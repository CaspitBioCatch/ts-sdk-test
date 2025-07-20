import { assert } from 'chai';
import DataAggregator from '../../../src/worker/DataAggregator';
import WupServerSessionState from '../../../src/worker/communication/WupServerSessionState';

describe('DataAggregator tests:', function () {
    describe('add tests: ', function () {
        it('add data successfully', function () {
            const dataAggregator = new DataAggregator(new WupServerSessionState());

            const data = {
                eventName: 'testEvent',
                data: {
                    message: 'dummy data message', url: 'dummy', level: 2, seq: 32323,
                },
            };

            dataAggregator.add(data);

            assert.equal(dataAggregator._dataObj.testEvent.length, 1, 'data aggregator data count is not as expected');
            assert.deepEqual(dataAggregator._dataObj.testEvent, [data.data], 'data aggregator data is not as expected');
        });

        it('add data fails if eventName field is missing', function () {
            const dataAggregator = new DataAggregator(new WupServerSessionState());

            const data = {
                eventName: 'testEvent',
                dodo: {
                    message: 'dummy data message', url: 'dummy', level: 2, seq: 32323,
                },
            };

            assert.throws(() => {
                return dataAggregator.add(data);
            });
        });

        it('add data data fails if data field is missing', function () {
            const dataAggregator = new DataAggregator(new WupServerSessionState());

            const data = {
                eventName: 'testEvent',
                dodo: {
                    message: 'dummy data message', url: 'dummy', level: 2, seq: 32323,
                },
            };

            assert.throws(() => {
                return dataAggregator.add(data);
            });
        });

        it('multiple add data data calls succeed', function () {
            const dataAggregator = new DataAggregator(new WupServerSessionState());

            const data = {
                eventName: 'testEvent',
                data: {
                    message: 'dummy data message', url: 'dummy', level: 2, seq: 32323,
                },
            };

            dataAggregator.add(data);

            assert.equal(dataAggregator._dataObj.testEvent.length, 1, 'data aggregator data count is not as expected');
            assert.deepEqual(dataAggregator._dataObj.testEvent, [data.data], 'data aggregator data is not as expected');

            dataAggregator.add(data);
            dataAggregator.add(data);
            dataAggregator.add(data);

            assert.equal(dataAggregator._dataObj.testEvent.length, 4, 'data aggregator data count is not as expected');
            assert.deepEqual(dataAggregator._dataObj.testEvent, [data.data, data.data, data.data, data.data], 'data aggregator data is not as expected');
        });
    });

    describe('reset tests: ', function () {
        it('calling reset succeeds', function () {
            const dataAggregator = new DataAggregator(new WupServerSessionState());

            const data = {
                eventName: 'testEvent',
                data: {
                    message: 'dummy data message', url: 'dummy', level: 2, seq: 32323,
                },
            };

            dataAggregator.add(data);

            assert.equal(dataAggregator._dataObj.testEvent.length, 1, 'data aggregator data count is not as expected');
            assert.deepEqual(dataAggregator._dataObj.testEvent, [data.data], 'data aggregator data is not as expected');

            dataAggregator.reset();

            assert.isUndefined(dataAggregator._dataObj.testEvent);
        });

        it('multiple rest calls succeeds', function () {
            const dataAggregator = new DataAggregator(new WupServerSessionState());

            const data = {
                eventName: 'testEvent',
                data: {
                    message: 'dummy data message', url: 'dummy', level: 2, seq: 32323,
                },
            };

            dataAggregator.add(data);

            assert.equal(dataAggregator._dataObj.testEvent.length, 1, 'data aggregator data count is not as expected');
            assert.deepEqual(dataAggregator._dataObj.testEvent, [data.data], 'data aggregator data is not as expected');

            dataAggregator.reset();
            dataAggregator.reset();
            dataAggregator.reset();

            assert.isUndefined(dataAggregator._dataObj.testEvent);

            dataAggregator.add(data);

            assert.equal(dataAggregator._dataObj.testEvent.length, 1, 'data aggregator data count is not as expected');
            assert.deepEqual(dataAggregator._dataObj.testEvent, [data.data], 'data aggregator data is not as expected');

            dataAggregator.reset();

            assert.isUndefined(dataAggregator._dataObj.testEvent);
        });
    });

    describe('isEmpty tests: ', function () {
        it('returns true when there is no data', function () {
            const dataAggregator = new DataAggregator(new WupServerSessionState());

            const data = {
                eventName: 'testEvent',
                data: {
                    message: 'dummy data message', url: 'dummy', level: 2, seq: 32323,
                },
            };

            dataAggregator.add(data);

            assert.equal(dataAggregator._dataObj.testEvent.length, 1, 'data aggregator data count is not as expected');
            assert.deepEqual(dataAggregator._dataObj.testEvent, [data.data], 'data aggregator data is not as expected');

            dataAggregator.reset();

            const isEmptyResult = dataAggregator.isEmpty();

            assert.equal(isEmptyResult, true);
        });

        it('returns true when there is no data after reset', function () {
            const dataAggregator = new DataAggregator(new WupServerSessionState());

            const isEmptyResult = dataAggregator.isEmpty();

            assert.equal(isEmptyResult, true);
        });

        it('returns false when there is data', function () {
            const dataAggregator = new DataAggregator(new WupServerSessionState());

            const data = {
                eventName: 'testEvent',
                data: {
                    message: 'dummy data message', url: 'dummy', level: 2, seq: 32323,
                },
            };

            dataAggregator.add(data);

            assert.equal(dataAggregator._dataObj.testEvent.length, 1, 'data aggregator data count is not as expected');
            assert.deepEqual(dataAggregator._dataObj.testEvent, [data.data], 'data aggregator data is not as expected');

            const isEmptyResult = dataAggregator.isEmpty();

            assert.equal(isEmptyResult, false);
        });
    });

    describe('get tests: ', function () {
        it('returns data successfully', function () {
            const wupServerSessionState = new WupServerSessionState();
            const incrementRequestIdSpy = sinon.spy(wupServerSessionState, 'incrementRequestId');

            const dataAggregator = new DataAggregator(wupServerSessionState);

            const data = {
                eventName: 'testEvent',
                data: {
                    message: 'dummy data message', url: 'dummy', level: 2, seq: 32323,
                },
            };

            dataAggregator.add(data);

            assert.equal(dataAggregator._dataObj.testEvent.length, 1, 'data aggregator data count is not as expected');
            assert.deepEqual(dataAggregator._dataObj.testEvent, [data.data], 'data aggregator data is not as expected');

            const aggregateData = dataAggregator.take();

            assert.deepEqual(aggregateData.testEvent, [data.data]);

            assert.isTrue(incrementRequestIdSpy.calledOnce);
            assert.equal(wupServerSessionState.getRequestId(), 1);
        });

        it('returns data after multiple adds successfully', function () {
            const dataAggregator = new DataAggregator(new WupServerSessionState());

            const data = {
                eventName: 'testEvent',
                data: {
                    message: 'dummy data message', url: 'dummy', level: 2, seq: 32323,
                },
            };

            dataAggregator.add(data);
            dataAggregator.add(data);
            dataAggregator.add(data);

            assert.equal(dataAggregator._dataObj.testEvent.length, 3, 'data aggregator data count is not as expected');
            assert.deepEqual(dataAggregator._dataObj.testEvent, [data.data, data.data, data.data], 'data aggregator data is not as expected');

            const aggregatedData = dataAggregator.take();

            assert.deepEqual(aggregatedData.testEvent, [data.data, data.data, data.data]);
        });

        it('returns data after multiple adds and resets successfully', function () {
            const dataAggregator = new DataAggregator(new WupServerSessionState());

            const data = {
                eventName: 'testEvent',
                data: {
                    message: 'dummy data message', url: 'dummy', level: 2, seq: 32323,
                },
            };

            dataAggregator.add(data);
            dataAggregator.add(data);
            dataAggregator.add(data);

            assert.equal(dataAggregator._dataObj.testEvent.length, 3, 'data aggregator data count is not as expected');
            assert.deepEqual(dataAggregator._dataObj.testEvent, [data.data, data.data, data.data], 'data aggregator data is not as expected');

            dataAggregator.reset();

            dataAggregator.add(data);
            dataAggregator.add(data);

            const aggregatedData = dataAggregator.take();

            assert.deepEqual(aggregatedData.testEvent, [data.data, data.data]);
        });
    });
});
