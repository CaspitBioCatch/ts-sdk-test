import { assert } from 'chai';
import MessageBus from '../../../../src/main/technicalServices/MessageBus';
import { MockObjects } from '../../mocks/mockObjects';
import ElementBlurEventEmitter from "../../../../src/main/emitters/ElementBlurEventEmitter";
import { MessageBusEventType } from '../../../../src/main/events/MessageBusEventType';

describe('ElementBlursEventEmitter Tests:', function () {
    beforeEach(function () {
        this.sandbox = sinon.createSandbox();

        this._messageBusStub = this.sandbox.createStubInstance(MessageBus);
        this._eventAggregatorStub = this.sandbox.stub(MockObjects.eventAggregator);
        this.elementBlurEventEmitter = new ElementBlurEventEmitter(this._messageBusStub, this._eventAggregatorStub)
    });

    afterEach(function () {
        if (this.sandbox) {
            this.sandbox.restore();
        }
    });

    it('Should create a new instance of ElementBlurEventEmitter', function () {
        assert.isObject(this.elementBlurEventEmitter, 'Could not construct a new ElementBlurEventEmitter object');
        assert.instanceOf(this.elementBlurEventEmitter._messageBus, MessageBus, '_messageBus instance is not the expected one');
    });

    function createSelectElement(idValue) {
        const select = document.createElement('select');
        const optionsValues = [];
        for (let i = 0; i < 5; i++) {
            const opt = document.createElement('option');
            opt.value = i;
            opt.text = i + '_text';
            optionsValues.push(i + '_text');
            select.appendChild(opt);
        }
        select.setAttribute('id', idValue);
        select.selectedIndex = 0;
        return select;
    }

    describe('start tests:', function () {
        it('starting the emitter registers for element blur events', function () {
            const select1 = createSelectElement('select1');
            const select2 = createSelectElement('select2');

            const _selectElements = Array.from([select1, select2]);
            this.elementBlurEventEmitter.start(_selectElements);

            const selectEvent = document.createEvent('Event');
            selectEvent.initEvent('blur', true, false);
            select1.selectedIndex = 1; // in IE the click event is enough, in the other not
            select1.dispatchEvent(selectEvent);
            assert.isTrue(this._eventAggregatorStub.addEventListener.calledTwice, `was not called ${this._eventAggregatorStub.addEventListener.callCount} times`);
            assert.equal(this._eventAggregatorStub.addEventListener.firstCall.args[1], 'blur');
            assert.equal(this._eventAggregatorStub.addEventListener.firstCall.args[2], this.elementBlurEventEmitter.handleElementBlurEvents);
        });
    });

    describe('stop', function () {
        it('stop emitter successfully', function () {
            const select1 = createSelectElement('select1');
            const select2 = createSelectElement('select2');

            const _selectElements = Array.from([select1, select2]);
            this.elementBlurEventEmitter.stop(_selectElements);

            const selectEvent = document.createEvent('Event');
            selectEvent.initEvent('blur', true, false);
            select1.selectedIndex = 1; // in IE the click event is enough, in the other not
            select1.dispatchEvent(selectEvent);

            assert.isTrue(this._eventAggregatorStub.removeEventListener.calledTwice, `was called ${this._eventAggregatorStub.addEventListener.callCount} times`);
            assert.equal(this._eventAggregatorStub.removeEventListener.firstCall.args[1], 'blur');
            assert.equal(this._eventAggregatorStub.removeEventListener.firstCall.args[2], this.elementBlurEventEmitter.handleElementBlurEvents);
        });
    });

    describe('handle event', function () {
        it('handle blur event', function () {
            const select1 = createSelectElement('select1');

            const _selectElements = Array.from(select1);
            this.elementBlurEventEmitter.start(_selectElements);

            const handleElementBlurEventsFunction = this._eventAggregatorStub.addEventListener.firstCall.args[2];

            const event = 'event tadada'
            handleElementBlurEventsFunction(event);

            assert.isTrue(this._messageBusStub.publish.calledOnce);
            assert.equal(this._messageBusStub.publish.firstCall.args[0], MessageBusEventType.ElementBlurEvent);
            assert.equal(this._messageBusStub.publish.firstCall.args[1], event);
        });
    });
});
