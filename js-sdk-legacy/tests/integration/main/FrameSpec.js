import { assert } from 'chai';
import { TestUtils } from '../../TestUtils';
import {SystemFrameName} from '../../../src/main/core/frames/SystemFrameName';

describe('frame related tests:', function () {
    beforeEach(function () {
        this.sandbox = sinon.createSandbox();
    });

    afterEach(function () {
        this.sandbox.restore();
    });

    it('run features on frames', async function () {
        const startFeatureSpy = this.sandbox.spy(this.systemBootstrapper.getFeatureBuilder()._features.list.KeyEvents.instance, 'startFeature');
        const keyEvent = this.systemBootstrapper.getFeatureBuilder()._features.list.KeyEvents.instance;

        const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;
        serverWorkerSendAsync.resetHistory();

        this.iframe1 = document.createElement('iframe');
        this.iframe1.setAttribute('id', 'iframe1Test');
        document.body.appendChild(this.iframe1);
        this.iframe1.contentWindow.testSign = 'iframe1';

        this.iframe2 = document.createElement('iframe');
        this.iframe2.setAttribute('id', 'iframe2Test');
        document.body.appendChild(this.iframe2);
        this.iframe2.contentWindow.testSign = 'iframe2';
        keyEvent.startFeature.resetHistory();

        await TestUtils.waitForNoAssertion(() => {
            const calls = keyEvent.startFeature.getCalls();
            assert.equal(calls.length, 2, 'number of start calls is not 2');
            assert.isTrue(keyEvent.startFeature.calledWith(this.sandbox.match.has('Context', sinon.match.has('testSign', 'iframe1'))));
            assert.isTrue(keyEvent.startFeature.calledWith(this.sandbox.match.has('Context', sinon.match.has('testSign', 'iframe2'))));
        }).finally(() => {
            serverWorkerSendAsync.resetHistory();
            startFeatureSpy.restore();
        });
    });


    it('should not run features on frames with ignored prefix id', async function () {
        const startFeatureSpy = this.sandbox.spy(this.systemBootstrapper.getFeatureBuilder()._features.list.KeyEvents.instance, 'startFeature');
        const keyEvent = this.systemBootstrapper.getFeatureBuilder()._features.list.KeyEvents.instance;

        const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;
        serverWorkerSendAsync.resetHistory();

        this.iframeToIgnore = document.createElement('iframe');
        this.iframeToIgnore.setAttribute('id', SystemFrameName.ignorePrefixFrame + 'iframeToIgnoreTest');
        document.body.appendChild(this.iframeToIgnore);
        this.iframeToIgnore.contentWindow.testSign = 'iframeToIgnore';

        this.iframeToIgnore2 = document.createElement('iframe');
        this.iframeToIgnore2.setAttribute('id', SystemFrameName.ignorePrefixFrame + 'iframeToIgnoreTest2');
        document.body.appendChild(this.iframeToIgnore2);
        this.iframeToIgnore2.contentWindow.testSign = 'iframeToIgnore2';
        keyEvent.startFeature.resetHistory();

        this.iframe1 = document.createElement('iframe');
        this.iframe1.setAttribute('id', 'iframeTest');
        document.body.appendChild(this.iframe1);
        this.iframe1.contentWindow.testSign = 'iframe1';
        keyEvent.startFeature.resetHistory();

        await TestUtils.waitForNoAssertion(() => {
            const calls = keyEvent.startFeature.getCalls();
            assert.equal(calls.length, 1, 'number of start calls is not 1');
            assert.isTrue(keyEvent.startFeature.calledWith(this.sandbox.match.has('Context', sinon.match.has('testSign', 'iframe1'))));
        }).finally(() => {
            serverWorkerSendAsync.resetHistory();
            startFeatureSpy.restore();
        });
    });

    it('run features on sub frames', async function () {
        const startFeatureSpy = this.sandbox.spy(this.systemBootstrapper.getFeatureBuilder()._features.list.KeyEvents.instance, 'startFeature');
        const keyEvent = this.systemBootstrapper.getFeatureBuilder()._features.list.KeyEvents.instance;

        const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;
        serverWorkerSendAsync.resetHistory();

        this.iframe1 = document.createElement('iframe');
        this.iframe1.setAttribute('id', 'iframe1Test');
        document.body.appendChild(this.iframe1);
        this.iframe1.contentWindow.testSign = 'iframe1';

        this.iframe2 = document.createElement('iframe');
        this.iframe2.setAttribute('id', 'iframe2Test');
        document.body.appendChild(this.iframe2);
        this.iframe2.contentWindow.testSign = 'iframe2';

        this.subFrame1 = document.createElement('iframe');
        this.subFrame1.setAttribute('id', 'subFrame1');
        document.body.appendChild(this.subFrame1);
        this.subFrame1.contentWindow.testSign = 'subFrame1';

        this.subFrame2 = document.createElement('iframe');
        this.subFrame2.setAttribute('id', 'subFrame2');
        document.body.appendChild(this.subFrame2);
        this.subFrame2.contentWindow.testSign = 'subFrame2';

        this.subOfSubFrame3 = document.createElement('iframe');
        this.subOfSubFrame3.setAttribute('id', 'subOfSubFrame3');
        document.body.appendChild(this.subOfSubFrame3);
        this.subOfSubFrame3.contentWindow.testSign = 'subOfSubFrame3';

        keyEvent.startFeature.resetHistory();

        await TestUtils.waitForNoAssertion(() => {
            const calls = keyEvent.startFeature.getCalls();
            assert.equal(calls.length, 5, 'number of start calls is not 5');
            assert.isTrue(keyEvent.startFeature.calledWith(this.sandbox.match.has('Context', sinon.match.has('testSign', 'iframe1'))));
            assert.isTrue(keyEvent.startFeature.calledWith(this.sandbox.match.has('Context', sinon.match.has('testSign', 'iframe2'))));
            assert.isTrue(keyEvent.startFeature.calledWith(this.sandbox.match.has('Context', sinon.match.has('testSign', 'subFrame1'))));
            assert.isTrue(keyEvent.startFeature.calledWith(this.sandbox.match.has('Context', sinon.match.has('testSign', 'subFrame2'))));
            assert.isTrue(keyEvent.startFeature.calledWith(this.sandbox.match.has('Context', sinon.match.has('testSign', 'subOfSubFrame3'))));
        }).finally(() => {
            serverWorkerSendAsync.resetHistory();
            startFeatureSpy.restore();
        });
    });

    describe('Iframe Element Collection Tests:', function () {
        it('should handle iframe load delays gracefully', async function () {
            const keyEvent = this.systemBootstrapper.getFeatureBuilder()._features.list.KeyEvents.instance;
            const startFeatureSpy = this.sandbox.spy(keyEvent, 'startFeature');

            // Create iframe but don't load it immediately
            this.delayedIframe = document.createElement('iframe');
            this.delayedIframe.setAttribute('id', 'delayedIframe');
            document.body.appendChild(this.delayedIframe);

            startFeatureSpy.resetHistory();

            // Simulate delayed load
            setTimeout(() => {
                this.delayedIframe.contentWindow.testSign = 'delayedLoad';
                // Trigger load event
                const loadEvent = new Event('load');
                this.delayedIframe.dispatchEvent(loadEvent);
            }, 100);

            // Features should eventually start after the delayed load
            await TestUtils.waitForNoAssertion(() => {
                const calls = startFeatureSpy.getCalls();
                const iframeCalls = calls.filter(call => 
                    call.args[0] && call.args[0].Context && call.args[0].Context.testSign === 'delayedLoad'
                );
                assert.isTrue(iframeCalls.length > 0, 'KeyEvents should start on iframe after delayed load');
            }).finally(() => {
                startFeatureSpy.restore();
            });
        });

    });
});
