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

(function() {
  'use strict';

  angular.module('nar', [
    //'ui.router',
    'ngMaterial'
  ])
  //.config(function($urlRouterProvider) {
  //  $urlRouterProvider.otherwise("/");
  //})
  .controller('DefaultController', function(People, Organization) {
    var vm = this;

    var error = function(response) {
        console.log(response);
    };

    People.query().then(
        function(people) {
            vm.people = people;
        },
        error
    );

    Organization.query().then(
        function(orgs) {
            vm.organizations = orgs;
        },
        error
    );

    var filter = {
        "@context": {"schema": "http://schema.org/"},
        "filter": {
            "path": "schema:familyName",
            "op": "eq",
            "value": "Kohus"
        }
    };

    People.query(filter).then(
        function(person) {
            vm.selected_person = person[0];
        },
        error
    );

  })
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

            Resource.query = function(filter) {
                if (filter) {
                    collection_uri += "&filter=" + encodeURIComponent(JSON.stringify(filter));
                }
                return $http.get(collection_uri, config).then(
                    // on retrieving the list of instance URIs, we...
                    function(response) {
                        console.log(response);
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
                                console.log(responses);
                                var instances = [];
                                for (let response of responses) {
                                    instances.push(response.data);
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
  }).factory('People', function (KGResource) {
      return KGResource('https://nexus.humanbrainproject.org/v0/data/bbp/core/person/v0.1.0');
  }).factory('Organization', function (KGResource) {
      return KGResource('https://nexus.humanbrainproject.org/v0/data/bbp/core/organization/v0.1.0');
  });

})();