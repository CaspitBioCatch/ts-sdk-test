import { assert } from 'chai';
import BeforeInstallPromptEventsCollector from '../../../../../src/main/collectors/events/BeforeInstallPromptEventCollector';
import MessageBus from '../../../../../src/main/technicalServices/MessageBus';
import { EventStructure as BeforeInstallPromptEventStructure } from '../../../../../src/main/collectors/events/BeforeInstallPromptEventCollector';
import CDUtils from '../../../../../src/main/technicalServices/CDUtils';
import BeforeInstallPromptEventEmitter from '../../../../../src/main/emitters/BeforeInstallPromptEventEmitter';
import DataQ from '../../../../../src/main/technicalServices/DataQ';

describe('BeforeInstallPromptEventCollector tests:', function () {
    beforeEach(function () {
        this.dataQ = sinon.createStubInstance(DataQ);
        this._messageBus = new MessageBus();

        this.sandbox = sinon.createSandbox();
        this._installPromptEventEmitterStub = this.sandbox.createStubInstance(BeforeInstallPromptEventEmitter);
    });

    describe('test event', function () {
        it('should report before_install_prompt', function () {
            const bipEvent = new BeforeInstallPromptEventsCollector(
                this.dataQ,
                CDUtils,
                this._messageBus,
                this._installPromptEventEmitterStub,
            );

            bipEvent.startFeature();

            const e = {
                type: 'beforeinstallprompt',
                timeStamp: 5164.325,
                platforms: ['web'],
            };

            bipEvent._onBeforeInstallPrompt(e);

            assert.isTrue(this.dataQ.addToQueue.getCalls().length > 0, 'did before_install_prompt feature work?');
            const call = this.dataQ.addToQueue.getCall(0);
            assert.equal(call.args[0], 'before_install_prompt', 'not before_install_prompt event');
            assert.equal(call.args[1][BeforeInstallPromptEventStructure.indexOf('platforms') + 1], 'web', 'error field platform');
            assert.equal(call.args[1][BeforeInstallPromptEventStructure.indexOf('relativeTime') + 1], e.timeStamp, 'relative time issue');
        });

        it('should report before_install_prompt if platforms is null', function () {
            const bipEvent = new BeforeInstallPromptEventsCollector(
                this.dataQ,
                CDUtils,
                this._messageBus,
                this._installPromptEventEmitterStub,
            );
            bipEvent.startFeature();

            const e = {
                type: 'beforeinstallprompt',
                timeStamp: 5164.325,
            };

            bipEvent._onBeforeInstallPrompt(e);

            assert.isTrue(this.dataQ.addToQueue.getCalls().length > 0, 'did before_install_prompt feature work?');
            const call = this.dataQ.addToQueue.getCall(0);
            assert.equal(call.args[0], 'before_install_prompt', 'not before_install_prompt event');
            assert.equal(call.args[1][BeforeInstallPromptEventStructure.indexOf('platforms') + 1], '', 'field platform is not ok');
            assert.equal(call.args[1][BeforeInstallPromptEventStructure.indexOf('relativeTime') + 1], e.timeStamp, 'relative time issue');
        });
    });
});
