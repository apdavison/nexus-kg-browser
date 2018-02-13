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

.controller('DefaultController', function($location, $rootScope, KGResource, PathHandler, bbpOidcSession) {
    var vm = this;
    var base_url = "https://nexus.humanbrainproject.org/v0/";

    var error = function(response) {
        console.log(response);
    };

    console.log("LOCATION: " + $location.url());

    // controller actions to login and logout
    vm.handleLogin = function() {bbpOidcSession.login();}
    vm.handleLogout = function() {bbpOidcSession.logout();}

    var get_instances = function(type_id, focus) {
        var Instances = KGResource(base_url + "data" + type_id);

        Instances.query().then(
            function(instances) {
                vm.instances = instances;
                if (focus) {
                    // probably inefficient if the list of instances is very long
                    vm.selected = instances.filter(function(instance) {return instance.path.id === focus})[0];
                } else {
                    vm.selected = instances[0];
                    $location.url(instances[0].path.id);
                }
            },
            error
        );
    }

    var current_type = null;
    vm.show_readme = false;
    vm.base_url = base_url;
    vm.selected = null;

    vm.selectInstance = function(instance) {
        vm.selected = instance;
        $location.url(instance.path.id);
    };

    vm.attributeType = function(attribute) {
        if (attribute.label === "age") {  // temporary hack. Should use schema for all these type determinations
            return "age";
        } else if (attribute.label === "address") {
            return "address";
        } else if (attribute.value["@id"]) {
            if (attribute.value["@id"].includes(base_url)) {
                return "internal-link";
            } else {
                return "external-link";
            }
        } else if (attribute.value["@type"] === "QuantitativeValue" ) {
            return "quantity";
        } else if (["string", "number", "boolean"].indexOf(typeof(attribute.value)) >= 0) {
            return "literal";
        } else if (Array.isArray(attribute.value)) {
            if (attribute.value[0]["@id"]) {
                return "list-of-links"  // assume internal for now
            } else {
                return "list"
            }
        } else {
            return "object";
        }
    };

    vm.resolveId = function(id) {
        return vm.selected.resolveId(id);
    };

    vm.pathFromId = function(uri) {
        return PathHandler.extract_path_from_uri(uri);
    };

    vm.switchTo = function(uri) {
        $location.url(PathHandler.extract_path_from_uri(uri).id);
    };

    $rootScope.$on('$locationChangeSuccess', function(event, url, oldUrl, state, oldState) {
        if ($location.url() && $location.url() != "/") {  // todo: should match against a pattern
            vm.show_readme = false;
            var path = PathHandler.extract_path_from_location($location.url());
            console.log(path.type, current_type);
            if (path.type != current_type) {
                get_instances(path.type, path.id);
                current_type = path.type;
            } else {
                vm.selected = vm.instances.filter(function(instance) {return instance.path.id === path.id})[0];
            }
        } else {
            vm.show_readme = true;
        }
    });

})

.controller('MenuController', function($location, KGIndex) {
    var vm = this;
    var originatorEv;

    vm.openMenu = function($mdMenu, ev) {
      originatorEv = ev;
      $mdMenu.open(ev);
    };

    vm.select = function(collection_uri, ev) {
      console.log(collection_uri);
      $location.url(collection_uri);
      originatorEv = null;
    };

    vm.get_type_name = function(type_path) {
        return type_path;
    }

    var error = function(response) {
        console.log(response);
    };

    KGIndex.paths().then(
        function(response) {
            console.log(response);
            vm.instance_types = response;
        },
        error
    );

});