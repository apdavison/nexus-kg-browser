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

    var config = {};

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
  .service("People", function($http, $q) {
        var error = function(response) {
            console.log(response);
        };
        var config = {};

        var People = {
            query: function(filter) {
                var resource_uri = "https://nexus.humanbrainproject.org/v0/data/bbp/core/person/v0.1.0";
                resource_uri += "?deprecated=False";
                if (filter) {
                    resource_uri += "&filter=" + encodeURIComponent(JSON.stringify(filter));
                }
                return $http.get(resource_uri, config).then(
                    // on retrieving the list of Person URIs, we...
                    function(response) {
                        console.log(response);
                        // ...construct a list of http promises, then ...
                        var people_promises = [];
                        for (let result of response.data.results) {
                            people_promises.push($http.get(result.resultId, config));
                        }
                        // ... when they all resolve, we put the data
                        // into an array, which is returned when the promise
                        // is resolved
                        var people_promise = $q.all(people_promises).then(
                            function(responses) {
                                console.log(responses);
                                var people = [];
                                for (let response of responses) {
                                    people.push(response.data);
                                }
                                return people;
                            },
                            error);
                        return people_promise;
                    },
                    error);
            }
        };
        return People;
  })
  .service("Organization", function($http, $q) {
        var error = function(response) {
            console.log(response);
        };
        var config = {};

        var Organization = {
            query: function() {
                return $http.get("https://nexus.humanbrainproject.org/v0/data/bbp/core/organization/v0.1.0", config).then(
                    // on retrieving the list of Organization URIs, we...
                    function(response) {
                        console.log(response);
                        // ...construct a list of http promises, then ...
                        var org_promises = [];
                        for (let result of response.data.results) {
                            org_promises.push($http.get(result.resultId, config));
                        }
                        // ... when they all resolve, we put the data
                        // into an array, which is returned when the promise
                        // is resolved
                        var orgs_promise = $q.all(org_promises).then(
                            function(responses) {
                                console.log(responses);
                                var orgs = [];
                                for (let response of responses) {
                                    orgs.push(response.data);
                                }
                                return orgs;
                            },
                            error);
                        return orgs_promise;
                    },
                    error);
            }
        };
        return Organization;
  })

  ;

})();