import { assert } from 'chai';
import NavigatorFeature from '../../../../../src/main/collectors/static/NavigatorFeature';
import DataQ from '../../../../../src/main/technicalServices/DataQ';
import sinon from 'sinon';

describe('NavigatorFeature test:', function () {
    let sandbox;
    let dataQ;
    let navigatorFeature;
    let mockNavigator;

    beforeEach(function () {
        sandbox = sinon.createSandbox();
        dataQ = sandbox.createStubInstance(DataQ);
        
        // Create a mock navigator with all required properties
        mockNavigator = {
            oscpu: 'test-oscpu',
            pdfViewerEnabled: true,
            webdriver: false,
            userAgentData: { getHighEntropyValues: true },
            appVersion: '1.0',
            platform: 'test-platform',
            vendor: 'test-vendor',
            productSub: 'test-productSub',
            vendorSub: 'test-vendorSub',
            onLine: true
        };
        Object.setPrototypeOf(mockNavigator, {
            somePrototypeMethod: () => {}
        });

        navigatorFeature = new NavigatorFeature(dataQ, mockNavigator);
    });

    afterEach(function () {
        sandbox.restore();
    });

    it('should initialize with default settings', function () {
        const settings = NavigatorFeature.getDefaultSettings();
        assert.equal(settings.configKey, 'isNavigatorFeature');
       
    });

    it('should collect and send all navigator properties', function () {
        navigatorFeature.startFeature();

        // Verify that addToQueue was called for each property
        assert.isTrue(dataQ.addToQueue.called, 'addToQueue should be called');
        assert.equal(dataQ.addToQueue.callCount, 12, 'addToQueue should be called 12 times');

        // Verify each call
        const calls = dataQ.addToQueue.getCalls();
        calls.forEach(call => {
            const args = call.args;
            assert.equal(args[0], 'static_fields', 'All calls should be to static_fields');
            assert.isArray(args[1], 'Second argument should be an array');
            assert.lengthOf(args[1], 2, 'Array should contain key and value');
            assert.isString(args[1][0], 'First element should be a string key');
            assert.isTrue(args[1][0].startsWith('navigator_'), 'Key should start with navigator_');
        });

        // Verify specific properties
        const callsMap = new Map(calls.map(call => [call.args[1][0], call.args[1][1]]));
        assert.equal(callsMap.get('navigator_oscpu'), 'test-oscpu');
        assert.equal(callsMap.get('navigator_pdfViewerEnabled'), true);
        assert.isNull(callsMap.get('navigator_webdriver'));
        assert.equal(callsMap.get('navigator_onLine'), true);
    });

    it('should handle missing navigator properties gracefully', function () {
        // Create a navigator with some missing properties
        const incompleteNavigator = {
            oscpu: 'test-oscpu',
            platform: 'test-platform'
        };
        navigatorFeature = new NavigatorFeature(dataQ, incompleteNavigator);

        navigatorFeature.startFeature();

        // Verify that addToQueue was still called for all properties
        assert.isTrue(dataQ.addToQueue.called, 'addToQueue should be called');
        assert.equal(dataQ.addToQueue.callCount, 12, 'addToQueue should be called 12 times');

        // Verify that missing properties are set to null
        const calls = dataQ.addToQueue.getCalls();
        const callsMap = new Map(calls.map(call => [call.args[1][0], call.args[1][1]]));
        assert.isNull(callsMap.get('navigator_pdfViewerEnabled'));
        assert.isNull(callsMap.get('navigator_webdriver'));
    });

    it('should handle errors gracefully', function () {
        // Create a navigator that will throw when accessing any property
        const errorNavigator = new Proxy({}, {
            get: () => { throw new Error('Test error'); }
        });
        navigatorFeature = new NavigatorFeature(dataQ, errorNavigator);

        navigatorFeature.startFeature();
        
        // Verify that addToQueue was not called
        assert.isFalse(dataQ.addToQueue.called, 'addToQueue should not be called when error occurs');
    });

    it('should use default navigator when not provided', function () {
        // Create a new instance without providing navigator
        navigatorFeature = new NavigatorFeature(dataQ);
        
        // Verify that it uses window.navigator
        assert.equal(navigatorFeature._navigator, window.navigator);
    });
}); 