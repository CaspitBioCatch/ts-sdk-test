import { assert } from 'chai';
import { ApiEventType } from '../../../../src/main/api/ApiEventType';
import ClientEventService from '../../../../src/main/api/ClientEventService';
import { TestUtils } from '../../../TestUtils';

describe('ClientEventService tests:', function () {
    describe('publishNewSessionStartedEvent:', function () {
        it('should publish a cdNewSessionStartedEvent successfully', async function () {
            let receivedNewSessionEvent = false;
            let receivedSID = null;
            window.addEventListener('message', (e) => {
                if (e.data.type === ApiEventType.NewSessionStartedEvent) {
                    receivedNewSessionEvent = true;
                    receivedSID = e.data.event.sessionID;
                }
            });

            const expectedSID = 'tadada';
            const clientEventService = new ClientEventService();

            clientEventService.publishNewSessionStartedEvent(expectedSID);

            await TestUtils.waitForNoAssertion(() => {
                assert.isTrue(receivedNewSessionEvent);
                assert.equal(receivedSID, expectedSID);
            });
        });
    });

    describe('publishStateChangedEvent: ', function () {
        it('should publish a cdStateChangedEvent successfully', async function () {
            let receivedStateChangedEvent = false;
            let receivedState = null;
            window.addEventListener('message', (e) => {
                if (e.data.type === ApiEventType.StateChangedEvent) {
                    receivedStateChangedEvent = true;
                    receivedState = e.data.event.state;
                }
            });

            const expectedState = 'starting';
            const clientEventService = new ClientEventService();

            clientEventService.publishStateChangedEvent(expectedState);

            await TestUtils.waitForNoAssertion(() => {
                assert.isTrue(receivedStateChangedEvent);
                assert.equal(receivedState, expectedState);
            });
        });
    });

    describe('publishRestoredMuidEvent',  function(){
        it('should publish a restored muid event', async function (){
            let receivedRestoredMuidEvent = false;
            let data = null;
            window.addEventListener('message',(e)=>{
                if(e.data.type === ApiEventType.RestoredMuidEvent){
                    receivedRestoredMuidEvent = true;
                    data = e.data.event;
                }
            });

            const muid = 'RESTORED_MUID';
            const clientEventService = new ClientEventService();
            clientEventService.publishRestoredMuidEvent(muid);

            await TestUtils.waitForNoAssertion(()=>{
                assert.isTrue(receivedRestoredMuidEvent, 'expected true');
                assert.equal(data.muid,muid, `expected to get ${muid}`);
            })
        });
    });
});
