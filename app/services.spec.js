/*


*/


describe('PathHandler service', function() {

    var PathHandler;

    beforeEach(angular.mock.module('nar'));

    beforeEach(inject(function(_PathHandler_) {
        PathHandler = _PathHandler_;
    }));

    it('should exist', function() {
        expect(PathHandler).toBeDefined();
    });

    describe('.extract_path_from_uri()', function() {
        it('should exist', function() {
            expect(PathHandler.extract_path_from_uri).toBeDefined();
        });
        it('should parse out type and instance parts', function() {
            expect(PathHandler.extract_path_from_uri('https://nexus-int.humanbrainproject.org/v0/data/bbp/experiment/patchedcellcollection/v0.1.0/3ce21161-7c08-44eb-b367-f01ed1e891be'))
            .toEqual({
                type: '/bbp/experiment/patchedcellcollection',
                id: 'bbp/experiment/patchedcellcollection/v0.1.0/3ce21161-7c08-44eb-b367-f01ed1e891be'
            });
        });
    });

    describe('.extract_path_from_location()', function() {
        it('should exist', function() {
            expect(PathHandler.extract_path_from_location).toBeDefined();
        });
        it('should parse out type and set instance to null', function() {
            expect(PathHandler.extract_path_from_location('/bbp/experiment/patchedcellcollection'))
            .toEqual({
                type: '/bbp/experiment/patchedcellcollection',
                id: null
            });
        });
    });

});
