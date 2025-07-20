import { assert } from 'chai';
import { MasterSlaveMessage } from '../../../src/slave/MasterSlaveMessage';
import { TestUtils } from '../../TestUtils';
import { SlaveTestUtils } from './SlaveTestUtils';

describe('Slave - Elements tests:', function () {
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
        const inputElement = document.createElement('input');
        inputElement.setAttribute('id', 'txt1');
        inputElement.type = 'text';
        inputElement.value = 'Some input field text 1';
        inputElement.className = 'input-text-class'; // set the CSS class
        document.body.appendChild(inputElement); // put it into the DOM

        const input = document.createElement('input');
        input.setAttribute('id', 'txt2');
        input.type = 'password';
        input.className = 'element-class-name'; // set the CSS class
        input.name = 'myElement';
        input.value = 'secret1234$%^&';
        input.alt = 'enter password';
        input.title = 'enter password tooltip';
        document.body.appendChild(input); // put it into the DOM
    });

    it('element event is received', async function () {
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'elements') {
                this.slaveKeySuccess = true;
            }
        };
        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveKeySuccess);
        });
    });

    it('tagName received', async function () {
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'elements') {
                if (msg.data.data[2] === 'INPUT') this.slaveKeySuccess = true;
            }
        };
        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveKeySuccess);
        });
    });

    it('name received', async function () {
        this.channel.port1.onmessage = (e) => {
            let text1 = false;
            let text2 = false;
            const msg = JSON.parse(e.data);
            if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'elements') {
                if (msg.data.data[3] === 'txt1') text1 = true;
                if (msg.data.data[3] === 'txt2') text2 = true;
                if (text2 && text1) this.slaveKeySuccess = true;
            }
        };
        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveKeySuccess);
        });
    });

    it('type received', async function () {
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            let text1 = false;
            let text2 = false;
            if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'elements') {
                if (msg.data.data[5] === 'text') text1 = true;
                if (msg.data.data[5] === 'password') text2 = true;
                if (text2 && text1) this.slaveKeySuccess = true;
            }
        };
        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveKeySuccess);
        });
    });

    it('leftPosition and topPosition received', async function () {
        this.channel.port1.onmessage = (e) => {
            let text1 = false;
            let text2 = false;
            const msg = JSON.parse(e.data);
            if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'elements') {
                if (msg.data.data[6] >= 0) text1 = true;
                if (msg.data.data[7] >= 0) text2 = true;
                if (text2 && text1) this.slaveKeySuccess = true;
            }
        };
        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveKeySuccess);
        });
    });

    it('width and height received', async function () {
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            let text1 = false;
            let text2 = false;
            if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'elements') {
                if (msg.data.data[8] >= 0) text1 = true;
                if (msg.data.data[9] >= 0) text2 = true;
                if (text2 && text1) this.slaveKeySuccess = true;
            }
        };
        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveKeySuccess);
        });
    });

    it('ClassName received', async function () {
        this.channel.port1.onmessage = (e) => {
            let text1 = false;
            let text2 = false;
            const msg = JSON.parse(e.data);
            if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'elements') {
                if (msg.data.data[10] === 'input-text-class') text1 = true;
                if (msg.data.data[10] === 'element-class-name') text2 = true;
                if (text2 && text1) this.slaveKeySuccess = true;
            }
        };
        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveKeySuccess);
        });
    });

    it('title received', async function () {
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'elements') {
                if (msg.data.data[12] === 'enter password tooltip') this.slaveKeySuccess = true;
            }
        };
        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveKeySuccess);
        });
    });

    it('alt received', async function () {
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'elements') {
                if (msg.data.data[13] === 'enter password') this.slaveKeySuccess = true;
            }
        };
        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveKeySuccess);
        });
    });

    it('element value received', async function () {
        this.channel.port1.onmessage = (e) => {
            let text1 = false;
            let text2 = false;
            const msg = JSON.parse(e.data);
            if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'elements') {
                if (msg.data.data[15] === 'aaaa aaaaa aaaaa 1') text1 = true;
                if (msg.data.data[15] === 'aaaaaa1111$%^&') text2 = true;
                if (text2 && text1) this.slaveKeySuccess = true;
            }
        };
        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveKeySuccess);
        });
    });

    it('timestamp received', async function () {
        this.channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'elements') {
                if (msg.data.data[17] > 1571323895342) this.slaveKeySuccess = true;
            }
        };
        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, this.slaveKeySuccess);
        });
    });
});
