import { assert } from 'chai';
import { MasterSlaveMessage } from '../../../src/slave/MasterSlaveMessage';
import { TestUtils } from '../../TestUtils';
import { SlaveTestUtils } from './SlaveTestUtils';

describe('Slave - Element event tests:', function () {
    before(async function () {
        this.channel = new MessageChannel();
        this.slaveHandshaked = false;
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (msg.msgType === MasterSlaveMessage.slaveHandShake) {
                this.slaveHandshaked = true;
            }
        };
        window.postMessage('CDHandShake', '*', [this.channel.port2]);
        await TestUtils.waitForNoAssertion(() => {
            assert.equal(this.slaveHandshaked, true);
        });
    });

    beforeEach(function () {
        this.slaveElementSuccess = false;
    });

    it('timestamp is received', async function () {
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);

            if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'element_events') {
                if (msg.data.data[2] > 1571929134904) {
                    this.slaveElementSuccess = true;
                }
            }
        };

        let confirmMutation = false;
        const mutationCallback = () => {
            confirmMutation = true;
        };
        const observer = TestUtils.startMutation(mutationCallback, document);

        // create element with checked field
        const cb = document.createElement('input');
        cb.setAttribute('id', 'cb1');
        cb.setAttribute('type', 'checkbox');
        cb.checked = false;
        document.body.appendChild(cb);

        await TestUtils.waitForNoAssertion(() => {
            assert.exists(document.getElementById('cb1'));
            assert.equal(true, confirmMutation, "Failed to receive mutation notification");
            observer.disconnect();
        });

        const e = document.createEvent('Event');
        e.initEvent('click', true, true);

        // Trigger the click event. This should also make the checkbox selected
        cb.click();

        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveElementSuccess);
        });
    });

    it('event type is received', async function () {
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);

            if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'element_events') {
                if (msg.data.data[3] === 5) this.slaveElementSuccess = true;
            }
        };

        let confirmMutation = false;
        const mutationCallback = () => {
            confirmMutation = true;
        };
        const observer = TestUtils.startMutation(mutationCallback, document);
        // create element with checked field
        const cb = document.createElement('input');
        cb.setAttribute('id', 'cb1');
        cb.setAttribute('type', 'checkbox');
        cb.checked = false;
        document.body.appendChild(cb);

        await TestUtils.waitForNoAssertion(() => {
            assert.exists(document.getElementById('cb1'));
            assert.equal(true, confirmMutation, "Failed to receive mutation notification");
            observer.disconnect();
        });

        // Trigger the click event. This should also make the checkbox selected
        cb.click();

        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveElementSuccess);
        });
    });

    it('length is received', async function () {
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);

            if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'element_events') {
                if (msg.data.data[6] >= 0) this.slaveElementSuccess = true;
            }
        };
        let confirmMutation = false;
        const mutationCallback = () => {
            confirmMutation = true;
        };
        const observer = TestUtils.startMutation(mutationCallback, document);
        // create element with checked field
        const cb = document.createElement('input');
        cb.setAttribute('id', 'cb1');
        cb.setAttribute('type', 'checkbox');
        cb.checked = false;
        document.body.appendChild(cb);

        await TestUtils.waitForNoAssertion(() => {
            assert.exists(document.getElementById('cb1'));
            assert.equal(true, confirmMutation, "Failed to receive mutation notification");
            observer.disconnect();
        });

        const e = document.createEvent('Event');
        e.initEvent('click', true, true);

        // Trigger the click event. This should also make the checkbox selected
        cb.click();

        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveElementSuccess);
        });
    });

    it('elementvalue is received', async function () {
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);

            if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'element_events') {
                if (msg.data.data[7] !== -1) this.slaveElementSuccess = true;
            }
        };
        let confirmMutation = false;
        const mutationCallback = () => {
            confirmMutation = true;
        };
        const observer = TestUtils.startMutation(mutationCallback, document);
        // create element with checked field
        const cb = document.createElement('input');
        cb.setAttribute('id', 'cb1');
        cb.setAttribute('type', 'checkbox');
        cb.checked = false;
        document.body.appendChild(cb);

        await TestUtils.waitForNoAssertion(() => {
            assert.exists(document.getElementById('cb1'));
            assert.equal(true, confirmMutation, "Failed to receive mutation notification");
            observer.disconnect();
        });

        const e = document.createEvent('Event');
        e.initEvent('click', true, true);

        // Trigger the click event. This should also make the checkbox selected
        cb.click();

        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveElementSuccess);
        });
    });

    it('selected is received', async function () {
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);

            if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'element_events') {
                if (msg.data.data[8] === 1) this.slaveElementSuccess = true;
            }
        };
        let confirmMutation = false;
        const mutationCallback = () => {
            confirmMutation = true;
        };
        const observer = TestUtils.startMutation(mutationCallback, document);
        // create element with checked field
        const cb = document.createElement('input');
        cb.setAttribute('id', 'cb1');
        cb.setAttribute('type', 'checkbox');
        cb.checked = false;
        document.body.appendChild(cb);

        await TestUtils.waitForNoAssertion(() => {
            assert.exists(document.getElementById('cb1'));
            assert.equal(true, confirmMutation, "Failed to receive mutation notification");
            observer.disconnect();
        });

        const e = document.createEvent('Event');
        e.initEvent('click', true, true);

        // Trigger the click event. This should also make the checkbox selected
        cb.click();

        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveElementSuccess);
        });
    });

    it('relative time is received', async function () {
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);

            if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'element_events') {
                if (msg.data.data[10] > 0) this.slaveElementSuccess = true;
            }
        };
        let confirmMutation = false;
        const mutationCallback = () => {
            confirmMutation = true;
        };
        const observer = TestUtils.startMutation(mutationCallback, document);
        // create element with checked field
        const cb = document.createElement('input');
        cb.setAttribute('id', 'cb1');
        cb.setAttribute('type', 'checkbox');
        cb.checked = false;
        document.body.appendChild(cb);

        await TestUtils.waitForNoAssertion(() => {
            assert.exists(document.getElementById('cb1'));
            assert.equal(true, confirmMutation, "Failed to receive mutation notification");
            observer.disconnect();
        });

        const e = document.createEvent('Event');
        e.initEvent('click', true, true);

        // Trigger the click event. This should also make the checkbox selected
        cb.click();

        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveElementSuccess);
        });
    });

    it('element events is received', async function () {
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'element_events') {
                this.slaveElementSuccess = true;
            }
        };

        let confirmMutation = false;
        const mutationCallback = () => {
            confirmMutation = true;
        };
        const observer = TestUtils.startMutation(mutationCallback, document);
        // create element with checked field
        const cb = document.createElement('input');
        cb.setAttribute('id', 'cb1');
        cb.setAttribute('type', 'checkbox');
        cb.checked = false;
        document.body.appendChild(cb);

        await TestUtils.waitForNoAssertion(() => {
            assert.exists(document.getElementById('cb1'));
            assert.equal(true, confirmMutation, "Failed to receive mutation notification");
            observer.disconnect();
        });

        const e = document.createEvent('Event');
        e.initEvent('click', true, true);

        // Trigger the click event. This should also make the checkbox selected
        cb.click();

        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveElementSuccess);
        });
    });
});
