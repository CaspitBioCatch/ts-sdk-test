import { assert } from 'chai';
import MessageBus from '../../../../../src/main/technicalServices/MessageBus';
import ClipboardEventsCollector, { ClipboardEventType } from '../../../../../src/main/collectors/events/ClipboardEventCollector';
import { dataQueue } from '../../../mocks/mockObjects';
import { EventStructure as ClipboardEventStructure } from '../../../../../src/main/collectors/events/ClipboardEventCollector';
import CDUtils from '../../../../../src/main/technicalServices/CDUtils';
import { MessageBusEventType } from '../../../../../src/main/events/MessageBusEventType';
import CutEventEmitter from '../../../../../src/main/emitters/CutEventEmitter';
import PasteEventEmitter from '../../../../../src/main/emitters/PasteEventEmitter';
import CopyEventEmitter from '../../../../../src/main/emitters/CopyEventEmitter';
import ElementsCollector from '../../../../../src/main/collectors/events/ElementsCollector';
import BrowserContext from '../../../../../src/main/core/browsercontexts/BrowserContext';
import sinon from 'sinon';
import StartupConfigurations from "../../../../../src/main/api/StartupConfigurations";

describe('ClipboardEventCollector Tests:', function () {
    let maskingServiceStub;

    beforeEach(function () {
        this._messageBus = new MessageBus();

        maskingServiceStub = {
            maskAbsoluteIfRequired: sinon.stub().returnsArg(0),
            maskText: sinon.stub().returns('maskingServiceStub.maskText.mock'),
            _shouldMask: sinon.stub().returnsArg(0)
        };

        this.sandbox = sinon.createSandbox();
        this.elementsStub = this.sandbox.createStubInstance(ElementsCollector);
        this.elementsStub.getElement.returns(32);
        this.elementsStub.isListed.returns(false);
        this.elementsStub._maskingService = maskingServiceStub

        this._cutEventEmitterStub = this.sandbox.createStubInstance(CutEventEmitter);
        this._copyEventEmitterStub = this.sandbox.createStubInstance(CopyEventEmitter);
        this._pasteEventEmitterStub = this.sandbox.createStubInstance(PasteEventEmitter);

        const input = document.createElement('input');
        input.setAttribute('id', 'txt1');
        input.textContent = 'asdd';
        input.className = 'class-name-txt'; // set the CSS class
        document.body.appendChild(input); // put it into the DOM

        const startupConfigurations = this.sandbox.createStubInstance(StartupConfigurations);

        const clipBoardBuiler = new ClipboardEventsCollector.Builder(
            CDUtils,
            this.elementsStub,
            dataQueue,
            startupConfigurations
        );
        clipBoardBuiler.withMessageBus(this._messageBus);
        clipBoardBuiler.withCutEventEmitter(this._cutEventEmitterStub);
        clipBoardBuiler.withCopyEventEmitter(this._copyEventEmitterStub);
        clipBoardBuiler.withPasteEventEmitter(this._pasteEventEmitterStub);
        this._clipboardEvents = clipBoardBuiler.build();
    });

    afterEach(function () {
        this.sandbox.restore();

        const input = document.getElementById('txt1');
        document.body.removeChild(input);
        dataQueue.requests = [];
    });

    it('Should create a new instance of ClipboardEvents Data Collector', function () {
        assert.isObject(this._clipboardEvents, 'Could not construct a new ElementEvents Data Collector');
        assert.instanceOf(this._clipboardEvents, ClipboardEventsCollector, 'this._elementEvents must be an instance of ElementEvents');
    });

    it('Should collect a copy clipboard event', function () {
        this._clipboardEvents.startFeature(new BrowserContext(self));

        const copyClipboardEvent = {
            bubbles: false,
            cancelBubble: false,
            cancelable: false,
            clipboardData: { getData() { return 'copy data'; } },
            composed: false,
            currentTarget: null,
            defaultPrevented: false,
            eventPhase: 0,
            isTrusted: false,
            path: [],
            returnValue: true,
            srcElement: null,
            target: null,
            timeStamp: 866.1000001011416,
            type: 'copy',
        };

        this._messageBus.publish(MessageBusEventType.CopyEvent, copyClipboardEvent);

        // Todo add event tests
        assert.isTrue(dataQueue.requests.length > 0, 'did clipboard event work?');
        assert.equal(dataQueue.requests[0][ClipboardEventStructure.indexOf('clipboardEventType') + 1], ClipboardEventType.copy);
        assert.equal(dataQueue.requests[0][ClipboardEventStructure.indexOf('copiedText') + 1], 'aaaa*aaaa');

        this._clipboardEvents.stopFeature(new BrowserContext(self));
    });

    it('Should collect a cut clipboard event', function () {
        this._clipboardEvents.startFeature(new BrowserContext(self));

        const cutClipboardEvent = {
            bubbles: false,
            cancelBubble: false,
            cancelable: false,
            clipboardData: { getData() { return 'cut 1234'; } },
            composed: false,
            currentTarget: null,
            defaultPrevented: false,
            eventPhase: 0,
            isTrusted: false,
            path: [],
            returnValue: true,
            srcElement: null,
            target: null,
            timeStamp: 866.1000001011416,
            type: 'cut',
        };

        this._messageBus.publish(MessageBusEventType.CutEvent, cutClipboardEvent);

        // Todo add event tests
        assert.isTrue(dataQueue.requests.length > 0, 'did clipboard event work?');
        assert.equal(dataQueue.requests[0][ClipboardEventStructure.indexOf('clipboardEventType') + 1], ClipboardEventType.cut);
        assert.equal(dataQueue.requests[0][ClipboardEventStructure.indexOf('copiedText') + 1], 'aaa*1111');

        this._clipboardEvents.stopFeature(new BrowserContext(self));
    });

    it('Should collect a paste clipboard event', function () {
        this._clipboardEvents.startFeature(new BrowserContext(self));

        const pasteClipboardEvent = {
            bubbles: false,
            cancelBubble: false,
            cancelable: false,
            clipboardData: { getData() { return 'paste 12ta'; } },
            composed: false,
            currentTarget: null,
            defaultPrevented: false,
            eventPhase: 0,
            isTrusted: false,
            path: [],
            returnValue: true,
            srcElement: null,
            target: null,
            timeStamp: 866.1000001011416,
            type: 'paste',
        };

        this._messageBus.publish(MessageBusEventType.PasteEvent, pasteClipboardEvent);

        assert.isTrue(dataQueue.requests.length > 0, 'did clipboard event work?');
        assert.equal(dataQueue.requests[0][ClipboardEventStructure.indexOf('copiedText') + 1], 'aaaaa*11aa');
        assert.equal(dataQueue.requests[0][ClipboardEventStructure.indexOf('clipboardEventType') + 1], ClipboardEventType.paste);

        this._clipboardEvents.stopFeature(new BrowserContext(self));
    });

    it('Should collect multiple clipboard events', function () {
        this._clipboardEvents.startFeature(new BrowserContext(self));

        let returnValue = 'copy data';

        const clipboardEvent = {
            bubbles: false,
            cancelBubble: false,
            cancelable: false,
            clipboardData: { getData() { return returnValue; } },
            composed: false,
            currentTarget: null,
            defaultPrevented: false,
            eventPhase: 0,
            isTrusted: false,
            path: [],
            returnValue: true,
            srcElement: null,
            target: null,
            timeStamp: 866.1000001011416,
            type: 'copy',
        };

        this._messageBus.publish(MessageBusEventType.CopyEvent, clipboardEvent);

        returnValue = 'cut 1234';
        clipboardEvent.type = 'cut';
        this._messageBus.publish(MessageBusEventType.CutEvent, clipboardEvent);

        returnValue = 'paste 12ta';
        clipboardEvent.type = 'paste';
        this._messageBus.publish(MessageBusEventType.PasteEvent, clipboardEvent);

        returnValue = '';
        clipboardEvent.type = 'paste';
        this._messageBus.publish(MessageBusEventType.PasteEvent, clipboardEvent);

        // Todo add event tests
        assert.isTrue(dataQueue.requests.length > 0, 'did clipboard event work?');
        assert.equal(dataQueue.requests[0][ClipboardEventStructure.indexOf('clipboardEventType') + 1], ClipboardEventType.copy);
        assert.equal(dataQueue.requests[0][ClipboardEventStructure.indexOf('copiedText') + 1], 'aaaa*aaaa');
        assert.equal(dataQueue.requests[1][ClipboardEventStructure.indexOf('clipboardEventType') + 1], ClipboardEventType.cut);
        assert.equal(dataQueue.requests[1][ClipboardEventStructure.indexOf('copiedText') + 1], 'aaa*1111');
        assert.equal(dataQueue.requests[2][ClipboardEventStructure.indexOf('clipboardEventType') + 1], ClipboardEventType.paste);
        assert.equal(dataQueue.requests[2][ClipboardEventStructure.indexOf('copiedText') + 1], 'aaaaa*11aa');
        assert.equal(dataQueue.requests[3][ClipboardEventStructure.indexOf('clipboardEventType') + 1], ClipboardEventType.paste);
        assert.equal(dataQueue.requests[3][ClipboardEventStructure.indexOf('copiedText') + 1], '');

        this._clipboardEvents.stopFeature(new BrowserContext(self));
    });

    describe('start tests:', function () {
        it('Should start receiving events once start is called', function () {
            this._clipboardEvents.startFeature(new BrowserContext(self));

            const copyClipboardEvent = {
                bubbles: false,
                cancelBubble: false,
                cancelable: false,
                clipboardData: { getData() { return 'copy data'; } },
                composed: false,
                currentTarget: null,
                defaultPrevented: false,
                eventPhase: 0,
                isTrusted: false,
                path: [],
                returnValue: true,
                srcElement: null,
                target: null,
                timeStamp: 866.1000001011416,
                type: 'copy',
            };

            this._messageBus.publish(MessageBusEventType.CopyEvent, copyClipboardEvent);

            assert.equal(dataQueue.requests.length, 1, 'did clipboard event work?');

            this._clipboardEvents.stopFeature(new BrowserContext(self));

            this._messageBus.publish(MessageBusEventType.CopyEvent, copyClipboardEvent);
            // Still only one event sent to queue which means we are no longer receiving clipboard events once stopFeature is called
            assert.equal(dataQueue.requests.length, 1, 'did clipboard event work?');

            this._clipboardEvents.startFeature(new BrowserContext(self));

            this._messageBus.publish(MessageBusEventType.CopyEvent, copyClipboardEvent);
            assert.equal(dataQueue.requests.length, 2, 'did clipboard event work?');
        });
    });

    describe('stop tests:', function () {
        it('Should stop receiving events once stop is called', function () {
            this._clipboardEvents.startFeature(new BrowserContext(self));

            const copyClipboardEvent = {
                bubbles: false,
                cancelBubble: false,
                cancelable: false,
                clipboardData: { getData() { return 'copy data'; } },
                composed: false,
                currentTarget: null,
                defaultPrevented: false,
                eventPhase: 0,
                isTrusted: false,
                path: [],
                returnValue: true,
                srcElement: null,
                target: null,
                timeStamp: 866.1000001011416,
                type: 'copy',
            };

            this._messageBus.publish(MessageBusEventType.CopyEvent, copyClipboardEvent);

            assert.equal(dataQueue.requests.length, 1, 'did clipboard event work?');

            this._clipboardEvents.stopFeature(new BrowserContext(self));

            this._messageBus.publish(MessageBusEventType.CopyEvent, copyClipboardEvent);
            // Still only one event sent to queue which means we are no longer receiving clipboard events once stopFeature is called
            assert.equal(dataQueue.requests.length, 1, 'did clipboard event work?');
        });
    });
});
