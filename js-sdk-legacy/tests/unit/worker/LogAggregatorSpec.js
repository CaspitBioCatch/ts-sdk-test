import { assert } from 'chai';
import LogAggregator from '../../../src/worker/LogAggregator';
import {LogLevel} from "../../../src/main/technicalServices/log/LogLevel";
import sinon from "sinon";
import WorkerCommunicator from "../../../src/main/technicalServices/WorkerCommunicator";
import ContextMgr from "../../../src/main/core/context/ContextMgr";

describe('LogAggregator tests:', function () {

    describe('add tests: ', function () {
        it('add log data successfully', function () {
            const logAggregator = new LogAggregator();

            const logData = {
                data: {
                    message: 'dummy log message', url: 'dummy', level: LogLevel.INFO, seq: 32323,
                },
            };

            logAggregator.add(logData);

            assert.equal(logAggregator._Q.length, 1, 'log aggregator data count is not as expected');
            assert.deepEqual(logAggregator._Q, [logData.data], 'log aggregator data is not as expected');
        });

        it('add log data without log level successfully', function () {
            const logAggregator = new LogAggregator();

            const logData = {
                data: {
                    message: 'dummy log message', url: 'dummy', seq: 32323,
                },
            };

            logAggregator.add(logData);

            assert.equal(logAggregator._Q.length, 1, 'log aggregator data count is not as expected');
            assert.deepEqual(logAggregator._Q, [logData.data], 'log aggregator data is not as expected');
        });

        it('add log data fails if data field is missing', function () {
            const logAggregator = new LogAggregator();

            const logData = {
                doto: {
                    message: 'dummy log message', url: 'dummy', level: LogLevel.INFO, seq: 32323,
                },
            };

            assert.throws(() => {
                return logAggregator.add(logData);
            });
        });

        it('multiple add log data calls succeed', function () {
            const logAggregator = new LogAggregator();

            const logData = {
                data: {
                    message: 'dummy log message', url: 'dummy', level: LogLevel.INFO, seq: 32323,
                },
            };

            logAggregator.add(logData);

            assert.equal(logAggregator._Q.length, 1, 'log aggregator data count is not as expected');
            assert.deepEqual(logAggregator._Q, [logData.data], 'log aggregator data is not as expected');

            logAggregator.add(logData);
            logAggregator.add(logData);
            logAggregator.add(logData);

            assert.equal(logAggregator._Q.length, 4, 'log aggregator data count is not as expected');
            assert.deepEqual(logAggregator._Q, [logData.data, logData.data, logData.data, logData.data], 'log aggregator data is not as expected');
        });
    });

    describe('setLogLevel test: ', function () {
        it('calling setLogLevel succeeds', function () {
            const logAggregator = new LogAggregator();
            assert.equal(logAggregator._logLevel, LogLevel.INFO, 'log aggregator default level is not as expected');
            logAggregator.setLogLevel(LogLevel.WARN);
            assert.equal(logAggregator._logLevel, LogLevel.WARN, 'log aggregator level is not as expected');
        });
    });

    describe('reset tests: ', function () {
        it('calling reset succeeds', function () {
            const logAggregator = new LogAggregator();

            const logData = {
                data: {
                    message: 'dummy log message', url: 'dummy', level: LogLevel.INFO, seq: 32323,
                },
            };

            logAggregator.add(logData);

            assert.equal(logAggregator._Q.length, 1, 'log aggregator data count is not as expected');
            assert.deepEqual(logAggregator._Q, [logData.data], 'log aggregator data is not as expected');
            assert.equal(logAggregator._logLevel, LogLevel.INFO, 'log aggregator level is not as expected');

            logAggregator.setLogLevel(LogLevel.WARN);
            assert.equal(logAggregator._logLevel, LogLevel.WARN, 'log aggregator level is not as expected');

            logAggregator.reset();
            assert.equal(logAggregator._logLevel, LogLevel.WARN, 'log aggregator level is not as expected');
            assert.equal(logAggregator._Q.length, 0, 'log aggregator data count is not as expected');
        });

        it('multiple rest calls succeeds', function () {
            const logAggregator = new LogAggregator();

            const logData = {
                data: {
                    message: 'dummy log message', url: 'dummy', level: LogLevel.INFO, seq: 32323,
                },
            };

            logAggregator.add(logData);

            assert.equal(logAggregator._Q.length, 1, 'log aggregator data count is not as expected');
            assert.deepEqual(logAggregator._Q, [logData.data], 'log aggregator data is not as expected');

            logAggregator.reset();
            logAggregator.reset();
            logAggregator.reset();

            assert.equal(logAggregator._Q.length, 0, 'log aggregator data count is not as expected');

            logAggregator.add(logData);

            assert.equal(logAggregator._Q.length, 1, 'log aggregator data count is not as expected');
            assert.deepEqual(logAggregator._Q, [logData.data], 'log aggregator data is not as expected');

            logAggregator.reset();

            assert.equal(logAggregator._Q.length, 0, 'log aggregator data count is not as expected');
        });
    });

    describe('isEmpty tests: ', function () {
        it('returns true when there is no data', function () {
            const logAggregator = new LogAggregator();

            const logData = {
                data: {
                    message: 'dummy log message', url: 'dummy', level: LogLevel.INFO, seq: 32323,
                },
            };

            logAggregator.add(logData);

            assert.equal(logAggregator._Q.length, 1, 'log aggregator data count is not as expected');
            assert.deepEqual(logAggregator._Q, [logData.data], 'log aggregator data is not as expected');

            logAggregator.reset();

            const isEmptyResult = logAggregator.isEmpty();

            assert.equal(isEmptyResult, true);
        });

        it('returns true when there is no data after reset', function () {
            const logAggregator = new LogAggregator();
            const isEmptyResult = logAggregator.isEmpty();

            assert.equal(isEmptyResult, true);
        });

        it('returns false when there is data', function () {
            const logAggregator = new LogAggregator();

            const logData = {
                data: {
                    message: 'dummy log message', url: 'dummy', level: LogLevel.INFO, seq: 32323,
                },
            };

            logAggregator.add(logData);

            assert.equal(logAggregator._Q.length, 1, 'log aggregator data count is not as expected');
            assert.deepEqual(logAggregator._Q, [logData.data], 'log aggregator data is not as expected');

            const isEmptyResult = logAggregator.isEmpty();

            assert.equal(isEmptyResult, false);
        });
    });

    describe('get tests: ', function () {
        it('returns data successfully', function () {
            const logAggregator = new LogAggregator();

            const logData = {
                data: {
                    message: 'dummy log message', url: 'dummy', level: LogLevel.INFO, seq: 32323,
                },
            };

            logAggregator.add(logData);

            assert.equal(logAggregator._Q.length, 1, 'log aggregator data count is not as expected');
            assert.deepEqual(logAggregator._Q, [logData.data], 'log aggregator data is not as expected');

            const data = logAggregator.take();

            assert.deepEqual(data, [logData.data]);
        });

        it('returns data after multiple adds successfully', function () {
            const logAggregator = new LogAggregator();

            const logData = {
                data: {
                    message: 'dummy log message', url: 'dummy', level: LogLevel.INFO, seq: 32323,
                },
            };

            logAggregator.add(logData);
            logAggregator.add(logData);
            logAggregator.add(logData);

            assert.equal(logAggregator._Q.length, 3, 'log aggregator data count is not as expected');
            assert.deepEqual(logAggregator._Q, [logData.data, logData.data, logData.data], 'log aggregator data is not as expected');

            const data = logAggregator.take();

            assert.deepEqual(data, [logData.data, logData.data, logData.data]);
        });

        it('returns data after multiple adds and resets successfully', function () {
            const logAggregator = new LogAggregator();

            const logData = {
                data: {
                    message: 'dummy log message', url: 'dummy', level: LogLevel.INFO, seq: 32323,
                },
            };

            logAggregator.add(logData);
            logAggregator.add(logData);
            logAggregator.add(logData);

            assert.equal(logAggregator._Q.length, 3, 'log aggregator data count is not as expected');
            assert.deepEqual(logAggregator._Q, [logData.data, logData.data, logData.data], 'log aggregator data is not as expected');

            logAggregator.reset();

            logAggregator.add(logData);
            logAggregator.add(logData);

            const data = logAggregator.take();

            assert.deepEqual(data, [logData.data, logData.data]);
        });
    });

    describe('filterQueue by filter tests: ', function () {

        before(function () {
            this.workerCommunicator = sinon.createStubInstance(WorkerCommunicator);
            this.contextMgr = sinon.createStubInstance(ContextMgr);
            this.contextMgr.contextId = 123456;

            this.logAggregator = new LogAggregator();

            const logAggregatorRR = this.logAggregator;
            sinon.stub(this.logAggregator, "add").callsFake(function fakeFn(data) {
                logAggregatorRR._Q.push(data);
            });

        });

        beforeEach(function () {

            const dataInfo = {
                msg: 'info-test',
                url: 'url',
                level: LogLevel.INFO,
                sn: 1 };

            const dataWarn = {
                msg: 'warn-test',
                url: 'url',
                level: LogLevel.WARN,
                sn: 2 };

            const dataError = {
                msg: 'warn-test',
                url: 'url',
                level: LogLevel.ERROR,
                sn: 3 };

            const dataDebug = {
                msg: 'debug-test',
                url: 'url',
                level: LogLevel.DEBUG,
                sn: 4 };

            this.logAggregator.add(dataInfo);
            this.logAggregator.add(dataWarn);
            this.logAggregator.add(dataError);
            this.logAggregator.add(dataDebug);
        });

        afterEach(function () {
            this.logAggregator._Q = [];
        });

        it('filter out log queue by DEBUGֹ level', function () {
            assert.equal(this.logAggregator._Q.length, 4);

            this.logAggregator.filterOutByLogLevel(LogLevel.DEBUG);

            assert.equal(this.logAggregator._Q.length, 4);
            assert.equal(this.logAggregator._Q[0].level, LogLevel.INFO);
            assert.equal(this.logAggregator._Q[1].level, LogLevel.WARN);
            assert.equal(this.logAggregator._Q[2].level, LogLevel.ERROR);
            assert.equal(this.logAggregator._Q[3].level, LogLevel.DEBUG);

        });

        it('filter out log queue by INFO level', function () {
            assert.equal(this.logAggregator._Q.length, 4);

            this.logAggregator.filterOutByLogLevel(LogLevel.INFO);

            assert.equal(this.logAggregator._Q.length, 3);
            assert.equal(this.logAggregator._Q[0].level, LogLevel.INFO);
            assert.equal(this.logAggregator._Q[1].level, LogLevel.WARN);
            assert.equal(this.logAggregator._Q[2].level, LogLevel.ERROR);

        });

        it('filter out log queue by WARN level', function () {
            assert.equal(this.logAggregator._Q.length, 4);

            this.logAggregator.filterOutByLogLevel(LogLevel.WARN);

            assert.equal(this.logAggregator._Q.length, 2);
            assert.equal(this.logAggregator._Q[0].level, LogLevel.WARN);
            assert.equal(this.logAggregator._Q[1].level, LogLevel.ERROR);

        });

        it('filter out log queue by ERROR level', function () {
            assert.equal(this.logAggregator._Q.length, 4);

            this.logAggregator.filterOutByLogLevel(LogLevel.ERROR);
            assert.equal(this.logAggregator._Q.length, 1);

            assert.equal(this.logAggregator._Q[0].level, LogLevel.ERROR);

        });

        it('filter out log queue by CRITICAL level, log queue remains empty', function () {
            assert.equal(this.logAggregator._Q.length, 4);

            this.logAggregator.filterOutByLogLevel(LogLevel.CRITICAL);
            assert.equal(this.logAggregator._Q.length, 0);

        });

        it('multiple messages of same level are filtered out', function () {
            const dataDebug2 = {
                msg: 'debug2-test',
                url: 'url',
                level: LogLevel.DEBUG,
                sn: 5 };
            const dataInfo2 = {
                msg: 'info2-test',
                url: 'url',
                level: LogLevel.INFO,
                sn: 5 };

            this.logAggregator.add(dataDebug2);
            this.logAggregator.add(dataInfo2);

            assert.equal(this.logAggregator._Q.length, 6);

            this.logAggregator.filterOutByLogLevel(LogLevel.INFO);
            assert.equal(this.logAggregator._Q.length, 4);
            assert.equal(this.logAggregator._Q[0].level, LogLevel.INFO);
            assert.equal(this.logAggregator._Q[1].level, LogLevel.WARN);
            assert.equal(this.logAggregator._Q[2].level, LogLevel.ERROR);
            assert.equal(this.logAggregator._Q[3].level, LogLevel.INFO);

        });
    });
});
