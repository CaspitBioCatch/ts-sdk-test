import { assert } from 'chai';
import { TestUtils } from '../../TestUtils';
import { ApiEventType } from '../../../src/main/api/ApiEventType';

describe('HeartBeat Messages tests:', function () {
    function _handleHeartbeatEvent(event) {
        if (event.data.type === ApiEventType.HeartBeatEvent) {
            this.HeartBeatEventsCounter += 1;
            this.newHeartBeatEvent = event.data.data;
            this.origin = event.data.origin;
        }
    }

    before(function () {
        window.addEventListener('message', _handleHeartbeatEvent.bind(this));
    });

    beforeEach(function () {
       this.HeartBeatEventsCounter = 0;
    });

    after(function () {
        window.removeEventListener('message', _handleHeartbeatEvent);
    });

    it('should get heartBeat message ok on first interval', async function () {
        await TestUtils.waitForNoAssertion(() => {
                assert.equal(this.newHeartBeatEvent, 'Ok');
                assert.equal(this.HeartBeatEventsCounter, 1);
        });
    });

    it('should get 2 heartBeat messages', async function () {
        await TestUtils.waitForNoAssertion(() => {
            assert.equal(this.newHeartBeatEvent, 'Ok');
            assert.equal(this.HeartBeatEventsCounter, 2);
        });
    });

    it('should have origin attribute equals to BC', async function(){
        const origin = 'BC';
        await TestUtils.waitForNoAssertion(()=>{
            assert.equal(this.origin,origin,'origin was not equal to BC');
        })
    });
});
