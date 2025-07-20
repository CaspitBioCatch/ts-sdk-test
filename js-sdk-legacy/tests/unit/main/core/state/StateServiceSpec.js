import MessageBus from '../../../../../src/main/technicalServices/MessageBus';
import StateService from '../../../../../src/main/core/state/StateService';
import { State } from '../../../../../src/main/core/state/State';

describe('StateService tests:', function () {
    beforeEach(function () {
        this.sandbox = sinon.createSandbox();
        this.messageBusStub = this.sandbox.createStubInstance(MessageBus);
        this.stateService = new StateService(this.messageBusStub);
    });

    afterEach(function () {
        this.sandbox.restore();
    });

    describe('getState:', function () {
        it('get state successfully', function () {
            const state = this.stateService.getState();

            assert.equal(state, State.stopped);
        });

        it('get updated state successfully', function () {
            this.stateService.updateState(State.paused);

            const state = this.stateService.getState();

            assert.equal(state, State.paused);
        });
    });

    describe('updateState:', function () {
        it('update state successfully', function () {
            this.stateService.updateState(State.started);

            const state = this.stateService.getState();

            assert.equal(state, State.started);
        });

        it('updating an invalid state throws an error', function () {
            let thrownError = null;
            try {
                this.stateService.updateState(undefined);
            } catch (e) {
                thrownError = e;
            }

            assert.exists(thrownError);
            assert.equal(thrownError.message, 'Unknown state undefined');
        });
    });
});
