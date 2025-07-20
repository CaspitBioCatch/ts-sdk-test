import { assert } from 'chai';
import WupServerSessionState from '../../../src/worker/communication/WupServerSessionState';
import DataAggregator from '../../../src/worker/DataAggregator';
import DataDispatcher from '../../../src/worker/DataDispatcher';
import WupDispatchRateCalculatorFactory
    from '../../../src/worker/wup/dispatching/WupDispatchRateCalculatorFactory';
import WupStatisticsService from '../../../src/worker/wup/WupStatisticsService';
import LogAggregator from '../../../src/worker/LogAggregator';
import ConfigurationRepository from '../../../src/main/core/configuration/ConfigurationRepository';
import { ConfigurationFields } from '../../../src/main/core/configuration/ConfigurationFields';
import { WupDispatchRateType } from '../../../src/worker/wup/dispatching/WupDispatchRateType';
import WupServerClient from '../../../src/worker/communication/WupServerClient';

describe('DataDispatcher tests:', function () {
    describe('message sending tests: ', function () {
        describe('with no interval: ', function () {
            describe('with callbacks supplied to handle messages: ', function () {
                describe('with single event: ', function () {
                    it('should send data wup to directly: ', function () {
                        const wupServerClientStub = sinon.createStubInstance(WupServerClient);

                        const wupServerSessionState = new WupServerSessionState();
                        const dataAggregator = new DataAggregator(wupServerSessionState);
                        wupServerClientStub.isReady.returns(true);
                        wupServerSessionState.setRequestId(0);

                        const dataAggregatorAddMethodSpy = sinon.spy(dataAggregator, 'add');
                        const dataAggregatorResetMethodSpy = sinon.spy(dataAggregator, 'reset');
                        const dataAggregatorIsEmptyMethodSpy = sinon.spy(dataAggregator, 'isEmpty');

                        // call the callback of to simulate message arrival
                        const msgFromMain = {
                            eventName: 'msg',
                            data: {
                                message: 'msg1', url: 'url', level: 2, seq: 1,
                            },
                        };

                        const dataDispatcher = new DataDispatcher(wupServerClientStub, dataAggregator,
                            new WupDispatchRateCalculatorFactory(new WupStatisticsService(30000)),
                            { type: WupDispatchRateType.constant, initialRateValueMs: 0 });

                        dataDispatcher.add(msgFromMain);
                        dataDispatcher.sendIfRequired();

                        assert.isTrue(wupServerClientStub.sendData.calledOnce);
                        assert.deepEqual(wupServerClientStub.sendData.firstCall.args[0].msg, [msgFromMain.data], 'sendData was called with invalid data');

                        assert.isTrue(dataAggregatorAddMethodSpy.calledOnce, 'data aggregator add wasnt called once');
                        assert.deepEqual(dataAggregatorAddMethodSpy.firstCall.args[0], msgFromMain);
                        assert.isTrue(dataAggregatorResetMethodSpy.calledOnce, 'data aggregator reset wasnt called once');
                        assert.isTrue(dataAggregatorIsEmptyMethodSpy.calledOnce, 'data aggregator isEmpty wasnt called once');
                    });

                    it('should send log wup to directly: ', function () {
                        const wupServerClientStub = sinon.createStubInstance(WupServerClient);
                        const logAggregator = new LogAggregator();
                        wupServerClientStub.isReady.returns(true);

                        const logAggregatorAddMethodSpy = sinon.spy(logAggregator, 'add');
                        const logAggregatorResetMethodSpy = sinon.spy(logAggregator, 'reset');
                        const logAggregatorIsEmptyMethodSpy = sinon.spy(logAggregator, 'isEmpty');

                        // call the callback of to simulate message arrival
                        const logFromMain = {
                            data: {
                                message: 'msg1', url: 'url', level: 20, seq: 1,
                            },
                        };

                        const dataDispatcher = new DataDispatcher(wupServerClientStub, logAggregator, new WupDispatchRateCalculatorFactory(new WupStatisticsService(30000)),
                            { type: WupDispatchRateType.constant, initialRateValueMs: 0 });

                        dataDispatcher.add(logFromMain);
                        dataDispatcher.sendIfRequired();

                        assert.isTrue(wupServerClientStub.sendData.calledOnce);
                        assert.isArray(wupServerClientStub.sendData.firstCall.args[0], 'sendData was called with invalid data. Argument should be an array');
                        assert.deepEqual(wupServerClientStub.sendData.firstCall.args[0], [logFromMain.data], 'sendData was called with invalid data');

                        assert.isTrue(logAggregatorAddMethodSpy.calledOnce, 'log aggregator add wasnt called once');
                        assert.deepEqual(logAggregatorAddMethodSpy.firstCall.args[0], logFromMain);
                        assert.isTrue(logAggregatorResetMethodSpy.calledOnce, 'log aggregator reset wasnt called once');
                        assert.isTrue(logAggregatorIsEmptyMethodSpy.calledOnce, 'log aggregator isEmpty wasnt called once');
                    });
                });

                describe('with multiple event: ', function () {
                    it('should send data wup to directly: ', function () {
                        const wupServerClientStub = sinon.createStubInstance(WupServerClient);
                        const wupServerSessionState = new WupServerSessionState();
                        const dataAggregator = new DataAggregator(wupServerSessionState);
                        wupServerClientStub.isReady.returns(true);

                        wupServerSessionState.setRequestId(0);

                        const dataAggregatorAddMethodSpy = sinon.spy(dataAggregator, 'add');
                        const dataAggregatorResetMethodSpy = sinon.spy(dataAggregator, 'reset');
                        const dataAggregatorIsEmptyMethodSpy = sinon.spy(dataAggregator, 'isEmpty');

                        // call the callback of to simulate message arrival
                        const msgFromMain = [
                            {
                                eventName: 'msg',
                                data: {
                                    message: 'msg1', url: 'url1', level: 1, seq: 1,
                                },
                            },
                            {
                                eventName: 'msg',
                                data: {
                                    message: 'msg2', url: 'url2', level: 2, seq: 2,
                                },
                            },
                        ];

                        const dataDispatcher = new DataDispatcher(wupServerClientStub, dataAggregator, new WupDispatchRateCalculatorFactory(new WupStatisticsService(30000)),
                            { type: WupDispatchRateType.constant, initialRateValueMs: 0 });

                        for (let i = 0; i < msgFromMain.length; i++) {
                            dataDispatcher.add(msgFromMain[i]);
                        }

                        dataDispatcher.sendIfRequired();

                        assert.isTrue(wupServerClientStub.sendData.calledOnce);
                        assert.deepEqual(wupServerClientStub.sendData.firstCall.args[0].msg, [msgFromMain[0].data, msgFromMain[1].data], 'sendData was called with invalid data');

                        assert.isTrue(dataAggregatorAddMethodSpy.calledTwice, 'data aggregator add wasnt called twice');
                        assert.deepEqual(dataAggregatorAddMethodSpy.firstCall.args[0], msgFromMain[0]);
                        assert.deepEqual(dataAggregatorAddMethodSpy.secondCall.args[0], msgFromMain[1]);
                        assert.isTrue(dataAggregatorResetMethodSpy.calledOnce, 'data aggregator reset wasnt called once');
                        assert.isTrue(dataAggregatorIsEmptyMethodSpy.calledOnce, 'data aggregator isEmpty wasnt called once');
                    });

                    it('should send log wup to directly: ', function () {
                        const wupServerClientStub = sinon.createStubInstance(WupServerClient);
                        const logAggregator = new LogAggregator();
                        wupServerClientStub.isReady.returns(true);

                        const logAggregatorAddMethodSpy = sinon.spy(logAggregator, 'add');
                        const logAggregatorResetMethodSpy = sinon.spy(logAggregator, 'reset');
                        const logAggregatorIsEmptyMethodSpy = sinon.spy(logAggregator, 'isEmpty');

                        // call the callback of to simulate message arrival
                        const logFromMain = [
                            {
                                data: {
                                    message: 'msg1', url: 'url1', level: 20, seq: 1,
                                },
                            },
                            {
                                data: {
                                    message: 'msg2', url: 'url2', level: 20, seq: 2,
                                },
                            },
                        ];

                        const dataDispatcher = new DataDispatcher(wupServerClientStub, logAggregator, new WupDispatchRateCalculatorFactory(new WupStatisticsService(30000)),
                            { type: WupDispatchRateType.constant, initialRateValueMs: 0 });

                        for (let i = 0; i < logFromMain.length; i++) {
                            dataDispatcher.add(logFromMain[i]);
                        }

                        dataDispatcher.sendIfRequired();

                        assert.isTrue(wupServerClientStub.sendData.calledOnce);
                        assert.isArray(wupServerClientStub.sendData.firstCall.args[0], 'sendData was called with invalid data. Argument should be an array');
                        assert.deepEqual(wupServerClientStub.sendData.firstCall.args[0], [logFromMain[0].data, logFromMain[1].data], 'sendData was called with invalid data');

                        assert.isTrue(logAggregatorAddMethodSpy.calledTwice, 'log aggregator add wasnt called twice');
                        assert.deepEqual(logAggregatorAddMethodSpy.firstCall.args[0], logFromMain[0]);
                        assert.deepEqual(logAggregatorAddMethodSpy.secondCall.args[0], logFromMain[1]);
                        assert.isTrue(logAggregatorResetMethodSpy.calledOnce, 'log aggregator reset wasnt called once');
                        assert.isTrue(logAggregatorIsEmptyMethodSpy.calledOnce, 'log aggregator isEmpty wasnt called once');
                    });
                });
            });
        });

        describe('with interval: ', function () {
            before(function () {
                this.clock = sinon.useFakeTimers();
            });

            after(function () {
                this.clock.restore();
            });
            describe('with callbacks supplied to handle messages: ', function () {
                describe('with single event: ', function () {
                    it('should send wup when constant interval arrives: ', function () {
                        const wupServerClientStub = sinon.createStubInstance(WupServerClient);
                        const wupServerSessionState = new WupServerSessionState();
                        const dataAggregator = new DataAggregator(wupServerSessionState);
                        wupServerClientStub.isReady.returns(true);
                        wupServerSessionState.setRequestId(0);

                        const dataAggregatorAddMethodSpy = sinon.spy(dataAggregator, 'add');
                        const dataAggregatorResetMethodSpy = sinon.spy(dataAggregator, 'reset');
                        const dataAggregatorIsEmptyMethodSpy = sinon.spy(dataAggregator, 'isEmpty');

                        // call the callback of to simulate message arrival
                        const msgFromMain = {
                            eventName: 'msg',
                            data: {
                                message: 'msg1', url: 'url', level: 2, seq: 1,
                            },
                        };

                        const dataDispatcher = new DataDispatcher(wupServerClientStub, dataAggregator,
                            new WupDispatchRateCalculatorFactory(new WupStatisticsService(30000)),
                            {
                                type: 'constant', //  (incremental, constant)
                                initialRateValueMs: 500,
                            });

                        dataDispatcher.add(msgFromMain);
                        dataDispatcher.sendIfRequired();

                        assert.isTrue(wupServerClientStub.sendData.notCalled, 'serverComm was called');

                        this.clock.tick(500);

                        assert.isTrue(wupServerClientStub.sendData.calledOnce);
                        assert.deepEqual(wupServerClientStub.sendData.firstCall.args[0].msg, [msgFromMain.data], 'sendData was called with invalid data');

                        assert.isTrue(dataAggregatorAddMethodSpy.calledOnce, 'data aggregator add wasnt called once');
                        assert.deepEqual(dataAggregatorAddMethodSpy.firstCall.args[0], msgFromMain);
                        assert.isTrue(dataAggregatorResetMethodSpy.calledOnce, 'data aggregator reset wasnt called once');
                        assert.isTrue(dataAggregatorIsEmptyMethodSpy.calledOnce, 'data aggregator isEmpty wasnt called once');
                    });

                    it('should send wup when incremental interval arrives: ', function () {
                        const wupServerClientStub = sinon.createStubInstance(WupServerClient);
                        const wupServerSessionState = new WupServerSessionState();
                        const dataAggregator = new DataAggregator(wupServerSessionState);
                        wupServerClientStub.isReady.returns(true);
                        wupServerSessionState.setRequestId(0);

                        const dataAggregatorAddMethodSpy = sinon.spy(dataAggregator, 'add');
                        const dataAggregatorResetMethodSpy = sinon.spy(dataAggregator, 'reset');
                        const dataAggregatorIsEmptyMethodSpy = sinon.spy(dataAggregator, 'isEmpty');

                        // call the callback of to simulate message arrival
                        const msgFromMain = {
                            eventName: 'msg',
                            data: {
                                message: 'msg1', url: 'url', level: 2, seq: 1,
                            },
                        };

                        const dataDispatcher = new DataDispatcher(wupServerClientStub, dataAggregator,
                            new WupDispatchRateCalculatorFactory(new WupStatisticsService(30000)),
                            {
                                type: 'incremental', //  (incremental, constant)
                                initialRateValueMs: 1500, // The initial rate
                                incrementStepMs: 500, // The rate increment rate
                                incrementStopMs: 5000, // At what rate value do we stop incrementing
                                incrementStartWupSendCount: 20, // After how many wups do we start increasing
                            });

                        dataDispatcher.add(msgFromMain);
                        dataDispatcher.sendIfRequired();

                        assert.isTrue(wupServerClientStub.sendData.notCalled, 'serverComm was called');

                        this.clock.tick(1500);

                        assert.isTrue(wupServerClientStub.sendData.calledOnce);
                        assert.deepEqual(wupServerClientStub.sendData.firstCall.args[0].msg, [msgFromMain.data], 'sendData was called with invalid data');

                        assert.isTrue(dataAggregatorAddMethodSpy.calledOnce, 'data aggregator add wasnt called once');
                        assert.deepEqual(dataAggregatorAddMethodSpy.firstCall.args[0], msgFromMain);
                        assert.isTrue(dataAggregatorResetMethodSpy.calledOnce, 'data aggregator reset wasnt called once');
                        assert.isTrue(dataAggregatorIsEmptyMethodSpy.calledOnce, 'data aggregator isEmpty wasnt called once');
                    });
                });
                describe('with multiple event: ', function () {
                    it('should send wup when constant interval arrives: ', function () {
                        this.timeout(30000);

                        const wupServerClientStub = sinon.createStubInstance(WupServerClient);
                        const wupServerSessionState = new WupServerSessionState();
                        const dataAggregator = new DataAggregator(wupServerSessionState);
                        wupServerClientStub.isReady.returns(true);
                        wupServerSessionState.setRequestId(0);

                        const dataAggregatorAddMethodSpy = sinon.spy(dataAggregator, 'add');
                        const dataAggregatorResetMethodSpy = sinon.spy(dataAggregator, 'reset');
                        const dataAggregatorIsEmptyMethodSpy = sinon.spy(dataAggregator, 'isEmpty');

                        // call the callback of to simulate message arrival
                        const msgFromMain = [
                            {
                                eventName: 'msg',
                                data: {
                                    message: 'msg1', url: 'url1', level: 1, seq: 1,
                                },
                            },
                            {
                                eventName: 'msg',
                                data: {
                                    message: 'msg2', url: 'url2', level: 2, seq: 2,
                                },
                            },
                        ];

                        const dataDispatcher = new DataDispatcher(wupServerClientStub, dataAggregator, new WupDispatchRateCalculatorFactory(new WupStatisticsService(30000)),
                            {
                                type: 'constant',
                                initialRateValueMs: 2000,
                            });

                        for (let i = 0; i < msgFromMain.length; i++) {
                            dataDispatcher.add(msgFromMain[i]);
                        }

                        dataDispatcher.sendIfRequired();

                        assert.isTrue(wupServerClientStub.sendData.notCalled, 'serverComm was called');

                        this.clock.tick(2000);

                        assert.isTrue(wupServerClientStub.sendData.calledOnce);
                        assert.deepEqual(wupServerClientStub.sendData.firstCall.args[0].msg, [msgFromMain[0].data, msgFromMain[1].data], 'sendData was called with invalid data');

                        assert.isTrue(dataAggregatorAddMethodSpy.calledTwice, 'data aggregator add wasnt called twice');
                        assert.deepEqual(dataAggregatorAddMethodSpy.firstCall.args[0], msgFromMain[0]);
                        assert.deepEqual(dataAggregatorAddMethodSpy.secondCall.args[0], msgFromMain[1]);
                        assert.isTrue(dataAggregatorResetMethodSpy.calledOnce, 'data aggregator reset wasnt called once');
                        assert.isTrue(dataAggregatorIsEmptyMethodSpy.calledOnce, 'data aggregator isEmpty wasnt called once');
                    });

                    it('should send wup when incremental interval arrives: ', function () {
                        this.timeout(30000);

                        const wupServerClientStub = sinon.createStubInstance(WupServerClient);
                        const wupServerSessionState = new WupServerSessionState();

                        const dataAggregator = new DataAggregator(wupServerSessionState);
                        wupServerClientStub.isReady.returns(true);
                        wupServerSessionState.setRequestId(0);

                        const dataAggregatorAddMethodSpy = sinon.spy(dataAggregator, 'add');
                        const dataAggregatorResetMethodSpy = sinon.spy(dataAggregator, 'reset');
                        const dataAggregatorIsEmptyMethodSpy = sinon.spy(dataAggregator, 'isEmpty');

                        // call the callback of to simulate message arrival
                        const msgFromMain = [
                            {
                                eventName: 'msg',
                                data: {
                                    message: 'msg1', url: 'url1', level: 1, seq: 1,
                                },
                            },
                            {
                                eventName: 'msg',
                                data: {
                                    message: 'msg2', url: 'url2', level: 2, seq: 2,
                                },
                            },
                        ];

                        const dataDispatcher = new DataDispatcher(wupServerClientStub, dataAggregator, new WupDispatchRateCalculatorFactory(new WupStatisticsService(30000)),
                            {
                                type: 'incremental', //  (incremental, constant)
                                initialRateValueMs: 1500, // The initial rate
                                incrementStepMs: 500, // The rate increment rate
                                incrementStopMs: 5000, // At what rate value do we stop incrementing
                                incrementStartWupSendCount: 20, // After how many wups do we start increasing
                            });

                        for (let i = 0; i < msgFromMain.length; i++) {
                            dataDispatcher.add(msgFromMain[i]);
                        }

                        dataDispatcher.sendIfRequired();

                        assert.isTrue(wupServerClientStub.sendData.notCalled, 'serverComm was called');

                        this.clock.tick(1500);

                        assert.isTrue(wupServerClientStub.sendData.calledOnce);
                        assert.deepEqual(wupServerClientStub.sendData.firstCall.args[0].msg, [msgFromMain[0].data, msgFromMain[1].data], 'sendData was called with invalid data');

                        assert.isTrue(dataAggregatorAddMethodSpy.calledTwice, 'data aggregator add wasnt called twice');
                        assert.deepEqual(dataAggregatorAddMethodSpy.firstCall.args[0], msgFromMain[0]);
                        assert.deepEqual(dataAggregatorAddMethodSpy.secondCall.args[0], msgFromMain[1]);
                        assert.isTrue(dataAggregatorResetMethodSpy.calledOnce, 'data aggregator reset wasnt called once');
                        assert.isTrue(dataAggregatorIsEmptyMethodSpy.calledOnce, 'data aggregator isEmpty wasnt called once');

                        wupServerClientStub.sendData.resetHistory();
                        dataAggregatorAddMethodSpy.resetHistory();
                        dataAggregatorResetMethodSpy.resetHistory();
                        dataAggregatorIsEmptyMethodSpy.resetHistory();

                        for (let i = 0; i < msgFromMain.length; i++) {
                            dataDispatcher.add(msgFromMain[i]);
                        }

                        dataDispatcher.sendIfRequired();

                        assert.isTrue(wupServerClientStub.sendData.notCalled, 'serverComm was called');

                        this.clock.tick(2000);

                        assert.isTrue(wupServerClientStub.sendData.calledOnce);
                        assert.deepEqual(wupServerClientStub.sendData.firstCall.args[0].msg, [msgFromMain[0].data, msgFromMain[1].data], 'sendData was called with invalid data');

                        assert.isTrue(dataAggregatorAddMethodSpy.calledTwice, 'data aggregator add wasnt called twice');
                        assert.deepEqual(dataAggregatorAddMethodSpy.firstCall.args[0], msgFromMain[0]);
                        assert.deepEqual(dataAggregatorAddMethodSpy.secondCall.args[0], msgFromMain[1]);
                        assert.isTrue(dataAggregatorResetMethodSpy.calledOnce, 'data aggregator reset wasnt called once');
                        assert.isTrue(dataAggregatorIsEmptyMethodSpy.calledOnce, 'data aggregator isEmpty wasnt called once');
                    });
                });
            });
        });
    });

    describe('updateByConfig tests: ', function () {
        before(function () {
            this.clock = sinon.useFakeTimers();
        });

        after(function () {
            this.clock.restore();
        });
        it('should change the interval to new one when given', function () {
            const wupServerClientStub = sinon.createStubInstance(WupServerClient);
            const wupServerSessionState = new WupServerSessionState();
            const dataAggregator = new DataAggregator(wupServerSessionState);
            wupServerClientStub.isReady.returns(true);

            wupServerSessionState.setRequestId(0);

            const dataAggregatorAddMethodSpy = sinon.spy(dataAggregator, 'add');
            const dataAggregatorResetMethodSpy = sinon.spy(dataAggregator, 'reset');
            const dataAggregatorIsEmptyMethodSpy = sinon.spy(dataAggregator, 'isEmpty');

            // call the callback of to simulate message arrival
            const msgFromMain = [
                {
                    eventName: 'msg',
                    data: {
                        message: 'msg1', url: 'url1', level: 1, seq: 1,
                    },
                },
                {
                    eventName: 'msg',
                    data: {
                        message: 'msg2', url: 'url2', level: 2, seq: 2,
                    },
                },
            ];

            const dataDispatcher = new DataDispatcher(wupServerClientStub, dataAggregator, new WupDispatchRateCalculatorFactory(new WupStatisticsService(30000)),
                {
                    type: 'incremental', //  (incremental, constant)
                    initialRateValueMs: 500, // The initial rate
                    incrementStepMs: 500, // The rate increment rate
                    incrementStopMs: 5000, // At what rate value do we stop incrementing
                    incrementStartWupSendCount: 20, // After how many wups do we start increasing
                });

            for (let i = 0; i < msgFromMain.length; i++) {
                dataDispatcher.add(msgFromMain[i]);
            }

            dataDispatcher.sendIfRequired();

            assert.isTrue(wupServerClientStub.sendData.notCalled, 'serverComm was called');

            this.clock.tick(500);

            assert.isTrue(wupServerClientStub.sendData.calledOnce);
            assert.deepEqual(wupServerClientStub.sendData.firstCall.args[0].msg, [msgFromMain[0].data, msgFromMain[1].data], 'sendData was called with invalid data');

            const confMgr = sinon.stub(new ConfigurationRepository());
            confMgr.get.returns({
                type: 'incremental', //  (incremental, constant)
                initialRateValueMs: 1000, // The initial rate
                incrementStepMs: 500, // The rate increment rate
                incrementStopMs: 5000, // At what rate value do we stop incrementing
                incrementStartWupSendCount: 20, // After how many wups do we start increasing
            });
            wupServerClientStub.sendData.reset();

            dataDispatcher.updateByConfig(confMgr.get(ConfigurationFields.dataWupDispatchRateSettings));
            assert.equal(1000, dataDispatcher._sendToServerInterval, 'interval was not updated');

            const thirdMsg = {
                eventName: 'msg',
                data: {
                    message: 'msg3', url: 'url3', level: 2, seq: 2,
                },
            };

            dataDispatcher.add(thirdMsg);

            dataDispatcher.sendIfRequired();

            this.clock.tick(500);
            assert.isTrue(wupServerClientStub.sendData.notCalled, 'serverComm was called');

            this.clock.tick(500);

            assert.isTrue(wupServerClientStub.sendData.calledOnce, 'sendData was not called once');

            assert.isTrue(dataAggregatorAddMethodSpy.calledThrice, 'data aggregator add wasnt called once');
            assert.deepEqual(dataAggregatorAddMethodSpy.firstCall.args[0], msgFromMain[0]);
            assert.deepEqual(dataAggregatorAddMethodSpy.secondCall.args[0], msgFromMain[1]);
            assert.deepEqual(dataAggregatorAddMethodSpy.thirdCall.args[0], thirdMsg);
            assert.isTrue(dataAggregatorResetMethodSpy.calledTwice, 'data aggregator reset wasnt called once');
            assert.isTrue(dataAggregatorIsEmptyMethodSpy.calledTwice, 'data aggregator isEmpty wasnt called once');
        });

        it('should NOT change the interval to new one when no interval was given', function () {
            const wupServerClientStub = sinon.createStubInstance(WupServerClient);
            const wupServerSessionState = new WupServerSessionState();
            const dataAggregator = new DataAggregator(wupServerSessionState);
            wupServerClientStub.isReady.returns(true);

            wupServerSessionState.setRequestId(0);

            const dataAggregatorAddMethodSpy = sinon.spy(dataAggregator, 'add');
            const dataAggregatorResetMethodSpy = sinon.spy(dataAggregator, 'reset');
            const dataAggregatorIsEmptyMethodSpy = sinon.spy(dataAggregator, 'isEmpty');

            // call the callback of to simulate message arrival
            const msgFromMain = [
                {
                    eventName: 'msg',
                    data: {
                        message: 'msg1', url: 'url1', level: 1, seq: 1,
                    },
                },
                {
                    eventName: 'msg',
                    data: {
                        message: 'msg2', url: 'url2', level: 2, seq: 2,
                    },
                },
            ];

            const dataDispatcher = new DataDispatcher(wupServerClientStub, dataAggregator, new WupDispatchRateCalculatorFactory(new WupStatisticsService(30000)),
                {
                    type: 'incremental', //  (incremental, constant)
                    initialRateValueMs: 500, // The initial rate
                    incrementStepMs: 500, // The rate increment rate
                    incrementStopMs: 5000, // At what rate value do we stop incrementing
                    incrementStartWupSendCount: 20, // After how many wups do we start increasing
                });

            for (let i = 0; i < msgFromMain.length; i++) {
                dataDispatcher.add(msgFromMain[i]);
            }

            dataDispatcher.sendIfRequired();

            assert.isTrue(wupServerClientStub.sendData.notCalled, 'serverComm was called');

            this.clock.tick(500);

            assert.isTrue(wupServerClientStub.sendData.calledOnce);
            assert.deepEqual(wupServerClientStub.sendData.firstCall.args[0].msg, [msgFromMain[0].data, msgFromMain[1].data], 'sendData was called with invalid data');

            const confMgr = sinon.stub(new ConfigurationRepository());
            confMgr.get.returns(undefined);
            wupServerClientStub.sendData.reset();

            dataDispatcher.updateByConfig(confMgr.get(ConfigurationFields.logWupDispatchRateSettings));
            assert.equal(500, dataDispatcher._sendToServerInterval, 'interval was not updated');

            const thirdMsg = {
                eventName: 'msg',
                data: {
                    message: 'msg3', url: 'url3', level: 2, seq: 2,
                },
            };

            dataDispatcher.add(thirdMsg);

            dataDispatcher.sendIfRequired();

            this.clock.tick(500);
            assert.isTrue(wupServerClientStub.sendData.calledOnce);
            // This line is commented out since the sinon stub returns the wrong value for some reason...
            // assert.isTrue(serverComm.sendData.calledWith({a: 'b'}));

            assert.isTrue(dataAggregatorAddMethodSpy.calledThrice, 'data aggregator add wasnt called once');
            assert.deepEqual(dataAggregatorAddMethodSpy.firstCall.args[0], msgFromMain[0]);
            assert.deepEqual(dataAggregatorAddMethodSpy.secondCall.args[0], msgFromMain[1]);
            assert.deepEqual(dataAggregatorAddMethodSpy.thirdCall.args[0], thirdMsg);
            assert.isTrue(dataAggregatorResetMethodSpy.calledTwice, 'data aggregator reset wasnt called once');
            assert.isTrue(dataAggregatorIsEmptyMethodSpy.calledTwice, 'data aggregator isEmpty wasnt called once');
        });
    });
});
