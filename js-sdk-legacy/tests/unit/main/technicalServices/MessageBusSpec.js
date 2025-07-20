import MessageBus from '../../../../src/main/technicalServices/MessageBus';

describe('MessageBus tests:', function () {
    const assert = chai.assert;

    describe('subscribe tests:', function () {
        it('subscribe should add listener to the listeners Q', function () {
            const msgBus = new MessageBus();

            msgBus.subscribe('msgA', function () {
            });
            assert.equal(msgBus.subscribers.size, 1, 'wrong list size');
            let listener = msgBus.subscribers.get('msgA');
            assert.equal(listener.size, 1, 'msg type not registered');
            msgBus.subscribe('msgB', function () {
            }, true);
            listener = msgBus.subscribers.get('msgB');
            assert.equal(msgBus.subscribers.size, 2, 'wrong list size');
            assert.equal(listener.size, 1, 'msg type not registered');
            listener.forEach(function (value) {
                assert.isTrue(value.isOneTime, 'wrong msg type');
            });
        });

        it('subscribe, unsubscribe should not call the listener in Q', function () {
            const msgBus = new MessageBus();

            const sub1 = sinon.spy();
            msgBus.subscribe('msgA', sub1);
            msgBus.publish('msgA', 'myData');
            msgBus.unsubscribe('msgA', sub1);
            msgBus.publish('msgA', 'myData');
            assert.equal(0, msgBus.subscribers.size, 'wrong list size');
            assert.isTrue(sub1.calledOnce);
        });

        it('should not subscribe the same handler multiple times', function () {
            const handler1 = sinon.spy();

            const msgBus = new MessageBus();

            msgBus.subscribe('msgA', handler1);
            msgBus.subscribe('msgA', handler1);

            msgBus.publish('msgA', 'wrong list size');

            assert.isTrue(handler1.calledWith('wrong list size'));
            assert.isTrue(handler1.calledOnce);
            assert.equal(msgBus.subscribers.size, 1);
        });
    });

    describe('publish tests:', function () {
        it('publish should call the listeners in Q', function () {
            const msgBus = new MessageBus();

            const sub1 = sinon.spy();
            const sub2 = sinon.spy();
            msgBus.subscribe('msgA', sub1);
            msgBus.subscribe('msgA', sub2);
            msgBus.publish('msgA', 'myData');
            assert.isTrue(sub1.calledWith('myData'));
            assert.isTrue(sub1.calledOnce);
            assert.isTrue(sub2.calledWith('myData'));
            assert.isTrue(sub2.calledOnce);
        });

        it('second publish should not call the listener in Q', function () {
            const msgBus = new MessageBus();

            const sub1 = sinon.spy();
            msgBus.subscribe('msgA', sub1, true);
            msgBus.publish('msgA', 'myData');
            msgBus.publish('msgA', 'myData');
            assert.isTrue(sub1.calledWith('myData'));
            assert.isTrue(sub1.calledOnce);
        });

        it('second publish should not call the second listener in Q', function () {
            const msgBus = new MessageBus();

            const sub1 = sinon.spy();
            const sub2 = sinon.spy();
            msgBus.subscribe('msgA', sub1);
            msgBus.subscribe('msgA', sub2, true);
            msgBus.publish('msgA', 'myData');
            msgBus.publish('msgA', 'myData');
            assert.isTrue(sub1.calledWith('myData'));
            assert.isTrue(sub1.calledTwice);
            assert.isTrue(sub2.calledWith('myData'));
            assert.isTrue(sub2.calledOnce);
        });

        it('should throw error if message type is invalid', function () {
            const msgBus = new MessageBus();

            const sub1 = sinon.spy();
            msgBus.subscribe('msgA', sub1);
            assert.throw(() => { return msgBus.publish(undefined, 'myData'); }, 'invalid argument messageType must be defined');
        });
    });
});
