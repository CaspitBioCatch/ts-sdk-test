import { assert } from 'chai';
import ReMessageSetting from '../../../../src/worker/communication/ReMessageSettings';
import {ConfigurationDefaultValues} from "../../../../src/worker/communication/ConfigurationDefaultValues";

describe('ReMessageSetting tests:', function () {
    let messageNumToRetry = 10;
    let messageRetryInterval = 100;
    let incrementalGrowthBetweenFailures = 100;
    let maxIntervalBetweenFailures = 300;

        it('settings are initialized on creation', function () {

            const reMessageSetting = new ReMessageSetting(messageNumToRetry, messageRetryInterval, incrementalGrowthBetweenFailures, maxIntervalBetweenFailures );

            assert.equal(reMessageSetting.messageNumToRetry, messageNumToRetry);
            assert.equal(reMessageSetting.messageRetryInterval, messageRetryInterval);
            assert.equal(reMessageSetting.incrementalGrowthBetweenFailures, incrementalGrowthBetweenFailures);
            assert.equal(reMessageSetting.maxIntervalBetweenFailures, maxIntervalBetweenFailures);
        });

    it('all geters', function () {

       const reMessageSetting = new ReMessageSetting(messageNumToRetry, messageRetryInterval, incrementalGrowthBetweenFailures, maxIntervalBetweenFailures );

        assert.equal(reMessageSetting.getMessageNumToRetry(), messageNumToRetry);
        assert.equal(reMessageSetting.getMessageRetryInterval(), messageRetryInterval);
        assert.equal(reMessageSetting.getIncrementalGrowthBetweenFailures(), incrementalGrowthBetweenFailures);
        assert.equal(reMessageSetting.getMaxIntervalBetweenFailures() , maxIntervalBetweenFailures);
    });
    it('messageNumToRetry is a string of number', function () {
        messageNumToRetry = "10";
        const reMessageSetting = new ReMessageSetting(messageNumToRetry, messageRetryInterval, incrementalGrowthBetweenFailures, maxIntervalBetweenFailures );

        assert.equal(reMessageSetting.getMessageNumToRetry(), 10);
        assert.equal(reMessageSetting.getMessageRetryInterval(), messageRetryInterval);
        assert.equal(reMessageSetting.getIncrementalGrowthBetweenFailures(), incrementalGrowthBetweenFailures);
        assert.equal(reMessageSetting.getMaxIntervalBetweenFailures() , maxIntervalBetweenFailures);
    });

    it('messageNumToRetry is a string of not number', function () {
        // messageNumToRetry min val is 1
        messageNumToRetry = "hello";
        const reMessageSetting = new ReMessageSetting(messageNumToRetry, messageRetryInterval, incrementalGrowthBetweenFailures, maxIntervalBetweenFailures );

        assert.equal(reMessageSetting.getMessageNumToRetry(), ConfigurationDefaultValues.DEFAULT_RETRY_NUM);
        assert.equal(reMessageSetting.getMessageRetryInterval(), messageRetryInterval);
        assert.equal(reMessageSetting.getIncrementalGrowthBetweenFailures(), incrementalGrowthBetweenFailures);
        assert.equal(reMessageSetting.getMaxIntervalBetweenFailures() , maxIntervalBetweenFailures);
    });

    it('messageNumToRetry less then min', function () {
        // messageNumToRetry min val is 1
        messageNumToRetry = 0;
        const reMessageSetting = new ReMessageSetting(messageNumToRetry, messageRetryInterval, incrementalGrowthBetweenFailures, maxIntervalBetweenFailures );

        assert.equal(reMessageSetting.getMessageNumToRetry(), ConfigurationDefaultValues.DEFAULT_RETRY_NUM);
        assert.equal(reMessageSetting.getMessageRetryInterval(), messageRetryInterval);
        assert.equal(reMessageSetting.getIncrementalGrowthBetweenFailures(), incrementalGrowthBetweenFailures);
        assert.equal(reMessageSetting.getMaxIntervalBetweenFailures() , maxIntervalBetweenFailures);
    });

    it('messageNumToRetry more then max', function () {
        // messageNumToRetry max val is 1000
        messageNumToRetry = 1001;
        const reMessageSetting = new ReMessageSetting(messageNumToRetry, messageRetryInterval, incrementalGrowthBetweenFailures, maxIntervalBetweenFailures );

        assert.equal(reMessageSetting.getMessageNumToRetry(),  ConfigurationDefaultValues.DEFAULT_RETRY_NUM);
        assert.equal(reMessageSetting.getMessageRetryInterval(), messageRetryInterval);
        assert.equal(reMessageSetting.getIncrementalGrowthBetweenFailures(), incrementalGrowthBetweenFailures);
        assert.equal(reMessageSetting.getMaxIntervalBetweenFailures() , maxIntervalBetweenFailures);
    });

    it('messageRetryInterval less then min', function () {
        // messageNumToRetry min val is 100
        messageRetryInterval = 99;
        const reMessageSetting = new ReMessageSetting(messageNumToRetry, messageRetryInterval, incrementalGrowthBetweenFailures, maxIntervalBetweenFailures );

        assert.equal(reMessageSetting.getMessageRetryInterval(), ConfigurationDefaultValues.DEFAULT_RETRY_INTERVAL);

    });

    it('messageRetryInterval more then max', function () {
        // messageNumToRetry max val is 10000
        messageRetryInterval = 10001;
        const reMessageSetting = new ReMessageSetting(messageNumToRetry, messageRetryInterval, incrementalGrowthBetweenFailures, maxIntervalBetweenFailures );

        assert.equal(reMessageSetting.getMessageRetryInterval(), ConfigurationDefaultValues.DEFAULT_RETRY_INTERVAL);

    });

    it('incrementalGrowthBetweenFailures less then min', function () {
        // messageNumToRetry min val is 0
        incrementalGrowthBetweenFailures = -1;
        const reMessageSetting = new ReMessageSetting(messageNumToRetry, messageRetryInterval, incrementalGrowthBetweenFailures, maxIntervalBetweenFailures );

        assert.equal(reMessageSetting.getIncrementalGrowthBetweenFailures(), ConfigurationDefaultValues.DEFAULT_GROWTH_PER_FAILURE);

    });

    it('incrementalGrowthBetweenFailures more then max', function () {
        // messageNumToRetry max val is 10000
        incrementalGrowthBetweenFailures = 10001;
        const reMessageSetting = new ReMessageSetting(messageNumToRetry, messageRetryInterval, incrementalGrowthBetweenFailures, maxIntervalBetweenFailures );

        assert.equal(reMessageSetting.getIncrementalGrowthBetweenFailures(), ConfigurationDefaultValues.DEFAULT_GROWTH_PER_FAILURE);

    });

    it('maxIntervalBetweenFailures less then min', function () {
        // messageNumToRetry min val is 100
        maxIntervalBetweenFailures = 99;
        const reMessageSetting = new ReMessageSetting(messageNumToRetry, messageRetryInterval, incrementalGrowthBetweenFailures, maxIntervalBetweenFailures );

        assert.equal(reMessageSetting.getMaxIntervalBetweenFailures(), ConfigurationDefaultValues.DEFAULT_INTERVAL_LIMIT);

    });

    it('maxIntervalBetweenFailures more then max', function () {
        // messageNumToRetry max val is 300000
        maxIntervalBetweenFailures = 300001;
        const reMessageSetting = new ReMessageSetting(messageNumToRetry, messageRetryInterval, incrementalGrowthBetweenFailures, maxIntervalBetweenFailures );

        assert.equal(reMessageSetting.getMaxIntervalBetweenFailures(), ConfigurationDefaultValues.DEFAULT_INTERVAL_LIMIT);

    });
    it('maxIntervalBetweenFailures smaller then messageRetryInterval', function () {
        messageRetryInterval = 1000
        maxIntervalBetweenFailures = 999;
        const reMessageSetting = new ReMessageSetting(messageNumToRetry, messageRetryInterval, incrementalGrowthBetweenFailures, maxIntervalBetweenFailures );

        assert.equal(reMessageSetting.getMaxIntervalBetweenFailures(), ConfigurationDefaultValues.DEFAULT_INTERVAL_LIMIT);
        assert.equal(reMessageSetting.getMessageRetryInterval(), ConfigurationDefaultValues.DEFAULT_RETRY_INTERVAL);

    });


});

