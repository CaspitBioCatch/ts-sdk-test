import HeartBeatSample from '../../../src/main/samples/HeartBeatSample';
import { TestUtils } from '../../TestUtils';

describe('HeartBeatSample tests:', function () {
    const assert = chai.assert;
    beforeEach(function () {
        this.heartBeatSample = new HeartBeatSample();
    });

    it('should start listen to heartBeat messages', async function () {
        this.heartBeatSample.startListen();
        await TestUtils.waitForNoAssertion(() => {
           assert.equal(this.heartBeatSample.heartBeatStatus, 'Ok');
        });
    });
});
