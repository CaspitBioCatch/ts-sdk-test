import { expect } from 'chai';
import sinon from 'sinon';
import { FlutterElementEventsCollector } from '../../../../../../src/main/collectors/events';
import { MessageBusEventType } from '../../../../../../src/main/events/MessageBusEventType';

describe('FlutterElementEventsCollector', () => {
  let msgBusMock, dataQueueMock, utilsMock, contextMgrMock, maskingServiceMock;
  let flutterElementEventsCollector;

  beforeEach(() => {
    // Create mocks for dependencies
    msgBusMock = {
      subscribe: sinon.spy(),
      unsubscribe: sinon.spy(),
    };
    dataQueueMock = {
      addToQueue: sinon.spy(),
    };
    utilsMock = {
      StorageUtils: {
        getAndUpdateEventSequenceNumber: sinon.stub().returns(1),
      },
      isUndefinedNull: sinon.stub().returns(false),
      convertToArrayByMap: sinon.stub(),
    };
    contextMgrMock = {
      contextHash: 'context-hash',
    };
    maskingServiceMock = {
      maskText: sinon.stub(),
      maskAbsoluteIfRequired: sinon.stub(),
    };

    // Initialize the collector
    flutterElementEventsCollector = new FlutterElementEventsCollector(
      msgBusMock,
      dataQueueMock,
      utilsMock,
      contextMgrMock,
      maskingServiceMock
    );
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('startFeature', () => {
    it('should subscribe to message bus events', () => {
      flutterElementEventsCollector.startFeature();

      expect(msgBusMock.subscribe.calledTwice).to.be.true;
      expect(msgBusMock.subscribe.calledWith(
        MessageBusEventType.BCTracker.ElementEventsEvent,
        flutterElementEventsCollector._collectEventElement
      )).to.be.true;
      expect(msgBusMock.subscribe.calledWith(
        MessageBusEventType.BCTracker.ElementsEvent,
        flutterElementEventsCollector._collectElement
      )).to.be.true;
    });
  });

  describe('stopFeature', () => {
    it('should unsubscribe from message bus events', () => {
      flutterElementEventsCollector.stopFeature();

      expect(msgBusMock.unsubscribe.calledTwice).to.be.true;
      expect(msgBusMock.unsubscribe.calledWith(
        MessageBusEventType.BCTracker.ElementEventsEvent,
        flutterElementEventsCollector._collectEventElement
      )).to.be.true;
      expect(msgBusMock.unsubscribe.calledWith(
        MessageBusEventType.BCTracker.ElementsEvent,
        flutterElementEventsCollector._collectElement
      )).to.be.true;
    });
  });

  describe('_collectEventElement', () => {
    it('should add an element event to the data queue with the correct payload', () => {
      const event = {
        hashCode: '123',
        eventType: 'click',
        elementValue: 'value',
        elementId: 'element-id',
      };
      maskingServiceMock.maskText.returns('masked-value');
      utilsMock.convertToArrayByMap.returns(['mapped-event-structure']);

      flutterElementEventsCollector._collectEventElement(event);

      expect(maskingServiceMock.maskText.calledWith('value', 'element-id')).to.be.true;
      expect(dataQueueMock.addToQueue.calledOnce).to.be.true;
      expect(dataQueueMock.addToQueue.calledWith('element_events', ['mapped-event-structure'])).to.be.true;
    });

    it('should clear maskedValue if it exceeds max length', () => {
      const event = {
        hashCode: '123',
        eventType: 'click',
        elementValue: 'x'.repeat(201), // Exceeding max length of 200
        elementId: 'element-id',
      };
      maskingServiceMock.maskText.returns('x'.repeat(201));
      utilsMock.convertToArrayByMap.returns(['mapped-event-structure']);

      flutterElementEventsCollector._collectEventElement(event);

      expect(maskingServiceMock.maskText.calledWith(event.elementValue, event.elementId)).to.be.true;
      expect(dataQueueMock.addToQueue.calledOnce).to.be.true;

      const payload = utilsMock.convertToArrayByMap.getCall(0).args[1];
      expect(payload.elementValues).to.equal(''); // Assert `elementValues` is cleared
    });
  });

  describe('_collectElement', () => {
    it('should add a new element to the data queue if not already collected', () => {
      const event = {
        hashCode: '456',
        elementId: 'element-id',
        widgetType: 'Button',
        dxPosition: 10,
        dyPosition: 20,
        widthElement: 100,
        heightElement: 200,
        timeStamp: 1234567890,
      };
      maskingServiceMock.maskAbsoluteIfRequired.returns('masked-id');

      flutterElementEventsCollector._collectElement(event);

      expect(utilsMock.isUndefinedNull.calledWith(event.hashCode)).to.be.true;
      expect(maskingServiceMock.maskAbsoluteIfRequired.calledWith(event.elementId, event.elementId)).to.be.true;
      expect(dataQueueMock.addToQueue.calledOnce).to.be.true;
      expect(dataQueueMock.addToQueue.calledWith('elements')).to.be.true;

      const queuePayload = dataQueueMock.addToQueue.getCall(0).args[1];
      expect(queuePayload).to.include(contextMgrMock.contextHash);
      expect(queuePayload).to.include(event.hashCode);
      expect(queuePayload).to.include(event.timeStamp);
    });

    it('should not add the same element twice', () => {
      const event = { hashCode: '456', elementId: 'element-id' };
      flutterElementEventsCollector._elementWMap.add('456');

      flutterElementEventsCollector._collectElement(event);

      expect(dataQueueMock.addToQueue.notCalled).to.be.true;
    });
  });
});
