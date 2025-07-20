import { assert } from 'chai';
import { MasterSlaveMessage } from '../../../src/slave/MasterSlaveMessage';
import { TestUtils } from '../../TestUtils';

describe('Slave - Handshake tests:', function () {
    it('should handshake successfully with slave', async function () {
        const channel = new MessageChannel();
        let slaveHandshake = false;
        let slaveRegistered = false;
        let slaveSentData = false;
        let slaveSentAlive = false;
        channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (msg.msgType === MasterSlaveMessage.slaveHandShake) {
                slaveHandshake = true;
            }
            if (msg.msgType === MasterSlaveMessage.registerSlave) {
                slaveRegistered = true;
            }
            if (msg.msgType === MasterSlaveMessage.dataFromSlave) {
                slaveSentData = true;
            }
            if (msg.msgType === MasterSlaveMessage.slaveAlive) {
                slaveSentAlive = true;
            }
        };

        window.postMessage('CDHandShake', '*', [channel.port2]);

        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, slaveHandshake);
            assert.equal(true, slaveRegistered);
            assert.equal(true, slaveSentAlive);
        });

        const input5 = document.createElement('input');
        input5.setAttribute('id', 'testTrigger');
        input5.value = 'trigger input 2';
        input5.name = 'testTriggtrigger input er';
        document.body.appendChild(input5); // put it into the DOM

        await TestUtils.waitForNoAssertion(() => {
            assert.equal(true, slaveSentData);
        });
    });

    it('should get several slaveAlive messages', async function () {
        const channel = new MessageChannel();
        let slaveSentAliveCounter = 0;
        channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (msg.msgType === MasterSlaveMessage.slaveAlive) {
                slaveSentAliveCounter += 1;
            }
        };

        window.postMessage('CDHandShake', '*', [channel.port2]);

        await TestUtils.waitForNoAssertion(() => {
            assert.isAtLeast(3, slaveSentAliveCounter);
        });
    });

    it('should not get handshake message from slave on wrong post message', async function () {
        const channel = new MessageChannel();
        let slaveAnswered = false;
        channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (msg.msgType === MasterSlaveMessage.slaveHandShake) {
                slaveAnswered = true;
            }
        };

        window.postMessage('CDHandShakeWrong', '*', [channel.port2]);

        await TestUtils.waitForNoAssertion(() => {
            assert.equal(false, slaveAnswered);
        });
    });

    it('should not get handshake message from slave on message without ports', async function () {
        const channel = new MessageChannel();
        let slaveAnswered = false;
        channel.port1.onmessage = (e) => {
            const msg = JSON.parse(e.data);
            if (msg.msgType === MasterSlaveMessage.slaveHandShake) {
                slaveAnswered = true;
            }
        };

        window.postMessage('CDHandShake', '*');

        await TestUtils.waitForNoAssertion(() => {
            assert.equal(false, slaveAnswered);
        });
    });
});
