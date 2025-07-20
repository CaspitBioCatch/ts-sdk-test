import { TestUtils } from '../TestUtils';
import { assert } from 'chai';

export class TestLifecycleHelper {
    static async startNewSession() {
        let newSessionStarted = false;
        cdApi.startNewSession();

        cdApi.addEventListener('cdNewSessionStartedEvent', () => {
            newSessionStarted = true;
        });

        await TestUtils.waitForNoAssertion(() => {
            assert.isTrue(newSessionStarted, 'New session not started.');
        });
    }
}
