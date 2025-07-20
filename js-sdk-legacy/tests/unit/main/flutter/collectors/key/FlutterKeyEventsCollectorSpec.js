import { FlutterKeyEventCollector } from '../../../../../../src/main/collectors/events';
import { MessageBusEventType } from '../../../../../../src/main/events/MessageBusEventType';
import sinon from 'sinon';

describe('FlutterKeyEventCollector', () => {
  let msgBusMock;
  let dataQueueMock;
  let utilsMock;
  let maskingServiceMock;
  let flutterKeyEventCollector;

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
      maskKey: sinon.stub().returns({
        key: 'a',
        charCode: 97,
        code: 'KeyA',
      }),
    };

    flutterKeyEventCollector = new FlutterKeyEventCollector(
      msgBusMock,
      dataQueueMock,
      utilsMock,
      maskingServiceMock
    );
  });

  it('should subscribe to KeyEvent on startFeature', () => {
    flutterKeyEventCollector.startFeature();

    expect(msgBusMock.subscribe.calledOnceWith(
      MessageBusEventType.BCTracker.KeyEvent,
      flutterKeyEventCollector._onKeyEvent
    )).to.be.true;
  });

  it('should unsubscribe from KeyEvent on stopFeature', () => {
    flutterKeyEventCollector.stopFeature();

    expect(msgBusMock.unsubscribe.calledOnceWith(
      MessageBusEventType.BCTracker.KeyEvent,
      flutterKeyEventCollector._onKeyEvent
    )).to.be.true;
  });

  it('should handle key events and add them to the data queue', () => {
    const event = {
      char: 'a',
      hashCode: '12345',
      elementId: 'element-id',
    };

    const timestamp = 1695123456789;
    const relativeTs = 120;

    sinon.stub(flutterKeyEventCollector, 'getEventTimestamp').returns(timestamp);
    sinon.stub(flutterKeyEventCollector, 'getTimestampFromEvent').returns(relativeTs);

    flutterKeyEventCollector._onKeyEvent(event);

    expect(maskingServiceMock.maskKey.calledOnceWith('a', '', 'element-id')).to.be.true;
    expect(dataQueueMock.addToQueue.calledOnceWith(
      'key_events',
      sinon.match([
        sinon.match.string, // Mapped structure
      ])
    )).to.be.true;

    const payload = utilsMock.convertToArrayByMap.getCall(0).args[1];
    expect(payload).to.deep.include({
      eventSequence: 42,
      timestamp: timestamp,
      eventType: 2, // Assuming KeyEventType.KEY_PRESS
      isTrusted: -1,
      elementHash: '12345',
      charCode: 97,
      character: 'a',
      keyComboType: -1,
      isCtrl: false,
      isShift: false,
      isAlt: false,
      isMetaKey: false,
      keyLocation: 0,
      code: 'KeyA',
      key: 'a',
      isRepeat: false,
      keyRegion: '-1',
      relativeTime: relativeTs,
      isSameKey: -1,
    });
  });

  it('should handle long keys by setting character to an empty string', () => {
    maskingServiceMock.maskKey.returns({
      key: 'Enter',
      charCode: 13,
      code: 'Enter',
    });

    const event = {
      char: 'Enter',
      hashCode: '67890',
      elementId: 'element-id',
    };

    flutterKeyEventCollector._onKeyEvent(event);

    const payload = utilsMock.convertToArrayByMap.getCall(0).args[1];
    expect(payload.character).to.equal('');
  });

  it('should default code and key fields to empty string if not provided', () => {
    maskingServiceMock.maskKey.returns({
      key: '',
      charCode: 0,
      code: '',
    });

    const event = {
      char: 'unknown',
      hashCode: '99999',
      elementId: 'unknown-element',
    };

    flutterKeyEventCollector._onKeyEvent(event);

    const payload = utilsMock.convertToArrayByMap.getCall(0).args[1];
    expect(payload.code).to.equal('');
    expect(payload.key).to.equal('');
  });
});
