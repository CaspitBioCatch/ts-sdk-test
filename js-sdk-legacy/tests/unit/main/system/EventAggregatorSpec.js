import { assert } from 'chai';
import EventAggregator from '../../../../src/main/system/EventAggregator';

describe('EventAggregator tests:', function () {
    beforeEach(function () {
        const stubObject = {
            addEventListener() {
            },
            removeEventListener() {
            },
        };

        this.sandbox = sinon.createSandbox();
        this.stub = this.sandbox.spy(stubObject);
    });

    afterEach(function () {
        this.sandbox.restore();
    });

    describe('addEventListener', function () {
        it('add listener successfully', function () {
            const callback = () => {
            };
            EventAggregator.addEventListener(this.stub, 'bobEvent', callback);

            assert.isTrue(this.stub.addEventListener.calledOnce);
            assert.equal(this.stub.addEventListener.firstCall.args[0], 'bobEvent');
            assert.equal(this.stub.addEventListener.firstCall.args[1], callback);
        });
    });

    describe('removeEventListener', function () {
        it('remove listener successfully', function () {
            const callback = () => {
            };
            EventAggregator.removeEventListener(this.stub, 'bobEvent', callback);

            assert.isTrue(this.stub.removeEventListener.calledOnce);
            assert.equal(this.stub.removeEventListener.firstCall.args[0], 'bobEvent');
            assert.equal(this.stub.removeEventListener.firstCall.args[1], callback);
        });
    });
});
