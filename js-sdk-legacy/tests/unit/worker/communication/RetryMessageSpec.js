import { assert } from 'chai';
import ReMessageSetting from '../../../../src/worker/communication/ReMessageSettings';
import RetryMessage from "../../../../src/worker/communication/RetryMessage";

describe('RetryMessage tests:', function () {
    let messageNumToRetry = 10;
    let messageRetryInterval = 100;
    let incrementalGrowthBetweenFailures = 100;
    let maxIntervalBetweenFailures = 300;
    let reMessageSetting = null;


    it('settings are initialized on creation', function () {
        reMessageSetting = new ReMessageSetting(messageNumToRetry, messageRetryInterval, incrementalGrowthBetweenFailures, maxIntervalBetweenFailures );
        const retryMessage = new RetryMessage(reMessageSetting);

        assert.deepEqual(retryMessage.reMessageSettings, reMessageSetting);
        assert.equal(retryMessage.currentMessageNumberOfSendFailures, 0);
        assert.equal(retryMessage.currentInterval, messageRetryInterval);
    });

    it('initReMessage', function () {
        reMessageSetting = new ReMessageSetting(messageNumToRetry, messageRetryInterval, incrementalGrowthBetweenFailures, maxIntervalBetweenFailures );
        const retryMessage = new RetryMessage(reMessageSetting);
        //change properties and than init
        retryMessage._incrementNumberOfSendFailures();
        retryMessage.restartMessageSettings();

        assert.equal(retryMessage.currentMessageNumberOfSendFailures, 0);
        assert.equal(retryMessage.currentInterval, messageRetryInterval);
    });

    it('updateSettings', function () {
        const differentMessageNumToRetry = 11;
        const differentMessageRetryInterval = 101;
        const differentIncrementalGrowthBetweenFailures = 101;
        const differentMaxIntervalBetweenFailures = 301;

        reMessageSetting = new ReMessageSetting(messageNumToRetry, messageRetryInterval, incrementalGrowthBetweenFailures, maxIntervalBetweenFailures );
        let differentMessageSetting = new ReMessageSetting(differentMessageNumToRetry, differentMessageRetryInterval, differentIncrementalGrowthBetweenFailures, differentMaxIntervalBetweenFailures );
        const retryMessage = new RetryMessage(reMessageSetting);

        //change properties and than init
        retryMessage.updateSettings(differentMessageSetting);
        retryMessage.restartMessageSettings();

        assert.deepEqual(retryMessage.reMessageSettings, differentMessageSetting);
    });

    it('updateAllSettings', function () {

        reMessageSetting = new ReMessageSetting(messageNumToRetry, messageRetryInterval, incrementalGrowthBetweenFailures, maxIntervalBetweenFailures );
        const retryMessage = new RetryMessage(reMessageSetting);
        reMessageSetting.messageRetryInterval = 999;
        reMessageSetting.maxIntervalBetweenFailures = 1050;
        retryMessage.updateAllSettings(reMessageSetting)

        assert.equal(retryMessage.getMessageRetryInterval(), 999);
        assert.equal(retryMessage.getMaxIntervalBetweenFailures(), 1050);

    });
    it('getters', function () {
        reMessageSetting = new ReMessageSetting(messageNumToRetry, messageRetryInterval, incrementalGrowthBetweenFailures, maxIntervalBetweenFailures );
        const retryMessage = new RetryMessage(reMessageSetting);
        //check getters on init
        assert.equal(retryMessage.getNumberOfSendFailures(), 0);
        assert.equal(retryMessage.getNextInterval(), 100);
        //change the values
        for (let i =0 ; i< 2; i++){
            retryMessage._incrementNumberOfSendFailures();
        }
        retryMessage.updateRetryInterval();
        //check getters again
        assert.equal(retryMessage.getNumberOfSendFailures(), 3);
        assert.equal(retryMessage.getNextInterval(), 300);

    });

    it('getters for the initial configuration', function () {
        reMessageSetting = new ReMessageSetting(messageNumToRetry, messageRetryInterval, incrementalGrowthBetweenFailures, maxIntervalBetweenFailures );
        const retryMessage = new RetryMessage(reMessageSetting);
        //check getters
        assert.equal(retryMessage.getMessageNumToRetry(), 10);
        assert.equal(retryMessage.getMessageRetryInterval(), 100);
        assert.equal(retryMessage.getMaxIntervalBetweenFailures(), 300);
        assert.equal(retryMessage.getIncrementalGrowthBetweenFailures(), 100);
    });
    it('incrementNumberOfSendFailures', function () {
        reMessageSetting = new ReMessageSetting(messageNumToRetry, messageRetryInterval, incrementalGrowthBetweenFailures, maxIntervalBetweenFailures );
        const retryMessage = new RetryMessage(reMessageSetting);
        //check getters on init
        assert.equal(retryMessage.getNumberOfSendFailures(), 0);
        //change the values
        for (let i =0 ; i< 2; i++){
            retryMessage._incrementNumberOfSendFailures();
        }
        assert.equal(retryMessage.getNumberOfSendFailures(), 2);

        retryMessage.restartMessageSettings();
        assert.equal(retryMessage.getNumberOfSendFailures(), 0);

        for (let i =0 ; i< 10; i++){
            retryMessage._incrementNumberOfSendFailures();
        }
        assert.equal(retryMessage.getNumberOfSendFailures(), 10);

    });

    it('shouldReMessage', function () {
        messageNumToRetry = 2;
        reMessageSetting = new ReMessageSetting(messageNumToRetry, messageRetryInterval, incrementalGrowthBetweenFailures, maxIntervalBetweenFailures );
        const retryMessage = new RetryMessage(reMessageSetting);

        assert.equal(retryMessage.shouldReMessage(true), true);
        assert.equal(retryMessage.shouldReMessage(false), true);

        for (let i =0 ; i< 2; i++){
            retryMessage._incrementNumberOfSendFailures();
        }
        assert.equal(retryMessage.shouldReMessage(false), false);

    });
    it('setReMessage , dont get to max interval limit', function () {
        messageNumToRetry = 10;
        maxIntervalBetweenFailures = 300000;
        reMessageSetting = new ReMessageSetting(messageNumToRetry, messageRetryInterval, incrementalGrowthBetweenFailures, maxIntervalBetweenFailures );
        const retryMessage = new RetryMessage(reMessageSetting);

        //simulates the first sending
        assert.equal(retryMessage.getNumberOfSendFailures(), 0);
        assert.equal(retryMessage.getNextInterval(), 100);

        //simulates the first retry
        retryMessage.updateRetryInterval();
        assert.equal(retryMessage.getNumberOfSendFailures(), 1);
        assert.equal(retryMessage.getNextInterval(), 100);

        //simulates the second retry
        retryMessage.updateRetryInterval();
        assert.equal(retryMessage.getNumberOfSendFailures(), 2);
        assert.equal(retryMessage.getNextInterval(), 200);

        //simulates the third retry
        retryMessage.updateRetryInterval();
        assert.equal(retryMessage.getNumberOfSendFailures(), 3);
        assert.equal(retryMessage.getNextInterval(), 400);

        retryMessage.updateRetryInterval();
        assert.equal(retryMessage.getNumberOfSendFailures(), 4);
        assert.equal(retryMessage.getNextInterval(), 700);
    });

    it('setReMessage , get to max interval limit', function () {
        messageNumToRetry = 10;
        maxIntervalBetweenFailures = 350;
        reMessageSetting = new ReMessageSetting(messageNumToRetry, messageRetryInterval, incrementalGrowthBetweenFailures, maxIntervalBetweenFailures );
        const retryMessage = new RetryMessage(reMessageSetting);

        //simulates the first sending
        assert.equal(retryMessage.getNumberOfSendFailures(), 0);
        assert.equal(retryMessage.getNextInterval(), 100);

        //simulates the first retry
        retryMessage.updateRetryInterval();
        assert.equal(retryMessage.getNumberOfSendFailures(), 1);
        assert.equal(retryMessage.getNextInterval(), 100);

        //simulates the second retry
        retryMessage.updateRetryInterval();
        assert.equal(retryMessage.getNumberOfSendFailures(), 2);
        assert.equal(retryMessage.getNextInterval(), 200);

        //simulates the third retry
        retryMessage.updateRetryInterval();
        assert.equal(retryMessage.getNumberOfSendFailures(), 3);
        assert.equal(retryMessage.getNextInterval(), 350);

        //interval reaches to max
        retryMessage.updateRetryInterval();
        assert.equal(retryMessage.getNumberOfSendFailures(), 4);
        assert.equal(retryMessage.getNextInterval(), 350);
    });

});


