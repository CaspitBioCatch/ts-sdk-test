import { assert } from 'chai';
import FilesFeature from '../../../../../src/main/collectors/misc/FilesFeature';
import ConfigurationRepository from '../../../../../src/main/core/configuration/ConfigurationRepository';
import CidCache from '../../../../../src/main/core/session/CidCache';
import { MockObjects } from '../../../mocks/mockObjects';
import MuidService from '../../../../../src/main/core/MuidService';
import SessionService from '../../../../../src/main/core/session/SessionService';
import sinon from 'sinon';

describe('FilesFeatures tests:', function () {
    it('should get png file', function () {
        const utils = sinon.stub(MockObjects.cdUtils);
        const configurationRepository = sinon.createStubInstance(ConfigurationRepository);
        const muidService = sinon.createStubInstance(MuidService);
        const sidM = sinon.createStubInstance(SessionService);
        const cidCacheStub = sinon.createStubInstance(CidCache);
        cidCacheStub.get.returns('OlbBioCatchDev');

        configurationRepository.get.withArgs('getAddrList').returns('["https://cipher-dev.bc2.customers.biocatch.com/api/v1/cr.png"]');
        muidService.muid = 'AAA';
        sidM.sessionId = 'Shir';

        const files = new FilesFeature(configurationRepository, utils, sidM, muidService, cidCacheStub);
        files.startFeature();

        assert.isTrue(cidCacheStub.get.calledOnce);
        assert.isTrue(utils.getPostUrl.calledOnce, "getPostUrl wasn't called once");
        const call = utils.getPostUrl.getCall(0);
        assert.equal(call.args[1], 'GET', 'param is not GET');
        assert.isTrue(call.args[0].indexOf('cid=OlbBioCatchDev') > -1, 'url with wrong cid');
        assert.isTrue(call.args[0].indexOf('snum=Shir') > -1, 'url with wrong sid');
        assert.isTrue(call.args[0].indexOf('muid=AAA') > -1, 'url with wrong muid');
    });

    describe('FilesFeature tests', function () {
        let utils, configurationRepository, muidService, sidM, cidCacheStub, files;

        beforeEach(() => {
            utils = sinon.stub(MockObjects.cdUtils);
            configurationRepository = sinon.createStubInstance(ConfigurationRepository);
            muidService = sinon.createStubInstance(MuidService);
            sidM = sinon.createStubInstance(SessionService);
            cidCacheStub = sinon.createStubInstance(CidCache);
            cidCacheStub.get.returns('OlbBioCatchDev');
            files = new FilesFeature(configurationRepository, utils, sidM, muidService, cidCacheStub);
        });
        afterEach(function() {
            sinon.restore();
            utils, configurationRepository, muidService, sidM, cidCacheStub, files  = null;
        })

        describe('startFeature', function () {

            it('should handle exceptions in startFeature', function () {
                // Set up your stubs and spies to throw an exception
                configurationRepository.get.withArgs('getAddrList').throws(new Error("Test error"));

                // Call the method
                files.startFeature();

                // Assertions
                // Add your assertions here, particularly checking that _addrList is set to ''
                assert.isTrue(files._addrList === '', 'addrList is not empty');
            });
        });

        describe('updateFeatureConfig', function () {
            it('should update feature configuration correctly', function () {
                // Set up your stubs and spies
                configurationRepository.get.withArgs('getAddrList').returns('["https://example.com/api/v1/cr.png"]');
                muidService.muid = 'AAA';
                sidM.sessionId = 'Shir';
                files._isSent = false;

                // Call the method
                files.updateFeatureConfig();

                // Assertions
                // Add your assertions here
                assert.isTrue(cidCacheStub.get.calledOnce);
                assert.isTrue(utils.getPostUrl.called, "getPostUrl wasn't called");
                const call = utils.getPostUrl.getCall(0);
                assert.deepEqual(files._addrList,  [ 'https://example.com/api/v1/cr.png' ], 'addrList is not updated');
                assert.isTrue(call.args[0].indexOf('snum=Shir') > -1, 'url with wrong sid');
                assert.isTrue(call.args[0].indexOf('muid=AAA') > -1, 'url with wrong muid');


            });

            it('should handle exceptions in updateFeatureConfig', function () {
                // Set up your stubs and spies to throw an exception
                configurationRepository.get.withArgs('getAddrList').throws(new Error("Test error"));
                muidService.muid = 'AAA';
                sidM.sessionId = 'Shir';

                // Call the method
                files.updateFeatureConfig();

                // Assertions
                // Add your assertions here, particularly checking that _addrList is set to ''
                assert.isTrue(files._addrList === '', 'addrList is not empty');
            });
        });
    });

});
