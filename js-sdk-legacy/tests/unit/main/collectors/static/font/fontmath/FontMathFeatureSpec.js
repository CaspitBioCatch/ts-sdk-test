/*  FontMathFeatureSpec.js – full coverage                *
 *  (mocha + chai + sinon)                                */

import { assert } from 'chai';
import sinon       from 'sinon';
import FontMathFeature from '../../../../../../../src/main/collectors/static/font/fontmath/FontMathFeature';
import DataQ from '../../../../../../../src/main/technicalServices/DataQ';

describe('FontMathFeature', function () {
  let sandbox;
  let dataQ;
  let win;
  let doc;
  let logger;
  let feature;

  /* ---------- helpers ---------- */
  function makeElementStub(bbox = {}) {
    /* returns a stubbed <math> element */
    return {
      style: {},
      /* configurable bounding rect */
      getBoundingClientRect: sandbox.stub().returns({
        x: 0, y: 0,
        left  : 0,
        right : 100,
        top   : 0,
        bottom: 50,
        width : 100,
        height: 50,
        ...bbox
      }),
      /* we spy on remove to assert it was called */
      remove: sandbox.stub()
    };
  }

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    dataQ = sandbox.createStubInstance(DataQ);

    win = {
      /* font-family always “Arial” for deterministic test */
      getComputedStyle: sandbox.stub().returns({
        getPropertyValue: sandbox.stub().withArgs('font-family').returns('Arial')
      })
    };

    doc = {
      /* stub will be swapped per-test when we need an error path */
      createElement: sandbox.stub().callsFake(() => makeElementStub()),
      body: {
        append: sandbox.stub()
      }
    };

    logger  = { error: sandbox.stub() };

    feature = new FontMathFeature(dataQ, win, doc, logger);
  });

  afterEach(() => sandbox.restore());

  /* ---------- _getBoundingBox ---------- */
  describe('_getBoundingBox', () => {
    it('returns bounding box + font on success', () => {
      const el   = makeElementStub();
      const bbox = feature._getBoundingBox(el, win);

      assert.deepEqual(bbox, {
        x: 0, y: 0,
        left  : 0,
        right : 100,
        bottom: 50,
        height: 50,
        top   : 0,
        width : 100,
        font  : 'Arial'
      });
    });

    it('returns null and logs on failure', () => {
      const el = makeElementStub();
      /* force exception inside method */
      el.getBoundingClientRect = sandbox.stub().throws(new Error('boom'));

      const res = feature._getBoundingBox(el, win);
      assert.isNull(res);
      assert.isTrue(logger.error.calledOnce);
    });
  });

  /* ---------- _renderMathFormulas ---------- */
  describe('_renderMathFormulas', () => {
    it('renders, measures and cleans up element', () => {
      const result = feature._renderMathFormulas();

      /* validate numeric props & font */
      assert.deepEqual(result, {
        x: 0, y: 0,
        left  : 0,
        right : 100,
        bottom: 50,
        height: 50,
        top   : 0,
        width : 100,
        font  : 'Arial'
      });

      /* element was appended and later removed */
      assert.isTrue(doc.body.append.calledOnce);

      const createdEl = doc.createElement.getCall(0).returnValue;
      assert.isTrue(createdEl.remove.calledOnce);
    });

    it('returns null and logs when createElement fails', () => {
      doc.createElement = sandbox.stub().throws(new Error('fail'));

      const res = feature._renderMathFormulas();
      assert.isNull(res);
      assert.isTrue(logger.error.calledOnce);
    });
  });

  /* ---------- startFeature ---------- */
  describe('startFeature', () => {
    it('adds font_math_info to queue on success', async () => {
      await feature.startFeature();

      assert.isTrue(dataQ.addToQueue.calledOnce);
      const [queueName, payload, flush] =
        dataQ.addToQueue.getCall(0).args;

      assert.equal(queueName, 'static_fields');
      assert.deepEqual(payload[0], 'font_math_info'); // key
      assert.isObject(payload[1]);                    // value
      assert.isFalse(flush);
    });

    it('skips queue when _renderMathFormulas returns null', async () => {
      /* stub method to simulate failure path */
      sandbox.stub(feature, '_renderMathFormulas').returns(null);

      await feature.startFeature();
      assert.isTrue(feature._renderMathFormulas.calledOnce);
      assert.isTrue(dataQ.addToQueue.notCalled);
    });

    it('logs when addToQueue throws', async () => {
      dataQ.addToQueue = sandbox.stub().throws(new Error('queue boom'));

      await feature.startFeature();
      assert.isTrue(logger.error.calledOnce);
    });
  });
});
