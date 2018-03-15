/*

Copyright 2017 CNRS

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.

Author: Andrew P. Davison, UNIC, CNRS

*/

'use strict';

angular.module('nar')

.service("PathHandler", function() {
    var parser = document.createElement('a');

    var get_instance_type_and_id = function(parts) {
        var type_id = "/" + parts.slice(0, 4).join("/");
        var instance_id = null;
        if (parts.length > 4) {
            instance_id = parts.join("/");
        }
        return {type: type_id, id: instance_id};
    };

    var PathHandler = {
        extract_path_from_uri: function(uri) { // assumes uri is a schema uri, need to generalize
            parser.href = uri;
            var full_path = parser.pathname;
            return get_instance_type_and_id(full_path.split("/").slice(3));
        },
        extract_path_from_location: function(location) {
            return get_instance_type_and_id(location.split("/").slice(1));
        }
    }
    return PathHandler;
})

.service("Jsonld", function($http) {

    var error = function(response) {
        console.log(response);
    };

    this.flattenContext = function(contexts) {
        var flattened = {};
        for (var i = 0; i < contexts.length; i++) {
            if (typeof contexts[i] === 'string' && contexts[i].startsWith('http')) {
                $http.get(contexts[i], {}).then(
                    function(response) {
                        for (var attrname in response.data) {
                            if (attrname.indexOf('@') < 0) {
                                flattened[attrname] = response.data[attrname];
                            }
                        }
                    },
                    error
                );
            } else {
                for (var attrname in contexts[i]) { 
                    if (attrname.indexOf('@') < 0) {
                        flattened[attrname] = contexts[i][attrname]; 
                    }
                }
            }
        }
        return flattened;
    }

    this.resolve = function(term, context) {
        // context should be flattened
        
        // expand the given term as a full URI
        if (term.startsWith("http")) {
            return term
        } else {
            if (context.hasOwnProperty(term)) {
                if (typeof(context[term]) === 'string') {
                    return this.resolve(context[term], context);
                } else {
                    return this.resolve(context[term]['@id'], context);
                }
            }
            var parts = term.split(':');
            var prefix = parts[0];
            var identifier = parts[1];
            if (context.hasOwnProperty(prefix)) {
                return context[prefix] + identifier;
            }
            return null;
        }
    };
})

