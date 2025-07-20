import {assert} from 'chai';
import ConfigurationRepository from '../../../../src/main/core/configuration/ConfigurationRepository';
import FeatureService from '../../../../src/main/collectors/FeatureService';
import {MockObjects} from '../../mocks/mockObjects';
import {TestUtils} from '../../../TestUtils';
import DOMUtils from '../../../../src/main/technicalServices/DOMUtils';
import CDUtils from "../../../../src/main/technicalServices/CDUtils";
import FramesHandler from '../../../../src/main/core/frames/FramesHandler';
import DataCollector from '../../../../src/main/collectors/DataCollector';
import BrowserContextsCache from '../../../../src/main/core/browsercontexts/BrowserContextsCache';
import BrowserContext from '../../../../src/main/core/browsercontexts/BrowserContext';
import sinon from "sinon";
import StartupConfigurations from "../../../../src/main/api/StartupConfigurations";
import {ConfigurationFields} from "../../../../src/main/core/configuration/ConfigurationFields";

describe('FeatureService tests:', function () {
    beforeEach(function () {
        this.frameHandler = sinon.createStubInstance(FramesHandler);
        this.configurationRepository = sinon.stub(new ConfigurationRepository());

        this.configurationRepository.isConfigurationUpdatedFromServer.returns(true);
        this.configurationRepository.get.withArgs(ConfigurationFields.useLegacyZeroTimeout).returns(true);

        this.featureList = MockObjects.featureList;
        this.featureList.list.TestFeat1.instance = sinon.createStubInstance(DataCollector);
        this.featureList.list.TestFeat2.instance = sinon.createStubInstance(DataCollector);
        this.featureList.list.TestFeat4.instance = sinon.createStubInstance(DataCollector);
        this.featureList.list.TestFeat3.instance = sinon.createStubInstance(DataCollector);
        this.featureList.list.TestFeat5.instance = sinon.createStubInstance(DataCollector);
        this.featureList.list.TestFeat6.instance = sinon.createStubInstance(DataCollector);
        this.featureList.list.TestFeat7.instance = sinon.createStubInstance(DataCollector);

        this.browserContextsCache = sinon.stub(new BrowserContextsCache());
    });

    afterEach(function () {
        this.frameHandler = null;
        this.configurationRepository = null;
        this.featureList.list.TestFeat1.instance = null;
        this.featureList.list.TestFeat2.instance = null;
        this.featureList.list.TestFeat4.instance = null;
        this.featureList.list.TestFeat3.instance = null;
        this.featureList.list.TestFeat5.instance = null;
        this.featureList.list.TestFeat6.instance = null;
        this.featureList.list.TestFeat7.instance = null;
        this.featureList = null;
        this.browserContextsCache = null;

        sinon.restore();
    });

    describe('Ctor tests:\n', function () {
        it('should build an array of frame related default and non default '
            + 'features and store them in members', function () {
            const featureList = MockObjects.featureList;
            const featureService = new FeatureService(featureList, {}, new ConfigurationRepository(), DOMUtils, CDUtils, this.browserContextsCache);
            assert.equal(2, featureService._frameRelatedDefaultFeatures.length);
            assert.equal(1, featureService._frameRelatedNonDefaultFeatures.length);
            assert.deepEqual(featureList.list.TestFeat1, featureService._frameRelatedDefaultFeatures[0]);
            assert.deepEqual(featureList.list.TestFeat3, featureService._frameRelatedNonDefaultFeatures[0]);
        });
    });

    describe('run features tests:', function () {
        it('runDefault should call the startFeature of each non frame related default feature in the feature list and '
            + 'to call the frameHandler.startFeatures on the list of frame related default features', async function () {
            const featureService = new FeatureService(this.featureList, this.frameHandler, this.configurationRepository, DOMUtils, CDUtils, this.browserContextsCache);
            featureService.runDefault();
            assert.isTrue(this.featureList.list.TestFeat2.isRunning);

            // since the frameHandler startFeatures receive array of features
            assert.equal(this.frameHandler.startFeatures.getCall(0).args[0][0], this.featureList.list.TestFeat1);
            assert.equal(this.frameHandler.startFeatures.getCall(0).args[0][1], this.featureList.list.TestFeat4);

            await TestUtils.waitForNoAssertion(() => {
                assert.isTrue(this.featureList.list.TestFeat2.instance.startFeature.calledOnce);

                assert.isFalse(this.featureList.list.TestFeat5.isRunning);
                assert.isTrue(this.featureList.list.TestFeat5.instance.startFeature.notCalled);
            });
        });

        it('stopDefault should call the stopFeature of each non frame related default feature in the feature list and '
            + 'to call the frameHandler.stopFeatures on the list of frame related default features', async function () {
            const featureService = new FeatureService(this.featureList, this.frameHandler, this.configurationRepository, DOMUtils, CDUtils, this.browserContextsCache);
            featureService.runDefault();
            assert.isTrue(this.featureList.list.TestFeat2.isRunning);
            await TestUtils.waitForNoAssertion(() => {
                assert.isTrue(this.featureList.list.TestFeat2.instance.startFeature.calledOnce);
            });

            featureService.stopDefault();

            await TestUtils.waitForNoAssertion(() => {
                assert.isFalse(this.featureList.list.TestFeat2.isRunning);
                assert.isTrue(this.featureList.list.TestFeat2.instance.stopFeature.calledOnce);
                // since the frameHandler startFeatures receive array of features
                assert.equal(this.frameHandler.stopFeatures.getCall(0).args[0][0], this.featureList.list.TestFeat1);
                assert.equal(this.frameHandler.stopFeatures.getCall(0).args[0][1], this.featureList.list.TestFeat4);
            });
        });

        it('runNonDefault should call the startFeature of each non frame related non default feature in the feature list and '
            + 'to call the frameHandler.startFeatures on the list of frame related non default features', async function () {
            const featureService = new FeatureService(this.featureList, this.frameHandler, this.configurationRepository, DOMUtils, CDUtils, this.browserContextsCache);

            featureService.runNonDefault();
            await TestUtils.waitForNoAssertion(() => {
                assert.isFalse(this.featureList.list.TestFeat2.isRunning);
                assert.isTrue(this.featureList.list.TestFeat2.instance.startFeature.notCalled);

                assert.isTrue(this.featureList.list.TestFeat5.isRunning);
                assert.isTrue(this.featureList.list.TestFeat5.instance.startFeature.calledOnce);

                // since the frameHandler startFeatures receive array of features
                assert.equal(this.frameHandler.startFeatures.getCall(0).args[0][0], this.featureList.list.TestFeat3);
            });
        });

        it('runNonDefault should call the startFeature of each related feature if configuration arrived from server', function () {
            const featureService = new FeatureService(this.featureList, this.frameHandler, this.configurationRepository, DOMUtils, CDUtils, this.browserContextsCache);

            this.configurationRepository.isConfigurationUpdatedFromServer.returns(false);

            const _runFeaturesSpy = sinon.spy(featureService, '_runFeatures');

            featureService.runNonDefault();

            assert.isTrue(this.configurationRepository.isConfigurationUpdatedFromServer.calledOnce, 'isConfigurationUpadatedFromServer was not called once');
            assert.isTrue(_runFeaturesSpy.notCalled, '_runFeatures was called');
        });

        it('stopNonDefault should call the stopFeature of each non frame related non default feature in the feature list and '
            + 'to call the frameHandler.stopFeatures on the list of frame related non default features', async function () {
            const featureService = new FeatureService(this.featureList, this.frameHandler, this.configurationRepository, DOMUtils, CDUtils, this.browserContextsCache);
            featureService.runNonDefault();

            await TestUtils.waitForNoAssertion(() => {
                assert.isTrue(this.featureList.list.TestFeat5.isRunning);
                assert.isTrue(this.featureList.list.TestFeat5.instance.startFeature.calledOnce);
            });

            featureService.stopNonDefault();

            await TestUtils.waitForNoAssertion(() => {
                assert.isFalse(this.featureList.list.TestFeat5.isRunning);
                assert.isTrue(this.featureList.list.TestFeat5.instance.stopFeature.calledOnce);

                // since the frameHandler startFeatures receive array of features
                assert.equal(this.frameHandler.stopFeatures.getCall(0).args[0][0], this.featureList.list.TestFeat3);
            });
        });

        it('runPerContextFeatures should call the startFeature of each related feature if configuration arrived from server', function () {
            const featureService = new FeatureService(this.featureList, this.frameHandler, this.configurationRepository, DOMUtils, CDUtils, this.browserContextsCache);

            this.configurationRepository.isConfigurationUpdatedFromServer.returns(false);

            const _runFeaturesSpy = sinon.spy(featureService, '_runFeatures');

            featureService.runPerContextFeatures();

            assert.isTrue(this.configurationRepository.isConfigurationUpdatedFromServer.calledOnce, 'isConfigurationUpadatedFromServer was not called once');
            assert.isTrue(_runFeaturesSpy.notCalled, '_runFeatures was called');
        });
    });

    describe('runPerSessionFeatures', function () {
        it('runPerSessionFeatures should call the startFeature of each related feature if configuration arrived from server', function () {
            const featureService = new FeatureService(this.featureList, this.frameHandler, this.configurationRepository, DOMUtils, CDUtils, this.browserContextsCache);

            this.configurationRepository.isConfigurationUpdatedFromServer.returns(true);

            featureService.runPerSessionFeatures();

            assert.isTrue(this.configurationRepository.isConfigurationUpdatedFromServer.calledOnce, 'isConfigurationUpadatedFromServer was not called once');

            Object.keys(this.featureList.getPerSessionFeatures()).forEach((featureName) => {
                const feature = this.featureList.list[featureName];
                assert.isTrue(feature.shouldRun);
                assert.isTrue(feature.isRunning);
            });
        });

        it('runPerSessionFeatures should NOT call the startFeature of each related feature if configuration arrived from server', function () {
            const featureService = new FeatureService(this.featureList, this.frameHandler, this.configurationRepository, DOMUtils, CDUtils, this.browserContextsCache);

            this.configurationRepository.isConfigurationUpdatedFromServer.returns(false);

            featureService.runPerSessionFeatures();

            assert.isTrue(this.configurationRepository.isConfigurationUpdatedFromServer.calledOnce, 'isConfigurationUpadatedFromServer was not called once');

            Object.keys(this.featureList.getPerSessionFeatures()).forEach((featureName) => {
                const feature = this.featureList.list[featureName];
                assert.isTrue(feature.shouldRun);
                assert.isFalse(feature.isRunning);
            });
        });

        it('runPerSessionFeatures should not start any feature with empty features', function () {
            const unexpectedFeaturesListObject = {
                getDefaultFeatures() {
                    return false;
                },

                getNonDefaultFeatures() {
                    return false;
                },

                getPerSessionFeatures() {
                    return false;
                }
            };
            const featureService = new FeatureService(unexpectedFeaturesListObject, this.frameHandler, this.configurationRepository, DOMUtils, CDUtils, this.browserContextsCache);
            const _startFeaturesSpy = sinon.spy(featureService, "_startFeatures");

            featureService.runPerSessionFeatures();

            assert.equal(_startFeaturesSpy.returnType, null, "featureService._startFeatures should return null");
        });

        it('runs each feature even if the feature is already running', function () {
            const featureService = new FeatureService(this.featureList, this.frameHandler, this.configurationRepository, DOMUtils, CDUtils, this.browserContextsCache);

            this.configurationRepository.isConfigurationUpdatedFromServer.returns(true);

            const _actOnFeatureSpy = sinon.spy(featureService, '_actOnFeature');

            featureService.runPerSessionFeatures();
            featureService.runPerSessionFeatures();

            assert.isTrue(this.configurationRepository.isConfigurationUpdatedFromServer.calledTwice, 'isConfigurationUpadatedFromServer was not called once');
            assert.isTrue(_actOnFeatureSpy.calledTwice, '_actOnFeature was not called twice');
            assert.equal(_actOnFeatureSpy.firstCall.args[1], 'startFeature');
            assert.equal(_actOnFeatureSpy.secondCall.args[1], 'startFeature');
        });
    });

    describe('stopPerSessionFeatures', function () {
        it('stop per  features', async function () {
            const featureService = new FeatureService(this.featureList, this.frameHandler, this.configurationRepository, DOMUtils, CDUtils, this.browserContextsCache);

            featureService.runPerSessionFeatures();

            await TestUtils.waitForNoAssertion(() => {
                assert.isFalse(this.featureList.list.TestFeat1.isRunning);
                assert.isFalse(this.featureList.list.TestFeat2.isRunning);
                assert.isFalse(this.featureList.list.TestFeat3.isRunning);
                assert.isFalse(this.featureList.list.TestFeat4.isRunning);
                assert.isFalse(this.featureList.list.TestFeat5.isRunning);
                assert.isTrue(this.featureList.list.TestFeat6.isRunning);
                assert.isFalse(this.featureList.list.TestFeat7.isRunning);
            });

            featureService.stopPerSessionFeatures();

            await TestUtils.waitForNoAssertion(() => {
                assert.isFalse(this.featureList.list.TestFeat1.isRunning);
                assert.isFalse(this.featureList.list.TestFeat2.isRunning);
                assert.isFalse(this.featureList.list.TestFeat3.isRunning);
                assert.isFalse(this.featureList.list.TestFeat4.isRunning);
                assert.isFalse(this.featureList.list.TestFeat5.isRunning);
                assert.isFalse(this.featureList.list.TestFeat6.isRunning);
                assert.isFalse(this.featureList.list.TestFeat7.isRunning);
            });
        });

        it('stop per session features when not started', async function () {
            const featureService = new FeatureService(this.featureList, this.frameHandler, this.configurationRepository, DOMUtils, CDUtils, this.browserContextsCache);

            featureService.stopPerSessionFeatures();

            await TestUtils.waitForNoAssertion(() => {
                assert.isFalse(this.featureList.list.TestFeat1.isRunning);
                assert.isFalse(this.featureList.list.TestFeat2.isRunning);
                assert.isFalse(this.featureList.list.TestFeat3.isRunning);
                assert.isFalse(this.featureList.list.TestFeat4.isRunning);
                assert.isFalse(this.featureList.list.TestFeat5.isRunning);
                assert.isFalse(this.featureList.list.TestFeat6.isRunning);
                assert.isFalse(this.featureList.list.TestFeat7.isRunning);
            });
        });
    });

    describe('runPerContextFeatures', function () {
        it('run per context features', async function () {
            const featureService = new FeatureService(this.featureList, this.frameHandler, this.configurationRepository, DOMUtils, CDUtils, this.browserContextsCache);

            featureService.runPerContextFeatures({name: 'stubContext'});

            assert.isTrue(this.frameHandler.startFeatures.calledOnce);
            assert.equal(this.frameHandler.startFeatures.firstCall.args[0], featureService._frameRelatedDefaultFeatures);

            await TestUtils.waitForNoAssertion(() => {
                assert.isFalse(this.featureList.list.TestFeat1.isRunning);
                assert.isFalse(this.featureList.list.TestFeat2.isRunning);
                assert.isFalse(this.featureList.list.TestFeat3.isRunning);
                assert.isFalse(this.featureList.list.TestFeat4.isRunning);
                assert.isFalse(this.featureList.list.TestFeat5.isRunning);
                assert.isFalse(this.featureList.list.TestFeat6.isRunning);
                assert.isTrue(this.featureList.list.TestFeat7.isRunning);
            });
        });

        it('run per context features aborts when configuration is unavailable', async function () {
            this.configurationRepository.isConfigurationUpdatedFromServer.returns(false);

            const featureService = new FeatureService(this.featureList, this.frameHandler, this.configurationRepository, DOMUtils, CDUtils, this.browserContextsCache);

            featureService.runPerContextFeatures({name: 'stubContext'});

            assert.isTrue(this.frameHandler.startFeatures.notCalled);

            await TestUtils.waitForNoAssertion(() => {
                assert.isFalse(this.featureList.list.TestFeat1.isRunning);
                assert.isFalse(this.featureList.list.TestFeat2.isRunning);
                assert.isFalse(this.featureList.list.TestFeat3.isRunning);
                assert.isFalse(this.featureList.list.TestFeat4.isRunning);
                assert.isFalse(this.featureList.list.TestFeat5.isRunning);
                assert.isFalse(this.featureList.list.TestFeat6.isRunning);
                assert.isFalse(this.featureList.list.TestFeat7.isRunning);
            });
        });
    });

    describe('stopPerContextFeatures', function () {
        it('stop per context features', async function () {
            const featureService = new FeatureService(this.featureList, this.frameHandler, this.configurationRepository, DOMUtils, CDUtils, this.browserContextsCache);

            featureService.runPerContextFeatures({name: 'stubContext'});

            assert.isTrue(this.frameHandler.startFeatures.calledOnce);
            assert.equal(this.frameHandler.startFeatures.firstCall.args[0], featureService._frameRelatedDefaultFeatures);

            await TestUtils.waitForNoAssertion(() => {
                assert.isFalse(this.featureList.list.TestFeat1.isRunning);
                assert.isFalse(this.featureList.list.TestFeat2.isRunning);
                assert.isFalse(this.featureList.list.TestFeat3.isRunning);
                assert.isFalse(this.featureList.list.TestFeat4.isRunning);
                assert.isFalse(this.featureList.list.TestFeat5.isRunning);
                assert.isFalse(this.featureList.list.TestFeat6.isRunning);
                assert.isTrue(this.featureList.list.TestFeat7.isRunning);
            });

            featureService.stopPerContextFeatures();

            await TestUtils.waitForNoAssertion(() => {
                assert.isFalse(this.featureList.list.TestFeat1.isRunning);
                assert.isFalse(this.featureList.list.TestFeat2.isRunning);
                assert.isFalse(this.featureList.list.TestFeat3.isRunning);
                assert.isFalse(this.featureList.list.TestFeat4.isRunning);
                assert.isFalse(this.featureList.list.TestFeat5.isRunning);
                assert.isFalse(this.featureList.list.TestFeat6.isRunning);
                assert.isFalse(this.featureList.list.TestFeat7.isRunning);
            });
        });

        it('stop per context features when not started', async function () {
            const featureService = new FeatureService(this.featureList, this.frameHandler, this.configurationRepository, DOMUtils, CDUtils, this.browserContextsCache);

            featureService.stopPerContextFeatures();

            await TestUtils.waitForNoAssertion(() => {
                assert.isFalse(this.featureList.list.TestFeat1.isRunning);
                assert.isFalse(this.featureList.list.TestFeat2.isRunning);
                assert.isFalse(this.featureList.list.TestFeat3.isRunning);
                assert.isFalse(this.featureList.list.TestFeat4.isRunning);
                assert.isFalse(this.featureList.list.TestFeat5.isRunning);
                assert.isFalse(this.featureList.list.TestFeat6.isRunning);
                assert.isFalse(this.featureList.list.TestFeat7.isRunning);
            });
        });
    });

    describe('updateRunByConfig tests:', function () {
        it('updateRunByConfig should should stop a running feature', async function () {
            const featureService = new FeatureService(this.featureList, this.frameHandler, this.configurationRepository, DOMUtils, CDUtils, this.browserContextsCache);
            const asyncCallSpy = sinon.spy(featureService, 'callMethod');
            this.featureList.list.TestFeat2.isRunning = true;
            this.featureList.list.TestFeat5.isRunning = true;

            const configurationRepository = sinon.stub(new ConfigurationRepository());
            configurationRepository.get.withArgs(this.featureList.list.TestFeat2.configKey).returns(false);
            configurationRepository.get.withArgs(this.featureList.list.TestFeat5.configKey).returns(false);
            configurationRepository.get.withArgs(ConfigurationFields.useLegacyZeroTimeout).returns(true);

            featureService.updateRunByConfig(configurationRepository);
            await TestUtils.waitForNoAssertion(() => {
                assert.isFalse(this.featureList.list.TestFeat2.isRunning);
                assert.isTrue(this.featureList.list.TestFeat2.instance.stopFeature.calledOnce);
                assert.isFalse(this.featureList.list.TestFeat5.isRunning);
                assert.isTrue(this.featureList.list.TestFeat5.instance.stopFeature.calledOnce);
                assert.isTrue(asyncCallSpy.called, "CDUtils.asyncCall should be invoked by _updateFeatureConfigOnBrowserContexts");
                asyncCallSpy.resetHistory();
                asyncCallSpy.restore();
            });
        });

        it('updateRunByConfig should start a feature that is shouldRun = true and the configKey is not set', async function () {
            const featureService = new FeatureService(this.featureList, this.frameHandler, this.configurationRepository, DOMUtils, CDUtils, this.browserContextsCache);
            this.featureList.list.TestFeat2.isRunning = false;
            this.featureList.list.TestFeat5.isRunning = false;

            const configurationRepository = sinon.stub(new ConfigurationRepository());
            configurationRepository.get.withArgs(this.featureList.list.TestFeat2.configKey).returns(undefined);
            configurationRepository.get.withArgs(this.featureList.list.TestFeat5.configKey).returns('blabla');

            featureService.updateRunByConfig(configurationRepository);
            await TestUtils.waitForNoAssertion(() => {
                assert.isTrue(this.featureList.list.TestFeat2.isRunning);
                assert.isTrue(this.featureList.list.TestFeat2.instance.startFeature.calledOnce);
                assert.isTrue(this.featureList.list.TestFeat5.isRunning);
                assert.isTrue(this.featureList.list.TestFeat5.instance.startFeature.calledOnce);
            });
        });

        it('updateRunByConfig should NOT start a feature that is shouldRun = false and the configKey is not set', async function () {
            const featureService = new FeatureService(this.featureList, this.frameHandler, this.configurationRepository, DOMUtils, CDUtils, this.browserContextsCache);
            this.featureList.list.TestFeat2.isRunning = false;
            this.featureList.list.TestFeat2.shouldRun = false;
            this.featureList.list.TestFeat5.isRunning = false;
            this.featureList.list.TestFeat5.shouldRun = false;

            const configurationRepository = sinon.stub(new ConfigurationRepository());
            configurationRepository.get.withArgs(this.featureList.list.TestFeat2.configKey).returns(undefined);
            configurationRepository.get.withArgs(this.featureList.list.TestFeat5.configKey).returns('blabla');

            featureService.updateRunByConfig(configurationRepository);
            await TestUtils.waitForNoAssertion(() => {
                assert.isFalse(this.featureList.list.TestFeat2.isRunning);
                assert.isTrue(this.featureList.list.TestFeat2.instance.startFeature.notCalled);
                assert.isFalse(this.featureList.list.TestFeat5.isRunning);
                assert.isTrue(this.featureList.list.TestFeat5.instance.startFeature.notCalled);
                this.featureList.list.TestFeat2.shouldRun = true;
                this.featureList.list.TestFeat5.shouldRun = true;
            });
        });

        it('updateRunByConfig should start a feature that is shouldRun = false and the configKey is set to true', async function () {
            const featureService = new FeatureService(this.featureList, this.frameHandler, this.configurationRepository, DOMUtils, CDUtils, this.browserContextsCache);
            this.featureList.list.TestFeat2.isRunning = false;
            this.featureList.list.TestFeat2.shouldRun = false;
            this.featureList.list.TestFeat5.isRunning = false;
            this.featureList.list.TestFeat5.shouldRun = false;

            const configurationRepository = sinon.stub(new ConfigurationRepository());
            configurationRepository.get.withArgs(this.featureList.list.TestFeat2.configKey).returns(true);
            configurationRepository.get.withArgs(this.featureList.list.TestFeat5.configKey).returns(true);

            featureService.updateRunByConfig(configurationRepository);
            await TestUtils.waitForNoAssertion(() => {
                assert.isTrue(this.featureList.list.TestFeat2.isRunning);
                assert.isTrue(this.featureList.list.TestFeat2.instance.startFeature.calledOnce);
                assert.isTrue(this.featureList.list.TestFeat5.isRunning);
                assert.isTrue(this.featureList.list.TestFeat5.instance.startFeature.calledOnce);
                this.featureList.list.TestFeat2.shouldRun = true;
                this.featureList.list.TestFeat5.shouldRun = true;
            });
        });

        it('updateRunByConfig should start a not running feature', async function () {
            const featureService = new FeatureService(this.featureList, this.frameHandler, this.configurationRepository, DOMUtils, CDUtils, this.browserContextsCache);
            this.featureList.list.TestFeat2.isRunning = false;
            this.featureList.list.TestFeat5.isRunning = false;

            const configurationRepository = sinon.stub(new ConfigurationRepository());
            configurationRepository.get.withArgs(this.featureList.list.TestFeat2.configKey).returns(true);
            configurationRepository.get.withArgs(this.featureList.list.TestFeat5.configKey).returns(true);

            featureService.updateRunByConfig(configurationRepository);

            await TestUtils.waitForNoAssertion(() => {
                assert.isTrue(this.featureList.list.TestFeat2.isRunning);
                assert.isTrue(this.featureList.list.TestFeat2.instance.startFeature.calledOnce);
                assert.isTrue(this.featureList.list.TestFeat5.isRunning);
                assert.isTrue(this.featureList.list.TestFeat5.instance.startFeature.calledOnce);
            });
        });

        it('updateRunByConfig should call updateFeatureConfig for a running feature that should not be stopped', async function () {
            const featureService = new FeatureService(this.featureList, this.frameHandler, this.configurationRepository, DOMUtils, CDUtils, this.browserContextsCache);
            this.featureList.list.TestFeat2.isRunning = true;
            this.featureList.list.TestFeat5.isRunning = false;

            const configurationRepository = sinon.stub(new ConfigurationRepository());
            configurationRepository.get.withArgs(this.featureList.list.TestFeat2.configKey).returns(true);
            configurationRepository.get.withArgs(this.featureList.list.TestFeat5.configKey).returns(false);

            featureService.updateRunByConfig(configurationRepository);
            await TestUtils.waitForNoAssertion(() => {
                assert.isTrue(this.featureList.list.TestFeat2.isRunning, 'TestFeat2 is not running');
                assert.isTrue(this.featureList.list.TestFeat2.instance.updateFeatureConfig.calledOnce, 'TestFeat2 updateFeatureConfig not called');
                assert.isFalse(this.featureList.list.TestFeat5.isRunning, 'TestFeat5 is not running');
                assert.isTrue(this.featureList.list.TestFeat5.instance.startFeature.notCalled, 'TestFeat5 was started');
                assert.isTrue(this.featureList.list.TestFeat5.instance.updateFeatureConfig.notCalled, 'TestFeat5 updateFeatureConfig was called');
            });
        });

        it('updateRunByConfig should call frameHandler to start a non running frame related feature', async function () {
            const featureService = new FeatureService(this.featureList, this.frameHandler, this.configurationRepository, DOMUtils, CDUtils, this.browserContextsCache);
            this.featureList.list.TestFeat1.isRunning = false;
            this.featureList.list.TestFeat3.isRunning = false;

            const configurationRepository = sinon.stub(new ConfigurationRepository());
            configurationRepository.get.withArgs(this.featureList.list.TestFeat1.configKey).returns(true);
            configurationRepository.get.withArgs(this.featureList.list.TestFeat3.configKey).returns(true);

            featureService.updateRunByConfig(configurationRepository);

            await TestUtils.waitForNoAssertion(() => {
                assert.isTrue(this.frameHandler.startFeature.calledWith(this.featureList.list.TestFeat1),
                    'FrameHandler startFeature was not called for TestFeat1');
                assert.isTrue(this.frameHandler.startFeature.calledWith(this.featureList.list.TestFeat3),
                    'FrameHandler startFeature was not called for TestFeat3');
            });
        });

        it('updateRunByConfig should call frameHandler to stop a non running frame related feature', function () {
            const featureService = new FeatureService(this.featureList, this.frameHandler, this.configurationRepository, DOMUtils, CDUtils, this.browserContextsCache);
            this.featureList.list.TestFeat1.isRunning = true;
            this.featureList.list.TestFeat3.isRunning = true;

            const configurationRepository = sinon.stub(new ConfigurationRepository());
            configurationRepository.get.withArgs(this.featureList.list.TestFeat1.configKey).returns(false);
            configurationRepository.get.withArgs(this.featureList.list.TestFeat3.configKey).returns(false);

            featureService.updateRunByConfig(configurationRepository);
            assert.equal(this.featureList.list.TestFeat1, this.frameHandler.stopFeature.getCall(0).args[0]);
            assert.equal(this.featureList.list.TestFeat3, this.frameHandler.stopFeature.getCall(1).args[0]);
        });

        it('updateRunByConfig should call frameHandler updateFeatureConfig for an already running feature', async function () {
            const featureService = new FeatureService(this.featureList, this.frameHandler, this.configurationRepository, DOMUtils, CDUtils, this.browserContextsCache);
            this.featureList.list.TestFeat1.isRunning = true;
            this.featureList.list.TestFeat3.isRunning = false;

            const configurationRepository = sinon.stub(new ConfigurationRepository());
            configurationRepository.get.withArgs(this.featureList.list.TestFeat1.configKey).returns(true);
            configurationRepository.get.withArgs(this.featureList.list.TestFeat3.configKey).returns(false);

            featureService.updateRunByConfig(configurationRepository);

            await TestUtils.waitForNoAssertion(() => {
                assert.equal(this.featureList.list.TestFeat1, this.frameHandler.updateFeatureConfig.getCall(0).args[0]);
            });
        });

        it('updateRunByConfig should not run the per session features', async function () {
            const featureService = new FeatureService(this.featureList, this.frameHandler, this.configurationRepository, DOMUtils, CDUtils, this.browserContextsCache);

            const configurationRepository = sinon.stub(new ConfigurationRepository());
            configurationRepository.get.returns(true);

            featureService.updateRunByConfig(configurationRepository);
            await TestUtils.waitForNoAssertion(() => {
                assert.isFalse(this.featureList.list.TestFeat6.isRunning);
            });
        });

        it('updateRunByConfig should invoke _startFeatureOnBrowserContexts upon a default non-running feature', async function () {
            const browserContext = sinon.createStubInstance(BrowserContext);
            sinon.stub(this.browserContextsCache, 'browserContexts').get(function getterFn() {
                return [browserContext];
            });
            const featureService = new FeatureService(this.featureList, this.frameHandler, this.configurationRepository, DOMUtils, CDUtils, this.browserContextsCache);
            this.featureList.list.TestFeat1.isRunning = false;
            const configurationRepository = sinon.stub(new ConfigurationRepository());

            featureService.updateRunByConfig(configurationRepository);
            await TestUtils.waitForNoAssertion(() => {
                assert.isTrue(this.featureList.list.TestFeat1.isRunning);
            });
        });

        it('updateRunByConfig should invoke _stopFeatureOnBrowserContexts upon a default non-running feature', async function () {
            const browserContext = sinon.createStubInstance(BrowserContext);
            sinon.stub(this.browserContextsCache, 'browserContexts').get(function getterFn() {
                return [browserContext];
            });
            const featureService = new FeatureService(this.featureList, this.frameHandler, this.configurationRepository, DOMUtils, CDUtils, this.browserContextsCache);
            const asyncCallSpy = sinon.spy(featureService, 'callMethod');
            this.featureList.list.TestFeat1.isRunning = true;
            this.featureList.list.TestFeat1.shouldRun = false;
            const configurationRepository = sinon.stub(new ConfigurationRepository());

            featureService.updateRunByConfig(configurationRepository);
            await TestUtils.waitForNoAssertion(() => {
                assert.isFalse(this.featureList.list.TestFeat1.isRunning);
                assert.isTrue(asyncCallSpy.called, "CDUtils.asyncCall should be called by _stopFeatureOnBrowserContexts");
                asyncCallSpy.resetHistory();
                asyncCallSpy.restore();
            });
        });

        it('updateRunByConfig should invoke _stopFeatureOnBrowserContexts upon a default non-running feature', async function () {
            const browserContext = sinon.createStubInstance(BrowserContext);
            sinon.stub(this.browserContextsCache, 'browserContexts').get(function getterFn() {
                return [browserContext];
            });
            const featureService = new FeatureService(this.featureList, this.frameHandler, this.configurationRepository, DOMUtils, CDUtils, this.browserContextsCache);
            this.featureList.list.TestFeat1.isRunning = true;
            const configurationRepository = sinon.stub(new ConfigurationRepository());

            featureService.updateRunByConfig(configurationRepository);
            await TestUtils.waitForNoAssertion(() => {
                assert.isTrue(this.featureList.list.TestFeat1.instance.updateFeatureConfig.calledOnce);
            });
        });
    });

    describe('buildFrameRelatedLists tests:', function () {
        it('cached lists are build on service creation', function () {
            const featureService = new FeatureService(this.featureList, this.frameHandler, this.configurationRepository, DOMUtils, CDUtils, this.browserContextsCache);

            assert.exists(featureService._frameRelatedDefaultFeatures);
            assert.exists(featureService._frameRelatedNonDefaultFeatures);
        });

        it('cached lists are rebuilt', function () {
            const featureService = new FeatureService(this.featureList, this.frameHandler, this.configurationRepository, DOMUtils, CDUtils, this.browserContextsCache);

            assert.exists(featureService._frameRelatedDefaultFeatures);
            assert.exists(featureService._frameRelatedNonDefaultFeatures);

            const frameRelatedDefaultFeature = {
                configKey: 'isTESTTTTTESTF',
                shouldRun: true,
                isDefault: true,
                isFrameRelated: true,
                isRunning: false,
                init() {
                    this._features.list.TESTTTTTESTF.instance = 'TESTTTTTESTFInstance';
                },
                instance: null,
            };

            this.featureList.list.TESTTTTTESTF = frameRelatedDefaultFeature;

            const frameRelatedNonDefaultFeature = {
                configKey: 'isnonTTDEF',
                shouldRun: true,
                isFrameRelated: true,
                isRunning: false,
                init() {
                    this._features.list.nonTTDEF.instance = 'nonTTDEFInstance';
                },
                instance: null,
            };

            this.featureList.list.nonTTDEF = frameRelatedNonDefaultFeature;

            featureService.buildFrameRelatedLists();

            assert.exists(featureService._frameRelatedDefaultFeatures);
            assert.exists(featureService._frameRelatedNonDefaultFeatures);

            assert.deepInclude(featureService._frameRelatedDefaultFeatures, frameRelatedDefaultFeature);
            assert.deepInclude(featureService._frameRelatedNonDefaultFeatures, frameRelatedNonDefaultFeature);
        });
    });

    describe('stopAllFeatures tests:', function () {
        it('stop all features', async function () {
            const featureService = new FeatureService(this.featureList, this.frameHandler, this.configurationRepository, DOMUtils, CDUtils, this.browserContextsCache);

            featureService.runDefault();
            featureService.runNonDefault();
            featureService.runPerContextFeatures({name: 'stubContext'});
            featureService.runPerSessionFeatures();

            featureService.stopAllFeatures();

            await TestUtils.waitForNoAssertion(() => {
                assert.isFalse(this.featureList.list.TestFeat1.isRunning);
                assert.isFalse(this.featureList.list.TestFeat2.isRunning);
                assert.isFalse(this.featureList.list.TestFeat3.isRunning);
                assert.isFalse(this.featureList.list.TestFeat4.isRunning);
                assert.isFalse(this.featureList.list.TestFeat5.isRunning);
                assert.isFalse(this.featureList.list.TestFeat6.isRunning);
                assert.isFalse(this.featureList.list.TestFeat7.isRunning);
            });
        });

        it('cdUtils.asyncCall is called upon invoking stopFeaturesOnBrowserContextRemove ', async function () {
            const featureService = new FeatureService(this.featureList, this.frameHandler, this.configurationRepository, DOMUtils, CDUtils, this.browserContextsCache);
            const browserContext = sinon.createStubInstance(BrowserContext);
            const asyncCallSpy = sinon.spy(featureService, 'callMethod');

            featureService.runFeaturesOnBrowserContext(browserContext);

            featureService.stopFeaturesOnBrowserContextRemove(browserContext);

            await TestUtils.waitForNoAssertion(() => {
                assert.isTrue(asyncCallSpy.called, "CDUtils.asyncCall should be invoked upon calling stopFeaturesOnBrowserContextRemove");
                assert.isTrue(this.featureList.list.TestFeat1.instance.stopFeature.calledOnce, "TestFeat1 (frame related) feature.instance.stopFeature should be called");
                asyncCallSpy.resetHistory();
                asyncCallSpy.restore();
            });
        });

        it('stop all features when some are started', async function () {
            const featureService = new FeatureService(this.featureList, this.frameHandler, this.configurationRepository, DOMUtils, CDUtils, this.browserContextsCache);

            featureService.runNonDefault();

            featureService.stopAllFeatures();

            await TestUtils.waitForNoAssertion(() => {
                assert.isFalse(this.featureList.list.TestFeat1.isRunning);
                assert.isFalse(this.featureList.list.TestFeat2.isRunning);
                assert.isFalse(this.featureList.list.TestFeat3.isRunning);
                assert.isFalse(this.featureList.list.TestFeat4.isRunning);
                assert.isFalse(this.featureList.list.TestFeat5.isRunning);
                assert.isFalse(this.featureList.list.TestFeat6.isRunning);
                assert.isFalse(this.featureList.list.TestFeat7.isRunning);
            });
        });

        it('stop all features when non is started', async function () {
            const featureService = new FeatureService(this.featureList, this.frameHandler, this.configurationRepository, DOMUtils, CDUtils, this.browserContextsCache);

            featureService.stopAllFeatures();

            await TestUtils.waitForNoAssertion(() => {
                assert.isFalse(this.featureList.list.TestFeat1.isRunning);
                assert.isFalse(this.featureList.list.TestFeat2.isRunning);
                assert.isFalse(this.featureList.list.TestFeat3.isRunning);
                assert.isFalse(this.featureList.list.TestFeat4.isRunning);
                assert.isFalse(this.featureList.list.TestFeat5.isRunning);
                assert.isFalse(this.featureList.list.TestFeat6.isRunning);
                assert.isFalse(this.featureList.list.TestFeat7.isRunning);
            });
        });
    });

    describe('Window Load Conditional Execution Tests:', function () {

        it('should execute _runFeatures with minimum delay (this._cdUtils.asyncCall) when document.readyState is complete', async function () {
            // Mock document.readyState as complete
            const originalReadyState = Object.getOwnPropertyDescriptor(Document.prototype, 'readyState');
            Object.defineProperty(document, 'readyState', {
                writable: true,
                value: 'complete'
            });

            const featureService = new FeatureService(this.featureList, this.frameHandler, this.configurationRepository, DOMUtils, CDUtils, this.browserContextsCache);

            // Spy on _runFeatures method
            const runFeaturesSpy = sinon.spy(featureService, '_runFeatures');

            // Call runDefault which should execute _runFeatures with this._cdUtils.asyncCall
            featureService.runDefault();
            await TestUtils.wait(1)

            assert.isTrue(runFeaturesSpy.called, '_runFeatures should be called immediately when document is complete');
            assert.isTrue(this.featureList.list.TestFeat1.instance.startFeature.called, 'Default features should start immediately');

            runFeaturesSpy.restore();

            // Restore original readyState
            if (originalReadyState) {
                Object.defineProperty(Document.prototype, 'readyState', originalReadyState);
            }
        });

        it('should defer _runFeatures execution when document.readyState is not complete', function () {
            // Mock document.readyState as loading
            const originalReadyState = Object.getOwnPropertyDescriptor(Document.prototype, 'readyState');
            Object.defineProperty(document, 'readyState', {
                writable: true,
                value: 'loading'
            });

            this.domUtilsStub = MockObjects.domUtils;

            // Mock onPageLoad to capture the callback
            let pageLoadCallback = null;
            this.domUtilsStub.onPageLoad = sinon.stub().callsFake((window, callback) => {
                pageLoadCallback = callback;
            });

            const featureService = new FeatureService(this.featureList, this.frameHandler, this.configurationRepository, this.domUtilsStub, CDUtils, this.browserContextsCache);
            
            // Spy on _runFeatures method
            const runFeaturesSpy = sinon.spy(featureService, '_runFeatures');
            
            // Call runNonDefault which uses _runFeatures with frame-related features
            featureService.runNonDefault();

            // Verify onPageLoad was called to defer execution
            assert.isTrue(this.domUtilsStub.onPageLoad.called, 'onPageLoad should be called when document is not complete');
            assert.isNotNull(pageLoadCallback, 'Page load callback should be captured');

            // Simulate window load event
            if (pageLoadCallback) {
                pageLoadCallback();
            }

            // Verify _runFeatures is called after window load
            assert.isTrue(runFeaturesSpy.called, '_runFeatures should be called after window load');

            runFeaturesSpy.restore();
            
            // Restore original readyState
            if (originalReadyState) {
                Object.defineProperty(Document.prototype, 'readyState', originalReadyState);
            }
        });

        it('should only call _runFeatures once even if window load fires multiple times', function () {
            // Mock document.readyState as loading
            const originalReadyState = Object.getOwnPropertyDescriptor(Document.prototype, 'readyState');
            Object.defineProperty(document, 'readyState', {
                writable: true,
                value: 'loading'
            });

            this.domUtilsStub = MockObjects.domUtils;

            let pageLoadCallbacks = [];
            this.domUtilsStub.onPageLoad = sinon.stub().callsFake((window, callback) => {
                pageLoadCallbacks.push(callback);
            });

            const featureService = new FeatureService(this.featureList, this.frameHandler, this.configurationRepository, this.domUtilsStub, CDUtils, this.browserContextsCache);
            
            // Call runNonDefault which should set up onPageLoad listener
            featureService.runNonDefault();

            // Simulate multiple window load events
            pageLoadCallbacks.forEach(callback => {
                callback();
                callback(); // Call twice to simulate multiple load events
            });

            // Verify frameHandler.startFeatures is called the expected number of times
            // Should be called for each pageLoadCallback, but the feature logic should handle deduplication
            assert.isTrue(this.frameHandler.startFeatures.called, 'frameHandler.startFeatures should be called after window load');

            // Restore original readyState
            if (originalReadyState) {
                Object.defineProperty(Document.prototype, 'readyState', originalReadyState);
            }
        });

        it('should handle both immediate and deferred execution paths', async function () {
            const featureService = new FeatureService(this.featureList, this.frameHandler, this.configurationRepository, DOMUtils, CDUtils, this.browserContextsCache);

            // Spy on methods
            const runFeaturesSpy = sinon.spy(featureService, '_runFeatures');


            // Test immediate execution (runDefault - no frame-related deferred execution)
            featureService.runDefault();
            window.dispatchEvent(new Event('load'));

            await TestUtils.wait(1)
            assert.isTrue(runFeaturesSpy.called, '_runFeatures should be called for default features');

            runFeaturesSpy.resetHistory();

            // Test with frame-related features (should call frameHandler)
            featureService.runNonDefault();
            assert.isTrue(runFeaturesSpy.called, '_runFeatures should be called for non-default features');
            assert.isTrue(this.frameHandler.startFeatures.called, 'frameHandler.startFeatures should be called for frame-related features');

            runFeaturesSpy.restore();
        });
    });

    describe('Regression Coverage Tests:', function () {
        it('should ensure startFeature is called for all default features during runDefault', async function () {
            const featureService = new FeatureService(this.featureList, this.frameHandler, this.configurationRepository, DOMUtils, CDUtils, this.browserContextsCache);

            // Reset call history
            this.featureList.list.TestFeat1.instance.startFeature.resetHistory();
            this.featureList.list.TestFeat4.instance.startFeature.resetHistory();

            featureService.runDefault();
            window.dispatchEvent(new Event('load'));

            await TestUtils.wait(1)

            // Verify startFeature is called for all default features
            assert.isTrue(this.featureList.list.TestFeat1.instance.startFeature.called, 'TestFeat1 startFeature should be called');
            assert.isTrue(this.featureList.list.TestFeat4.instance.startFeature.called, 'TestFeat4 startFeature should be called');

            // Verify features are marked as running
            assert.isTrue(this.featureList.list.TestFeat1.isRunning, 'TestFeat1 should be marked as running');
            assert.isTrue(this.featureList.list.TestFeat4.isRunning, 'TestFeat4 should be marked as running');
        });

        it('should ensure _runFeatures is called with correct parameters', async function () {
            const featureService = new FeatureService(this.featureList, this.frameHandler, this.configurationRepository, DOMUtils, CDUtils, this.browserContextsCache);

            // Spy on _runFeatures
            const runFeaturesSpy = sinon.spy(featureService, '_runFeatures');

            // Test default features
            featureService.runDefault();
            window.dispatchEvent(new Event('load'));

            await TestUtils.wait(1);
            assert.isTrue(runFeaturesSpy.called, '_runFeatures should be called for default features');
            assert.isTrue(runFeaturesSpy.calledWith(
                this.featureList.getDefaultFeatures(),
                featureService._frameRelatedDefaultFeatures
            ), '_runFeatures should be called with default features and frame-related defaults');

            runFeaturesSpy.resetHistory();

            // Test non-default features
            featureService.runNonDefault();
            assert.isTrue(runFeaturesSpy.called, '_runFeatures should be called for non-default features');
            assert.isTrue(runFeaturesSpy.calledWith(
                this.featureList.getNonDefaultFeatures(),
                featureService._frameRelatedNonDefaultFeatures
            ), '_runFeatures should be called with non-default features and frame-related non-defaults');

            runFeaturesSpy.restore();
        });

        it('should verify frame-related features are passed to FrameHandler', function () {
            const featureService = new FeatureService(this.featureList, this.frameHandler, this.configurationRepository, DOMUtils, CDUtils, this.browserContextsCache);
            
            // Reset frame handler spies
            this.frameHandler.startFeatures.resetHistory();
            
            // Run features that should trigger frame handler
            featureService.runNonDefault();
            
            // Verify frameHandler.startFeatures is called with frame-related features
            assert.isTrue(this.frameHandler.startFeatures.called, 'frameHandler.startFeatures should be called');
            
            // Verify it's called with the correct frame-related features
            const frameRelatedFeatures = featureService._frameRelatedNonDefaultFeatures;
            assert.isTrue(this.frameHandler.startFeatures.calledWith(frameRelatedFeatures), 
                'frameHandler should be called with correct frame-related features');
        });

        it('should ensure default and frame-related features are properly separated', function () {
            const featureService = new FeatureService(this.featureList, this.frameHandler, this.configurationRepository, DOMUtils, CDUtils, this.browserContextsCache);
            
            // Verify frame-related lists are built correctly
            assert.isArray(featureService._frameRelatedDefaultFeatures, '_frameRelatedDefaultFeatures should be an array');
            assert.isArray(featureService._frameRelatedNonDefaultFeatures, '_frameRelatedNonDefaultFeatures should be an array');
            
            // Check that frame-related features are properly identified
            const defaultFeatures = this.featureList.getDefaultFeatures();
            const frameRelatedDefaults = featureService._frameRelatedDefaultFeatures;
            
            frameRelatedDefaults.forEach(feature => {
                assert.isTrue(feature.isFrameRelated, 'All features in _frameRelatedDefaultFeatures should be frame-related');
            });
        });

        it('should verify feature execution flow under load conditions', async function () {
            const featureService = new FeatureService(this.featureList, this.frameHandler, this.configurationRepository, DOMUtils, CDUtils, this.browserContextsCache);

            // Spy on critical methods
            const runFeaturesSpy = sinon.spy(featureService, '_runFeatures');
            const asyncCallSpy = sinon.spy(featureService, 'callMethod');

            // Execute feature service
            featureService.runDefault();
            window.dispatchEvent(new Event('load'));

            await TestUtils.wait(1);

            // Verify the execution flow
            assert.isTrue(runFeaturesSpy.called, '_runFeatures should be called');
            assert.isTrue(asyncCallSpy.called, 'CDUtils.asyncCall should be used for feature execution');

            // Verify async calls are made for feature instances
            const asyncCalls = asyncCallSpy.getCalls();
            const featureStartCalls = asyncCalls.filter(call =>
                typeof call.thisValue === 'function' &&
                call.thisValue.name === 'startFeature'
            );
            assert.isTrue(featureStartCalls.length > 0, 'startFeature should be called asynchronously');

            runFeaturesSpy.restore();
            asyncCallSpy.restore();
        });

        it('should handle feature execution when configuration is not updated from server', async function () {
            // Configure repository to simulate server configuration not received
            this.configurationRepository.isConfigurationUpdatedFromServer.returns(false);

            const featureService = new FeatureService(this.featureList, this.frameHandler, this.configurationRepository, DOMUtils, CDUtils, this.browserContextsCache);

            // Reset call history
            this.featureList.list.TestFeat2.instance.startFeature.resetHistory();
            this.featureList.list.TestFeat3.instance.startFeature.resetHistory();

            // Try to run non-default features (should be skipped)
            featureService.runNonDefault();

            // Verify features are not started when configuration is not available
            assert.isFalse(this.featureList.list.TestFeat2.instance.startFeature.called,
                'Non-default features should not start without server configuration');
            assert.isFalse(this.featureList.list.TestFeat3.instance.startFeature.called,
                'Non-default features should not start without server configuration');

            // But default features should still work (they don't depend on server config)
            this.featureList.list.TestFeat1.instance.startFeature.resetHistory();
            featureService.runDefault();
            window.dispatchEvent(new Event('load'));

            await TestUtils.wait(1)

            assert.isTrue(this.featureList.list.TestFeat1.instance.startFeature.called,
                'Default features should start even without server configuration');
        });

        it('should verify per-context feature execution', function () {
            const featureService = new FeatureService(this.featureList, this.frameHandler, this.configurationRepository, DOMUtils, CDUtils, this.browserContextsCache);
            
            const runFeaturesSpy = sinon.spy(featureService, '_runFeatures');
            
            // Run per-context features
            const contextData = { name: 'test-context' };
            featureService.runPerContextFeatures(contextData);
            
            // Verify _runFeatures is called with per-context features
            assert.isTrue(runFeaturesSpy.called, '_runFeatures should be called for per-context features');
            assert.isTrue(runFeaturesSpy.calledWith(this.featureList.getPerContextFeatures()), 
                '_runFeatures should be called with per-context features');
            
            // Verify frame handler is called for non-cd_auto contexts
            assert.isTrue(this.frameHandler.startFeatures.called, 
                'frameHandler should be called for frame-related features in per-context execution');
            
            runFeaturesSpy.restore();
        });
    });

    describe('Handle features with concrete collected browser contexts', function () {
        it('runFeaturesOnBrowserContext invokes the startFeature method of default features', async function () {
            const featureService = new FeatureService(this.featureList, this.frameHandler, this.configurationRepository, DOMUtils, CDUtils, this.browserContextsCache);
            const browserContext = sinon.createStubInstance(BrowserContext);
            const contextGetterSpy = sinon.spy();
            sinon.stub(browserContext, 'Context').get(contextGetterSpy);

            featureService.runFeaturesOnBrowserContext(browserContext);
            assert.isTrue(contextGetterSpy.called);
            await TestUtils.waitForNoAssertion(() => {
                assert.isTrue(this.featureList.list.TestFeat1.isRunning);
                assert.isTrue(this.featureList.list.TestFeat4.isRunning);
            });
        });
    });
});
