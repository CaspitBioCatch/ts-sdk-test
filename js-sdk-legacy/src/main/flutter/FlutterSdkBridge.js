import {MessageBusEventType} from "../events/MessageBusEventType";

export class FlutterSdkBridge {
  constructor(messageBus) {
    this.messageBus = messageBus;
  }

  collectElement(
    hashCode,
    elementId,
    widthElement,
    heightElement,
    dxPosition,
    dyPosition,
    widgetType,
    elementValue,
    timestamp
  ) {
    this.messageBus.publish(MessageBusEventType.BCTracker.ElementsEvent,
      {
        hashCode: hashCode,
        elementId: elementId,
        widthElement: widthElement,
        heightElement: heightElement,
        dxPosition: dxPosition,
        dyPosition: dyPosition,
        widgetType: widgetType,
        timeStamp: timestamp
      });
  }

  collectElementEvent(
    hashCode,
    elementId,
    eventType,
    elementValue,
    timestamp
  ) {
    this.messageBus.publish(MessageBusEventType.BCTracker.ElementEventsEvent,
      {
        hashCode: hashCode,
        elementId: elementId,
        eventType: eventType,
        elementValue: elementValue,
        timeStamp: timestamp
      });
  }

  collectTouchEvent(
    hashCode,
    touchState,
    x,
    y,
    pointer,
    sourceName,
    size,
    radiusMajor,
    radiusMinor,
    pressure,
    orientation,
    timestamp
  ) {
    this.messageBus.publish(MessageBusEventType.BCTracker.TouchEvent,
      {
        hashCode: hashCode,
        touchState: touchState,
        x: x,
        y: y,
        pointer: pointer,
        radiusMajor: radiusMajor,
        radiusMinor: radiusMinor,
        pressure: pressure,
        timeStamp: timestamp
      });
  }

  collectKeyEvent(
    hashCode,
    elementId,
    char,
    timestamp
  ) {
    this.messageBus.publish(MessageBusEventType.BCTracker.KeyEvent,
      {
        hashCode: hashCode,
        elementId: elementId,
        char: char,
        timeStamp: timestamp
      });
  }

  collectOnMouseEvent(
     hashCode,
     touchState,
     x,
     y,
     pointer,
     sourceName,
     size,
     radiusMajor,
     radiusMinor,
     pressure,
     orientation,
     timestamp
    ) {
      this.messageBus.publish(MessageBusEventType.BCTracker.MouseEvent,
        {
          hashCode: hashCode,
          type: touchState,
          screenX: x,
          screenY: y,
          pointer: pointer,
          radiusMajor: radiusMajor,
          radiusMinor: radiusMinor,
          pressure: pressure,
          timeStamp: timestamp
        });
  }
}