.factory("KGResource", function($http, $q, PathHandler, bbpOidcSession, Jsonld) {
    var error = function(response) {
        console.log(response);
    };

    return function(collection_uri) {
        console.log("Constructing a resource for " + collection_uri);
        
        // a constructor for new resources
        var Resource = function(data) {
            angular.extend(this, data);
        };

        var config = {
            Authorization: "Bearer " + bbpOidcSession.token()
        };

        var schema_uri = collection_uri.replace('data', 'schemas');
        var target_class = null;
        var schema_properties = {};
        var schema_context = {};
        var collection_query_uri = collection_uri + "?deprecated=False";

        var Instance = function(data, schema_properties, target_class) {
            var instance = {
                data: data,
                id: data["@id"],
                type: target_class,
                context: Jsonld.flattenContext(data["@context"]),
                attributes: {},
                path: PathHandler.extract_path_from_uri(data["@id"]),
                saved: true
            };

            if (instance.id.includes('NEW')) {
                instance.saved = false;
            }

            var is_valid = function(name) {
                return (['@context', 'deprecated', 'nxv:deprecated', 'rev', 'nxv:rev', 'links', '@type', '@id'].indexOf(name) < 0);
            };

            // copy properties/attributes from schema_properties
            // todo: rename "attribute" to "property" for consistency
            for (var attribute_uri in schema_properties) {
                instance.attributes[attribute_uri] = Object.assign({}, schema_properties[attribute_uri]);
            }

            for (var attribute in instance.data) {
                // skip loop if the property is from prototype
                if (!instance.data.hasOwnProperty(attribute)) continue;
                if (is_valid(attribute)) {
                    var attribute_uri = Jsonld.resolve(attribute, instance.context);
                    //console.log(attribute_uri);
                    //console.log(instance.attributes);
                    if (instance.attributes[attribute_uri]) {
                        instance.attributes[attribute_uri].value = instance.data[attribute];
                    } else {
                        if (attribute_uri == 'http://schema.org/distribution') {
                            instance.attributes[attribute_uri] = {
                                name: 'Distribution',
                                value: instance.data[attribute]  // todo: add @type?
                            }
                        } else {
                            console.log("WARNING: Attribute " + attribute_uri + " is not in the schema");
                        }
                    }
                }
            }

            instance.get_label = function() {
                // hacky, needs to be cleaned up, resolving context
                var label = instance.id;
                if (instance.data.hasOwnProperty('name')) {
                    label = instance.data.name;
                } else if (instance.data.hasOwnProperty('familyName')) {
                    label = instance.data.givenName + " " + instance.data.familyName;
                } else if (instance.data.hasOwnProperty('http://schema.org/familyName')) {
                    label = instance.data['http://schema.org/givenName'] + " " + instance.data['http://schema.org/familyName'];    
                } else if (instance.data.hasOwnProperty('label')) {
                    label = instance.data.label;
                } else {
                    label = PathHandler.extract_path_from_uri(label).id;
                }
                return label;
            };

            instance.resolveId = function(id) {
                var prefix = id.split(":")[0];
                var suffix = id.split(":")[1];
                if (prefix === "http" || prefix === "https") {
                    return id;
                } else {
                    return instance.context[prefix] + suffix;  // todo: may need to recurse within context to get final URI
                }
            };

            instance.save = function() {
                if (instance.saved) {
                    var put_url = instance.id + "?rev=" + instance.data["nxv:rev"];
                    for (var name in instance.attributes) {
                        if (instance.attributes[name].hasOwnProperty('value')) {
                            if (instance.attributes[name].value != instance.data[name]) {
                                instance.data[name] = instance.attributes[name].value;
                            }
                        }
                    }
                    delete instance.data.links;  //  might want to copy instance.data before removing this
                    return $http.put(put_url, JSON.stringify(instance.data), config);
                } else {
                    var post_url = instance.id.slice(0, -4)  // remove '/NEW'

                    instance.data = {
                        //'@context': schema_context,
                        '@context': {  // temporary, fragile work-around
                            'nsg': "https://bbp-nexus.epfl.ch/vocabs/bbp/neurosciencegraph/core/v0.1.0/"
                        },
                        '@type': instance.type
                    };
                    for (var name in instance.attributes) {
                        if (instance.attributes[name].hasOwnProperty('value')) {
                            instance.data[name] = instance.attributes[name].value;
                        }
                    }
                    console.log("About to post the following to " + post_url);
                    console.log(JSON.stringify(instance.data, null, 4));
                    return $http.post(post_url, JSON.stringify(instance.data), config);
                }
            }

            return instance;
        };

        var get_next = function(next, promises) {
            // on retrieving the list of instance URIs, we
            // construct a list of http promises, then ...
            console.log(next);
            return $http.get(next, config).then(
                function(response) {
                    for (let result of response.data.results) {
                        promises.push($http.get(result.resultId, config));
                    }
                    // check if there's more data to come
                    if (response.data.links.next) {
                        promises = get_next(response.data.links.next, promises);
                    }
                    return promises
                },
                error);

        };

        var build_properties = function(shape, context) {
            if (shape.property) {
                for (let property of shape.property) {
                    var property_uri = Jsonld.resolve(property.path, context);
                    if (schema_properties.hasOwnProperty(property_uri)) {
                        // merge the two properties
                        Object.assign(schema_properties[property_uri], property);
                    } else {
                        schema_properties[property_uri] = property;
                    }
                }
            }
        }

        var get_schema = function() {
            return $http.get(schema_uri, config).then(
                function(response) {
                    var schema = response.data;
                    console.log(schema);
                    var context = Jsonld.flattenContext(schema["@context"]);
                    for (let shape of schema.shapes) {
                        console.log(shape);
                        //schema_context = Jsonld.flattenContext(schema['@context']);
                        if (shape.targetClass) {
                            target_class = shape.targetClass;
                            console.log("Setting target class to " + shape.targetClass);
                        }
                        if (shape.and) {
                            for (let parent_shape of shape.and) {
                                if (parent_shape.node) {
                                    var shape_uri = Jsonld.resolve(parent_shape.node, context);
                                    $http.get(shape_uri, config).then(
                                        function(response) {
                                            build_properties(response.data, context);
                                        },
                                        error
                                    );
                                } else {
                                    build_properties(parent_shape, context);
                                }
                            }
                        } else {
                            console.log("WARNING: shape not fully processed: " + shape["@id"])
                        }
                    }
                }, 
                error
            );
        };

        Resource.query = function(filter) {
            if (filter) {
                collection_query_uri += "&filter=" + encodeURIComponent(JSON.stringify(filter));
            }

            var get_instances = function() {
                return get_next(collection_query_uri, []).then(
                    function(promises) {
                        // ... when they all resolve, we put the data
                        // into an array, which is returned when the promise
                        // is resolved
                        var instances_promise = $q.all(promises).then(
                            function(responses) {
                                var instances = [];
                                for (let response of responses) {
                                    instances.push(Instance(response.data, schema_properties, target_class));
                                }
                                console.log(instances);
                                return instances;
                            },
                            error);
                        return instances_promise;
                    },
                    error);
            }

            return get_schema().then(get_instances);
        };

        Resource.create = function() {
            return Instance({'@id': collection_uri + "/NEW", '@context': {}},
                            schema_properties,
                            target_class);
        }

        return Resource;
    };
})


.service("KGIndex", function($http, PathHandler, bbpOidcSession, nexusBaseUrl) {

    var error = function(response) {
        console.log(response);
    };

    var config = {
        Authorization: "Bearer " + bbpOidcSession.token()
    };

    var KGIndex = {
        organizations: function() {
            return $http.get(nexusBaseUrl + 'organizations/', config).then(
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
            return $http.get(nexusBaseUrl + 'domains/', config).then(
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
                console.log("Getting schema URIs");
                console.log("  with headers: ");
                console.log(config);
                console.log(next);
                return $http.get(next, config).then(
                    function(response) {
                        //console.log(response);
                        for (let result of response.data.results) {
                            schemas.push(result.resultId);
                        }
                        // check if there's more data to come
                        if (response.data.links.next) {
                            schemas = get_next(response.data.links.next, schemas);
                        }
                        return schemas
                    },
                    error);
            };

            return get_next(nexusBaseUrl + 'schemas/?from=0&size=50', []);
        },
        paths: function() {
            var extract_paths = function(schema_uris) {
                var paths = [];
                for (let uri of schema_uris) {
                    paths.push(PathHandler.extract_path_from_uri(uri).type);
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