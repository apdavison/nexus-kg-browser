/*


*/

'use strict';

angular.module('nar')

.controller('DefaultController', function($location, $rootScope, KGResource, PathHandler) {
    var vm = this;
    var base_url = "https://nexus.humanbrainproject.org/v0/";

    var error = function(response) {
        console.log(response);
    };

    console.log("LOCATION: " + $location.url());

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
    }

    $rootScope.$on('$locationChangeSuccess', function(event, url, oldUrl, state, oldState) {
        if ($location.url() && $location.url() != "/") {  // todo: should match against a pattern
            vm.show_readme = false;
            var path = PathHandler.extract_path_from_location($location.url());
            console.log(path.type, current_type);
            if (path.type != current_type) {
                get_instances(path.type, path.id);
                current_type = path.type;
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