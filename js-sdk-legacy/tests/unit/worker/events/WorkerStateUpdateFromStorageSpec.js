import {assert} from "chai";
import sinon from "sinon";
import WorkerStateUpdateFromStorage from "../../../../src/worker/events/WorkerStateUpdateFromStorage";
import WorkerCommunicator from "../../../../src/main/technicalServices/WorkerCommunicator";
import WupServerSessionState from "../../../../src/worker/communication/WupServerSessionState";
import LogServerClient from "../../../../src/worker/communication/LogServerClient";

describe("WorkerStateUpdateFromStorage", function () {
    let sandbox;
    let mainCommunicator;
    let wupServerSessionState;
    let workerStateUpdateFromStorage;
    let logServerClient;

    beforeEach(function () {
        sandbox = sinon.createSandbox();
        mainCommunicator = sandbox.createStubInstance(WorkerCommunicator);
        wupServerSessionState = sandbox.createStubInstance(WupServerSessionState);
        logServerClient = sandbox.createStubInstance(LogServerClient);
        workerStateUpdateFromStorage = new WorkerStateUpdateFromStorage(mainCommunicator, wupServerSessionState, logServerClient);
    });

    afterEach(function () {
        sandbox.restore();
        mainCommunicator = null;
        wupServerSessionState = null;
        workerStateUpdateFromStorage = null;
        logServerClient = null;
    });

    it("should handle V4 state update correctly", function () {
        const msg = {
            requestId: 'someRequestId',
            ott: 'someOtt'
        };

        workerStateUpdateFromStorage._handle(msg);

        assert.isTrue(wupServerSessionState.setRequestId.calledWith('someRequestId', false));
        assert.isTrue(wupServerSessionState.setOtt.calledWith('someOtt'));
    });

    it("should handle V3 state update correctly", function () {
        const msg = {
            requestId: 'someRequestId',
            sts: 'someSts',
            std: 'someStd'
        };

        workerStateUpdateFromStorage._handle(msg);

        assert.isTrue(wupServerSessionState.setRequestId.calledWith('someRequestId', false));
        assert.isTrue(wupServerSessionState.setSts.calledWith('someSts'));
        assert.isTrue(wupServerSessionState.setStd.calledWith('someStd'));
    });

    it("should not set anything if msg is not valid", function () {
        const msg = {
            requestId: null,
            sts: 'someSts',
            std: 'someStd'
        };

        workerStateUpdateFromStorage._handle(msg);

        assert.isFalse(wupServerSessionState.setRequestId.called);
        assert.isFalse(wupServerSessionState.setSts.called);
        assert.isFalse(wupServerSessionState.setStd.called);
        assert.isFalse(wupServerSessionState.setOtt.called);
    });

    it('should _handleStateChanged call log client', () => {
        const msg = {
            SDK_state: 0
        };
        workerStateUpdateFromStorage._handleStateChanged(msg)

        assert.isTrue(logServerClient.setIsPaused.called);
    });
});
