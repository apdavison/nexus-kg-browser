/*


*/

'use strict';

angular.module('nar')

.controller('DefaultController', function($location, $rootScope, KGResource) {
    var vm = this;
    var base_url = "https://nexus.humanbrainproject.org/v0/";

    var error = function(response) {
        console.log(response);
    };

    console.log("LOCATION: " + $location.url());

    var get_instances = function() {
        var Instances = KGResource(base_url + "data" + $location.url());

        Instances.query().then(
            function(instances) {
                vm.instances = instances;
                vm.selected = instances[0];
            },
            error
        );
    }

    vm.selected = null;
    vm.selectInstance = function(instance) {
        vm.selected = instance;
    }

    $rootScope.$on('$locationChangeSuccess', function(event, url, oldUrl, state, oldState) {
        get_instances();
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
        //return type_path.split("/")[3];
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