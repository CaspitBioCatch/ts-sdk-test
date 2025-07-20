import { assert } from 'chai';
import sinon from 'sinon';
import FontWidthFeature from '../../../../../../../src/main/collectors/static/font/size-prefences/FontWidthFeature';
import DataQ from '../../../../../../../src/main/technicalServices/DataQ';

describe('FontWidthFeature test:', function () {
  let sandbox, dataQ, documentMock, dpr;

  const makeElem = () => ({
    style: {},
    getBoundingClientRect: sandbox.stub().returns({ width: 100 })
  });

  beforeEach(function () {
    sandbox = sinon.createSandbox();
    dataQ = sandbox.createStubInstance(DataQ);

    // mock <iframe> + contentDocument + body
    const iframe = { contentDocument: {} };
    iframe.contentDocument.open  = sandbox.stub();
    iframe.contentDocument.write = sandbox.stub();
    iframe.contentDocument.close = sandbox.stub();
    iframe.contentDocument.body  = {
      style: {},
      appendChild: sandbox.stub(),
      removeChild: sandbox.stub(),
      append: sandbox.stub()
    };
    iframe.contentDocument.createElement = sandbox.stub().callsFake(makeElem);

    // mock window.document
    documentMock = {
      createElement: sandbox.stub().returns(iframe),
      body: {
        appendChild: sandbox.stub(),
        removeChild: sandbox.stub()
      }
    };

    dpr = 2;
  });

  afterEach(() => sandbox.restore());

  /* ---------- constructor ---------- */
  describe('constructor', () => {
    it('uses default deps when none provided', () => {
      const feature = new FontWidthFeature(dataQ);
      assert.instanceOf(feature, FontWidthFeature);
    });

    it('uses injected deps', () => {
      const feature = new FontWidthFeature(dataQ, documentMock, dpr);
      assert.strictEqual(feature._document, documentMock);
      assert.strictEqual(feature._devicePixelRatio, dpr);
    });
  });

  /* ---------- startFeature ---------- */
  describe('startFeature', () => {
    it('pushes font width info to queue', async () => {
      const feature = new FontWidthFeature(dataQ, documentMock, dpr);
      await feature.startFeature();

      sandbox.assert.calledOnce(dataQ.addToQueue);
      const [queueType, [fieldName, fontWidthInfo], persistent] =
        dataQ.addToQueue.firstCall.args;

      assert.equal(queueType, 'static_fields');
      assert.equal(fieldName, 'font_width_info');
      assert.isObject(fontWidthInfo);
      assert.isFalse(persistent);
    });

    it('swallows internal errors gracefully', async () => {
      // force error
      documentMock.createElement.throws(new Error('boom'));
      const feature = new FontWidthFeature(dataQ, documentMock, dpr);
      await feature.startFeature();

      sandbox.assert.notCalled(dataQ.addToQueue);
    });
  });

  /* ---------- helpers ---------- */
  describe('_isZoomNeeded', () => {
    it('always true', () => {
      const feature = new FontWidthFeature(dataQ, documentMock, dpr);
      assert.isTrue(feature._isZoomNeeded());
    });
  });

  describe('_isZoomResetNeeded', () => {
    it('always false', () => {
      const feature = new FontWidthFeature(dataQ, documentMock, dpr);
      assert.isFalse(feature._isZoomResetNeeded());
    });
  });
});
