import { assert } from 'chai';
import ConfigurationChanger from './ConfigurationChanger';
import { TestUtils } from '../../TestUtils';
import { WorkerCommand } from '../../../src/main/events/WorkerCommand';
import TestFeatureSupport from '../../TestFeatureSupport';
import CDUtils from '../../../src/main/technicalServices/CDUtils';
import StorageUtilsWrapper from "../../../src/main/technicalServices/StorageUtilsWrapper";
import ConfigurationRepository from "../../../src/main/core/configuration/ConfigurationRepository";
import {ConfigurationFields} from "../../../src/main/core/configuration/ConfigurationFields";
import TestBrowserUtils from '../../TestBrowserUtils';

describe('session tests:', function () {
    const sidKey = 'cdSNum';

    beforeEach(function () {
        this.sandbox = sinon.createSandbox();
    });

    afterEach(function () {
        this.sandbox.restore();
    });

    describe('session reset tests:', function () {
        it('session id regeneration runs the perSession features - all features reported', async function () {
            // Flaky on Safari browsers due to private browsing feature.
            this.retries(3);

            // Change the threshold so reset will be called and not blocked...
            ConfigurationChanger.change(this.systemBootstrapper, {
                resetSessionApiThreshold: -1,
            });

            const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;

            function verifyLengthNotZero(data, errorMsg) {
                assert.notEqual(data.length, 0, 'data length is 0: ' + errorMsg);
            }

            function verifyLengthEquals(len, data, errorMsg) {
                assert.equal(data.length, len, 'data length is different: ' + errorMsg);
            }

            function verifyPlugins(data) {
                assert.notEqual(data.length, 0, 'plugins length');
                assert.equal(data[0].length, 4, 'plugin data should have 4 items');
            }

            // function anyValue(data, errorMsg) {
            //     data;
            //     errorMsg;
            // }

            const featuresExpected = {
                device_source: {
                    expected: 'js',
                    actual: null,
                    called: false,
                    errorMsg: 'device_source is expected to be js',
                },
                version_client: {
                    expected: null, actual: null, called: false, optional: true,
                },
                dnt: {
                    expected: TestFeatureSupport.isDoNotTrackSupported() ? 0 : 2,
                    actual: null,
                    called: false,
                    errorMsg: 'do not track is expected to be 0',
                },
                main_lang: {
                    expected: null, actual: null, called: false,
                },
                os: {
                    expected: null, actual: null, called: false,
                },
                os_version: {
                    expected: null, actual: null, called: false,
                },
                os_family: {
                    expected: null, actual: null, called: false,
                },
                is_private_browsing: {
                    expected: false,
                    actual: null,
                    called: false,
                    errorMsg: 'is private expected to be false',
                },
                input_mech: {
                    expected: null, actual: null, called: false,
                },
                cores: {
                    expected: null, actual: null, called: false,
                },
                l_ips: {
                    expected: null, actual: null, called: false, optional: true,
                },
                g_ips: {
                    expected: null, actual: null, called: false, optional: true,
                },
                fonts: {
                    expected: verifyLengthNotZero, actual: null, called: false, optional: true,
                },
                plugins: {
                    expected: verifyPlugins, actual: null, called: false, optional: true,
                },
                display: {
                    expected: verifyLengthEquals.bind(this, 7), actual: null, called: false, optional: true,
                },
                client_debug_info : {
                    expected: verifyLengthNotZero, actual: null, called: false, optional: true,
                },
                js_ua: {
                    expected: verifyLengthNotZero,
                    actual: null,
                    called: false,
                    errorMsg: 'user agent length should be > 0',
                },
                time_zone: {
                    expected: (new Date()).getTimezoneOffset() * -1,
                    actual: null,
                    called: false,
                    errorMsg: 'wrong time_zone value',
                },
                net_info_api: {
                    expected: verifyLengthEquals.bind(this, 6),
                    actual: null,
                    called: false,
                    optional: true,
                    errorMsg: ' bad net_info',
                },
                grph_card: {
                    expected: null, actual: null, called: false, optional: true,
                },
                au_context_info: {
                    expected: null, actual: null, called: false, optional: true,
                },
                au_osc_sum: {
                    expected: null, actual: null, called: false, optional: true,
                },
                au_osc_output: {
                    expected: null, actual: null, called: false, optional: true,
                },
                au_osc_output_hash: {
                    expected: null, actual: null, called: false, optional: true,
                },
                cookie_enabled: {
                    expected: true, actual: null, called: false, optional: true,
                },
                browser_spoofing: {
                    expected: verifyLengthNotZero, actual: null, called: false, optional: true,
                },
                device_memory: {
                    expected: null, actual: null, called: false, optional: true,
                },
                per_geolocation: {
                    expected: null, actual: null, called: false, optional: true,
                },
                per_midi: {
                    expected: null, actual: null, called: false, optional: true,
                },
                per_notifications: {
                    expected: null, actual: null, called: false, optional: true,
                },
                per_push: {
                    expected: null, actual: null, called: false, optional: true,
                },
                per_storage: {
                    expected: null, actual: null, called: false, optional: true,
                },
                per_audio: {
                    expected: null, actual: null, called: false, optional: true,
                },
                per_video: {
                    expected: null, actual: null, called: false, optional: true,
                },
                media_devices: {
                    expected: null, actual: null, called: false, optional: true,
                },
                navigator_max_touch_points: {
                    expected: null, actual: null, called: false, optional: true,
                },
                browser_display_detect: {
                    expected: null, actual: null, called: false, optional: true,
                },
                math_detect: {
                    expected: null, actual: null, called: false, optional: true,
                },
                storage_estimate: {
                    expected: null, actual: null, called: false, optional: true,
                },
                keyboard_layout: {
                    expected: null, actual: null, called: false, optional: true,
                },
                battery_status: {
                    expected: null, actual: null, called: false, optional: true,
                },
                browser_extensions: {
                    expected: null, actual: null, called: false, optional: true,
                },
            };

            if (navigator.languages) {
                featuresExpected.languages = { expected: null, actual: null, called: false };
            }

            if(TestBrowserUtils.isFirefox(window.navigator.userAgent, '')) {
                featuresExpected.navigator_build_id = { expected: null, actual: null, called: false };
            }

            serverWorkerSendAsync.resetHistory();
            window.cdApi.startNewSession();

            await TestUtils.waitForNoAssertion(() => {
                const staticFields = TestUtils.findAllStaticFields(serverWorkerSendAsync);

                assert.exists(staticFields, 'unable to find static fields');

                for (let i = 0; i < staticFields.length; i++) {
                    const featureDef = featuresExpected[staticFields[i][0]];

                    assert.isDefined(featureDef, 'a static_fields feature that called that was not expected: ' + staticFields[i][0]);
                    featureDef.called = true;
                    if (featureDef.expected !== null) {
                        if (typeof featureDef.expected === 'function') {
                            featureDef.expected(staticFields[i][1], featureDef.errorMsg);
                        } else {
                            // verify the content
                            assert.equal(staticFields[i][1], featureDef.expected, featureDef.errorMsg);
                        }
                    }
                }

                Object.keys(featuresExpected).forEach((key) => {
                    if (!featuresExpected[key].optional) {
                        assert.isTrue(featuresExpected[key].called, `feature not called ${key}`);
                    }
                });
            });
        });

        it('session id regeneration posts notification to api listener', async function () {
            // Change the threshold so reset will be called and not blocked...
            ConfigurationChanger.change(this.systemBootstrapper, {
                resetSessionApiThreshold: -1,
            });

            const cb = this.sandbox.spy();
            const srvWrkSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;

            srvWrkSendAsync.resetHistory();
            window.cdApi.registerSessionNumberChange(cb);

            window.postMessage({ type: 'ResetSession', resetReason: 'Home page' }, window.location.href);

            await TestUtils.waitForNoAssertion(() => {
                assert.isTrue(cb.calledOnce, `cb was not called once. It was called ${cb.callCount}`);
                const index = cb.getCall(0).args[0];
                const sid = cb.getCall(0).args[0].substr(index + 1);
                assert.isNotNull(sid, 'session number passed to api is not valid');
            });
        });

        it('session id regeneration sends csid update to worker', async function () {
            // Change the threshold so reset will be called and not blocked...
            ConfigurationChanger.change(this.systemBootstrapper, {
                resetSessionApiThreshold: -1,
            });

            const srvWrkSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;

            window.cdApi.startNewSession();

            await TestUtils.waitForNoAssertion(() => {
                TestUtils.verifyMsgToWorker(srvWrkSendAsync, WorkerCommand.updateCsidCommand, function (data) {
                    assert.isNotNull(data.csid, 'updateCsidCommand was sent without csid parameter');
                    assert.equal(data.csid, 'customerSessionNumber2.2', 'csid value is invalid');
                });
            });
        });

        it('when session is reset csid is reset', async function () {
            // Change the threshold so reset will be called and not blocked...
            ConfigurationChanger.change(this.systemBootstrapper, {
                resetSessionApiThreshold: -1,
            });

            const srvWrkSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;

            window.cdApi.startNewSession();

            await TestUtils.waitForNoAssertion(() => {
                TestUtils.verifyMsgToWorker(srvWrkSendAsync, WorkerCommand.startNewSessionCommand, function (data) {
                    assert.isNull(data.csid, 'startNewSessionCommand was sent with a csid parameter which is not null');
                });
            });
        });

        it('when session is reset psid is reset', async function () {
            // Change the threshold so reset will be called and not blocked...
            ConfigurationChanger.change(this.systemBootstrapper, {
                resetSessionApiThreshold: -1,
            });

            const srvWrkSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;

            window.postMessage({ type: 'cdSetPsid', psid: 'newPSID' }, window.location.href);

            await TestUtils.waitForNoAssertion(() => {
                TestUtils.verifyMsgToWorker(srvWrkSendAsync, WorkerCommand.updatePsidCommand, function (data) {
                    assert.isNotNull(data.psid, 'updatePidCommand was sent without psid parameter');
                    assert.equal(data.psid, 'newPSID', 'psid value is invalid');
                });
            });

            window.cdApi.startNewSession();

            await TestUtils.waitForNoAssertion(() => {
                TestUtils.verifyMsgToWorker(srvWrkSendAsync, WorkerCommand.startNewSessionCommand, function (data) {
                    assert.isNull(data.psid, 'startNewSessionCommand was sent with a csid parameter which is not null');
                });
            });
        });

        it('resuming a session sends csid update to worker', async function () {
            // Change the threshold so reset will be called and not blocked...
            ConfigurationChanger.change(this.systemBootstrapper, {
                resetSessionApiThreshold: -1,
            });

            const srvWrkSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;

            this.systemBootstrapper.getSessionService().resumeOrStartSession();

            await TestUtils.waitForNoAssertion(() => {
                TestUtils.verifyMsgToWorker(srvWrkSendAsync, WorkerCommand.updateCsidCommand, function (data) {
                    assert.isNotNull(data.csid, 'updateCsidCommand was sent without csid parameter');
                    assert.equal(data.csid, 'customerSessionNumber2.2', 'csid value is invalid');
                });
            });
        });

        it('resuming a session sends psid update to worker', async function () {
            // Change the threshold so reset will be called and not blocked...
            ConfigurationChanger.change(this.systemBootstrapper, {
                resetSessionApiThreshold: -1,
            });

            const srvWrkSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;

            srvWrkSendAsync.resetHistory();

            window.postMessage({ type: 'cdSetPsid', psid: 'partnersessIdent' }, window.location.href);

            await TestUtils.waitForNoAssertion(() => {
                TestUtils.verifyMsgToWorker(srvWrkSendAsync, WorkerCommand.updatePsidCommand, function (data) {
                    assert.isNotNull(data.psid, 'updatePidCommand was sent without psid parameter');
                    assert.equal(data.psid, 'partnersessIdent', 'psid value is invalid');
                });
            });

            this.systemBootstrapper.getSessionService().resumeOrStartSession();

            await TestUtils.waitForNoAssertion(() => {
                TestUtils.verifyMsgToWorker(srvWrkSendAsync, WorkerCommand.updatePsidCommand, function (data) {
                    assert.isNotNull(data.psid, 'updatePidCommand was sent without psid parameter');
                    assert.equal(data.psid, 'partnersessIdent', 'psid value is invalid');
                });
            });
        });

        it('should receive new sid from server if we reset the session', async function () {
            // Change the threshold so reset will be called and not blocked...
            ConfigurationChanger.change(this.systemBootstrapper, {
                resetSessionApiThreshold: -1,
            });

            const sessionService = this.systemBootstrapper.getSessionService();
            const srvWrkSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;

            srvWrkSendAsync.resetHistory();

            // Trigger a reset session call which is what happens when the script is loaded as well. Should generate a session id if not found or use existing one if found
            sessionService.resetSession({ resetReason: 'TEST' });

            await TestUtils.waitForNoAssertion(() => {
                TestUtils.verifyMsgToWorker(srvWrkSendAsync, WorkerCommand.startNewSessionCommand, function (data) {
                    assert.notExists(data.cdsnum, 'sid should not exist in command');
                });

                // Make sure we receive the sid from the server
                assert.isNotNull(sessionService.sessionId, 'session id is null');
            });
        });
    });

    describe('session id storage related tests:', function () {
        it('should get existing session id even if not in cookie', function () {
            const sessionService = this.systemBootstrapper.getSessionService();
            const configurationRepMock = sinon.stub(new ConfigurationRepository());
            configurationRepMock.get.withArgs(ConfigurationFields.enableSameSiteNoneAndSecureCookies).returns(false);

            const storageUtilsWrapper = new StorageUtilsWrapper(CDUtils, configurationRepMock)
            // Start a clean session
            sessionService.resumeOrStartSession();

            const initialSessionId = sessionService.sessionId;
            storageUtilsWrapper.setCookie(sidKey, '');
            assert.equal(storageUtilsWrapper.getCookie(sidKey), '', `Cookie ${sidKey} value is not as expected`);

            // Trigger a reset session call which is what happens when the script is loaded as well. Should generate a session id if not found or use existing one if found
            sessionService.resumeOrStartSession();

            assert.equal(sessionService.sessionId, initialSessionId, 'session id was not equal to expected');
        });

        it('should get existing session id even if not in local storage', function () {
            const sessionService = this.systemBootstrapper.getSessionService();
            const configurationRepMock = sinon.stub(new ConfigurationRepository());
            configurationRepMock.get.withArgs(ConfigurationFields.enableSameSiteNoneAndSecureCookies).returns(false);

            const storageUtilsWrapper = new StorageUtilsWrapper(CDUtils, configurationRepMock)
            // Start a clean session
            sessionService.resumeOrStartSession();

            const initialSessionId = sessionService.sessionId;
            storageUtilsWrapper.removeFromLocalStorage(sidKey);
            assert.equal(storageUtilsWrapper.getFromLocalStorage(sidKey), undefined, `local storage ${sidKey} value is not as expected`);

            // Trigger a reset session call which is what happens when the script is loaded as well. Should generate a session id if not found or use existing one if found
            sessionService.resumeOrStartSession();

            // Wait for condition since for some reason in Edge it randomly fails.
            TestUtils.waitForNoAssertion(() => {
                assert.equal(sessionService.sessionId, initialSessionId, 'session id was not equal to expected');
            });
        });

        it('should save current session id to cookie after read from local storage', function () {
            const sessionService = this.systemBootstrapper.getSessionService();
            const configurationRepMock = sinon.stub(new ConfigurationRepository());
            configurationRepMock.get.withArgs(ConfigurationFields.enableSameSiteNoneAndSecureCookies).returns(false);

            const storageUtilsWrapper = new StorageUtilsWrapper(CDUtils, configurationRepMock)
            // Start a clean session
            sessionService.resumeOrStartSession();

            const initialSessionId = sessionService.sessionId;

            storageUtilsWrapper.setCookie(sidKey, '');
            assert.equal(storageUtilsWrapper.getCookie(sidKey), '', `Cookie ${sidKey} value is not as expected. Browser Cookies: ${document.cookie}\``);

            // Trigger a reset session call which is what happens when the script is loaded as well. Should generate a session id if not found or use existing one if found
            sessionService.resumeOrStartSession();

            // Wait for condition since for some reason in Edge it randomly fails.
            TestUtils.waitForNoAssertion(() => {
                assert.equal(storageUtilsWrapper.getCookie(sidKey), initialSessionId, `Cookie sid is not equal to expected. Browser Cookies: ${document.cookie}`);
            });
        });

        it('should save current session id to local storage after read from cookie', function () {
            const sessionService = this.systemBootstrapper.getSessionService();
            const configurationRepMock = sinon.stub(new ConfigurationRepository());
            configurationRepMock.get.withArgs(ConfigurationFields.enableSameSiteNoneAndSecureCookies).returns(false);

            const storageUtilsWrapper = new StorageUtilsWrapper(CDUtils, configurationRepMock)
            // Start a clean session
            sessionService.resumeOrStartSession();

            // Wait for sessionId to have a value
            TestUtils.waitForNoAssertion(() => {
                assert.exists(sessionService.sessionId);
            });

            const initialSessionId = sessionService.sessionId;
            storageUtilsWrapper.removeFromLocalStorage(sidKey);
            assert.equal(storageUtilsWrapper.getFromLocalStorage(sidKey), undefined, `local storage ${sidKey} value is not as expected`);

            // Trigger a reset session call which is what happens when the script is loaded as well. Should generate a session id if not found or use existing one if found
            sessionService.resumeOrStartSession();

            TestUtils.waitForNoAssertion(() => {
                assert.equal(storageUtilsWrapper.getFromLocalStorage(sidKey), initialSessionId);
            });
        });

        it('should reset session id if cookie and local storage is undefined', function () {
            const sessionService = this.systemBootstrapper.getSessionService();
            const configurationRepMock = sinon.stub(new ConfigurationRepository());
            configurationRepMock.get.withArgs(ConfigurationFields.enableSameSiteNoneAndSecureCookies).returns(false);

            const storageUtilsWrapper = new StorageUtilsWrapper(CDUtils, configurationRepMock)
            // Start a clean session
            sessionService.resumeOrStartSession();

            // Wait for sessionId to have a value
            TestUtils.waitForNoAssertion(() => {
                assert.exists(sessionService.sessionId);
            });

            const initialSessionId = sessionService.sessionId;
            storageUtilsWrapper.setCookie(sidKey, '');
            storageUtilsWrapper.removeFromLocalStorage(sidKey);
            assert.equal(storageUtilsWrapper.getCookie(sidKey), '', `cookie ${sidKey} value is not as expected`);

            // Trigger a reset session call which is what happens when the script is loaded as well. Should generate a session id if not found or use existing one if found
            sessionService.resumeOrStartSession();

            TestUtils.waitForNoAssertion(() => {
                assert.notEqual(storageUtilsWrapper.getCookie(sidKey), initialSessionId, 'Invalid SID in cookie');
                assert.notEqual(storageUtilsWrapper.getFromLocalStorage(sidKey), initialSessionId, 'Invalid SID in local storage');
            });
        });
    });
});
