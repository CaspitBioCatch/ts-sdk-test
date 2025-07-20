import { assert } from 'chai';
import WupStatisticsService from '../../../../src/worker/wup/WupStatisticsService';
import { TestUtils } from '../../../TestUtils';

describe('WupStatisticsService tests:', function () {
    afterEach(function () {
        if (this._wupStatisticsService) {
            this._wupStatisticsService.stop();
            this._wupStatisticsService = null;
        }
    });

    describe('incrementSentWupCount tests: ', function () {
        it('increment sent wup count successfully', function () {
            this._wupStatisticsService = new WupStatisticsService(30000);

            this._wupStatisticsService.incrementSentWupCount();

            assert.equal(this._wupStatisticsService.getSentWupsCount(), 1, 'sent wups count is not as expected');

            this._wupStatisticsService.incrementSentWupCount();
            this._wupStatisticsService.incrementSentWupCount();

            assert.equal(this._wupStatisticsService.getSentWupsCount(), 3, 'sent wups count is not as expected');
        });

        it('increment sent wup count successfully after counters reset', function () {
            this._wupStatisticsService = new WupStatisticsService(30000);

            this._wupStatisticsService.incrementSentWupCount();

            assert.equal(this._wupStatisticsService.getSentWupsCount(), 1, 'sent wups count is not as expected');

            this._wupStatisticsService.incrementSentWupCount();
            this._wupStatisticsService.incrementSentWupCount();

            assert.equal(this._wupStatisticsService.getSentWupsCount(), 3, 'sent wups count is not as expected');

            this._wupStatisticsService.resetCounters();

            this._wupStatisticsService.incrementSentWupCount();

            assert.equal(this._wupStatisticsService.getSentWupsCount(), 1, 'sent wups count is not as expected');
        });
    });

    describe('updateSettings tests: ', function () {
        it('updates settings successfully', function () {
            this._wupStatisticsService = new WupStatisticsService(30000);

            this._wupStatisticsService.updateSettings(15000);

            assert.equal(this._wupStatisticsService._statisticsLogIntervalMs, 15000, 'statistics log interval has an unexpected value');
        });

        it('multiple settings updates are successful', function () {
            this._wupStatisticsService = new WupStatisticsService(30000);

            this._wupStatisticsService.updateSettings(15000);

            assert.equal(this._wupStatisticsService._statisticsLogIntervalMs, 15000, 'statistics log interval has an unexpected value');

            this._wupStatisticsService.updateSettings(111);

            assert.equal(this._wupStatisticsService._statisticsLogIntervalMs, 111, 'statistics log interval has an unexpected value');

            this._wupStatisticsService.updateSettings(12131415);

            assert.equal(this._wupStatisticsService._statisticsLogIntervalMs, 12131415, 'statistics log interval has an unexpected value');
        });
    });

    describe('resetCounters tests: ', function () {
        it('counters are reset successfully', function () {
            this._wupStatisticsService = new WupStatisticsService(30000);

            this._wupStatisticsService.incrementSentWupCount();

            assert.equal(this._wupStatisticsService.getSentWupsCount(), 1, 'sent wups count is not as expected');

            this._wupStatisticsService.resetCounters();

            assert.equal(this._wupStatisticsService.getSentWupsCount(), 0, 'sent wups count is not as expected');
        });

        it('counters are reset successfully multiple times', function () {
            this._wupStatisticsService = new WupStatisticsService(30000);

            this._wupStatisticsService.incrementSentWupCount();

            assert.equal(this._wupStatisticsService.getSentWupsCount(), 1, 'sent wups count is not as expected');

            this._wupStatisticsService.resetCounters();

            assert.equal(this._wupStatisticsService.getSentWupsCount(), 0, 'sent wups count is not as expected');

            this._wupStatisticsService.incrementSentWupCount();
            this._wupStatisticsService.incrementSentWupCount();

            assert.equal(this._wupStatisticsService.getSentWupsCount(), 2, 'sent wups count is not as expected');

            this._wupStatisticsService.resetCounters();

            assert.equal(this._wupStatisticsService.getSentWupsCount(), 0, 'sent wups count is not as expected');
        });
    });

    describe('periodic log tests: ', function () {
        beforeEach(function () {
            this.sandbox = sinon.createSandbox();
        });

        afterEach(function () {
            this.sandbox.restore();

            if (this._wupStatisticsService) {
                this._wupStatisticsService.stop();
                this._wupStatisticsService = null;
            }
        });

        it('logs statistics successfully', async function () {
            this._wupStatisticsService = new WupStatisticsService(300);

            this._wupStatisticsService.incrementSentWupCount();

            assert.equal(this._wupStatisticsService.getSentWupsCount(), 1, 'sent wups count is not as expected');
            assert.equal(this._wupStatisticsService._sentWupsInCurrentIntervalCount, 1);

            await TestUtils.waitForNoAssertion(() => {
                assert.equal(this._wupStatisticsService._sentWupsInCurrentIntervalCount, 0);
            });
        });

        it('logs multiple statistics successfully', async function () {
            this._wupStatisticsService = new WupStatisticsService(200);

            this._wupStatisticsService.incrementSentWupCount();
            assert.equal(this._wupStatisticsService.getSentWupsCount(), 1, 'sent wups count is not as expected');
            assert.equal(this._wupStatisticsService._sentWupsInCurrentIntervalCount, 1);

            await TestUtils.waitForNoAssertion(() => {
                assert.equal(this._wupStatisticsService._sentWupsInCurrentIntervalCount, 0);
            });

            this._wupStatisticsService.incrementSentWupCount();
            this._wupStatisticsService.incrementSentWupCount();
            this._wupStatisticsService.incrementSentWupCount();

            assert.equal(this._wupStatisticsService.getSentWupsCount(), 4, 'sent wups count is not as expected');
            assert.equal(this._wupStatisticsService._sentWupsInCurrentIntervalCount, 3);

            await TestUtils.waitForNoAssertion(() => {
                assert.equal(this._wupStatisticsService._sentWupsInCurrentIntervalCount, 0);
            });
        });
    });
});
