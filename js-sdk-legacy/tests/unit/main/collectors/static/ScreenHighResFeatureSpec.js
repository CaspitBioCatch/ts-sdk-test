import {assert} from 'chai';
import ScreenHighResFeature from '../../../../../src/main/collectors/static/ScreenHighResFeature';
import ScreenHighResContract from '../../../../../src/main/contract/staticContracts/ScreenHighResContract';
import {DevDebugDataQ} from "../../../../../src/main/technicalServices/dev_collectors/DevDebugDataQ";

describe('ScreenHighResFeature tests:', function () {
    let sandbox;
    let devDebugDataQ;
    let originalMatchMedia;

    beforeEach(function () {
        sandbox = sinon.createSandbox();
        devDebugDataQ = sandbox.createStubInstance(DevDebugDataQ);
        originalMatchMedia = window.matchMedia;
    });

    afterEach(function () {
        sandbox.restore();
        window.matchMedia = originalMatchMedia;
    });

    describe('constructor', function() {
        it('should initialize with a DataQueue instance', function() {
            const screenHighResFeature = new ScreenHighResFeature(devDebugDataQ);
            assert.instanceOf(screenHighResFeature, ScreenHighResFeature);
            assert.property(screenHighResFeature, '_dataQ');
            assert.strictEqual(screenHighResFeature._dataQ, devDebugDataQ);
        });
    });

    describe('getDefaultSettings', function() {
        it('should return a copy of the feature settings', function() {
            const settings = ScreenHighResFeature.getDefaultSettings();
            
            assert.property(settings, 'configKey');
            assert.equal(settings.configKey, 'isScreenHighResFeature');
            assert.property(settings, 'shouldRunPerSession');
            assert.isTrue(settings.shouldRunPerSession);
            assert.property(settings, 'runInSlave');
            assert.isTrue(settings.runInSlave);
            assert.property(settings, 'runInLean');
            assert.isTrue(settings.runInLean);
        });
    });

    describe('startFeature', function() {
        it('should collect screen high resolution information when matches is true', function() {
            const mockMediaQueryList = { matches: true };
            const mockMatchMedia = sandbox.stub().returns(mockMediaQueryList);
            window.matchMedia = mockMatchMedia;

            const contractData = ['screen_high_res', true];
            sandbox.stub(ScreenHighResContract.prototype, 'buildQueueMessage').returns(contractData);

            const screenHighResFeature = new ScreenHighResFeature(devDebugDataQ);
            screenHighResFeature.startFeature();

            assert.isTrue(devDebugDataQ.addToQueue.calledOnce);
            const addQArgs = devDebugDataQ.addToQueue.getCall(0).args;
            assert.equal(addQArgs[0], 'static_fields');
            assert.deepEqual(addQArgs[1], contractData);
        });

        it('should collect screen high resolution information when matches is false', function() {
            const mockMediaQueryList = { matches: false };
            const mockMatchMedia = sandbox.stub().returns(mockMediaQueryList);
            window.matchMedia = mockMatchMedia;

            const contractData = ['screen_high_res', false];
            sandbox.stub(ScreenHighResContract.prototype, 'buildQueueMessage').returns(contractData);

            const screenHighResFeature = new ScreenHighResFeature(devDebugDataQ);
            screenHighResFeature.startFeature();

            assert.isTrue(devDebugDataQ.addToQueue.calledOnce);
            const addQArgs = devDebugDataQ.addToQueue.getCall(0).args;
            assert.equal(addQArgs[0], 'static_fields');
            assert.deepEqual(addQArgs[1], contractData);
        });

        it('should handle error when matchMedia is not available', function() {
            window.matchMedia = undefined;

            const screenHighResFeature = new ScreenHighResFeature(devDebugDataQ);
            screenHighResFeature.startFeature();

            assert.isTrue(devDebugDataQ.addToQueue.calledOnce);
            const addQArgs = devDebugDataQ.addToQueue.getCall(0).args;
            assert.equal(addQArgs[0], 'static_fields');
            assert.deepEqual(addQArgs[1], ['screen_high_res', false]);
        });
    });

    describe('getScreenHighResInfo', function() {
        it('should return true when media query matches', function() {
            const mockMediaQueryList = { matches: true };
            const mockMatchMedia = sandbox.stub().returns(mockMediaQueryList);
            window.matchMedia = mockMatchMedia;

            const result = ScreenHighResFeature.getScreenHighResInfo();
            assert.isTrue(result);
        });

        it('should return false when media query does not match', function() {
            const mockMediaQueryList = { matches: false };
            const mockMatchMedia = sandbox.stub().returns(mockMediaQueryList);
            window.matchMedia = mockMatchMedia;

            const result = ScreenHighResFeature.getScreenHighResInfo();
            assert.isFalse(result);
        });

        it('should return false when matchMedia is not available', function() {
            window.matchMedia = undefined;

            const result = ScreenHighResFeature.getScreenHighResInfo();
            assert.isFalse(result);
        });
    });

    describe('getMediaQueryList', function() {
        it('should return MediaQueryList when matchMedia is available', function() {
            const mockMediaQueryList = { matches: true };
            const mockMatchMedia = sandbox.stub().returns(mockMediaQueryList);
            window.matchMedia = mockMatchMedia;

            const query = "(-webkit-min-device-pixel-ratio: 2)";
            const result = ScreenHighResFeature.getMediaQueryList(query);
            
            assert.equal(result, mockMediaQueryList);
            assert.isTrue(mockMatchMedia.calledWith(query));
        });

        it('should return null when matchMedia is not available', function() {
            window.matchMedia = undefined;

            const query = "(-webkit-min-device-pixel-ratio: 2)";
            const result = ScreenHighResFeature.getMediaQueryList(query);
            
            assert.isNull(result);
        });
    });
}); 