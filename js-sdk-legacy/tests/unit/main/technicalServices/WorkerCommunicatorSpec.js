import { assert } from 'chai';
/* eslint-disable */
// Use the below import statement if you wish to upgrade the worker-loader to 3.x.x
// At the moment, unless we give up IE 11, we have to remain with worker-loader 2.0.0
import DummyWorker from 'worker-loader?inline=no-fallback&filename=worker.js!./WorkerCommunicatorDummyDedicatedWorker.js';
/* eslint-enable */
import WorkerCommunicator from '../../../../src/main/technicalServices/WorkerCommunicator';
import { TestUtils } from '../../../TestUtils';
import WorkerWrapper from '../../../../src/main/technicalServices/WorkerWrapper';

describe('WorkerCommunicator tests:', function () {
    const bgWorkerApi = {
        _port: {
            _onMsgCb: undefined,
            start() {
            },
            setonmessage(cb) {
                this._onMsgCb = cb;
            },
            get onmessage() {
                return this._onMsgCb;
            },
            postMessage: () => {},
        },
        get port() {
            return this._port;
        },
        stumFunc() {
            // Dummy func so we can stub the object
        },
    };

    beforeEach(function () {
        this.sandbox = sinon.createSandbox();
    });

    afterEach(function () {
        this.sandbox.restore();
    });

    describe('Ctor tests', function () {
        it('should listen to the backgroundWorker messages', function () {
            const bgWorkerMock = this.sandbox.stub(bgWorkerApi);
            assert.isUndefined(bgWorkerMock.port.onmessage);
            const workerComm = new WorkerCommunicator();
            workerComm.setMessagingPort(bgWorkerMock.port);
            assert.isDefined(bgWorkerMock.port.onmessage);
        });
    });

    describe('message passing tests', function () {
        it('should do nothing when message arrives with no listeners', function () {
            const bgWorkerMock = this.sandbox.stub(bgWorkerApi);
            const workerComm = new WorkerCommunicator();
            workerComm.setMessagingPort(bgWorkerMock.port);
            bgWorkerMock.port.onmessage({ data: { msgType: 'A', data: 'B' } });
        });

        it('should call to listener on msgType when message arrives with the same msgType', function () {
            const bgWorkerMock = this.sandbox.stub(bgWorkerApi);
            const workerComm = new WorkerCommunicator();
            workerComm.setMessagingPort(bgWorkerMock.port);
            const cbSpy = this.sandbox.spy();
            workerComm.addMessageListener('aMsgType', cbSpy);
            bgWorkerMock.port.onmessage({ data: { msgType: 'aMsgType', data: 'myData' } });
            assert.isTrue(cbSpy.calledOnce);
            assert.isTrue(cbSpy.calledWith('myData'));

            // verify that the listener still listens since no isOneTime was passed to addMessageListener
            bgWorkerMock.port.onmessage({ data: { msgType: 'aMsgType', data: 'myData2' } });
            assert.isTrue(cbSpy.calledTwice);
            assert.isTrue(cbSpy.calledWith('myData2'));

            // verify listener is not called when other msgType sent
            bgWorkerMock.port.onmessage({ data: { msgType: 'bMsgType', data: 'myData' } });
            assert.isTrue(cbSpy.calledTwice);
        });

        it('should call to listener on msgType when message arrives with the same msgType', function () {
            const bgWorkerMock = this.sandbox.stub(bgWorkerApi);
            const workerComm = new WorkerCommunicator();
            workerComm.setMessagingPort(bgWorkerMock.port);
            const cbSpy = this.sandbox.spy();
            workerComm.addMessageListener('aMsgType', cbSpy);
            bgWorkerMock.port.onmessage({ data: { msgType: 'aMsgType', data: 'myData' } });
            assert.isTrue(cbSpy.calledOnce);
            assert.isTrue(cbSpy.calledWith('myData'));
        });

        it('should call to all listeners on msgType when message arrives with the same msgType', function () {
            const bgWorkerMock = this.sandbox.stub(bgWorkerApi);
            const workerComm = new WorkerCommunicator();
            workerComm.setMessagingPort(bgWorkerMock.port);
            const cbListener1 = this.sandbox.spy();
            const cbListener2 = this.sandbox.spy();
            workerComm.addMessageListener('aMsgType', cbListener1);
            workerComm.addMessageListener('aMsgType', cbListener2);
            bgWorkerMock.port.onmessage({ data: { msgType: 'aMsgType', data: 'myData' } });
            assert.isTrue(cbListener1.calledOnce);
            assert.isTrue(cbListener2.calledOnce);
            assert.isTrue(cbListener1.calledWith('myData'));
            assert.isTrue(cbListener2.calledWith('myData'));
        });

        it('should remove listener that registered with isOneTime=true on msgType when message arrives with the same msgType', function () {
            const bgWorkerMock = this.sandbox.stub(bgWorkerApi);
            const workerComm = new WorkerCommunicator();
            workerComm.setMessagingPort(bgWorkerMock.port);
            const cbListener1 = this.sandbox.spy();
                const cbListener2 = this.sandbox.spy();
            workerComm.addMessageListener('aMsgType', cbListener1, true);
            workerComm.addMessageListener('aMsgType', cbListener2);
            bgWorkerMock.port.onmessage({ data: { msgType: 'aMsgType', data: 'myData' } });
            assert.isTrue(cbListener1.calledOnce, `First callback was called not called once. It was called ${cbListener1.callCount} times`);
            assert.isTrue(cbListener1.calledWith('myData'), 'First callback was not called with expected arg');
            assert.isTrue(cbListener2.calledWith('myData'), 'Second callback was not called with expected arg');
            bgWorkerMock.port.onmessage({ data: { msgType: 'aMsgType', data: 'myData2' } });
            assert.isTrue(cbListener1.calledOnce, `First callback was called not called once. It was called ${cbListener1.callCount} times`);
            assert.isTrue(cbListener2.calledTwice, `Second callback was called not called twice. It was called ${cbListener1.callCount} times`);
            assert.isTrue(cbListener2.calledWith('myData2'), `Second callback was not called with expected arg. ${cbListener2.secondCall.args}`);
        });

        it('multiple senders should send and receive responses without interfering each other', function () {
            const bgWorkerMock = this.sandbox.stub(bgWorkerApi);
            bgWorkerMock.port.postMessage = this.sandbox.spy();
            const workerComm = new WorkerCommunicator();
            workerComm.setMessagingPort(bgWorkerMock.port);
            const cb1 = this.sandbox.spy();
                const cb2 = this.sandbox.spy();

            // send messages
            workerComm.sendAsync('aMsgType', 'aMyData', 'aMsgType', cb1);
            workerComm.sendAsync('bMsgType', 'bMyData', 'bMsgType', cb2);
            assert.isTrue(bgWorkerMock.port.postMessage.calledTwice);

            const argsInFirstCall = bgWorkerMock.port.postMessage.args[0];
            assert.equal(argsInFirstCall[0].msgType, 'aMsgType');
            assert.equal(argsInFirstCall[0].data, 'aMyData');

            // respond to first msg
            bgWorkerMock.port.onmessage({ data: { msgType: 'aMsgType', data: 'responseMyDataA' } });
            assert.isTrue(cb1.calledOnce);
            assert.isTrue(cb1.calledWith('responseMyDataA'));
            assert.isTrue(cb2.notCalled);

            const argsInSecondCall = bgWorkerMock.port.postMessage.args[1];
            assert.equal(argsInSecondCall[0].msgType, 'bMsgType');
            assert.equal(argsInSecondCall[0].data, 'bMyData');

            // respond to second msg
            bgWorkerMock.port.onmessage({ data: { msgType: 'bMsgType', data: 'responseMyDataB' } });
            assert.isTrue(cb2.calledOnce);
            assert.isTrue(cb2.calledWith('responseMyDataB'));
        });

        it('sendAsync should pass message from main to worker and call the callback', async function () {
            this.retries(3);

            const dummyWorker = new DummyWorker();
            const workerWrapper = new WorkerWrapper(dummyWorker);

            const workerComm = new WorkerCommunicator();
            workerComm.setMessagingPort(workerWrapper.port);

            let callbackCalled = false;
            workerComm.addMessageListener('WorkerAlive', () => {
                workerComm.sendAsync('mainToWorker', 'mainToWorkerData', 'workerToMain', function (data) {
                    assert.equal(data, 'workerToMainData');
                    workerWrapper.close();

                    callbackCalled = true;
                }, true);
            }, true);

            await TestUtils.waitForNoAssertion(() => {
                assert.isTrue(callbackCalled, 'Event listener for WorkerAlive event was not called');
            }).finally(() => {
                workerWrapper.close();
            });
        });

        it('addMessageListener callback should be called when worker sends message with the same messageType', async function () {
            this.retries(3);

            const dummyWorker = new DummyWorker();
            const workerWrapper = new WorkerWrapper(dummyWorker);

            const workerComm = new WorkerCommunicator();
            workerComm.setMessagingPort(workerWrapper.port);

            let callbackCalled = false;
            workerComm.addMessageListener('WorkerAlive', () => {
                workerComm.addMessageListener('testMainListenerStartResponse', function (data) {
                    assert.equal(data, 'testMainListenerStartDataResponse');
                    workerWrapper.close();

                    callbackCalled = true;
                }, true);

                workerComm.sendAsync('testMainListenerStart', 'testMainListenerStartData');
            }, true);

            await TestUtils.waitForNoAssertion(() => {
                assert.isTrue(callbackCalled, 'Event listener for WorkerAlive event was not called');
            }).finally(() => {
                workerWrapper.close();
            });
        });
    });
});
