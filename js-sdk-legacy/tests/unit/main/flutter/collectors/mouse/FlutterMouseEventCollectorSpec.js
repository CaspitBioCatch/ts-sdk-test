import { FlutterMouseEventCollector } from '../../../../../../src/main/collectors/events';
import { MessageBusEventType } from '../../../../../../src/main/events/MessageBusEventType';
import sinon from 'sinon';
import { FlutterMouseEventType } from '../../../../../../src/main/flutter/collectors/mouse/FlutterMouseEventCollector';
import {MockObjects} from "../../../../mocks/mockObjects";
import StartupConfigurations from "../../../../../../src/main/api/StartupConfigurations";

describe('FlutterMouseEventCollector', () => {
  let sandbox = null;
  let msgBusMock;
  let dataQueueMock;
  let utilsMock;
  let maskingServiceMock;
  let flutterMouseEventCollector;
  let browserContextMock;

  beforeEach(() => {
    msgBusMock = {
      subscribe: sinon.spy(),
      unsubscribe: sinon.spy(),
    };

    dataQueueMock = {
      addToQueue: sinon.spy(),
    };

    utilsMock = {
      StorageUtils: {
        getAndUpdateEventSequenceNumber: sinon.stub().returns(42),
      },
      convertToArrayByMap: sinon.stub().returns(['mapped-event-structure']),
    };

    maskingServiceMock = {
      shouldMaskCoordinates: sinon.stub().returns(false), // Default: masking disabled
    };

    browserContextMock = {
      getDocument: sinon.stub().returns(document.createElement('input')),
      collectAllElementsBySelectorAsync: sinon.stub().resolves([]),
    };
    sandbox = sinon.createSandbox();

    const startupConfigurations = sandbox.createStubInstance(StartupConfigurations);

    flutterMouseEventCollector = new FlutterMouseEventCollector(
      msgBusMock,
      dataQueueMock,
      utilsMock,
      maskingServiceMock,
      MockObjects.domUtils,
        startupConfigurations
    );
  });

  it('should subscribe to MouseEvent on startFeature', () => {
    flutterMouseEventCollector.startFeature(browserContextMock);

    expect(msgBusMock.subscribe.calledOnceWith(
        MessageBusEventType.BCTracker.MouseEvent,
        flutterMouseEventCollector._onMouseEvent
    )).to.be.true;
  });

  it('should unsubscribe from MouseEvent on stopFeature', () => {
    flutterMouseEventCollector.stopFeature(browserContextMock);

    expect(msgBusMock.unsubscribe.calledOnceWith(
      MessageBusEventType.BCTracker.MouseEvent,
      flutterMouseEventCollector._onMouseEvent
    )).to.be.true;
  });

  it('should handle mouse events and add them to the data queue', () => {
    maskingServiceMock.shouldMaskCoordinates = sinon.stub().returns(false); // Disable masking
    const event = {
      type: 'onTapDown',
      hashCode: '12345',
      screenX: 250.75,
      screenY: 400.25,
    };

    const timestamp = 1695123456789;
    const relativeTs = 120;

    sinon.stub(flutterMouseEventCollector, 'getEventTimestamp').returns(timestamp);
    sinon.stub(flutterMouseEventCollector, 'getTimestampFromEvent').returns(relativeTs);

    flutterMouseEventCollector._onMouseEvent(event);

    expect(dataQueueMock.addToQueue.calledOnceWith(
      'mouse_events',
      sinon.match([
        sinon.match.string, // Mapped structure
      ])
    )).to.be.true;

    const payload = utilsMock.convertToArrayByMap.getCall(0).args[1];
    expect(payload).to.deep.include({
      eventSequence: 42,
      timestamp: timestamp,
      eventType: FlutterMouseEventType.onTapDown,
      isTrusted: -1,
      elementHash: '12345',
      screenX: 251, // Rounded coordinates
      screenY: 400,
      relativeTime: relativeTs,
    });
  });

  it('should mask coordinates if masking is enabled', () => {
    maskingServiceMock.shouldMaskCoordinates = sinon.stub().returns(true); // Enable masking

    const event = {
      screenX: 300.5,
      screenY: 450.8,
    };

    flutterMouseEventCollector._onMouseEvent(event);

    const payload = utilsMock.convertToArrayByMap.getCall(0).args[1];
    expect(payload.screenX).to.equal(-1000);
    expect(payload.screenY).to.equal(-1000);
  });

  it('should handle undefined coordinates gracefully', () => {
    maskingServiceMock.shouldMaskCoordinates = sinon.stub().returns(false); // Disable masking

    const event = {
      screenX: undefined,
      screenY: null,
    };

    flutterMouseEventCollector._onMouseEvent(event);

    const payload = utilsMock.convertToArrayByMap.getCall(0).args[1];
    expect(payload.screenX).to.equal(-1);
    expect(payload.screenY).to.equal(-1);
  });
});
