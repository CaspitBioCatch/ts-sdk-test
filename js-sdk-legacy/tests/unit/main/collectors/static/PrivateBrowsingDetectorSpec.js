import { assert } from 'chai';
import PrivateBrowsingDetector from '../../../../../src/main/collectors/static/PrivateBrowsingDetector';
import { TestUtils } from '../../../../TestUtils';

describe('PrivateBrowsingDetector tests:', function () {
    describe('detectPrivateMode tests:', function () {
        it('mode is detected successfully', async function () {
            // Just to make sure the detection finishes first
            this.timeout(5000);

            const privateBrowsingDetector = new PrivateBrowsingDetector();

            let isCallbackExecuted = false;
            let isPrivateBrowsing;
            privateBrowsingDetector.detectPrivateMode((result) => {
                isCallbackExecuted = true;
                isPrivateBrowsing = result;
            });

            await TestUtils.waitForNoAssertion(() => {
                assert.isTrue(isCallbackExecuted, 'callback was not executed');
                assert.exists(isPrivateBrowsing);
            });
        });
    });
});