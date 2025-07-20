import { assert } from 'chai';
import sinon from 'sinon';
import FontEmojiFeature from '../../../../../../../src/main/collectors/static/font/emoji/FontEmojiFeature';
import DataQ from '../../../../../../../src/main/technicalServices/DataQ';

describe('FontEmojiFeature', () => {
  let sandbox;
  let dataQ;
  let mockWindow;
  let mockDocument;
  let mockLogger;
  let fontEmojiFeature;
   
  /** Helper: returns a mock element with required stubs */
  const buildMockElement = (bbox = { x: 0, y: 0, width: 80, height: 16 }) => ({
    style: {},
    innerHTML: '',
    remove: sandbox.stub(),
    getBoundingClientRect: sandbox.stub().returns({
      top: bbox.y,
      left: bbox.x,
      right: bbox.x + bbox.width,
      bottom: bbox.y + bbox.height,
      ...bbox,
    }),
  });

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    // Dependencies
    dataQ = sandbox.createStubInstance(DataQ);
    mockWindow = {
      getComputedStyle: sandbox.stub().returns({
        getPropertyValue: sandbox.stub().returns('Arial'),
      }),
    };
    mockDocument = {
      body: { append: sandbox.stub() },
      createElement: sandbox.stub().callsFake(() => buildMockElement()),
    };
    mockLogger = { error: sandbox.stub() };

    fontEmojiFeature = new FontEmojiFeature(
      dataQ,
      mockWindow,
      mockDocument,
      mockLogger,
    );
  });

  afterEach(() => sandbox.restore());

  /* ---------- static ---------- */
  it('getDefaultSettings returns correct static values', () => {
    const s = FontEmojiFeature.getDefaultSettings();
    assert.deepEqual(s, {
      configKey: 'isFontEmojiFeature',
      isDefault: false,
      shouldRunPerContext: false,
      shouldRunPerSession: true,
      shouldRun: false,
      isFrameRelated: false,
      runInUns: false,
      runInSlave: true,
      runInLean: true,
      isRunning: false,
      instance: null,
    });
  });

  /* ---------- _getBoundingBox ---------- */
  describe('_getBoundingBox', () => {
    it('collects all available properties plus font', () => {
      const elem = buildMockElement({
        x: 10, y: 20, width: 100, height: 40, top: 20, left: 10, right: 110, bottom: 60,
      });
      const res = fontEmojiFeature._getBoundingBox(elem, mockWindow);
      assert.deepEqual(res, {
        x: 10, y: 20, width: 100, height: 40,
        top: 20, left: 10, right: 110, bottom: 60,
        font: 'Arial',
      });
    });

    it('skips missing properties gracefully', () => {
      // Element whose bounding-rect only has width & height
      const elem = {
        getBoundingClientRect: sinon.stub().returns({
          width: 50,
          height: 25,
        }),
      };

      const res = fontEmojiFeature._getBoundingBox(elem, mockWindow);
      assert.deepEqual(res, { width: 50, height: 25, font: 'Arial' });
    });
  });

  /* ---------- _renderEmojis ---------- */
  describe('_renderEmojis', () => {
    it('creates, appends and removes a span; returns bounding box', () => {
      const result = fontEmojiFeature._renderEmojis();

      sandbox.assert.calledWithExactly(mockDocument.createElement, 'span');
      sandbox.assert.calledOnce(mockDocument.body.append);
      const elem = mockDocument.body.append.firstCall.args[0];
      sandbox.assert.calledOnce(elem.remove);

      assert.containsAllKeys(result, ['width', 'height', 'font']);
      assert.equal(result.font, 'Arial');
    });
  });

  /* ---------- startFeature ---------- */
  describe('startFeature', () => {
    it('adds info to the queue when successful', async () => {
      await fontEmojiFeature.startFeature();

      sandbox.assert.calledOnce(dataQ.addToQueue);
      const [topic, [key, value], sensitive] = dataQ.addToQueue.firstCall.args;
      assert.equal(topic, 'static_fields');
      assert.equal(key, 'font_emoji_info');
      assert.isFalse(sensitive);
      assert.containsAllKeys(value, ['width', 'height', 'font']);
    });

    it('logs error and skips queue on failure', async () => {
      mockDocument.createElement.throws(new Error('boom'));

      await fontEmojiFeature.startFeature();

      sandbox.assert.notCalled(dataQ.addToQueue);
      sandbox.assert.calledOnce(mockLogger.error);
      sandbox.assert.calledWith(
        mockLogger.error,
        'Failed to collect emoji font information',
      );
    });
  });
});
