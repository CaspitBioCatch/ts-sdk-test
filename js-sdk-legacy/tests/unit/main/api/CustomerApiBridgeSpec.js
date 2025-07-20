import { assert } from 'chai';
import CustomerApiBridge from '../../../../src/main/api/CustomerApiBridge';
import CDUtils from '../../../../src/main/technicalServices/CDUtils';
import { ApiCommandType } from '../../../../src/main/api/ApiCommandType';
import { MessageBusEventType } from '../../../../src/main/events/MessageBusEventType';
import CdApiFacade from '../../../../src/main/api/CdApiFacade';
import { TestUtils } from '../../../TestUtils';
import PauseResumeManager from '../../../../src/main/core/state/PauseResumeManager';
import MessageBus from '../../../../src/main/technicalServices/MessageBus';

describe('CustomerApiBridge tests:', function () {
    beforeEach(function () {
        this.sandbox = sinon.createSandbox();
        this.messageBusStub = this.sandbox.createStubInstance(MessageBus);
        this.cdApiFacadeStub = this.sandbox.stub(new CdApiFacade());
        this.pauseResumeManagerStub = this.sandbox.createStubInstance(PauseResumeManager);
        this.pauseResumeManagerStub.isCustomerApiEnabled.returns(true);
    });

    afterEach(function () {
        this.sandbox.restore();
    });

    describe('getConfigurations', function () {
        it('getConfigurations calls the cdApi and returns its value', function () {
            const apiBridge = new CustomerApiBridge(this.pauseResumeManagerStub, this.messageBusStub, this.cdApiFacadeStub, CDUtils);
            this.cdApiFacadeStub.getConfigurations.callsArgWith(0, 'aaawup');
            const cb = sinon.spy();

            apiBridge.getConfigurations(cb);

            assert.isTrue(cb.calledWith('aaawup'), 'callback was not called with the value expected from the cdApi');
        });
    });

    describe('getServerAddress', function () {
        it('getServerAddress calls the cdApi.getCustomerConfigLocation and returns its value', function () {
            const apiBridge = new CustomerApiBridge(this.pauseResumeManagerStub, this.messageBusStub, this.cdApiFacadeStub, CDUtils);
            this.cdApiFacadeStub.getServerAddress.callsArgWith(0, 'aaawup');
            const cb = sinon.spy();

            apiBridge.getServerAddress(cb);

            assert.isTrue(cb.calledWith('aaawup'), 'callback was not called with the value expected from the cdApi');
        });

        it('getServerAddress gets the server address from the config file', async function () {
            const apiBridge = new CustomerApiBridge(this.pauseResumeManagerStub, this.messageBusStub, this.cdApiFacadeStub, CDUtils);
            this.cdApiFacadeStub.getServerAddress.callsArgWith(0, 'https://rnd-bcdn.s3.amazonaws.com/clientDev/iosCustomerConfig.json');
            const cb = sinon.spy();

            apiBridge.getServerAddress(cb);
            await TestUtils.waitForNoAssertion(() => {
                const call = cb.getCall(0);
                if (call) {
                    assert.isTrue(call.args[0].indexOf('client/v3.1/web/wup') >= -1, 'callback was not called with correct string');
                    assert.isTrue(call.args[0].indexOf('cid') >= -1, 'callback was not called with cid');
                }
            });
        });
    });

    describe('getLogServerAddress', function () {
        it('getLogServerAddress calls the cdApi and returns its value', function () {
            const apiBridge = new CustomerApiBridge(this.pauseResumeManagerStub, this.messageBusStub, this.cdApiFacadeStub, CDUtils);
            this.cdApiFacadeStub.getLogServerAddress.callsArgWith(0, 'aaawup');
            const cb = sinon.spy();

            apiBridge.getLogServerAddress(cb);

            assert.isTrue(cb.calledWith('aaawup'), 'callback was not called with the value expected from the cdApi');
        });
    });

    describe('getCustomerSessionID', function () {
        it('getCustomerSessionID calls the cdApi and returns its value', function () {
            const apiBridge = new CustomerApiBridge(this.pauseResumeManagerStub, this.messageBusStub, this.cdApiFacadeStub, CDUtils);
            this.cdApiFacadeStub.getCustomerSessionID.callsArgWith(0, 'aaawup');
            const cb = sinon.spy();

            apiBridge.getCustomerSessionID(cb);

            assert.isTrue(cb.calledWith('aaawup'), 'callback was not called with the value expected from the cdApi');
        });
    });

    describe('isApiAvailable tests:', function () {
        it('returns true if api method is available', function () {
            const apiBridge = new CustomerApiBridge(this.pauseResumeManagerStub, this.messageBusStub, this.cdApiFacadeStub, CDUtils);
            this.cdApiFacadeStub.isApiAvailable.withArgs('getCustomerSessionID').returns(true);

            assert.isTrue(apiBridge.isApiAvailable('getCustomerSessionID'));
        });

        it('returns false if api method is unavailable', function () {
            const apiBridge = new CustomerApiBridge(this.pauseResumeManagerStub, this.messageBusStub, this.cdApiFacadeStub, CDUtils);
            this.cdApiFacadeStub.isApiAvailable.withArgs('unavailableAPI').returns(false);

            assert.isFalse(apiBridge.isApiAvailable('unavailableAPI'));
        });
    });

    it('notifySessionReset post message of type SNumNotification', function (done) {
        const apiBridge = new CustomerApiBridge(this.pauseResumeManagerStub, this.messageBusStub, this.cdApiFacadeStub, CDUtils);
        window.addEventListener('message', function t(e) {
            if (e.data.type === 'SNumNotification') {
                assert.equal(e.data.cdSNum, 'aaafff', 'cdSNum is not the expected value');
                window.removeEventListener('message', t, true);
                done();
            }
        }, true);
        apiBridge.notifySessionReset('aaafff');
    });

    it('ChangeContext api command triggers the ApiContextChangeEvent bus event', async function () {
        const apiBridge = new CustomerApiBridge(this.pauseResumeManagerStub, this.messageBusStub, this.cdApiFacadeStub, CDUtils);
        apiBridge.enableApi();

        window.postMessage({ type: ApiCommandType.ContextChangeCommand, context: 'contxt' }, window.location.href);
        await TestUtils.waitForNoAssertion(() => {
            assert.isTrue(this.messageBusStub.publish.calledOnce, 'message bus publish was not called once');
            assert.isTrue(this.messageBusStub.publish.calledWith(MessageBusEventType.ApiContextChangeEvent, {
                    type: ApiCommandType.ContextChangeCommand, context: 'contxt',
                }),
                'message bus publish was called with invalid arguments');
        }).finally(() => {
            apiBridge.disableApi();
        });
    });

    it('ResetSession api command triggers the ApiResetSessionEvent bus event', async function () {
        const apiBridge = new CustomerApiBridge(this.pauseResumeManagerStub, this.messageBusStub, this.cdApiFacadeStub, CDUtils);
        apiBridge.enableApi();

        window.postMessage({
            type: ApiCommandType.ResetSessionCommand,
            resetReason: 'customerApi',
        }, window.location.href);
        await TestUtils.waitForNoAssertion(() => {
            assert.isTrue(this.messageBusStub.publish.calledOnce, 'message bus publish was not called once');
            assert.isTrue(this.messageBusStub.publish.calledWith(MessageBusEventType.ApiResetSessionEvent, {
                    type: ApiCommandType.ResetSessionCommand, resetReason: 'customerApi',
                }),
                'message bus publish was called with invalid arguments');
        }).finally(() => {
            apiBridge.disableApi();
        });
    });

    it('Metadata api command triggers the ApiCustomerMetadataEvent bus event', async function () {
        const apiBridge = new CustomerApiBridge(this.pauseResumeManagerStub, this.messageBusStub, this.cdApiFacadeStub, CDUtils);
        apiBridge.enableApi();

        window.postMessage({ type: ApiCommandType.CustomerMetadataCommand, data: 'meta' }, window.location.href);
        await TestUtils.waitForNoAssertion(() => {
            assert.isTrue(this.messageBusStub.publish.calledOnce, 'message bus publish was not called once');
            assert.isTrue(this.messageBusStub.publish.calledWith(MessageBusEventType.ApiCustomerMetadataEvent, {
                    type: ApiCommandType.CustomerMetadataCommand, data: 'meta',
                }),
                'message bus publish was called with invalid arguments');
        }).finally(() => {
            apiBridge.disableApi();
        });
    });

    it('cdChangeState (pause/resume) api command triggers the ApiChangeStateEvent bus event', async function () {
        const apiBridge = new CustomerApiBridge(this.pauseResumeManagerStub, this.messageBusStub, this.cdApiFacadeStub, CDUtils);
        apiBridge.enableApi();

        window.postMessage({ type: ApiCommandType.ChangeStateCommand, toState: 'pause' }, window.location.href);
        await TestUtils.waitForNoAssertion(() => {
            assert.isTrue(this.messageBusStub.publish.calledOnce, 'message bus publish was not called once');
            assert.isTrue(this.messageBusStub.publish.calledWith(MessageBusEventType.ApiChangeStateEvent, {
                    type: ApiCommandType.ChangeStateCommand,
                    toState: 'pause',
                }),
                'message bus publish was called with invalid arguments');
        });

        this.messageBusStub.publish.resetHistory();

        window.postMessage({ type: ApiCommandType.ChangeStateCommand, toState: 'resume' }, window.location.href);
        await TestUtils.waitForNoAssertion(() => {
            assert.isTrue(this.messageBusStub.publish.calledOnce, 'message bus publish was not called once');
            assert.isTrue(this.messageBusStub.publish.calledWith(MessageBusEventType.ApiChangeStateEvent, {
                    type: ApiCommandType.ChangeStateCommand,
                    toState: 'resume',
                }),
                'message bus publish was called with invalid arguments');
        }).finally(() => {
            apiBridge.disableApi();
        });
    });

    it('Set Csid api command triggers the ApiCustomerMetadataEvent bus event', async function () {
        const apiBridge = new CustomerApiBridge(this.pauseResumeManagerStub, this.messageBusStub, this.cdApiFacadeStub, CDUtils);
        apiBridge.enableApi();

        window.postMessage({ type: ApiCommandType.SetCsidCommand, csid: 'cs-id' }, window.location.href);
        await TestUtils.waitForNoAssertion(() => {
            assert.isTrue(this.messageBusStub.publish.calledOnce, 'message bus publish was not called once');
            assert.isTrue(this.messageBusStub.publish.calledWith(MessageBusEventType.ApiSetCsidEvent, {
                    type: ApiCommandType.SetCsidCommand, csid: 'cs-id',
                }),
                'message bus publish was called with invalid arguments');
        }).finally(() => {
            apiBridge.disableApi();
        });
    });

    it('Set Psid api command triggers the ApiCustomerMetadataEvent bus event', async function () {
        const apiBridge = new CustomerApiBridge(this.pauseResumeManagerStub, this.messageBusStub, this.cdApiFacadeStub, CDUtils);
        apiBridge.enableApi();

        window.postMessage({ type: ApiCommandType.SetPsidCommand, psid: 'p s i d' }, window.location.href);
        await TestUtils.waitForNoAssertion(() => {
            assert.isTrue(this.messageBusStub.publish.calledOnce, 'message bus publish was not called once');
            assert.isTrue(this.messageBusStub.publish.calledWith(MessageBusEventType.ApiSetPsidEvent, {
                    type: ApiCommandType.SetPsidCommand, psid: 'p s i d',
                }),
                'message bus publish was called with invalid arguments');
        }).finally(() => {
            apiBridge.disableApi();
        });
    });

    it('should not call any handler when customer api not enabled', async function () {
        this.pauseResumeManagerStub.isCustomerApiEnabled.returns(false);
        const apiBridge = new CustomerApiBridge(this.pauseResumeManagerStub, this.messageBusStub, this.cdApiFacadeStub, CDUtils);
        apiBridge.enableApi();
        window.postMessage({ type: ApiCommandType.ResetSessionCommand, data: 'aData' }, window.location.href);
        await TestUtils.waitForNoAssertion(() => {
            assert.isTrue(this.messageBusStub.publish.notCalled, 'aHandler called when customer api not enabled');
        }).finally(() => {
            apiBridge.disableApi();
        });
    });
});
