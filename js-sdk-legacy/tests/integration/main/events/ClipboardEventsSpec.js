import { assert } from 'chai';
import ConfigurationChanger from '../ConfigurationChanger';
import {
    ClipboardEventType,
    EventStructure as ClipboardEventStructure,
} from '../../../../src/main/collectors/events/ClipboardEventCollector';
import { TestUtils } from '../../../TestUtils';
import TestFeatureSupport from '../../../TestFeatureSupport';

describe('ClipboardEvents tests:', function () {
    beforeEach(function () {
        if (!TestFeatureSupport.isClipboardEventsSupported()) {
            this.skip();
        }

        ConfigurationChanger.change(this.systemBootstrapper, {
            isClipboardEvents: true,
        });
    });

    it('Copy clipboard event is sent to worker', async function () {
        const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;

        serverWorkerSendAsync.resetHistory();

        const e = new ClipboardEvent('copy', { dataType: 'text/plain', data: 'copy data' });
        document.dispatchEvent(e);

        TestUtils.verifyCallHappened(serverWorkerSendAsync, 'clipboard_events', 'copy clipboard event event', function (data) {
            assert.equal(data[ClipboardEventStructure.indexOf('clipboardEventType') + 1],
                ClipboardEventType.copy, 'event type is not copy event');
        });
    });

    it('Cut clipboard event is sent to worker', async function () {
        const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;

        serverWorkerSendAsync.resetHistory();

        const e = new ClipboardEvent('cut', { dataType: 'text/plain', data: 'cut data' });
        document.dispatchEvent(e);

        TestUtils.verifyCallHappened(serverWorkerSendAsync, 'clipboard_events', 'cut clipboard event event', function (data) {
            assert.equal(data[ClipboardEventStructure.indexOf('clipboardEventType') + 1],
                ClipboardEventType.cut, 'event type is not cut event');
        });
    });

    it('Paste clipboard event is sent to worker', async function () {
        const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;

        serverWorkerSendAsync.resetHistory();

        const e = new ClipboardEvent('paste', { dataType: 'text/plain', data: 'paste data' });
        document.dispatchEvent(e);

        TestUtils.verifyCallHappened(serverWorkerSendAsync, 'clipboard_events', 'paste clipboard event event', function (data) {
            assert.equal(data[ClipboardEventStructure.indexOf('clipboardEventType') + 1],
                ClipboardEventType.paste, 'event type is not paste event');
        });
    });

    it('Multiple clipboard events are sent to worker', async function () {
        const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;

        serverWorkerSendAsync.resetHistory();

        let e = new ClipboardEvent('copy', { dataType: 'text/plain', data: 'copy data' });
        document.dispatchEvent(e);

        TestUtils.verifyCallHappened(serverWorkerSendAsync, 'clipboard_events', 'copy clipboard event event', function (data) {
            assert.equal(data[ClipboardEventStructure.indexOf('clipboardEventType') + 1],
                ClipboardEventType.copy, 'event type is not copy event');
        });

        serverWorkerSendAsync.resetHistory();
        e = new ClipboardEvent('cut', { dataType: 'text/plain', data: 'cut data' });
        document.dispatchEvent(e);

        TestUtils.verifyCallHappened(serverWorkerSendAsync, 'clipboard_events', 'cut clipboard event event', function (data) {
            assert.equal(data[ClipboardEventStructure.indexOf('clipboardEventType') + 1],
                ClipboardEventType.cut, 'event type is not cut event');
        });

        serverWorkerSendAsync.resetHistory();
        e = new ClipboardEvent('paste', { dataType: 'text/plain', data: 'paste data' });
        document.dispatchEvent(e);

        TestUtils.verifyCallHappened(serverWorkerSendAsync, 'clipboard_events', 'paste clipboard event event', function (data) {
            assert.equal(data[ClipboardEventStructure.indexOf('clipboardEventType') + 1],
                ClipboardEventType.paste, 'event type is not paste event');
        });
    });
});
