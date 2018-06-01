/*


*/


describe('PathHandler service', function() {

    var PathHandler;

    beforeEach(angular.mock.module('nar'));

    // Provide mock dependencies
    beforeEach(function () {

        mockbbpOidcSession = {
            token: function() {
                return "footoken"
            }
        };

        module(function ($provide) {
            $provide.value('bbpOidcSession', mockbbpOidcSession);
        });
    });

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


describe('KGResource Spec', function () {

    var KGResource, $httpBackend;

    beforeEach(angular.mock.module('nar'));

    // Provide mock dependencies
    beforeEach(function () {

        mockbbpOidcSession = {
            token: function() {
                return "footoken"
            }
        };

        module(function ($provide) {
            $provide.value('bbpOidcSession', mockbbpOidcSession);
        });
    });

    beforeEach(inject(function(_KGResource_, _$httpBackend_) {
        KGResource = _KGResource_;
        $httpBackend = _$httpBackend_;
    }));

    afterEach(function() {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    it('should exist', function() {
        expect(KGResource).toBeDefined();
    });

    describe('Resource', function () {
        it("should return a list of instances", inject(function () {

            var r = {
                "@context": "https://nexus-int.humanbrainproject.org/v0/contexts/nexus/core/search/v0.1.0",
                "total": 0,
                "maxScore": 0,
                "results": [],
                "links": {
                    "@context": "https://nexus-int.humanbrainproject.org/v0/contexts/nexus/core/links/v0.2.0",
                    "self": "https://nexus-int.humanbrainproject.org/v0/data/neurosciencegraph/atlas/atlasconstruction/v0.1.0"
                    }
                };

            $httpBackend.expectGET('https://nexus-int.humanbrainproject.org/v0/data/neurosciencegraph/atlas/atlasconstruction/v0.1.0?deprecated=False').respond(r);

            var Instances = KGResource('https://nexus-int.humanbrainproject.org/v0/data/neurosciencegraph/atlas/atlasconstruction/v0.1.0');

            Instances.query().then(
                function(instances) {
                    expect(instances).toEqual([]);
                });
            $httpBackend.flush();
        }))
    });
});


describe('KGIndex service', function() {

    var KGIndex, $httpBackend;

    beforeEach(angular.mock.module('nar'));

    // Provide mock dependencies
    beforeEach(function () {

        mockbbpOidcSession = {
            token: function() {
                return "footoken"
            }
        };

        module(function ($provide) {
            $provide.value('bbpOidcSession', mockbbpOidcSession);
        });
    });

    beforeEach(inject(function(_KGIndex_, _$httpBackend_) {
        KGIndex = _KGIndex_;
        $httpBackend = _$httpBackend_;
    }));

    afterEach(function() {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    it('should exist', function() {
        expect(KGIndex).toBeDefined();
    });

    describe('.paths()', function() {

        it('should exist', function() {
            expect(KGIndex.paths).toBeDefined();
        });

        it('should return types of schemas', function() {

            var r = {
                "total":1,
                "results":[{
                    "resultId":"https://nexus-int.humanbrainproject.org/v0/schemas/shape/core/activity/v0.0.4",
                    "source":{"@id":"https://nexus-int.humanbrainproject.org/v0/schemas/shape/core/activity/v0.0.4",
                        "links":[{
                            "rel":"self",
                            "href":"https://nexus-int.humanbrainproject.org/v0/schemas/shape/core/activity/v0.0.4"
                            }]
                        }}],
                "links":[{
                    "rel":"self",
                    "href":"https://nexus-int.humanbrainproject.org/v0/data/bbp/experiment/brainslicing"
                    }]
                };

            $httpBackend.whenGET('https://nexus-int.humanbrainproject.org/v0/schemas/?from=0&size=50').respond(r);

            KGIndex.paths().then(function(response) {
                expect(response).toEqual(['/shape/core/activity']);
            });
            $httpBackend.flush();
        });
    });

    describe('.organizations()', function() {

        it('should exist', function() {
            expect(KGIndex.organizations).toBeDefined();
        });

        it('should return path of organizations', function() {
            var r = {
                "total":1,
                "results":[{
                    "resultId":"https://nexus-int.humanbrainproject.org/v0/organizations/shape",
                    "source":{
                        "@id":"https://nexus-int.humanbrainproject.org/v0/organizations/shape",
                        "links":[{
                            "rel":"self",
                            "href":"https://nexus-int.humanbrainproject.org/v0/organizations/shape"
                            }]
                        }}],
                "links":[{
                    "rel":"self",
                    "href":"https://nexus-int.humanbrainproject.org/v0/organizations/"
                    }]
                };

            $httpBackend.whenGET('https://nexus-int.humanbrainproject.org/v0/organizations/').respond(r);

            KGIndex.organizations().then(function(response) {
                expect(response).toEqual(['https://nexus-int.humanbrainproject.org/v0/organizations/shape']);
            });
            $httpBackend.flush();
        });
    });

    describe('.domains()', function() {

        it('should exist', function() {
            expect(KGIndex.domains).toBeDefined();
        });

        it('should return path of domains', function() {
            var r = {
                "total":1,
                "results":[{
                    "resultId":"https://nexus-int.humanbrainproject.org/v0/domains/shape/core",
                    "source":{
                        "@id":"https://nexus-int.humanbrainproject.org/v0/domains/shape/core",
                        "links":[{
                            "rel":"self",
                            "href":"https://nexus-int.humanbrainproject.org/v0/domains/shape/core"
                            }]
                        }}]
                };

            $httpBackend.whenGET('https://nexus-int.humanbrainproject.org/v0/domains/').respond(r);

            KGIndex.domains().then(function(response) {
                expect(response).toEqual(['https://nexus-int.humanbrainproject.org/v0/domains/shape/core']);
            });
            $httpBackend.flush();
        });
    });
});