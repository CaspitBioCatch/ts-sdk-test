import { expect } from 'chai';
import sinon from 'sinon';
import { FlutterSdkBridge } from '../../../../src/main/flutter/FlutterSdkBridge';
import { MessageBusEventType } from '../../../../src/main/events/MessageBusEventType';

describe('FlutterSdkBridge', () => {
  let messageBusMock;
  let flutterSdkBridge;

  beforeEach(() => {
    // Create a mock for the messageBus
    messageBusMock = {
      publish: sinon.spy(),
    };
    // Instantiate FlutterSdkBridge with the mocked messageBus
    flutterSdkBridge = new FlutterSdkBridge(messageBusMock);
  });

  afterEach(() => {
    // Restore Sinon spies/mocks
    sinon.restore();
  });

  it('should publish an ElementsEvent when collectElement is called', () => {
    const payload = {
      hashCode: '123',
      elementId: 'el1',
      widthElement: 100,
      heightElement: 200,
      dxPosition: 10,
      dyPosition: 20,
      widgetType: 'Button',
      timeStamp: 1234567890,
    };

    flutterSdkBridge.collectElement(
      payload.hashCode,
      payload.elementId,
      payload.widthElement,
      payload.heightElement,
      payload.dxPosition,
      payload.dyPosition,
      payload.widgetType,
      null,
      payload.timeStamp
    );

    expect(messageBusMock.publish.calledOnce).to.be.true;
    expect(messageBusMock.publish.calledWith(
      MessageBusEventType.BCTracker.ElementsEvent,
      payload
    )).to.be.true;
  });

  it('should publish an ElementEventsEvent when collectElementEvent is called', () => {
    const payload = {
      hashCode: '456',
      elementId: 'el2',
      eventType: 'click',
      elementValue: 'value1',
      timeStamp: 1234567891,
    };

    flutterSdkBridge.collectElementEvent(
      payload.hashCode,
      payload.elementId,
      payload.eventType,
      payload.elementValue,
      payload.timeStamp
    );

    expect(messageBusMock.publish.calledOnce).to.be.true;
    expect(messageBusMock.publish.calledWith(
      MessageBusEventType.BCTracker.ElementEventsEvent,
      payload
    )).to.be.true;
  });

  it('should publish a TouchEvent when collectTouchEvent is called', () => {
    const payload = {
      hashCode: '789',
      touchState: 'down',
      x: 50,
      y: 100,
      pointer: 1,
      radiusMajor: 10,
      radiusMinor: 5,
      pressure: 0.8,
      timeStamp: 1234567892,
    };

    flutterSdkBridge.collectTouchEvent(
      payload.hashCode,
      payload.touchState,
      payload.x,
      payload.y,
      payload.pointer,
      null,
      null,
      payload.radiusMajor,
      payload.radiusMinor,
      payload.pressure,
      null,
      payload.timeStamp
    );

    expect(messageBusMock.publish.calledOnce).to.be.true;
    expect(messageBusMock.publish.calledWith(
      MessageBusEventType.BCTracker.TouchEvent,
      payload
    )).to.be.true;
  });

  it('should publish a KeyEvent when collectKeyEvent is called', () => {
    const payload = {
      hashCode: '101',
      elementId: 'el3',
      char: 'A',
      timeStamp: 1234567893,
    };

    flutterSdkBridge.collectKeyEvent(
      payload.hashCode,
      payload.elementId,
      payload.char,
      payload.timeStamp
    );

    expect(messageBusMock.publish.calledOnce).to.be.true;
    expect(messageBusMock.publish.calledWith(
      MessageBusEventType.BCTracker.KeyEvent,
      payload
    )).to.be.true;
  });

  it('should publish a MouseEvent when collectOnMouseEvent is called', () => {
    const payload = {
      hashCode: '202',
      type: 'move',
      screenX: 150,
      screenY: 200,
      pointer: 2,
      radiusMajor: 15,
      radiusMinor: 10,
      pressure: 0.5,
      timeStamp: 1234567894,
    };

    flutterSdkBridge.collectOnMouseEvent(
      payload.hashCode,
      payload.type,
      payload.screenX,
      payload.screenY,
      payload.pointer,
      null,
      null,
      payload.radiusMajor,
      payload.radiusMinor,
      payload.pressure,
      null,
      payload.timeStamp
    );

    expect(messageBusMock.publish.calledOnce).to.be.true;
    expect(messageBusMock.publish.calledWith(
      MessageBusEventType.BCTracker.MouseEvent,
      payload
    )).to.be.true;
  });
});
