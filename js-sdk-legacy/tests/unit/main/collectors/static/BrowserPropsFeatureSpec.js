import {assert} from 'chai';
import ConfigurationRepository from '../../../../../src/main/core/configuration/ConfigurationRepository';
import BrowserPropsFeature from '../../../../../src/main/collectors/static/BrowserPropsFeature';
import {MockObjects} from '../../../mocks/mockObjects';
import TestBrowserUtils from '../../../../TestBrowserUtils';
import SupportedBrowserVersions from '../../../../SupportedBrowserVersions';
import DataQ from '../../../../../src/main/technicalServices/DataQ';

describe('BrowserPropsFeature tests:', function () {
    beforeEach(function () {
        this.dataQ = sinon.createStubInstance(DataQ);
        this.configurations = {
            isBrowserDisplayDetectEnabled: sinon.stub().returns(true),
            isMathDetectEnabled: sinon.stub().returns(true)
        };
    });

    afterEach(function
        () {
        this.dataQ.addToQueue.reset();
    });

    function findStaticValue(dataQ, staticName) {
        for (let i = 0; i < dataQ.addToQueue.args.length; i++) {
            if (dataQ.addToQueue.args[i][0] !== 'static_fields') {
                continue;
            }

            const currentStatic = dataQ.addToQueue.args[i][1];
            if (currentStatic[0] === staticName) {
                return currentStatic[1];
            }
        }
        return null;
    }

    it('run the start feature and verify no exception is thrown and the dataQ was called', function () {
        const utils = sinon.stub(MockObjects.cdUtils);
        const configurationRepository = sinon.stub(new ConfigurationRepository());

        const pointerHoverDetector = sinon.stub({
            getPointerHover() {
            },
        });
        pointerHoverDetector.getPointerHover.returns({pointer: 1, hover: 2});

        const bpFeature = new BrowserPropsFeature(this.dataQ, pointerHoverDetector, utils, configurationRepository, this.configurations);

        bpFeature.startFeature();
    });

    it('Language field is hashed when configuration is true', function () {
        const utils = sinon.stub(MockObjects.cdUtils);
        const configurationRepository = sinon.stub(new ConfigurationRepository());
        configurationRepository.get.withArgs('browserPropsShouldHashLanguageField').returns(true);

        const currentLanguage = BrowserPropsFeature.getLanguage();
        utils.getHash.withArgs(currentLanguage).returns(currentLanguage + 'hashed');
        utils.getHash.withArgs().returns('hashed');

        const pointerHoverDetector = sinon.stub({
            getPointerHover() {
            },
        });
        pointerHoverDetector.getPointerHover.returns({pointer: 1, hover: 2});

        const bpFeature = new BrowserPropsFeature(this.dataQ, pointerHoverDetector, utils, configurationRepository, this.configurations);

        bpFeature.startFeature();

        const addQArgs = this.dataQ.addToQueue.getCall(2).args;
        assert.equal('static_fields', addQArgs[0], 'no static fields found');

        const languageValue = findStaticValue(this.dataQ, 'main_lang');
        assert.isNotNull(languageValue, 'main_lang value is null. Probably couldn\'t find it in the statics list');
        assert.equal(addQArgs[1][1], utils.getHash(currentLanguage));
    });

    it('Language field is not hashed when configuration is false', function () {
        const utils = sinon.stub(MockObjects.cdUtils);
        const configurationRepository = sinon.stub(new ConfigurationRepository());

        const currentLanguage = BrowserPropsFeature.getLanguage();
        utils.getHash.withArgs(currentLanguage).returns(currentLanguage + 'hashed');

        configurationRepository.set('browserPropsShouldHashLanguageField', false);

        const pointerHoverDetector = sinon.stub({
            getPointerHover() {
            },
        });
        pointerHoverDetector.getPointerHover.returns({pointer: 1, hover: 2});

        const bpFeature = new BrowserPropsFeature(this.dataQ, pointerHoverDetector, utils, configurationRepository, this.configurations);


        bpFeature.startFeature();

        const addQArgs = this.dataQ.addToQueue.getCall(2).args;
        assert.equal('static_fields', addQArgs[0], 'no static fields found');

        const languageValue = findStaticValue(this.dataQ, 'main_lang');
        assert.isNotNull(languageValue, 'main_lang value is null. Probably couldn\'t find it in the statics list');
        assert.equal(addQArgs[1][1], currentLanguage);
    });

    it('Languages field is hashed when configuration is true', function (done) {
        if (TestBrowserUtils.isEdge(window.navigator.userAgent)
            || TestBrowserUtils.isIE11(window.navigator.userAgent)
            || TestBrowserUtils.isFirefox(window.navigator.userAgent, SupportedBrowserVersions.FirefoxOldestSupportedVersion)
            || !navigator.languages) {
            this.skip();
            return;
        }

        const utils = sinon.stub(MockObjects.cdUtils);
        const configurationRepository = sinon.stub(new ConfigurationRepository());
        configurationRepository.get.withArgs('browserPropsShouldHashLanguageField').returns(true);

        let languages = navigator.languages;
        for (let i = 0; i < languages.length; i++) {
            utils.getHash.withArgs(languages[i]).returns(languages[i] + 'hashed');
        }

        languages = Array.from(languages, (language) => {
            return utils.getHash(language);
        });

        const pointerHoverDetector = sinon.stub({
            getPointerHover() {
            },
        });
        pointerHoverDetector.getPointerHover.returns({pointer: 1, hover: 2});

        const bpFeature = new BrowserPropsFeature(this.dataQ, pointerHoverDetector, utils, configurationRepository, this.configurations);


        bpFeature.startFeature();

        const addQArgs = this.dataQ.addToQueue.getCall(7).args;
        assert.equal('static_fields', addQArgs[0], 'no static fields found');

        const languagesValue = findStaticValue(this.dataQ, 'languages');
        assert.isNotNull(languagesValue, 'Languages value is null. Probably couldnt find it in the statics list');
        assert.equal(languagesValue.length, languages.length, 'Actual and expected language arrays are not of the same size');
        for (let i = 0; i < languagesValue.length; i++) {
            assert.equal(languagesValue[i], languages[i]);
        }

        done();
    });

    it('Languages field is not hashed when configuration is false', function (done) {
        if (TestBrowserUtils.isEdge(window.navigator.userAgent)
            || TestBrowserUtils.isIE11(window.navigator.userAgent)
            || TestBrowserUtils.isFirefox(window.navigator.userAgent, SupportedBrowserVersions.FirefoxOldestSupportedVersion)
            || !navigator.languages) {
            this.skip();
            return;
        }

        const utils = sinon.stub(MockObjects.cdUtils);
        const configurationRepository = sinon.stub(new ConfigurationRepository());

        const languages = navigator.languages;
        for (let i = 0; i < languages.length; i++) {
            utils.getHash.withArgs(languages[i]).returns(languages[i] + 'hashed');
        }

        configurationRepository.set('browserPropsShouldHashLanguageField', false);

        const pointerHoverDetector = sinon.stub({
            getPointerHover() {
            },
        });
        pointerHoverDetector.getPointerHover.returns({pointer: 1, hover: 2});

        const bpFeature = new BrowserPropsFeature(this.dataQ, pointerHoverDetector, utils, configurationRepository, this.configurations);


        bpFeature.startFeature();

        const addQArgs = this.dataQ.addToQueue.getCall(7).args;
        assert.equal('static_fields', addQArgs[0], 'no static fields found');

        const languagesValue = findStaticValue(this.dataQ, 'languages');
        assert.isNotNull(languagesValue, 'Languages value is null. Probably couldnt find it in the statics list');
        assert.equal(languagesValue.length, languages.length, 'Actual and expected language arrays are not of the same size');
        for (let i = 0; i < languagesValue.length; i++) {
            assert.equal(languagesValue[i], languages[i]);
        }

        done();
    });

    it('os_version / os_family fields are sent', function () {
        const utils = sinon.stub(MockObjects.cdUtils);
        const configurationRepository = sinon.stub(new ConfigurationRepository());

        const pointerHoverDetector = sinon.stub({
            getPointerHover() {
            },
        });
        pointerHoverDetector.getPointerHover.returns({pointer: 1, hover: 2});

        const bpFeature = new BrowserPropsFeature(this.dataQ, pointerHoverDetector, utils, configurationRepository, this.configurations);


        bpFeature.startFeature();

        const addQArgs = this.dataQ.addToQueue.getCall(2).args;
        assert.equal('static_fields', addQArgs[0], 'no static fields found');

        const osVersion = findStaticValue(this.dataQ, 'os_version');
        assert.isNotNull(osVersion, 'os_version value is null. Probably couldn\'t find it in the statics list');

        const osFamily = findStaticValue(this.dataQ, 'os_family');
        assert.isNotNull(osFamily, 'os_family value is null. Probably couldn\'t find it in the statics list');
    });

    it('Successfully augments the navigator.plugins entry with Shockwave Flash plugin in IE', function () {
        // Create the ActiveXObject stub
        window['ActiveXObject'] = function (val) {
            return val;
        };
        const pluginsStub = function () {
            this.toString = function () {
                return '[object MSCollection]';
            }
        };
        const detectFlashInIE = BrowserPropsFeature.isActiveXAndFlashEnabled;
        const pList = BrowserPropsFeature.augmentWithFlashInIE([], new pluginsStub(), detectFlashInIE);

        assert.lengthOf(pList, 1);
        assert.equal(pList[0][0], 'Flash32_32_0_0_238.ocx', 'IE < 11 augmented flash filename should be Flash32_32_0_0_238.ocx');
        assert.equal(pList[0][1], 2, 'IE < 11 augmented flash length should be 2');
        assert.equal(pList[0][2], 'Shockwave Flash', 'IE < 11 augmented flash name should be Shockwave Flash');
        assert.equal(pList[0][3], '32.0.0.238', 'IE < 11 augmented flash name version should be 32.0.0.238');

        delete window['ActiveXObject'];
    });

    it('navigator.plugins is not augmented with the Shockwave Flash entry', function () {
        const pluginsStub = function () {
            this.toString = function () {
                return '[object MSCollection]';
            }
        };
        const detectFlashInIE = BrowserPropsFeature.isActiveXAndFlashEnabled;
        const pList = BrowserPropsFeature.augmentWithFlashInIE([], new pluginsStub(), detectFlashInIE);

        assert.lengthOf(pList, 0);
    });

    it('navigator.buildID is not sent when the browser is not Firefox', function () {
        if (TestBrowserUtils.isFirefox(window.navigator.userAgent, '')) {
            this.skip();
            return;
        }
        const utils = sinon.stub(MockObjects.cdUtils);
        const configurationRepository = sinon.stub(new ConfigurationRepository());

        const pointerHoverDetector = sinon.stub({
            getPointerHover() {
            },
        });
        pointerHoverDetector.getPointerHover.returns({pointer: 1, hover: 2});

        const bpFeature = new BrowserPropsFeature(this.dataQ, pointerHoverDetector, utils, configurationRepository, this.configurations);


        bpFeature.startFeature();

        const addQArgs = this.dataQ.addToQueue.getCall(7).args;
        assert.equal('static_fields', addQArgs[0], 'no static fields found');

        const buildId = findStaticValue(this.dataQ, 'navigator_build_id');
        assert.isNull(buildId);
    });

    it('navigator.buildID is sent when the browser is Firefox', function () {
        if (!TestBrowserUtils.isFirefox(window.navigator.userAgent, SupportedBrowserVersions.FirefoxOldestSupportedVersion)) {
            this.skip();
            return;
        }
        const utils = sinon.stub(MockObjects.cdUtils);
        const configurationRepository = sinon.stub(new ConfigurationRepository());

        const pointerHoverDetector = sinon.stub({
            getPointerHover() {
            },
        });
        pointerHoverDetector.getPointerHover.returns({pointer: 1, hover: 2});

        const bpFeature = new BrowserPropsFeature(this.dataQ, pointerHoverDetector, utils, configurationRepository, this.configurations);


        bpFeature.startFeature();

        const addQArgs = this.dataQ.addToQueue.getCall(7).args;
        assert.equal('static_fields', addQArgs[0], 'no static fields found');

        const buildId = findStaticValue(this.dataQ, 'navigator_build_id');
        assert.isNotNull(buildId);
    });

    it('navigator.maxTouchPoints is collected', function () {
        const utils = sinon.stub(MockObjects.cdUtils);
        const configurationRepository = sinon.stub(new ConfigurationRepository());

        const pointerHoverDetector = sinon.stub({
            getPointerHover() {
            },
        });
        pointerHoverDetector.getPointerHover.returns({pointer: 1, hover: 2});

        const bpFeature = new BrowserPropsFeature(this.dataQ, pointerHoverDetector, utils, configurationRepository, this.configurations);


        bpFeature.startFeature();

        const addQArgs = this.dataQ.addToQueue.getCall(7).args;
        assert.equal('static_fields', addQArgs[0], 'no static fields found');

        const maxTouchPoints = findStaticValue(this.dataQ, 'navigator_max_touch_points');
        assert.isNotNull(maxTouchPoints);
    });

    it('Get available platform from old api', function () {
        let platform = BrowserPropsFeature.getAvailablePlatform(window.navigator);
        assert.equal(platform, window.navigator.platform, 'old api is deprecated');
    });

    it('Get available platform from new api', function () {
        if ('userAgentData' in window.navigator) {
            let mockNavigator = sinon.mock({"userAgentData": {"platform": window.navigator.userAgentData.platform}});
            let platform = BrowserPropsFeature.getAvailablePlatform(mockNavigator.object);
            assert.equal(platform, window.navigator.userAgentData.platform, 'new api is not available');
        } else {
            this.skip();
        }
    });

    it('Get available platform no available apis', function () {
        let platform = BrowserPropsFeature.getAvailablePlatform({});
        assert.isNull(platform, 'no api is available');
    });

    it('should return "reduce" if prefers-reduced-transparency: reduce is matched', () => {
        sinon.stub(window, 'matchMedia').callsFake((query) => {
            return {
                matches: query.includes('prefers-reduced-transparency: reduce'),
            }
        });
        assert.strictEqual(BrowserPropsFeature.isTransparencyReduced(), 'reduce');
    });

    describe('Browser Display Browser Props Tests', function () {
        let matchMediaStub;
        let originalMatchMedia;

        beforeEach(function () {
            // Save original matchMedia
            originalMatchMedia = window.matchMedia;
            // Create a new stub for matchMedia
            matchMediaStub = sinon.stub();
            window.matchMedia = matchMediaStub;
        });

        afterEach(function () {
            // Restore original matchMedia
            window.matchMedia = originalMatchMedia;
        });

        // Test for getMonochromeDepth method
        it('should return undefined if monochrome is not supported', function () {
            matchMediaStub.returns({ matches: false });

            const result = BrowserPropsFeature.getMonochromeDepth();
            assert.strictEqual(result, undefined);
        });

        it('should return the correct monochrome depth', function () {
            matchMediaStub.withArgs('(min-monochrome: 0)').returns({ matches: true });
            matchMediaStub.withArgs('(max-monochrome: 0)').returns({ matches: true });

            const result = BrowserPropsFeature.getMonochromeDepth();
            assert.strictEqual(result, 0);
        });

        // Test for isHDR method
        it('should return "high" if HDR is supported', function () {
            matchMediaStub.withArgs('(dynamic-range: high)').returns({ matches: true });
            matchMediaStub.withArgs('(dynamic-range: standard)').returns({ matches: false });

            const result = BrowserPropsFeature.isHDR();
            assert.strictEqual(result, 'high');
        });

        it('should return "standard" if HDR is not high but standard', function () {
            matchMediaStub.withArgs('(dynamic-range: high)').returns({ matches: false });
            matchMediaStub.withArgs('(dynamic-range: standard)').returns({ matches: true });

            const result = BrowserPropsFeature.isHDR();
            assert.strictEqual(result, 'standard');
        });

        it('should return "undefined" if HDR is neither high nor standard', function () {
            matchMediaStub.withArgs('(dynamic-range: high)').returns({ matches: false });
            matchMediaStub.withArgs('(dynamic-range: standard)').returns({ matches: false });

            const result = BrowserPropsFeature.isHDR();
            assert.strictEqual(result, 'undefined');
        });

        // Test for areColorsInverted method
        it('should return "inverted" if colors are inverted', function () {
            matchMediaStub.withArgs('(inverted-colors: inverted)').returns({ matches: true });

            const result = BrowserPropsFeature.areColorsInverted();
            assert.strictEqual(result, 'inverted');
        });

        it('should return "undefined" if no condition matches for inverted colors', function () {
            matchMediaStub.withArgs('(inverted-colors: inverted)').returns({ matches: false });
            matchMediaStub.withArgs('(inverted-colors: none)').returns({ matches: false });

            const result = BrowserPropsFeature.areColorsInverted();
            assert.strictEqual(result, 'undefined');
        });

        // Test for areColorsForced method
        it('should return "active" if colors are forced', function () {
            matchMediaStub.withArgs('(forced-colors: active)').returns({ matches: true });

            const result = BrowserPropsFeature.areColorsForced();
            assert.strictEqual(result, 'active');
        });

        it('should return "undefined" if no condition matches for forced colors', function () {
            matchMediaStub.withArgs('(forced-colors: active)').returns({ matches: false });
            matchMediaStub.withArgs('(forced-colors: none)').returns({ matches: false });

            const result = BrowserPropsFeature.areColorsForced();
            assert.strictEqual(result, 'undefined');
        });

        it('should return "rec2020" if color gamut is rec2020', function () {
            matchMediaStub.withArgs('(color-gamut: rec2020)').returns({ matches: true });

            const result = BrowserPropsFeature.getColorGamut();
            assert.strictEqual(result, 'rec2020');
        });

        it('should return "p3" if color gamut is p3', function () {
            matchMediaStub.withArgs('(color-gamut: rec2020)').returns({ matches: false });
            matchMediaStub.withArgs('(color-gamut: p3)').returns({ matches: true });

            const result = BrowserPropsFeature.getColorGamut();
            assert.strictEqual(result, 'p3');
        });

        it('should return "srgb" if color gamut is srgb', function () {
            matchMediaStub.withArgs('(color-gamut: rec2020)').returns({ matches: false });
            matchMediaStub.withArgs('(color-gamut: p3)').returns({ matches: false });
            matchMediaStub.withArgs('(color-gamut: srgb)').returns({ matches: true });

            const result = BrowserPropsFeature.getColorGamut();
            assert.strictEqual(result, 'srgb');
        });

        it('should return "undefined" if no color gamut matches', function () {
            matchMediaStub.withArgs('(color-gamut: rec2020)').returns({ matches: false });
            matchMediaStub.withArgs('(color-gamut: p3)').returns({ matches: false });
            matchMediaStub.withArgs('(color-gamut: srgb)').returns({ matches: false });

            const result = BrowserPropsFeature.getColorGamut();
            assert.strictEqual(result, 'undefined');
        });

        it('should return "reduce" if motion is reduced', function () {
            matchMediaStub.withArgs('(prefers-reduced-motion: reduce)').returns({ matches: true });

            const result = BrowserPropsFeature.isMotionReduced();
            assert.strictEqual(result, 'reduce');
        });

        it('should return "undefined" if no reduced motion preference matches', function () {
            matchMediaStub.withArgs('(prefers-reduced-motion: reduce)').returns({ matches: false });
            matchMediaStub.withArgs('(prefers-reduced-motion: no-preference)').returns({ matches: false });

            const result = BrowserPropsFeature.isMotionReduced();
            assert.strictEqual(result, 'undefined');
        });
    });

    it('get math fingerprint ', function () {
        let math = BrowserPropsFeature.getMathFingerprint();
        assert.strictEqual(typeof math, 'string');
        assert.ok(math.match(/[0-9|\-|.]/));
    });

    it('should not collect browser display properties when isBrowserDisplayDetectEnabled is false', function () {
        const utils = sinon.stub(MockObjects.cdUtils);
        const configurationRepository = sinon.stub(new ConfigurationRepository());
        
        // Set isBrowserDisplayDetectEnabled to return false
        const configurations = {
            isBrowserDisplayDetectEnabled: sinon.stub().returns(false),
            isMathDetectEnabled: sinon.stub().returns(true)
        };

        const pointerHoverDetector = sinon.stub({
            getPointerHover() {
            },
        });
        pointerHoverDetector.getPointerHover.returns({pointer: 1, hover: 2});

        const bpFeature = new BrowserPropsFeature(this.dataQ, pointerHoverDetector, utils, configurationRepository, configurations);

        bpFeature.startFeature();

        // Verify that browser display properties are NOT collected
        const browserDisplayValue = findStaticValue(this.dataQ, 'browser_display_properties');
        assert.isNull(browserDisplayValue, 'browser_display_properties should not be collected when isBrowserDisplayDetectEnabled is false');
    });

    it('should not collect math fingerprint when isMathDetectEnabled is false', function () {
        const utils = sinon.stub(MockObjects.cdUtils);
        const configurationRepository = sinon.stub(new ConfigurationRepository());
        
        // Set isMathDetectEnabled to return false
        const configurations = {
            isBrowserDisplayDetectEnabled: sinon.stub().returns(true),
            isMathDetectEnabled: sinon.stub().returns(false)
        };

        const pointerHoverDetector = sinon.stub({
            getPointerHover() {
            },
        });
        pointerHoverDetector.getPointerHover.returns({pointer: 1, hover: 2});

        const bpFeature = new BrowserPropsFeature(this.dataQ, pointerHoverDetector, utils, configurationRepository, configurations);

        bpFeature.startFeature();

        // Verify that math fingerprint is NOT collected
        const mathValue = findStaticValue(this.dataQ, 'math_detect');
        assert.isNull(mathValue, 'math_detect should not be collected when isMathDetectEnabled is false');
    });
});
