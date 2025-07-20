import { assert } from "chai";
import sinon from "sinon";
import FontDetectorProvider from "../../../../../../../../../src/main/collectors/static/font/collection/v2/detector/FontDetectorProvider";
import CanvasFontDetector from "../../../../../../../../../src/main/collectors/static/font/collection/v2/detector/CanvasFontDetector";
import NativeFontDetector from "../../../../../../../../../src/main/collectors/static/font/collection/v2/detector/NativeFontDetector";
import Log from "../../../../../../../../../src/main/technicalServices/log/Logger";


describe('FontDetectorProvider Unit Tests', () => {
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        sandbox.stub(Log, 'info');
        sandbox.stub(Log, 'error');
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should throw an error if "domUtils" is missing', () => {
        assert.throws(() => new FontDetectorProvider(), /domUtils is required for FontDetectorProvider\./);
    });

    it('should initialize with valid "domUtils"', () => {
        const domUtilsStub = {};
        const provider = new FontDetectorProvider(domUtilsStub);
        assert.equal(provider._domUtils, domUtilsStub);
    });

    it('should return NativeFontDetector if supported', () => {
        const domUtilsStub = {};
        sandbox.stub(NativeFontDetector.prototype, 'isSupported').returns(true);

        const provider = new FontDetectorProvider(domUtilsStub);
        const detector = provider.getBestDetector();

        assert.ok(detector instanceof NativeFontDetector);
        assert.isTrue(Log.info.calledOnce);
        assert.match(Log.info.firstCall.args[0], /Using NativeFontDetector/);
    });

    it('should return CanvasFontDetector if NativeFontDetector is not supported and CanvasFontDetector is supported', () => {
        const domUtilsStub = {};
        sandbox.stub(NativeFontDetector.prototype, 'isSupported').returns(false);
        sandbox.stub(CanvasFontDetector.prototype, 'isSupported').returns(true);

        const provider = new FontDetectorProvider(domUtilsStub);
        const detector = provider.getBestDetector();

        assert.ok(detector instanceof CanvasFontDetector);
        assert.isTrue(Log.info.calledOnce);
        assert.match(Log.info.firstCall.args[0], /Using CanvasFontDetector/);
    });

    it('should throw an error if no detector is supported', () => {
        const domUtilsStub = {};
        sandbox.stub(NativeFontDetector.prototype, 'isSupported').returns(false);
        sandbox.stub(CanvasFontDetector.prototype, 'isSupported').returns(false);

        const provider = new FontDetectorProvider(domUtilsStub);

        assert.throws(() => provider.getBestDetector(), /No suitable font detection implementation is supported/);
    });

    it('should handle errors during NativeFontDetector instantiation', () => {
        const domUtilsStub = {};
        sandbox.stub(NativeFontDetector.prototype, 'isSupported').throws(new Error('NativeFontDetector Error'));
        sandbox.stub(CanvasFontDetector.prototype, 'isSupported').returns(true);

        const provider = new FontDetectorProvider(domUtilsStub);
        const detector = provider.getBestDetector();

        assert.ok(detector instanceof CanvasFontDetector);
        assert.isTrue(Log.error.calledOnce);
        assert.match(Log.error.firstCall.args[0], /NativeFontDetector failed/);
        assert.isTrue(Log.info.calledOnce);
        assert.match(Log.info.firstCall.args[0], /Using CanvasFontDetector/);
    });

    it('should handle errors during CanvasFontDetector instantiation', () => {
        const domUtilsStub = {};
        sandbox.stub(NativeFontDetector.prototype, 'isSupported').returns(false);
        sandbox.stub(CanvasFontDetector.prototype, 'isSupported').throws(new Error('CanvasFontDetector Error'));

        const provider = new FontDetectorProvider(domUtilsStub);

        assert.throws(() => provider.getBestDetector(), /No suitable font detection implementation is supported/);
        assert.isTrue(Log.error.calledOnce);
        assert.match(Log.error.firstCall.args[0], /CanvasFontDetector failed/);
    });
});