/*


*/

'use strict';

angular.module('nar')

.controller('DefaultController', function($location, People, Organization, Subject) {
    var vm = this;

    var error = function(response) {
        console.log(response);
    };

    console.log("LOCATION: " + $location.absUrl());

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
            vm.selected = person[0];
        },
        error
    );

    Subject.query().then(
        function(subjects) {
            vm.subjects = subjects;
        },
        error
    );

    vm.selected = null;
    vm.selectPerson = function(person) {
        vm.selected = person;
        person.get_related();
    }

})