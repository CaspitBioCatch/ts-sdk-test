import { assert } from 'chai';
import BrowserContextsCache from '../../../../../src/main/core/browsercontexts/BrowserContextsCache';
import FramesDetector from '../../../../../src/main/core/frames/FramesDetector';
import FramesHandler from '../../../../../src/main/core/frames/FramesHandler';
import { MockObjects } from '../../../mocks/mockObjects';
import { TestUtils } from '../../../../TestUtils';
import TestDomUtils from '../../../../TestDomUtils';
import TestFeatureSupport from '../../../../TestFeatureSupport';
import DataCollector from '../../../../../src/main/collectors/DataCollector';
import ElementsMutationObserverFactory
    from '../../../../../src/main/core/browsercontexts/ElementsMutationObserverFactory';
import CDUtils from "../../../../../src/main/technicalServices/CDUtils";
import ElementsMutationObserver from "../../../../../src/main/core/browsercontexts/ElementsMutationObserver";

describe('FramesHandler tests:', function () {
    beforeEach(function () {
        if (!TestFeatureSupport.isMutationObserverSupported()) {
            this.skip();
            return;
        }

        this.sandbox = sinon.createSandbox();

        const featureList = this.sandbox.stub(MockObjects.featureList);
        featureList.list.TestFeat1.instance = this.sandbox.createStubInstance(DataCollector);
        featureList.list.TestFeat4.instance = this.sandbox.createStubInstance(DataCollector);
        this.frameRelatedFeatures = [featureList.list.TestFeat1, featureList.list.TestFeat4];

        this.iframe1 = document.createElement('iframe');
        this.iframe1.setAttribute('id', 'iframe1');
        document.body.appendChild(this.iframe1);
        this.iframe1.contentWindow.testSign = 'iframe1';

        this.iframe2 = document.createElement('iframe');
        this.iframe2.setAttribute('id', 'iframe2');
        document.body.appendChild(this.iframe2);
        this.iframe2.contentWindow.testSign = 'iframe2';

        this.domUtilsStub = this.sandbox.stub(MockObjects.domUtils);
        this.domUtilsStub.matches.returns(true);
        this.domUtilsStub.canAccessIFrame.returns(true);
        this.domUtilsStub.isWindowDocumentReady.returns(true);

        this.frameDetectorStub = this.sandbox.createStubInstance(FramesDetector);
        this._framesCache = new BrowserContextsCache();

        this.useLegacyZeroTimeout = true;

        // Stub requestIdleCallbackSafe to call the callback immediately
        this.sandbox.replace(ElementsMutationObserver.prototype, 'requestIdleCallbackSafe', (cb) => {
            cb({ timeRemaining: () => 5, didTimeout: false });
        });

        this._framesDetector = new FramesDetector(new ElementsMutationObserverFactory(), this.domUtilsStub);
    });

    afterEach(function () {
        TestDomUtils.clearChildElements(document.body);

        this.frameRelatedFeatures = null;
        this.iframe1 = null;
        this.iframe2 = null;
        this._framesCache = null;
        this._framesDetector.stop();
        this._framesDetector = null;
        this.sandbox.restore();
    });

    describe('startFeature/\s tests:', function () {
        it('startFeature should register new iframes', async function () {
            const frameHandler = new FramesHandler(this._framesCache, this._framesDetector, this.domUtilsStub, CDUtils, this.useLegacyZeroTimeout);
            const asyncCallSpy = sinon.spy(frameHandler, 'callMethod');

            frameHandler.startFeatures(this.frameRelatedFeatures);

            await TestUtils.waitForNoAssertion(() => {
                assert.isTrue(this._framesCache.exists(this.iframe1));
                assert.isTrue(this._framesCache.exists(this.iframe2));
                assert.isTrue(asyncCallSpy.called, "CDUtils.asyncCall called upon startFeature call");
            }).finally(() => {
                asyncCallSpy.resetHistory();
                asyncCallSpy.restore();
                frameHandler.stopFeatures(this.frameRelatedFeatures);
            });
        });

        it('should call startFeature for each feature with the reference to all frames in the page', async function () {
            const featList = this.sandbox.stub(MockObjects.featureList);
            featList.list.TestFeat1.instance = this.sandbox.createStubInstance(DataCollector);
            featList.list.TestFeat4.instance = this.sandbox.createStubInstance(DataCollector);
            const features = [featList.list.TestFeat1, featList.list.TestFeat4];
            const frameHandler = new FramesHandler(this._framesCache, this._framesDetector, this.domUtilsStub, CDUtils, this.useLegacyZeroTimeout);
            frameHandler.startFeatures(features);

            await TestUtils.waitForNoAssertion(() => {
                assert.isTrue(features[0].instance.startFeature.calledTwice, `feat1 not called twice. It was called ${features[0].instance.startFeature.callCount}`);
                assert.isTrue(features[1].instance.startFeature.calledTwice, `feat2 not called twice. It was called ${features[1].instance.startFeature.callCount}`);
                assert.isTrue(features[0].instance.startFeature.calledWith(this.sandbox.match.has('Context', sinon.match.has('testSign', 'iframe1'))));
                assert.isTrue(features[0].instance.startFeature.calledWith(this.sandbox.match.has('Context', sinon.match.has('testSign', 'iframe2'))));
                assert.isTrue(features[1].instance.startFeature.calledWith(this.sandbox.match.has('Context', sinon.match.has('testSign', 'iframe1'))));
                assert.isTrue(features[1].instance.startFeature.calledWith(this.sandbox.match.has('Context', sinon.match.has('testSign', 'iframe2'))));
                assert.isTrue(features[0].isRunning);
                assert.isTrue(features[1].isRunning);
            }).finally(() => {
                frameHandler.stopFeatures(features);
            });
        });

        it('Frames should not register multiple times in frames cache if they are already registered', async function () {
            const frameHandler = new FramesHandler(this._framesCache, this._framesDetector, this.domUtilsStub, CDUtils, this.useLegacyZeroTimeout);

            frameHandler.startFeatures(this.frameRelatedFeatures);
            await TestUtils.waitForNoAssertion(() => {
                const keysArray = Array.from(this._framesCache.contexts);
                assert.equal(2, keysArray.length);
            });

            frameHandler.startFeatures(this.frameRelatedFeatures);
            await TestUtils.waitForNoAssertion(() => {
                const keysArray = Array.from(this._framesCache.contexts);
                assert.equal(2, keysArray.length);
            }).finally(() => {
                frameHandler.stopFeatures(this.frameRelatedFeatures);
            });
        });

        it('Frames cache should keep previous features when adding new on frames', async function () {
            const newList = this.sandbox.stub(MockObjects.featureList);
            newList.list.TestFeat2.instance = this.sandbox.createStubInstance(DataCollector);
            const newFeatures = [newList.list.TestFeat2];

            const frameHandler = new FramesHandler(this._framesCache, this._framesDetector, this.domUtilsStub, CDUtils, this.useLegacyZeroTimeout);

            frameHandler.startFeatures(this.frameRelatedFeatures);

            await TestUtils.waitForNoAssertion(() => {
                const keysArray = Array.from(this._framesCache.contexts);
                assert.equal(2, keysArray.length);
            });

            frameHandler.startFeatures(newFeatures);
            const frm1 = document.getElementById('iframe1');
            await TestUtils.waitForNoAssertion(() => {
                assert.equal(3, this._framesCache.get(frm1).features.size);
            });

            frameHandler.stopFeatures(this.frameRelatedFeatures);
            await TestUtils.waitForNoAssertion(() => {
                assert.equal(1, this._framesCache.get(frm1).features.size);
            });

            frameHandler.stopFeatures(newFeatures);
            await TestUtils.waitForNoAssertion(() => {
                const keysArray = Array.from(this._framesCache.contexts);
                assert.equal(0, keysArray.length);
            });
        });

        it('features should be registered on all frames', async function () {
            const frameHandler = new FramesHandler(this._framesCache, this._framesDetector, this.domUtilsStub, CDUtils, this.useLegacyZeroTimeout);

            frameHandler.startFeatures(this.frameRelatedFeatures);

            await TestUtils.waitForNoAssertion(() => {
                assert.isTrue(this._framesCache.hasFeature(this.iframe1, this.frameRelatedFeatures[0]));
                assert.isTrue(this._framesCache.hasFeature(this.iframe1, this.frameRelatedFeatures[1]));
                assert.isTrue(this._framesCache.hasFeature(this.iframe2, this.frameRelatedFeatures[0]));
                assert.isTrue(this._framesCache.hasFeature(this.iframe2, this.frameRelatedFeatures[1]));
            }).finally(() => {
                frameHandler.stopFeatures(this.frameRelatedFeatures);
            });
        });

        it('startFeatures should register feature on all frames in the page', async function () {
            const frameHandler = new FramesHandler(this._framesCache, this._framesDetector, this.domUtilsStub, CDUtils, this.useLegacyZeroTimeout);

            frameHandler.startFeatures(this.frameRelatedFeatures);

            await TestUtils.waitForNoAssertion(() => {
                assert.isTrue(this._framesCache.hasFeature(this.iframe1, this.frameRelatedFeatures[0]));
                assert.isTrue(this._framesCache.hasFeature(this.iframe2, this.frameRelatedFeatures[0]));
                assert.isTrue(this._framesCache.hasFeature(this.iframe1, this.frameRelatedFeatures[1]));
                assert.isTrue(this._framesCache.hasFeature(this.iframe2, this.frameRelatedFeatures[1]));
            }).finally(() => {
                frameHandler.stopFeatures(this.frameRelatedFeatures);
            });
        });

        it('startFeature should register feature on all frames in the page', async function () {
            const frameHandler = new FramesHandler(this._framesCache, this._framesDetector, this.domUtilsStub, CDUtils, this.useLegacyZeroTimeout);

            await TestUtils.waitForNoAssertion(() => {
                frameHandler.startFeature(this.frameRelatedFeatures[0]);
                assert.isTrue(this._framesCache.hasFeature(this.iframe1, this.frameRelatedFeatures[0]));
                assert.isTrue(this._framesCache.hasFeature(this.iframe2, this.frameRelatedFeatures[0]));
                frameHandler.stopFeatures(this.frameRelatedFeatures);
            });
        });

        it('startFeature should start one feature on all frames in the page', async function () {
            this.retries(3);

            const frameHandler = new FramesHandler(this._framesCache, this._framesDetector, this.domUtilsStub, CDUtils, this.useLegacyZeroTimeout);
            frameHandler.startFeatures(this.frameRelatedFeatures);

            await TestUtils.waitForNoAssertion(() => {
                assert.isTrue(this.frameRelatedFeatures[0].instance.startFeature.calledTwice);
                assert.isTrue(this.frameRelatedFeatures[0].instance.startFeature.calledWith(this.sandbox.match.has('Context', sinon.match.has('testSign', 'iframe1'))));
                assert.isTrue(this.frameRelatedFeatures[0].instance.startFeature.calledWith(this.sandbox.match.has('Context', sinon.match.has('testSign', 'iframe2'))));
                assert.isTrue(this.frameRelatedFeatures[1].instance.startFeature.calledTwice);
                assert.isTrue(this.frameRelatedFeatures[1].instance.startFeature.calledWith(this.sandbox.match.has('Context', sinon.match.has('testSign', 'iframe1'))));
                assert.isTrue(this.frameRelatedFeatures[1].instance.startFeature.calledWith(this.sandbox.match.has('Context', sinon.match.has('testSign', 'iframe2'))));
            }).finally(() => {
                frameHandler.stopFeatures(this.frameRelatedFeatures);
            });
        });

        it('startFeatures wont start features on an inaccessible frame', async function () {
            this.domUtilsStub.canAccessIFrame.returns(false);

            const frameHandler = new FramesHandler(this._framesCache, this._framesDetector, this.domUtilsStub, CDUtils, this.useLegacyZeroTimeout);

            const runFeatureOnFrame = this.sandbox.spy(frameHandler, '_runFeatureOnFrame');

            frameHandler.startFeatures(this.frameRelatedFeatures);

            await TestUtils.waitForNoAssertion(() => {
                assert.isFalse(runFeatureOnFrame.calledWith(this.iframe1, this.frameRelatedFeatures[0]), 'feature 1 should not start on frame 1');
                assert.isFalse(runFeatureOnFrame.calledWith(this.iframe2, this.frameRelatedFeatures[0]), 'feature 1 should not start on frame 2');
                assert.isFalse(runFeatureOnFrame.calledWith(this.iframe1, this.frameRelatedFeatures[1]), 'feature 2 should not start on frame 1');
                assert.isFalse(runFeatureOnFrame.calledWith(this.iframe2, this.frameRelatedFeatures[1]), 'feature 2 should not start on frame 2');
            }).finally(() => {
                frameHandler.stopFeatures(this.frameRelatedFeatures);
            });
        });

        it('_runFeatureOnFrame wont start feature on an inaccessible frame', async function () {
            const frameHandler = new FramesHandler(this._framesCache, this._framesDetector, this.domUtilsStub, CDUtils, this.useLegacyZeroTimeout);
            this.frameRelatedFeatures[0].instance.startFeature.resetHistory();
            this.domUtilsStub.canAccessIFrame.returns(false);
            frameHandler._runFeatureOnFrame(this.iframe1, this.frameRelatedFeatures[0]);
            this.domUtilsStub.canAccessIFrame.returns(true);
            frameHandler._runFeatureOnFrame(this.iframe2, this.frameRelatedFeatures[0]);

            await TestUtils.waitForNoAssertion(() => {
                // eslint-disable-next-line max-len
                assert.isFalse(this.frameRelatedFeatures[0].instance.startFeature.calledWith(this.sandbox.match.has('Context', sinon.match.has('testSign', 'iframe1'))), 'start feature called with invalid arguments');
                // eslint-disable-next-line max-len
                assert.isTrue(this.frameRelatedFeatures[0].instance.startFeature.calledWith(this.sandbox.match.has('Context', sinon.match.has('testSign', 'iframe2'))), 'start feature called with invalid arguments');
            });
        });
    });

    describe('stopFeature/\s tests:', function () {
        it('stopFeatures should stop the features in each frame', async function () {
            const featList = this.sandbox.stub(MockObjects.featureList);
            featList.list.TestFeat1.instance = this.sandbox.createStubInstance(DataCollector);
            featList.list.TestFeat4.instance = this.sandbox.createStubInstance(DataCollector);
            const features = [featList.list.TestFeat1, featList.list.TestFeat4];
            const frameHandler = new FramesHandler(this._framesCache, this._framesDetector, this.domUtilsStub, CDUtils, this.useLegacyZeroTimeout);
            const asyncCallSpy = sinon.spy(frameHandler, 'callMethod');

            frameHandler.startFeatures(features);

            await TestUtils.waitForNoAssertion(() => {
                assert.isTrue(this._framesCache.exists(this.iframe1));
                assert.isTrue(this._framesCache.exists(this.iframe2));
                assert.isTrue(asyncCallSpy.called, "CDUtils.asyncCall called upon stopFeature call");
                asyncCallSpy.resetHistory();
                asyncCallSpy.restore();
            });

            frameHandler.stopFeatures(features);

            await TestUtils.waitForNoAssertion(() => {
                assert.isTrue(features[0].instance.stopFeature.calledTwice, 'not called twice');
                assert.isFalse(features[0].isRunning, 'feature is running');
                assert.isTrue(features[1].instance.stopFeature.calledTwice, 'not called twice');
                assert.isFalse(features[1].isRunning, 'second feature is running');
                assert.isTrue(features[0].instance.stopFeature.calledWith(this.sandbox.match.has('Context', sinon.match.has('testSign', 'iframe1'))));
                assert.isTrue(features[0].instance.stopFeature.calledWith(this.sandbox.match.has('Context', sinon.match.has('testSign', 'iframe2'))));
                assert.isTrue(features[1].instance.stopFeature.calledWith(this.sandbox.match.has('Context', sinon.match.has('testSign', 'iframe1'))));
                assert.isTrue(features[1].instance.stopFeature.calledWith(this.sandbox.match.has('Context', sinon.match.has('testSign', 'iframe2'))));
            });
        });

        it('stopFeature should call stopFeature on each frame', async function () {
            const frameHandler = new FramesHandler(this._framesCache, this._framesDetector, this.domUtilsStub, CDUtils, this.useLegacyZeroTimeout);

            frameHandler.startFeature(this.frameRelatedFeatures[0]);

            await TestUtils.waitForNoAssertion(() => {
                assert.isTrue(this._framesCache.exists(this.iframe1));
                assert.isTrue(this._framesCache.exists(this.iframe2));
            });

            frameHandler.stopFeature(this.frameRelatedFeatures[0]);

            await TestUtils.waitForNoAssertion(() => {
                assert.isTrue(this.frameRelatedFeatures[0].instance.stopFeature.calledTwice);
                assert.isTrue(this.frameRelatedFeatures[0].instance.stopFeature.calledWith(this.sandbox.match.has('Context', sinon.match.has('testSign', 'iframe1'))));
                assert.isTrue(this.frameRelatedFeatures[0].instance.stopFeature.calledWith(this.sandbox.match.has('Context', sinon.match.has('testSign', 'iframe2'))));
            });
        });

        it('stopFeatures wont start features on an inaccessible frame', async function () {
            this.domUtilsStub.canAccessIFrame.returns(false);

            const frameHandler = new FramesHandler(this._framesCache, this._framesDetector, this.domUtilsStub, CDUtils, this.useLegacyZeroTimeout);

            const stopFeatureOnFrame = this.sandbox.spy(frameHandler, '_stopFeatureOnFrame');

            frameHandler.stopFeatures(this.frameRelatedFeatures);

            await TestUtils.waitForNoAssertion(() => {
                assert.isFalse(stopFeatureOnFrame.calledWith(this.iframe1, this.frameRelatedFeatures[0]), 'feature 1 should not start on frame 1');
                assert.isFalse(stopFeatureOnFrame.calledWith(this.iframe2, this.frameRelatedFeatures[0]), 'feature 1 should not start on frame 2');
                assert.isFalse(stopFeatureOnFrame.calledWith(this.iframe1, this.frameRelatedFeatures[1]), 'feature 2 should not start on frame 1');
                assert.isFalse(stopFeatureOnFrame.calledWith(this.iframe2, this.frameRelatedFeatures[1]), 'feature 2 should not start on frame 2');
            }).finally(() => {
                frameHandler.stopFeatures(this.frameRelatedFeatures);
            });
        });

        it('_stopFeatureOnFrame wont start feature on an inaccessible frame', async function () {
            const frameHandler = new FramesHandler(this._framesCache, this._framesDetector, this.domUtilsStub, CDUtils, this.useLegacyZeroTimeout);
            this.frameRelatedFeatures[0].instance.stopFeature.resetHistory();
            this.domUtilsStub.canAccessIFrame.returns(false);
            frameHandler._stopFeatureOnFrame(this.iframe1, this.frameRelatedFeatures[0]);
            this.domUtilsStub.canAccessIFrame.returns(true);
            frameHandler._stopFeatureOnFrame(this.iframe2, this.frameRelatedFeatures[0]);

            await TestUtils.waitForNoAssertion(() => {
                // eslint-disable-next-line max-len
                assert.isFalse(this.frameRelatedFeatures[0].instance.stopFeature.calledWith(this.sandbox.match.has('Context', sinon.match.has('testSign', 'iframe1'))), 'stop feature called with invalid arguments');
                // eslint-disable-next-line max-len
                assert.isTrue(this.frameRelatedFeatures[0].instance.stopFeature.calledWith(this.sandbox.match.has('Context', sinon.match.has('testSign', 'iframe2'))), 'stop feature called with invalid arguments');
            });
        });
    });

    describe('updateFeatureConfig tests:', function () {
        it('updateFeatureConfig wont start features on an inaccessible frame', async function () {
            this.domUtilsStub.canAccessIFrame.returns(false);

            const frameHandler = new FramesHandler(this._framesCache, this._framesDetector, this.domUtilsStub, CDUtils, this.useLegacyZeroTimeout);

            const _updateFeatureConfigOnFrameSpy = this.sandbox.spy(frameHandler, '_updateFeatureConfigOnFrame');

            frameHandler.startFeature(this.frameRelatedFeatures);
            frameHandler.updateFeatureConfig(this.frameRelatedFeatures[0]);

            await TestUtils.waitForNoAssertion(() => {
                assert.isFalse(_updateFeatureConfigOnFrameSpy.calledWith(this.iframe1, this.frameRelatedFeatures[0]), 'feature 1 should not start on frame 1');
                assert.isFalse(_updateFeatureConfigOnFrameSpy.calledWith(this.iframe2, this.frameRelatedFeatures[0]), 'feature 1 should not start on frame 2');
            }).finally(() => {
                frameHandler.stopFeatures(this.frameRelatedFeatures);
            });
        });

        it('_updateFeatureConfigOnFrame wont start feature on an inaccessible frame', async function () {
            const frameHandler = new FramesHandler(this._framesCache, this._framesDetector, this.domUtilsStub, CDUtils, this.useLegacyZeroTimeout);
            this.frameRelatedFeatures[0].instance.startFeature.resetHistory();
            this.domUtilsStub.canAccessIFrame.returns(false);
            frameHandler._updateFeatureConfigOnFrame(this.iframe1, this.frameRelatedFeatures[0]);
            this.domUtilsStub.canAccessIFrame.returns(true);
            frameHandler._updateFeatureConfigOnFrame(this.iframe2, this.frameRelatedFeatures[0]);

            await TestUtils.waitForNoAssertion(() => {
                // eslint-disable-next-line max-len
                assert.isFalse(this.frameRelatedFeatures[0].instance.updateFeatureConfig.calledWith(this.sandbox.match.has('Context', sinon.match.has('testSign', 'iframe1'))), 'start feature called with invalid arguments');
                // eslint-disable-next-line max-len
                assert.isTrue(this.frameRelatedFeatures[0].instance.updateFeatureConfig.calledWith(this.sandbox.match.has('Context', sinon.match.has('testSign', 'iframe2'))), 'start feature called with invalid arguments');
            });
        });

        it('_updateFeaturesConfigOnFrames successfully calls CDUtils.asyncCall', async function() {
            const frameHandler = new FramesHandler(this._framesCache, this._framesDetector, this.domUtilsStub, CDUtils, this.useLegacyZeroTimeout);
            this.domUtilsStub.canAccessIFrame.returns(true);

            const asyncCallSpy = sinon.spy(frameHandler, 'callMethod');

            frameHandler.startFeature(this.frameRelatedFeatures[0]);
            frameHandler.updateFeatureConfig(this.frameRelatedFeatures[0]);

            await TestUtils.waitForNoAssertion(() => {
                assert.isTrue(asyncCallSpy.called, "CDUtils.asyncCall called upon updateFeatureConfig call");
            }).finally(() => {
                asyncCallSpy.resetHistory();
                asyncCallSpy.restore();
                frameHandler.stopFeatures(this.frameRelatedFeatures);
            });
        });
    });

    describe('frame changes detection', function () {
        it('dynamically added frame is handled correctly', async function () {
            const frameHandler = new FramesHandler(this._framesCache, this._framesDetector, this.domUtilsStub, CDUtils, this.useLegacyZeroTimeout);
            frameHandler.startFeatures(this.frameRelatedFeatures);

            const dynamicFrame = document.createElement('iframe');
            dynamicFrame.setAttribute('id', 'dynamicFrame');
            document.body.appendChild(dynamicFrame);
            dynamicFrame.contentWindow.testSign = 'dynamicFrame';

            await TestUtils.wait(100);

            assert.isTrue(this.frameRelatedFeatures[0].instance.startFeature.calledThrice);
            assert.isTrue(this.frameRelatedFeatures[0].instance.startFeature.calledWith(this.sandbox.match.has('Context', sinon.match.has('testSign', 'iframe1'))));
            assert.isTrue(this.frameRelatedFeatures[0].instance.startFeature.calledWith(this.sandbox.match.has('Context', sinon.match.has('testSign', 'iframe2'))));
            assert.isTrue(this.frameRelatedFeatures[0].instance.startFeature.calledWith(this.sandbox.match.has('Context', sinon.match.has('testSign', 'dynamicFrame'))));
            assert.isTrue(this.frameRelatedFeatures[1].instance.startFeature.calledThrice);
            assert.isTrue(this.frameRelatedFeatures[1].instance.startFeature.calledWith(this.sandbox.match.has('Context', sinon.match.has('testSign', 'iframe1'))));
            assert.isTrue(this.frameRelatedFeatures[1].instance.startFeature.calledWith(this.sandbox.match.has('Context', sinon.match.has('testSign', 'iframe2'))));
            assert.isTrue(this.frameRelatedFeatures[0].instance.startFeature.calledWith(this.sandbox.match.has('Context', sinon.match.has('testSign', 'dynamicFrame'))));
            frameHandler.stopFeatures(this.frameRelatedFeatures);
        });

        it('Reloaded frame is handled correctly', async function () {
            const frameHandler = new FramesHandler(this._framesCache, this._framesDetector, this.domUtilsStub, CDUtils, this.useLegacyZeroTimeout);
            const firstIFrameLoadEventHandler = this.domUtilsStub.addEventListener.firstCall.args[2];

            frameHandler.startFeatures(this.frameRelatedFeatures);

            await TestUtils.waitForNoAssertion(() => {
                assert.isTrue(this.frameRelatedFeatures[0].instance.startFeature.calledTwice);
                assert.isTrue(this.frameRelatedFeatures[0].instance.startFeature.calledWith(this.sandbox.match.has('Context', sinon.match.has('testSign', 'iframe1'))));
                assert.isTrue(this.frameRelatedFeatures[0].instance.startFeature.calledWith(this.sandbox.match.has('Context', sinon.match.has('testSign', 'iframe2'))));
                assert.isTrue(this.frameRelatedFeatures[1].instance.startFeature.calledTwice);
                assert.isTrue(this.frameRelatedFeatures[1].instance.startFeature.calledWith(this.sandbox.match.has('Context', sinon.match.has('testSign', 'iframe1'))));
                assert.isTrue(this.frameRelatedFeatures[1].instance.startFeature.calledWith(this.sandbox.match.has('Context', sinon.match.has('testSign', 'iframe2'))));
            });

            this.frameRelatedFeatures[0].instance.startFeature.resetHistory();
            this.frameRelatedFeatures[1].instance.startFeature.resetHistory();

            firstIFrameLoadEventHandler({ target: this.iframe1 });

            await TestUtils.waitForNoAssertion(() => {
                assert.isTrue(this.frameRelatedFeatures[0].instance.startFeature.calledOnce);
                assert.isTrue(this.frameRelatedFeatures[1].instance.startFeature.calledOnce);
            }).finally(() => {
                frameHandler.stopFeatures(this.frameRelatedFeatures);
            });
        });
    });
});
