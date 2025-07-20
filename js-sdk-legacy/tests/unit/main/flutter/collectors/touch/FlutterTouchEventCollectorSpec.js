import { FlutterTouchEventCollector } from '../../../../../../src/main/collectors/events';
import sinon from 'sinon';
import { MessageBusEventType } from '../../../../../../src/main/events/MessageBusEventType';
import { FlutterTouchEventType } from '../../../../../../src/main/flutter/collectors/touch/FlutterTouchEventCollector';

describe('FlutterTouchEventCollector', () => {
  let msgBusMock;
  let dataQueueMock;
  let utilsMock;
  let flutterTouchEventCollector;
  let maskingServiceStub;

  beforeEach(() => {
    msgBusMock = {
      subscribe: sinon.spy(),
      unsubscribe: sinon.spy(),
      publish: sinon.spy(),
    };

    dataQueueMock = {
      addToQueue: sinon.spy(),
    };

    utilsMock = {
      StorageUtils: {
        getAndUpdateEventSequenceNumber: sinon.stub().returns(42),
      },
      isUndefinedNull: sinon.stub().returns(false),
      convertToArrayByMap: sinon.stub().returns(['mapped-event-structure']),
    };

    maskingServiceStub = {
      maskAbsoluteIfRequired: sinon.stub().returnsArg(0),
      maskText: sinon.stub().returns('maskingServiceStub.maskText.mock'),
      _shouldMask: sinon.stub().returnsArg(0),
      shouldMaskCoordinates: sinon.stub().returns(false)
    };

    flutterTouchEventCollector = new FlutterTouchEventCollector(
      msgBusMock,
      dataQueueMock,
      utilsMock,
      maskingServiceStub
    );
  });

  it('should subscribe to TouchEvent on startFeature', () => {
    flutterTouchEventCollector.startFeature();

    expect(msgBusMock.subscribe.calledOnceWith(
      MessageBusEventType.BCTracker.TouchEvent,
      flutterTouchEventCollector._onTouchEvent
    )).to.be.true;
  });

  it('should unsubscribe from TouchEvent on stopFeature', () => {
    flutterTouchEventCollector.stopFeature();

    expect(msgBusMock.unsubscribe.calledOnceWith(
      MessageBusEventType.BCTracker.TouchEvent,
      flutterTouchEventCollector._onTouchEvent
    )).to.be.true;
  });

  it('should handle valid touch events and add them to the data queue', () => {
    const event = {
      touchState: 'onTapDown',
      hashCode: '12345',
      x: 250.5,
      y: 400.8,
      pointer: 1,
      radiusMajor: 20,
      radiusMinor: 15,
      pressure: 0.8,
    };

    const timestamp = 1695123456789;
    const relativeTs = 120;

    sinon.stub(flutterTouchEventCollector, 'getEventTimestamp').returns(timestamp);
    sinon.stub(flutterTouchEventCollector, 'getTimestampFromEvent').returns(relativeTs);

    flutterTouchEventCollector._onTouchEvent(event);

    expect(dataQueueMock.addToQueue.calledOnceWith(
      'touch_events',
      sinon.match([
        sinon.match.string, // Mapped structure
      ])
    )).to.be.true;

    const payload = utilsMock.convertToArrayByMap.getCall(0).args[1];
    expect(payload).to.deep.include({
      eventSequence: 42,
      timestamp: timestamp,
      eventType: FlutterTouchEventType.onTapDown,
      isTrusted: -1,
      elementHash: '12345',
      clientX: 251, // Rounded value
      clientY: 401, // Rounded value
      touchIndex: 1,
      touchSizeMajor: 40, // Radius major * 2
      touchSizeMinor: 30, // Radius minor * 2
      touchPressure: 0.8,
      relativeTime: relativeTs,
    });
  });

  it('should publish touch events for onTapDown and onTapUp', () => {
    const event = { touchState: 'onTapUp' };

    flutterTouchEventCollector._onTouchEvent(event);

    expect(msgBusMock.publish.calledOnceWith(
      MessageBusEventType.TouchEvent,
      sinon.match({ action: FlutterTouchEventType.onTapUp })
    )).to.be.true;
  });

  it('should handle undefined touch type gracefully', () => {
    utilsMock.isUndefinedNull.returns(true);

    const event = {
      touchState: 'invalidState',
      hashCode: '12345',
      x: null,
      y: undefined,
      pointer: 1,
      radiusMajor: null,
      radiusMinor: undefined,
    };

    flutterTouchEventCollector._onTouchEvent(event);

    const payload = utilsMock.convertToArrayByMap.getCall(0).args[1];
    expect(payload.eventType).to.equal(-1);
    expect(payload.clientX).to.equal(0); // Defaults for undefined/null
    expect(payload.clientY).to.equal(0);
    expect(payload.touchSizeMajor).to.equal(0);
    expect(payload.touchSizeMinor).to.equal(0);
  });

  it('should handle default pressure if not provided', () => {
    const event = {
      touchState: 'onTapDown',
      pressure: undefined,
    };

    flutterTouchEventCollector._onTouchEvent(event);

    const payload = utilsMock.convertToArrayByMap.getCall(0).args[1];
    expect(payload.touchPressure).to.equal(-1); // Default value
  });

  it('should handle null or undefined x and y coordinates', () => {
    const event = {
      x: null,
      y: undefined,
    };

    flutterTouchEventCollector._onTouchEvent(event);

    const payload = utilsMock.convertToArrayByMap.getCall(0).args[1];
    expect(payload.clientX).to.equal(0); // Defaults to 0
    expect(payload.clientY).to.equal(0);
  });
});
