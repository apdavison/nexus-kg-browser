/*


*/

'use strict';

angular.module('nar')

.controller('DefaultController', function(People, Organization, Subject) {
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

    Subject.query().then(
        function(subjects) {
            vm.subjects = subjects;
        },
        error
    );

})