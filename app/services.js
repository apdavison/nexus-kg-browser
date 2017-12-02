/*


*/

'use strict';

angular.module('nar')

.factory("KGResource", function($http, $q) {
    var error = function(response) {
        console.log(response);
    };

    return function (collection_uri) {
        console.log("Constructing a resource for " + collection_uri);

        //a constructor for new resources
        var Resource = function (data) {
            angular.extend(this, data);
        };

        var config = {};
        collection_uri += "?deprecated=False";

        var Instance = function(response) {
            var instance = {
                data: response.data,
                id: response.data["@id"],
                attributes: []
            };

            var is_valid = function(name) {
                return (['@context', 'deprecated', 'rev', 'links', '@type', '@id'].indexOf(name) < 0);
            };

            for (var attribute in instance.data) {
                // skip loop if the property is from prototype
                if (!instance.data.hasOwnProperty(attribute)) continue;
                if (is_valid(attribute)) {
                    instance.attributes.push({
                        label: attribute,
                        value: instance.data[attribute]
                    });
                }
            }

            instance.get_related = function() {
                var related = {};

                var traverse = function(data, parent_attribute) {
                    // traverse - requires lodash
                    _.forIn(data, function (value, attribute) {
                        if (parent_attribute && attribute === "@id") {
                            related[parent_attribute] = value;
                        } else if (['@context', 'deprecated', 'rev', 'links', '@type'].indexOf(attribute) < 0) {
                            if (_.isArray(value)) {
                                value.forEach(function(element) {
                                    if (_.isObject(element)) {
                                        traverse(element, attribute); // to fix: subsequent elements will overwrite the first one in `related`
                                    }
                                });
                            } else if (_.isObject(value)) {
                                traverse(value, attribute);
                            }
                        }
                    });
                };
                traverse(instance.data, null);
                //console.log(related);
                return related;
            }

            instance.get_label = function() {
                var label = instance.data["@id"];
                if (instance.data.hasOwnProperty('name')) {
                    label = instance.data.name;
                } else if (instance.data.hasOwnProperty('familyName')) {
                    label = instance.data.givenName + " " + instance.data.familyName;
                } else if (instance.data.hasOwnProperty('label')) {
                    label = instance.data.label
                }
                return label;
            }

            return instance;
        };

        Resource.query = function(filter) {  // todo: this only returns the first 10 items
            if (filter) {
                collection_uri += "&filter=" + encodeURIComponent(JSON.stringify(filter));
            }
            return $http.get(collection_uri, config).then(
                // on retrieving the list of instance URIs, we...
                function(response) {
                    // ...construct a list of http promises, then ...
                    var promises = [];
                    for (let result of response.data.results) {
                        promises.push($http.get(result.resultId, config));
                    }
                    // ... when they all resolve, we put the data
                    // into an array, which is returned when the promise
                    // is resolved
                    var instances_promise = $q.all(promises).then(
                        function(responses) {
                            var instances = [];
                            for (let response of responses) {
                                instances.push(Instance(response));
                            }
                            return instances;
                        },
                        error);
                    return instances_promise;
                },
                error);
        }
        return Resource
    };
})
.service("KGIndex", function($http) {

    var error = function(response) {
        console.log(response);
    };

    var config = {};

    var KGIndex = {
        organizations: function() {
            return $http.get('https://nexus.humanbrainproject.org/v0/organizations/', config).then(
                function(response) {
                    var orgs = [];
                    for (let result of response.data.results) {
                        orgs.push(result.resultId);
                    }
                    return orgs;
                },
                error);
        },
        domains: function() {  // todo: allow to restrict to a specific organization
            return $http.get('https://nexus.humanbrainproject.org/v0/domains/', config).then(
                function(response) {
                    var domains = [];
                    for (let result of response.data.results) {
                        domains.push(result.resultId);
                    }
                    return domains;
                },
                error);
        },
        schema_uris: function() {  // todo: allow to restrict to a specific organization or domain
            var get_next = function(next, schemas) {
                console.log(next);
                return $http.get(next, config).then(
                    function(response) {
                        for (let result of response.data.results) {
                            schemas.push(result.resultId);
                        }
                        // check if there's more data to come
                        for (let link of response.data.links) {
                            if (link.rel === "next") {
                                schemas = get_next(link.href, schemas);
                            }
                        }
                        return schemas
                    },
                    error);
            }

            return get_next('https://nexus.humanbrainproject.org/v0/schemas/?from=0&size=50', []);
        },
        paths: function() {
            var extract_paths = function(schema_uris) {
                var parser = document.createElement('a');
                var paths = [];
                for (let uri of schema_uris) {
                    //console.log(uri);
                    parser.href = uri;
                    var full_path = parser.pathname;
                    // remove "v0/schema" from the start and version from the end
                    var path = "/" + full_path.split("/").slice(3, 6).join("/");
                    paths.push(path);
                }
                return paths;
            }

            return this.schema_uris().then(
                extract_paths,
                error
            )
        }
    };

    return KGIndex;
})
;