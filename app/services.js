/*


*/

'use strict';

angular.module('nar')

.factory("KGResource", function($http, $q) {
    var error = function(response) {
        console.log(response);
    };

    return function (collection_uri) {
        //a constructor for new resources
        var Resource = function (data) {
            angular.extend(this, data);
        };

        var config = {};
        collection_uri += "?deprecated=False";

        var Instance = function(response) {
            var instance = response.data;

            instance.get_related = function() {
                var related = {};

                var traverse = function(instance, parent_attribute) {
                    // traverse - requires lodash
                    _.forIn(instance, function (value, attribute) {
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
                traverse(instance, null);
                //console.log(related);
                return related;
            }
            return instance;
        };

        Resource.query = function(filter) {
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
.factory('People', function (KGResource) {
    return KGResource('https://nexus.humanbrainproject.org/v0/data/bbp/core/person/v0.1.0');
})
.factory('Organization', function (KGResource) {
    return KGResource('https://nexus.humanbrainproject.org/v0/data/bbp/core/organization/v0.1.0');
})
.factory('Subject', function (KGResource) {
    return KGResource('https://nexus.humanbrainproject.org/v0/data/bbp/experiment/subject/v0.1.0');
})

;