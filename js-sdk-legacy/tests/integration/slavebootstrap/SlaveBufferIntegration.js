import {MasterSlaveMessage} from "../../../src/slave/MasterSlaveMessage";
import {SlaveTestUtils} from "../slave/SlaveTestUtils";
import {TestUtils} from "../../TestUtils";
import {assert} from "chai";

describe("Slave - Buffer Tests", function () {

    before(async function () {
        this.slaveHandshaked = false;
    })

    it('receive all events before handshake', async function () {
        let isDataReceivedBeforeHandShake = false
        const channel = new MessageChannel();

        const e = new Event('copy', {
            dataType: 'text/plain', data: 'copy data',
        });
        document.dispatchEvent(e);

        channel.port1.onmessage = (messageEvent) => {
            const msg = JSON.parse(messageEvent.data);

            if (msg.msgType === MasterSlaveMessage.slaveHandShake) {
                this.slaveHandshaked = true;
            }
            if (SlaveTestUtils.isDataFromSlave(msg) && msg.data.eventName === 'clipboard_events') {
                isDataReceivedBeforeHandShake = true
            }
        };

        window.postMessage('CDHandShake', '*', [channel.port2]);
        await TestUtils.waitForNoAssertion(() => {
            assert.equal(this.slaveHandshaked, true);
        });
        channel.port1.postMessage("{\"msgType\": \"updateSlaveConf\", \"data\": \" \"}")
        await TestUtils.waitForNoAssertion(() => {
            assert.equal(isDataReceivedBeforeHandShake, true);
        });
    });
});

