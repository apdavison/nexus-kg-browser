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
    var base_url = "https://nexus-int.humanbrainproject.org/v0/";

    vm.editMode = false;

    var error = function(response) {
        console.log(response);
    };

    console.log("LOCATION: " + $location.url());

    // controller actions to login and logout
    vm.handleLogin = function() {bbpOidcSession.login();}
    vm.handleLogout = function() {bbpOidcSession.logout();}

    var Instances = null;

    var get_instances = function(type_id, focus) {
        Instances = KGResource(base_url + "data" + type_id);

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
        console.log(instance);
        $location.url(instance.path.id);
    };

    vm.attributeType = function(attribute) {
        if (attribute.path === "nsg:age") {  // todo:  expand 'nsg' to a full URL
            return "age";  
        } else if (attribute.value) {
            if (attribute.value["@id"]) {
                if (attribute.value["@id"].includes(base_url)) {
                    return "internal-link";
                } else {
                    return "external-link";
                }
            } else if (attribute.value["@type"] === "QuantitativeValue" ) {
                return "quantity";
            } else if (attribute.value["@type"] === "schema:PostalAddress") { // todo: expand 'schema' to a full URL
                return "address";
            } else if (["string", "number", "boolean"].indexOf(typeof(attribute.value)) >= 0) {
                return "literal";
            } else if (Array.isArray(attribute.value)) {
                if (attribute.value[0]["@id"]) {
                    return "list-of-links"  // assume internal for now
                } else {
                    return "list"
                }
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
        vm.editMode = false;
        $location.url(PathHandler.extract_path_from_uri(uri).id);
    };

    vm.createInstance = function() {
        vm.editMode = true;
        console.log("Creating new instance of " + current_type);
        var instance = Instances.create();
        console.log(instance);
        vm.selectInstance(instance);
    }

    vm.saveInstance = function(instance) {
        instance.save().then(
            function success(response) {
                instance.id = response.data['@id'];
                instance.path = PathHandler.extract_path_from_uri(instance.id);
                instance.saved = true;
                vm.editMode = false;
                console.log("SUCCESS");
                //console.log(response);
                //console.log(instance.path.id);
                vm.instances.push(instance);
                vm.selectInstance(instance);
            },
            error
        );
    }

    $rootScope.$on('$locationChangeSuccess', function(event, url, oldUrl, state, oldState) {
        if ($location.url() && $location.url() != "/") {  // todo: should match against a pattern
            vm.show_readme = false;
            var path = PathHandler.extract_path_from_location($location.url());
            console.log(path.type, current_type);
            if (path.type != current_type) {
                get_instances(path.type, path.id);
                current_type = path.type;
            } else {
                if (vm.selected.saved) {
                    vm.editMode = false;
                    vm.selected = vm.instances.filter(function(instance) {return instance.path.id === path.id})[0];
                }
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