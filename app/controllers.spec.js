describe('DefaultController', function() {

    var $controller, $rootScope, controller, $location, $scope;

    beforeEach(angular.mock.module('nar'));

    beforeEach(inject(angular.mock.inject(function(_$controller_, _$rootScope_, _$location_) {
        $rootScope = _$rootScope_;
        $scope = $rootScope.$new();
        $controller = _$controller_;
        controller = $controller('DefaultController', {$scope: $scope});
        $location = _$location_;
    })));

    it('should exist', function() {
        expect(controller).toBeDefined();
    });

    it('should store selected instance and return its path', function() {
        controller.selectInstance({'path':{'id':'/'}});
        expect(controller.selected).toEqual({'path':{'id':'/'}});
        expect($location.url()).toEqual('/');
    });

    it('should return type of attribute of the instance', function() {
        expect(controller.attributeType({'label':'age'})).toBe('age');
        expect(controller.attributeType({'value':{"@id":"https://nexus.humanbrainproject.org/v0/"}})).toBe('internal-link');
        expect(controller.attributeType({'value':{"@id":"/"}})).toBe('external-link');
        expect(controller.attributeType({'value':{"@type":"QuantitativeValue"}})).toBe('quantity');
        expect(controller.attributeType({'value':4321})).toBe('literal');
        expect(controller.attributeType({'value':[{"@id":[]}]})).toBe('list-of-links');
    });

    it('should return path of instance', function() {
        controller.switchTo("https://nexus.humanbrainproject.org/v0/data/bbp/experiment/patchedcellcollection/v0.1.0/3ce21161-7c08-44eb-b367-f01ed1e891be");
        expect($location.url()).toEqual('/bbp/experiment/patchedcellcollection/v0.1.0/3ce21161-7c08-44eb-b367-f01ed1e891be');
    });
});


describe('MenuController', function() {

    var $controller, $rootScope, controller, $location, $scope;

    beforeEach(angular.mock.module('nar'));

    beforeEach(inject(angular.mock.inject(function(_$controller_, _$rootScope_, _$location_) {
        $rootScope = _$rootScope_;
        $scope = $rootScope.$new();
        $controller = _$controller_;
        controller = $controller('MenuController', {$scope: $scope});
        $location = _$location_;
    })));

    it('should exist', function() {
        expect(controller).toBeDefined();
    });

    it('should return url of collection', function() {
        controller.select('bbp/experiment/brainslicing', '');
        expect($location.url()).toEqual('/bbp/experiment/brainslicing');
    });
});