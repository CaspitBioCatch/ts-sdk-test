import { assert } from 'chai';
import CDEvent from '../../../../src/main/infrastructure/CDEvent';

describe('CDEvent tests:', function () {
    describe('publish tests:', function () {
        it('publish should call the listeners in Q', function () {
            const event = new CDEvent();
            const sub1 = sinon.spy();
            const sub2 = sinon.spy();
            event.subscribe(sub1);
            event.subscribe(sub2);
            event.publish('blabla');
            assert.isTrue(sub1.calledWith('blabla'));
            assert.isTrue(sub2.calledOnce);
            assert.isTrue(sub2.calledWith('blabla'));
            assert.isTrue(sub2.calledOnce);
        });
    });

    describe('subscribe tests:', function () {
        it('subscribe should add listener to the listeners Q', function () {
            const event = new CDEvent();
            event.subscribe(function () {
            });
            assert.equal(1, event._listeners.length);
            event.subscribe(function () {
            });
            assert.equal(2, event._listeners.length);
        });
    });

    describe('unsubscribe tests:', function () {
        it('should unsubscribe from event', function () {
            const event = new CDEvent();
            const sub1 = sinon.spy();
            const sub2 = sinon.spy();

            event.subscribe(sub1);
            event.subscribe(sub2);
            event.publish('blabla');

            assert.isTrue(sub1.calledWith('blabla'));
            assert.isTrue(sub2.calledOnce);
            assert.isTrue(sub2.calledWith('blabla'));
            assert.isTrue(sub2.calledOnce);

            sub1.resetHistory();
            sub2.resetHistory();

            event.unsubscribe(sub1);
            event.publish('blabla2');

            assert.isTrue(sub1.notCalled);
            assert.isTrue(sub2.calledWith('blabla2'));
            assert.isTrue(sub2.calledOnce);

            assert.isFalse(event._listeners.includes(sub1));
        });

        it('does not throw error if not subscribed', function () {
            const event = new CDEvent();
            const sub1 = sinon.spy();

            assert.doesNotThrow(() => { return event.unsubscribe(sub1); });
        });
    });
});
