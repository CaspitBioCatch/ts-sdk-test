import { assert } from 'chai';
import BrowserDetect from '../../../../../src/main/collectors/static/BrowserDetect';
import DataQ from '../../../../../src/main/technicalServices/DataQ';
import TestBrowserUtils from "../../../../TestBrowserUtils";
import SupportedBrowserVersions from "../../../../SupportedBrowserVersions";

describe('BrowserDetectFeature test:', function () {
    let originalNavigator;

    function countItemsTrue(array) {
        let result = 0;
        for (let x = 0; array.length >= x; x++) {
            if (array[x] === true) {
                result++;
            }
        }
        return result;
    }

    beforeEach(() => {
        originalNavigator = { userAgent: navigator.userAgent, vendor: navigator.vendor };
        // Reset navigator to its original state before each test
        Object.defineProperty(navigator, 'userAgent', {
            value: originalNavigator.userAgent,
            configurable: true,
        });
        if (originalNavigator.vendor) {
            Object.defineProperty(navigator, 'vendor', {
                value: originalNavigator.vendor,
                configurable: true,
            });
        }
    });

    afterEach(() => {
        // Restore the original navigator properties after each test
        Object.defineProperty(navigator, 'userAgent', {
            value: originalNavigator.userAgent,
            configurable: true,
        });
        if (originalNavigator.vendor) {
            Object.defineProperty(navigator, 'vendor', {
                value: originalNavigator.vendor,
                configurable: true,
            });
        }
    });

    it('should detect Chrome browser fallback', function () {
        const dataQ = sinon.createStubInstance(DataQ);

        Object.defineProperty(navigator, 'userAgentData', {
            value: null,
            configurable: true
        });

        // Mocking Chrome's userAgent
        Object.defineProperty(navigator, 'userAgent', {
            value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            configurable: true
        });

        Object.defineProperty(navigator, 'vendor', {
            value: "Google Inc",
            configurable: true,
        });

        const bdFeature = new BrowserDetect(dataQ);
        bdFeature.startFeature();

        const addQArgs = dataQ.addToQueue.getCall(0).args;
        const num = countItemsTrue(addQArgs[1][1]);
        assert.isTrue(addQArgs[1][1][0], 'Chrome should be detected as true');
        assert.isTrue(num <= 2, 'more than one browser detected');
    });

    it('should detect Firefox browser fallback', function () {
        const dataQ = sinon.createStubInstance(DataQ);

        Object.defineProperty(navigator, 'userAgentData', {
            value: null,
            configurable: true
        });

        // Mocking Firefox's userAgent
        Object.defineProperty(navigator, 'userAgent', {
            value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
            configurable: true
        });

        const bdFeature = new BrowserDetect(dataQ);
        bdFeature.startFeature();

        const addQArgs = dataQ.addToQueue.getCall(0).args;
        const num = countItemsTrue(addQArgs[1][1]);
        assert.isTrue(addQArgs[1][1][1], 'Firefox should be detected as true');
        assert.isTrue(num <= 2, 'more than one browser detected');
    });

    it('should detect Safari browser fallback', function () {
        const dataQ = sinon.createStubInstance(DataQ);
        Object.defineProperty(navigator, 'userAgentData', {
            value: null,
            configurable: true
        });

        // Mocking Safari's userAgent
        Object.defineProperty(navigator, 'userAgent', {
            value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Safari/605.1.15',
            configurable: true
        });
        Object.defineProperty(navigator, 'vendor', {
            value: 'Apple Computer, Inc.',
            configurable: true
        });

        const bdFeature = new BrowserDetect(dataQ);
        bdFeature.startFeature();

        const addQArgs = dataQ.addToQueue.getCall(0).args;
        const num = countItemsTrue(addQArgs[1][1]);
        assert.isTrue(addQArgs[1][1][4], 'Safari should be detected as true');
        assert.isTrue(num <= 2, 'more than one browser detected');
    });

    it('should detect Edge browser fallback', function () {
        const dataQ = sinon.createStubInstance(DataQ);

        Object.defineProperty(navigator, 'userAgentData', {
            value: null,
            configurable: true
        });

        // Mocking Edge's userAgent
        Object.defineProperty(navigator, 'userAgent', {
            value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.64',
            configurable: true
        });

        const bdFeature = new BrowserDetect(dataQ);
        bdFeature.startFeature();

        const addQArgs = dataQ.addToQueue.getCall(0).args;
        const num = countItemsTrue(addQArgs[1][1]);
        assert.isTrue(addQArgs[1][1][2], 'Edge should be detected as true');
        assert.isTrue(num <= 2, 'more than one browser detected');
    });

    it('should detect Opera browser fallback', function () {
        if (TestBrowserUtils.isSafari(window.navigator.userAgent)) {
            this.skip();
        }
        const dataQ = sinon.createStubInstance(DataQ);

        Object.defineProperty(navigator, 'userAgentData', {
            value: null,
            configurable: true
        });

        // Mocking Opera's userAgent
        Object.defineProperty(navigator, 'userAgent', {
            value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 OPR/77.0.4054.172',
            configurable: true
        });

        const bdFeature = new BrowserDetect(dataQ);
        bdFeature.startFeature();

        const addQArgs = dataQ.addToQueue.getCall(0).args;
        const num = countItemsTrue(addQArgs[1][1]);
        assert.isTrue(addQArgs[1][1][5], 'Opera should be detected as true');
        assert.isTrue(num <= 2, 'more than one browser detected');
    });

    it('should detect Chrome browser', function () {
        const dataQ = sinon.createStubInstance(DataQ);

        // Mock userAgentData for Chrome
        Object.defineProperty(navigator, 'userAgentData', {
            value: {
                brands: [
                    { brand: 'Google Chrome', version: '91' },
                    { brand: 'Not A Brand', version: '99' }
                ],
                platform: 'Windows'
            },
            configurable: true
        });

        const bdFeature = new BrowserDetect(dataQ);
        bdFeature.startFeature();

        const addQArgs = dataQ.addToQueue.getCall(0).args;
        assert.isTrue(addQArgs[1][1][0], 'Chrome should be detected as true');
    });

    it('should detect Safari browser', function () {
        const dataQ = sinon.createStubInstance(DataQ);

        // Mock userAgentData for Chrome
        Object.defineProperty(navigator, 'userAgentData', {
            value: {
                brands: [
                    { brand: 'Apple Safari', version: '14' },
                    { brand: 'Not A Brand', version: '99' }
                ],
                platform: 'macOS'
            },
            configurable: true
        });

        Object.defineProperty(navigator, 'userAgent', {
            value: 'Safari/14.0',
            configurable: true
        });

        const bdFeature = new BrowserDetect(dataQ);
        bdFeature.startFeature();

        const addQArgs = dataQ.addToQueue.getCall(0).args;
        assert.isTrue(addQArgs[1][1][4], 'Safari should be detected as true');
    });

    it('should detect Firefox browser', function () {
        const dataQ = sinon.createStubInstance(DataQ);

        // Mock userAgentData for Chrome
        Object.defineProperty(navigator, 'userAgentData', {
            value: {
                brands: [
                    { brand: 'Firefox', version: '99' }
                ],
                platform: 'Windows'
            },
            configurable: true
        });

        const bdFeature = new BrowserDetect(dataQ);
        bdFeature.startFeature();

        const addQArgs = dataQ.addToQueue.getCall(0).args;
        assert.isTrue(addQArgs[1][1][1], 'Firefox should be detected as true');
    });

    it('should detect Firefox browser', function () {
        const dataQ = sinon.createStubInstance(DataQ);

        // Mock userAgentData for Chrome
        Object.defineProperty(navigator, 'userAgentData', {
            value: {
                brands: [
                    { brand: 'Opera', version: '99' }
                ],
                platform: 'Windows'
            },
            configurable: true
        });

        const bdFeature = new BrowserDetect(dataQ);
        bdFeature.startFeature();

        const addQArgs = dataQ.addToQueue.getCall(0).args;
        assert.isTrue(addQArgs[1][1][5], 'Opera should be detected as true');
    });


    it('should detect Edge browser', function () {
        const dataQ = sinon.createStubInstance(DataQ);

        // Mock userAgentData for Chrome
        Object.defineProperty(navigator, 'userAgentData', {
            value: {
                brands: [
                    { brand: 'Microsoft Edge', version: '91' },
                    { brand: 'Not A Brand', version: '99' }
                ],
                platform: 'Windows'
            },
            configurable: true
        });

        const bdFeature = new BrowserDetect(dataQ);
        bdFeature.startFeature();

        const addQArgs = dataQ.addToQueue.getCall(0).args;
        assert.isTrue(addQArgs[1][1][2], 'Edge should be detected as true');
    }); 
});
