import { assert } from 'chai';
import CdApiFacade from '../../../../src/main/api/CdApiFacade';
import CDUtils from '../../../../src/main/technicalServices/CDUtils';
import { TestUtils } from '../../../TestUtils';
import Client from '../../../../src/main/Client';
import CollectionSettings from "../../../../src/main/api/CollectionSettings";
import sinon from "sinon";
import { AgentType } from "../../../../src/main/contract/AgentType";
import URLBuilder from "../../../../src/main/technicalServices/URLBuilder";
import { CollectionMode } from "../../../../src/main/contract/CollectionMode";
import { attachCdApi, detachCdApi } from '../../../../src/main/samples/CdApiUtils';

describe('CdApiFacade tests:', function () {

    before(function () {
        attachCdApi();

        // Add legacy functions to test legacy support
        window.cdApi.getCustomerConfigLocation = () => {
        };
        window.cdApi.getLogServerAddress = () => {
        };
    });

    after(function () {
        detachCdApi()
    });

    beforeEach(function () {
        this.sandbox = sinon.createSandbox();
    });

    afterEach(function () {
        this.sandbox.restore();
    });

    describe('getConfigurations', function () {
        it('getConfigurations calls the cdApi and returns its value', function () {
            const cdApiFacade = new CdApiFacade(CDUtils);
            const getConfigurations = this.sandbox.stub(window.cdApi, 'getConfigurations');
            getConfigurations.callsArgWith(0, {
                wupServerURL: 'https://wupserver.com/client/v3.1/web/wup?cid=mycid',
                logServerURL: 'bbb',
                enableFramesProcessing: false,
                useUrlWorker: false,
                workerUrl: 'worker.js',
            });
            const cb = this.sandbox.spy();
            cdApiFacade.getConfigurations(cb);

            const configurations = cb.firstCall.args[0];
            assert.equal(configurations.getWupServerURL(), 'https://wupserver.com/client/v3.1/web/wup?cid=mycid');
            assert.equal(configurations.getLogServerURL(), 'bbb');
            assert.isFalse(configurations.getEnableFramesProcessing());
            assert.isFalse(configurations.getUseUrlWorker());
            assert.equal(configurations.getWorkerUrl(), 'worker.js');

            getConfigurations.restore();
        });

        it('getConfigurations returns enableCustomElementsProcessing', function () {
            const cdApiFacade = new CdApiFacade(CDUtils);
            const getConfigurations = this.sandbox.stub(window.cdApi, 'getConfigurations');
            getConfigurations.callsArgWith(0, {
                wupServerURL: 'https://wupserver.com/client/v3.1/web/wup?cid=mycid',
                logServerURL: 'bbb',
                enableCustomElementsProcessing: true,
                useUrlWorker: false,
                workerUrl: 'worker.js',
            });
            const cb = this.sandbox.spy();
            cdApiFacade.getConfigurations(cb);

            const configurations = cb.firstCall.args[0];
            assert.isTrue(configurations.getEnableCustomElementsProcessing());

            getConfigurations.restore();
        });

        it('getConfigurations returns enableSameSiteNoneAndSecureCookies', function () {
            const cdApiFacade = new CdApiFacade(CDUtils);
            const getConfigurations = this.sandbox.stub(window.cdApi, 'getConfigurations');
            getConfigurations.callsArgWith(0, {
                wupServerURL: 'https://wupserver.com/client/v3.1/web/wup?cid=mycid',
                logServerURL: 'bbb',
                enableCustomElementsProcessing: true,
                enableSameSiteNoneAndSecureCookies: true,
                useUrlWorker: false,
                workerUrl: 'worker.js',
            });
            const cb = this.sandbox.spy();
            cdApiFacade.getConfigurations(cb);

            const configurations = cb.firstCall.args[0];
            assert.isTrue(configurations.getEnableSameSiteNoneAndSecureCookies());

            getConfigurations.restore();
        });

        it('getConfigurations returns undefined when enableCustomElementsProcessing is unavailable', function () {
            const cdApiFacade = new CdApiFacade(CDUtils);
            const getConfigurations = this.sandbox.stub(window.cdApi, 'getConfigurations');
            getConfigurations.callsArgWith(0, {
                wupServerURL: 'https://wupserver.com/client/v3.1/web/wup?cid=mycid',
                logServerURL: 'bbb',
                useUrlWorker: false,
                workerUrl: 'worker.js',
            });
            const cb = this.sandbox.spy();
            cdApiFacade.getConfigurations(cb);

            const configurations = cb.firstCall.args[0];
            assert.notExists(configurations.getEnableCustomElementsProcessing());

            getConfigurations.restore();
        });

        it('getConfigurations returns undefined when enableSameSiteNoneAndSecureCookies is unavailable', function () {
            const cdApiFacade = new CdApiFacade(CDUtils);
            const getConfigurations = this.sandbox.stub(window.cdApi, 'getConfigurations');
            getConfigurations.callsArgWith(0, {
                wupServerURL: 'https://wupserver.com/client/v3.1/web/wup?cid=mycid',
                logServerURL: 'bbb',
                useUrlWorker: false,
                workerUrl: 'worker.js',
            });
            const cb = this.sandbox.spy();
            cdApiFacade.getConfigurations(cb);

            const configurations = cb.firstCall.args[0];
            assert.notExists(configurations.getEnableSameSiteNoneAndSecureCookies());

            getConfigurations.restore();
        });


        it('getConfigurations returns collectionSettings', function () {
            const cdApiFacade = new CdApiFacade(CDUtils);
            const collectionSettingsjson = {
                'elementSettings': {
                    'customElementAttribute': 'bob-bobby'
                }
            };
            const expectedCollectionSettings = new CollectionSettings(collectionSettingsjson);
            const getConfigurations = this.sandbox.stub(window.cdApi, 'getConfigurations');
            getConfigurations.callsArgWith(0, {
                wupServerURL: 'https://wupserver.com/client/v3.1/web/wup?cid=mycid',
                logServerURL: 'bbb',
                enableCustomElementsProcessing: true,
                useUrlWorker: false,
                workerUrl: 'worker.js',
                collectionSettings: { 'elementSettings': { 'customElementAttribute': 'bob-bobby' } }
            });
            const cb = this.sandbox.spy();
            cdApiFacade.getConfigurations(cb);

            const configurations = cb.firstCall.args[0];
            assert.deepEqual(configurations.getCollectionSettings(), expectedCollectionSettings);

            getConfigurations.restore();
        });

        it('getConfigurations returns collectionSettings without elementSettings', function () {
            const cdApiFacade = new CdApiFacade(CDUtils);
            const collectionSettingsjson = {};
            const expectedCollectionSettings = new CollectionSettings(collectionSettingsjson);
            const getConfigurations = this.sandbox.stub(window.cdApi, 'getConfigurations');
            getConfigurations.callsArgWith(0, {
                wupServerURL: 'https://wupserver.com/client/v3.1/web/wup?cid=mycid',
                logServerURL: 'bbb',
                enableCustomElementsProcessing: true,
                useUrlWorker: false,
                workerUrl: 'worker.js',
                collectionSettings: {}
            });
            const cb = this.sandbox.spy();
            cdApiFacade.getConfigurations(cb);

            const configurations = cb.firstCall.args[0];
            assert.deepEqual(configurations.getCollectionSettings(), expectedCollectionSettings);

            getConfigurations.restore();
        });

        it('getConfigurations returns collectionSettings without elementSettings.customElementAttribute', function () {
            const cdApiFacade = new CdApiFacade(CDUtils);
            const collectionSettingsjson = {
                'elementSettings': {}
            };
            const expectedCollectionSettings = new CollectionSettings(collectionSettingsjson);
            const getConfigurations = this.sandbox.stub(window.cdApi, 'getConfigurations');
            getConfigurations.callsArgWith(0, {
                wupServerURL: 'https://wupserver.com/client/v3.1/web/wup?cid=mycid',
                logServerURL: 'bbb',
                enableCustomElementsProcessing: true,
                useUrlWorker: false,
                workerUrl: 'worker.js',
                collectionSettings: { 'elementSettings': {} }
            });
            const cb = this.sandbox.spy();
            cdApiFacade.getConfigurations(cb);

            const configurations = cb.firstCall.args[0];
            assert.deepEqual(configurations.getCollectionSettings(), expectedCollectionSettings);

            getConfigurations.restore();
        });

        it('getConfigurations returns undefined when collectionSettings is unavailable', function () {
            const cdApiFacade = new CdApiFacade(CDUtils);
            const getConfigurations = this.sandbox.stub(window.cdApi, 'getConfigurations');
            getConfigurations.callsArgWith(0, {
                wupServerURL: 'https://wupserver.com/client/v3.1/web/wup?cid=mycid',
                logServerURL: 'bbb',
                useUrlWorker: false,
                workerUrl: 'worker.js',
            });
            const cb = this.sandbox.spy();
            cdApiFacade.getConfigurations(cb);

            const configurations = cb.firstCall.args[0];
            assert.deepEqual(configurations.getCollectionSettings(), new CollectionSettings(undefined));

            getConfigurations.restore();
        });

        it('getConfigurations calls the cdApi with missing url worker configurations sets default values', function () {
            const cdApiFacade = new CdApiFacade(CDUtils);
            const getConfigurations = this.sandbox.stub(window.cdApi, 'getConfigurations');
            getConfigurations.callsArgWith(0, {
                wupServerURL: 'https://wupserver.com/client/v3.1/web/wup?cid=mycid',
                logServerURL: 'bbb',
                enableFramesProcessing: false,
            });
            const cb = this.sandbox.spy();
            cdApiFacade.getConfigurations(cb);

            const configurations = cb.firstCall.args[0];
            assert.equal(configurations.getWupServerURL(), 'https://wupserver.com/client/v3.1/web/wup?cid=mycid');
            assert.equal(configurations.getLogServerURL(), 'bbb');
            assert.isFalse(configurations.getEnableFramesProcessing());
            assert.isFalse(configurations.getUseUrlWorker());
            assert.equal(configurations.getWorkerUrl(), '');

            getConfigurations.restore();
        });

        it('getConfigurations calls the cdApi cid and serverURL and returns its url', function () {
            const cdApiFacade = new CdApiFacade(CDUtils);
            const getConfigurations = this.sandbox.stub(window.cdApi, 'getConfigurations');
            getConfigurations.callsArgWith(0, {
                logServerURL: 'bbb',
                enableFramesProcessing: false,
                serverURL: 'wupserver.com',
                useUrlWorker: false,
                workerUrl: 'worker.js',
                customerID: 'mycid',
            });
            const cb = this.sandbox.spy();
            cdApiFacade.getConfigurations(cb);

            const configurations = cb.firstCall.args[0];
            assert.equal(configurations.getWupServerURL(), 'https://wupserver.com/client/v3.1/web/wup?cid=mycid');

            getConfigurations.restore();
        });

        it('getConfigurations calls the cdApi with empty serverURL and returns error', function () {
            const cdApiFacade = new CdApiFacade(CDUtils);
            const getConfigurations = this.sandbox.stub(window.cdApi, 'getConfigurations');
            getConfigurations.callsArgWith(0, {
                logServerURL: 'bbb',
                enableFramesProcessing: false,
                serverURL: '',
                useUrlWorker: false,
                workerUrl: 'worker.js',
                customerID: 'mycid',
            });
            const cb = this.sandbox.spy();

            assert.throws(() => {
                return cdApiFacade.getConfigurations(cb);
            },
                Error, 'Invalid serverURL or cid. Parameter is empty');
            getConfigurations.restore();
        });

        it('getConfigurations calls the cdApi with empty cid and returns error', function () {
            const cdApiFacade = new CdApiFacade(CDUtils);
            const getConfigurations = this.sandbox.stub(window.cdApi, 'getConfigurations');
            getConfigurations.callsArgWith(0, {
                logServerURL: 'bbb',
                enableFramesProcessing: false,
                serverURL: 'hostname',
                useUrlWorker: false,
                workerUrl: 'worker.js',
                customerID: '',
            });
            const cb = this.sandbox.spy();

            assert.throws(() => {
                return cdApiFacade.getConfigurations(cb);
            },
                Error, 'Invalid serverURL or cid. Parameter is empty');
            getConfigurations.restore();
        });

        it('getConfigurations uses legacy apis if cdApi.getConfigurations does not exist and returns value', function () {
            const cdApiFacade = new CdApiFacade(CDUtils);
            const getConfigurations = window.cdApi.getConfigurations;
            window.cdApi.getConfigurations = undefined;
            const getCustConfLoc = this.sandbox.stub(window.cdApi, 'getCustomerConfigLocation');
            getCustConfLoc.callsArgWith(0, 'https://wupserver.com/client/v3.1/web/wup?cid=mycid');
            const getLogServerAddressStub = this.sandbox.stub(window.cdApi, 'getLogServerAddress');
            getLogServerAddressStub.callsArgWith(0, 'bbb');

            const cb = this.sandbox.spy();

            cdApiFacade.getConfigurations(cb);

            const configurations = cb.firstCall.args[0];
            assert.equal(configurations.getWupServerURL(), 'https://wupserver.com/client/v3.1/web/wup?cid=mycid');
            assert.equal(configurations.getLogServerURL(), 'bbb');
            assert.notExists(configurations.getEnableFramesProcessing());

            window.cdApi.getConfigurations = getConfigurations;
            getCustConfLoc.restore();
            getLogServerAddressStub.restore();
        });

        it('getConfigurations returns null configurations', function () {
            const cdApiFacade = new CdApiFacade(CDUtils);
            const getConfigurations = this.sandbox.stub(window.cdApi, 'getConfigurations');
            getConfigurations.callsArgWith(0, null);
            const cb = this.sandbox.spy();
            cdApiFacade.getConfigurations(cb);
            const configurations = cb.firstCall.args[0];
            assert.isNull(configurations);
            getConfigurations.restore();
        });

        it('getConfigurations uses legacy apis if cdApi.getConfigurations does not exist', function () {
            const cdApiFacade = new CdApiFacade(CDUtils);
            const getConfigurations = window.cdApi.getConfigurations;
            window.cdApi.getConfigurations = undefined;
            const getCustConfLoc = this.sandbox.stub(window.cdApi, 'getCustomerConfigLocation');
            getCustConfLoc.callsArgWith(0, 'aaawup');
            const getLogServerAddressStub = this.sandbox.stub(window.cdApi, 'getLogServerAddress');
            getLogServerAddressStub.callsArgWith(0, 'bbb');

            const cb = this.sandbox.spy();

            assert.throws(() => {
                return cdApiFacade.getConfigurations(cb);
            },
                Error, 'Invalid field. Failed extracting the address parameter: aaawup');

            window.cdApi.getConfigurations = getConfigurations;
            getCustConfLoc.restore();
            getLogServerAddressStub.restore();
        });

        it('getConfigurations throws an error if legacy apis do not exist', function () {
            const cdApiFacade = new CdApiFacade(CDUtils);
            const getConfigurations = window.cdApi.getConfigurations;
            const getCustomerConfigLocation = window.cdApi.getCustomerConfigLocation;
            const getLogServerAddress = window.cdApi.getLogServerAddress;

            window.cdApi.getConfigurations = undefined;
            window.cdApi.getCustomerConfigLocation = undefined;
            window.cdApi.getLogServerAddress = undefined;

            const cb = this.sandbox.spy();

            assert.throws(() => {
                cdApiFacade.getConfigurations(cb);
            },
                Error, 'Invalid wupServerURL. Parameter is empty');

            window.cdApi.getConfigurations = getConfigurations;
            window.cdApi.getCustomerConfigLocation = getCustomerConfigLocation;
            window.cdApi.getLogServerAddress = getLogServerAddress;
        });
    });

    describe('getServerAddress', function () {
        it('getServerAddress calls the cdApi.getCustomerConfigLocation and returns its value', function () {
            const cdApiFacade = new CdApiFacade(CDUtils);
            const getCustConfLoc = this.sandbox.stub(window.cdApi, 'getCustomerConfigLocation');
            getCustConfLoc.callsArgWith(0, 'aaawup');
            const cb = this.sandbox.spy();

            cdApiFacade.getServerAddress(cb);

            assert.isTrue(cb.calledWith('aaawup'), 'callback was not called with the value expected from the cdApi');
            getCustConfLoc.restore();
        });

        it('getServerAddress gets the server address from the config file', async function () {
            const cdApiFacade = new CdApiFacade(CDUtils);
            const getCustConfLoc = this.sandbox.stub(window.cdApi, 'getCustomerConfigLocation');
            getCustConfLoc.callsArgWith(0, 'https://rnd-bcdn.s3.amazonaws.com/clientDev/iosCustomerConfig.json');
            const cb = this.sandbox.spy();

            cdApiFacade.getServerAddress(cb);
            await TestUtils.waitForNoAssertion(() => {
                const call = cb.getCall(0);
                if (call) {
                    assert.isTrue(call.args[0].indexOf('client/v3.1/web/wup') >= -1, 'callback was not called with correct string');
                    assert.isTrue(call.args[0].indexOf('cid') >= -1, 'callback was not called with cid');
                }
            }).finally(() => {
                getCustConfLoc.restore();
            });
        });

        it('getServerAddress returns empty string if cdApi.getCustomerConfigLocation does not exist', function () {
            const cdApiFacade = new CdApiFacade(CDUtils);
            window.cdApi.getCustomerConfigLocation = undefined;
            const cb = this.sandbox.spy();

            cdApiFacade.getServerAddress(cb);

            assert.isTrue(cb.calledWith(''), 'callback was not called with empty string');
        });

        it('getServerAddress waits for cdApi till it is loaded', async function () {
            const cdApiFacade = new CdApiFacade();
            const cdApiOrig = window.cdApi;
            window.cdApi = undefined;

            const cb = this.sandbox.spy();

            cdApiFacade.getServerAddress(cb);
            assert.isTrue(cb.notCalled, 'callback was called');
            window.cdApi = cdApiOrig;
            await TestUtils.waitForNoAssertion(() => {
                const call = cb.getCall(0);
                assert.isNotNull(call, 'callback was not called');
                assert.isTrue(call.args[0].indexOf('client/v3/web/wup') >= -1, 'callback was not called with correct string');
                assert.isTrue(call.args[0].indexOf('cid') >= -1, 'callback was not called with cid');
            });
        });
    });

    describe('getLogServerAddress', function () {
        it('getLogServerAddress calls the cdApi and returns its value', function () {
            const cdApiFacade = new CdApiFacade(CDUtils);
            const getLogServerAddressStub = this.sandbox.stub(window.cdApi, 'getLogServerAddress');
            getLogServerAddressStub.callsArgWith(0, 'aaawup');
            const cb = this.sandbox.spy();

            cdApiFacade.getLogServerAddress(cb);

            assert.isTrue(cb.calledWith('aaawup'), 'callback was not called with the value expected from the cdApi');

            getLogServerAddressStub.restore();
        });

        it('getLogServerAddress returns empty string if cdApi.getLogServerAddress does not exist', function () {
            const cdApiFacade = new CdApiFacade(CDUtils);
            const getLogServerAddress = window.cdApi.getLogServerAddress;
            window.cdApi.getLogServerAddress = undefined;
            const cb = this.sandbox.spy();

            cdApiFacade.getLogServerAddress(cb);

            assert.isTrue(cb.calledWith(''), 'callback was not called with empty string');

            window.cdApi.getLogServerAddress = getLogServerAddress;
        });
    });

    describe('getCustomerSessionID', function () {
        it('getCustomerSessionID calls the cdApi and returns its value', function () {
            const cdApiFacade = new CdApiFacade(CDUtils);
            const getCustConfLoc = this.sandbox.stub(window.cdApi, 'getCustomerSessionID');
            getCustConfLoc.callsArgWith(0, 'aaawup');
            const cb = this.sandbox.spy();

            cdApiFacade.getCustomerSessionID(cb);

            assert.isTrue(cb.calledWith('aaawup'), 'callback was not called with the value expected from the cdApi');

            getCustConfLoc.restore();
        });

        it('getCustomerSessionID returns empty string if cdApi.getCustomerSessionID does not exist', function () {
            const cdApiFacade = new CdApiFacade(CDUtils);
            const getCustomerSessionID = window.cdApi.getCustomerSessionID;
            window.cdApi.getCustomerSessionID = undefined;
            const cb = this.sandbox.spy();

            cdApiFacade.getCustomerSessionID(cb);

            assert.isTrue(cb.calledWith(''), 'callback was not called with empty string');

            window.cdApi.getCustomerSessionID = getCustomerSessionID;
        });
    });

    describe('isApiAvailable tests:', function () {
        it('returns true if api method is available', function () {
            const cdApiFacade = new CdApiFacade(CDUtils);

            assert.isTrue(cdApiFacade.isApiAvailable('getCustomerSessionID'));
        });

        it('returns false if api method is unavailable', function () {
            const cdApiFacade = new CdApiFacade(CDUtils);

            assert.isFalse(cdApiFacade.isApiAvailable('unavailableAPI'));
        });
    });

    describe('isCDAPIAvailable tests:', function () {
        it('returns true if cdApi is available', function () {
            window.cdApi = {};

            const cdApiFacade = new CdApiFacade(CDUtils);

            assert.isTrue(cdApiFacade.isCDAPIAvailable());
        });

        it('returns false if cdApi is unavailable', function () {
            window.cdApi = undefined;

            const cdApiFacade = new CdApiFacade(CDUtils);

            assert.isFalse(cdApiFacade.isCDAPIAvailable());
        });
    });

    describe('createClientInterface tests:', function () {

        after(function () {
            detachCdApi()
        });

        it('create client facade fails when cdApi is unavailable', function () {
            const cdApiFacade = new CdApiFacade(CDUtils);

            const clientStub = this.sandbox.createStubInstance(Client);

            const clientSettings = {};

            let thrownException = null;
            try {
                cdApiFacade.createClientInterface(clientStub, clientSettings);
            } catch (e) {
                thrownException = e;
            }

            assert.exists(thrownException);
            assert.equal(thrownException.message, 'Failed setting client facade. cdApi is unavailable.');
        });

        it('create client facade with restart capability enabled', function () {
            window.cdApi = {};

            const cdApiFacade = new CdApiFacade(CDUtils);
            const clientSettings = {
                'enableRestart': true,
            };

            const clientStub = this.sandbox.createStubInstance(Client);
            clientStub.restart = this.sandbox.spy();

            cdApiFacade.createClientInterface(clientStub, clientSettings);

            window.cdApi.client.restart();

            assert.isTrue(clientStub.restart.called);
        });

        it('create client facade with restart capability disabled', function () {
            window.cdApi = {};

            const cdApiFacade = new CdApiFacade(CDUtils);
            const clientSettings = {
                'enableRestart': false,
            };

            const clientStub = this.sandbox.createStubInstance(Client);
            clientStub.restart = this.sandbox.spy();

            cdApiFacade.createClientInterface(clientStub, clientSettings);

            assert.isFalse(window.cdApi.client.hasOwnProperty('restart'));
        });

        it('validate flush capability can be enabled', function () {
            window.cdApi = {};

            const cdApiFacade = new CdApiFacade(CDUtils);
            const clientSettings = {
                'enableFlush': true,
            };

            const clientStub = this.sandbox.createStubInstance(Client);
            clientStub.flush = this.sandbox.spy();
            clientStub.setCoordinatesMasking = this.sandbox.spy();

            cdApiFacade.createClientInterface(clientStub, clientSettings);

            window.cdApi.client.flush();

            assert.isTrue(clientStub.flush.called, 'flush was not called');
        });

        it("enableCoordinatesMasking capability can be enabled", async function () {
            window.cdApi = {};

            const cdApiFacade = new CdApiFacade(CDUtils);
            const clientSettings = {
                'enableCoordinatesMasking': true
            };
            const clientStub = this.sandbox.createStubInstance(Client);
            clientStub.setCoordinatesMasking = this.sandbox.spy();

            cdApiFacade.createClientInterface(clientStub, clientSettings);

            window.cdApi.client.setCoordinatesMasking(true);

            await TestUtils.waitForNoAssertion(() => {
                assert.isTrue(clientStub.setCoordinatesMasking.called, 'setCoordinatesMasking was not called');

            });
        });

        it('validate flush capability can be disabled', function () {
            window.cdApi = {};

            const cdApiFacade = new CdApiFacade(CDUtils);
            const clientSettings = {
                'enableFlush': false,
            };

            const clientStub = this.sandbox.createStubInstance(Client);
            clientStub.flush = this.sandbox.spy();

            cdApiFacade.createClientInterface(clientStub, clientSettings);

            assert.isFalse(window.cdApi.client.hasOwnProperty('flush'));

        });

    });

    describe('isWupServerURLProxy client configuration', function () {
        it('should return isWupServerURLProxy true', function () {
            attachCdApi();

            const cdApiFacade = new CdApiFacade(CDUtils);
            const cdApiGetConfigurationStub = sinon.stub(window.cdApi, 'getConfigurations');

            cdApiGetConfigurationStub.callsArgWith(0, {
                wupServerURL: 'https://wupserver.com/client/v3.1/web/wup?cid=mycid',
                isWupServerURLProxy: true,
            });

            const cb = this.sandbox.spy();
            cdApiFacade.getConfigurations(cb);
            const configurations = cb.firstCall.args[0];

            assert.isTrue(configurations.getIsWupServerURLProxy(), 'expected true');
            cdApiGetConfigurationStub.restore();

        });

        it('should return false when not configured', function () {
            attachCdApi();

            const cdApiFacade = new CdApiFacade(CDUtils);
            const cdApiGetConfigurationStub = this.sandbox.stub(window.cdApi, 'getConfigurations');

            cdApiGetConfigurationStub.callsArgWith(0, {
                wupServerURL: 'https://wupserver.com/client/v3.1/web/wup?cid=mycid'
            });
            const cb = this.sandbox.spy();
            cdApiFacade.getConfigurations(cb);
            const configurations = cb.firstCall.args[0];
            assert.isFalse(configurations.getIsWupServerURLProxy(), 'expected configuration to be false');

            cdApiGetConfigurationStub.restore();
        });

    });
    describe('isWupServerURLProxy false', function () {
        it('should call buildCustomServerUrl', async function () {
            attachCdApi();
            const buildCustomServerUrlSpy = this.sandbox.spy(URLBuilder, 'buildCustomServerUrl');
            const cdApiFacade = new CdApiFacade(CDUtils);
            const cdApiGetConfigurations = this.sandbox.stub(window.cdApi, 'getConfigurations');
            const cb = this.sandbox.spy();
            cdApiGetConfigurations.callsArgWith(0, {
                wupServerURL: 'https://wupserver.com/client/v3.1/web/wup?cid=mycid'
            });
            //spy after what is coming back from the cdApi getConfigurations()
            cdApiFacade.getConfigurations(cb);
            //restoring spies and stubs:
            cdApiGetConfigurations.restore();
            buildCustomServerUrlSpy.restore();

            await TestUtils.waitForNoAssertion(() => {
                const configurations = cb.firstCall.args[0];
                const extractorArgs = buildCustomServerUrlSpy.getCall(0).args;
                assert.equal(extractorArgs[0], configurations.getWupServerURL(), 'expected URLs to be equal');
            });
        });

        describe('AgentType functionality', function () {
            let cdApiFacade = null;
            let cb = null;
            let getConfigurations = null;
            beforeEach(function () {
                cdApiFacade = new CdApiFacade(CDUtils);
                getConfigurations = this.sandbox.stub(window.cdApi, 'getConfigurations');
                cb = this.sandbox.spy();
            });
            afterEach(function () {
                getConfigurations = null;
                cdApiFacade = null;
                cb = null;
            });
            it('should return AgentType as secondary', function () {
                getConfigurations.callsArgWith(0, {
                    wupServerURL: 'https://wupserver.com/client/v3.1/web/wup?cid=mycid',
                    collectionSettings: { mode: { agentType: 'secondary' }, }
                });

                cdApiFacade.getConfigurations(cb);
                const configurations = cb.firstCall.args[0]._collectionSettings._agentType;
                assert.equal(configurations, AgentType.SECONDARY, 'expected agentType to be secondary');
            });
            it('should return AgentType as primary when configuration is missing', function () {
                getConfigurations.callsArgWith(0, {
                    wupServerURL: 'https://wupserver.com/client/v3.1/web/wup?cid=mycid',
                });
                cdApiFacade.getConfigurations(cb);
                const configurations = cb.firstCall.args[0];
                assert.equal(configurations.getCollectionSettings().getAgentType(), AgentType.PRIMARY,
                    'expected agentType to be primary');
            });
            it('should return AgentType as primary the configuration value is not a valid value', function () {
                getConfigurations.callsArgWith(0, {
                    wupServerURL: 'https://wupserver.com/client/v3.1/web/wup?cid=mycid',
                    agentType: 'invalid',
                });
                cdApiFacade.getConfigurations(cb);
                const configurations = cb.firstCall.args[0];
                assert.equal(configurations.getCollectionSettings().getAgentType(), AgentType.PRIMARY,
                    'expected agentType to be primary');
            });
        });

        describe('AgentType functionality', function () {
            let cdApiFacade = null;
            let cb = null;
            let getConfigurations = null;
            beforeEach(function () {
                cdApiFacade = new CdApiFacade(CDUtils);
                getConfigurations = this.sandbox.stub(window.cdApi, 'getConfigurations');
                cb = this.sandbox.spy();
            });
            afterEach(function () {
                getConfigurations = null;
                cdApiFacade = null;
                cb = null;
            });
            it('should return AgentType as secondary', function () {
                getConfigurations.callsArgWith(0, {
                    wupServerURL: 'https://wupserver.com/client/v3.1/web/wup?cid=mycid',
                    collectionSettings: { mode: { agentType: AgentType.SECONDARY, collectionMode: CollectionMode.LEAN }, }
                });

                cdApiFacade.getConfigurations(cb);
                const configurations = cb.firstCall.args[0]._collectionSettings._collectionMode;
                assert.equal(configurations, CollectionMode.LEAN, 'expected collectionMode to be lean');
            });
        });
    });

    describe('enableStartupCustomerSessionId client configuration', function () {
        it('should return enableStartupCustomerSessionId true', function () {
            const cdApiFacade = new CdApiFacade(CDUtils);
            const cdApiGetConfigurationStub = sinon.stub(window.cdApi, 'getConfigurations');

            cdApiGetConfigurationStub.callsArgWith(0, {
                wupServerURL: 'https://wupserver.com/client/v3.1/web/wup?cid=mycid',
                enableStartupCustomerSessionId: true,
            });

            const cb = this.sandbox.spy();
            cdApiFacade.getConfigurations(cb);
            const configurations = cb.firstCall.args[0];

            assert.isTrue(configurations.getEnableStartupCustomerSessionId(), 'expected true');
            cdApiGetConfigurationStub.restore();

        });
        it('should return enableStartupCustomerSessionId undefiend', function () {
            const cdApiFacade = new CdApiFacade(CDUtils);
            const cdApiGetConfigurationStub = sinon.stub(window.cdApi, 'getConfigurations');

            cdApiGetConfigurationStub.callsArgWith(0, {
                wupServerURL: 'https://wupserver.com/client/v3.1/web/wup?cid=mycid',
            });

            const cb = this.sandbox.spy();
            cdApiFacade.getConfigurations(cb);
            const configurations = cb.firstCall.args[0];

            assert.isUndefined(configurations.getEnableStartupCustomerSessionId(), 'expected undefined');
            cdApiGetConfigurationStub.restore();

        });
    });

    describe('mutation observer configs', function () {
        it('should return mutation observer config values', function () {
            const cdApiFacade = new CdApiFacade(CDUtils);
            const getConfigurations = this.sandbox.stub(window.cdApi, 'getConfigurations');
            getConfigurations.callsArgWith(0, {
                wupServerURL: 'https://wupserver.com/client/v3.1/web/wup?cid=mycid',
                mutationMaxChunkSize: 50,
                mutationChunkDelayMs: 1000,
            });
            const cb = this.sandbox.spy();
            cdApiFacade.getConfigurations(cb);

            const configurations = cb.firstCall.args[0];
            assert.equal(configurations.getMutationMaxChunkSize(), 50);
            assert.equal(configurations.getMutationChunkDelayMs(), 1000);

            getConfigurations.restore();
        });

        it('should return mutation observer default config values', function () {
            const cdApiFacade = new CdApiFacade(CDUtils);
            const getConfigurations = this.sandbox.stub(window.cdApi, 'getConfigurations');
            getConfigurations.callsArgWith(0, {
                wupServerURL: 'https://wupserver.com/client/v3.1/web/wup?cid=mycid',
            });
            const cb = this.sandbox.spy();
            cdApiFacade.getConfigurations(cb);

            const configurations = cb.firstCall.args[0];
            assert.equal(configurations.getMutationMaxChunkSize(), 0);
            assert.equal(configurations.getMutationChunkDelayMs(), 100);

            getConfigurations.restore();
        });
    });
});