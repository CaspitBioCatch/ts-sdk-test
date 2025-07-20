import { assert } from 'chai';
import FeaturesBuilder from '../../../../src/main/collectors/FeaturesBuilder';

describe('FeatureBuilder tests:', function () {
    describe('buildFeatures tests:', function () {
        let featureList = null;

        beforeEach(function () {
            featureList = {
                list: {
                    TestFeat1: {
                        init: function () {
                            // Set properties directly on the feature object rather than relying on `this`
                            featureList.list.TestFeat1.instance = 'TestFeat1Instance';
                            featureList.list.TestFeat1.configKey = 'isTestFeat1';
                        },
                        instance: null
                    },
                    TestFeat2: {
                        init: function () {
                            featureList.list.TestFeat2.instance = 'TestFeat2Instance';
                            featureList.list.TestFeat2.configKey = 'isTestFeat2';
                        },
                        instance: null
                    },
                    TestFeat3: {
                        init: function () {
                            featureList.list.TestFeat3.instance = 'TestFeat3Instance';
                            featureList.list.TestFeat3.configKey = 'isTestFeat3';
                        },
                        instance: null
                    },
                    // A failing feature for testing removal
                    TestFeatFail: {
                        name: 'TestFeatFail',
                        init: function () {
                            throw new Error('Initialization failure');
                        },
                        instance: null
                    }
                }
            };
        });

        afterEach(function () {
            if (featureList.list.TestFeat1) {
                featureList.list.TestFeat1.instance = null;
            }
            if (featureList.list.TestFeat2) {
                featureList.list.TestFeat2.instance = null;
            }
            if (featureList.list.TestFeat3) {
                featureList.list.TestFeat3.instance = null;
            }
            if (featureList.list.TestFeatFail) {
                featureList.list.TestFeatFail.instance = null;
            }
        });

        it('should build all successful features', function () {
            assert.isNull(featureList.list.TestFeat1.instance, 'TestFeat1 instance should initially be null');
            assert.isNull(featureList.list.TestFeat2.instance, 'TestFeat2 instance should initially be null');
            assert.isNull(featureList.list.TestFeat3.instance, 'TestFeat3 instance should initially be null');

            const featureBuilder = new FeaturesBuilder(featureList, {}, {}, {}, {}, {}, {}, {});
            featureBuilder.buildFeatures();

            assert.equal(featureList.list.TestFeat1.instance, 'TestFeat1Instance');
            assert.equal(featureList.list.TestFeat1.configKey, 'isTestFeat1');
            assert.equal(featureList.list.TestFeat2.instance, 'TestFeat2Instance');
            assert.equal(featureList.list.TestFeat2.configKey, 'isTestFeat2');
            assert.equal(featureList.list.TestFeat3.instance, 'TestFeat3Instance');
            assert.equal(featureList.list.TestFeat3.configKey, 'isTestFeat3');
        });

        it('should remove a failing feature from the feature list', function () {
            assert.isNull(featureList.list.TestFeatFail.instance, 'Failing feature instance should initially be null');

            const featureBuilder = new FeaturesBuilder(
                featureList, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}
            );
            featureBuilder.buildFeatures();

            // The failing feature should have been deleted from the list
            assert.isUndefined(featureList.list.TestFeatFail, 'Failing feature should be removed from the feature list');
        });
    });
});
