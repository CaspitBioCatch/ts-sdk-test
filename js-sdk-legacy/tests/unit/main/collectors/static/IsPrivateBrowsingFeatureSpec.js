import { assert } from 'chai';
import IsPrivateBrowsingFeature from '../../../../../src/main/collectors/static/IsPrivateBrowsingFeature';
import PrivateBrowsingDetector from '../../../../../src/main/collectors/static/PrivateBrowsingDetector';
import { TestUtils } from '../../../../TestUtils';
import DataQ from '../../../../../src/main/technicalServices/DataQ';

describe('IsPrivateBrowsingFeature tests:', function () {
    beforeEach(function () {
        this.sandbox = sinon.createSandbox();

        this.dataQueueStub = this.sandbox.createStubInstance(DataQ);
        this.privateBrowsingDetectorStub = this.sandbox.stub(new PrivateBrowsingDetector());
    });

    afterEach(function () {
        this.sandbox.restore();
    });

    describe('startFeature tests:', function () {
        it('send is_private_browsing value of true successfully', async function () {
            this.privateBrowsingDetectorStub.detectPrivateMode.callsArgWith(0, true);
            const ipbFeature = new IsPrivateBrowsingFeature(this.dataQueueStub, this.privateBrowsingDetectorStub);
            ipbFeature.startFeature();

            await TestUtils.waitForNoAssertion(() => {
                const addQArgs = this.dataQueueStub.addToQueue.getCall(0).args;
                assert.equal('static_fields', addQArgs[0], 'is_private_browsing added event not to static part');
                assert.equal('is_private_browsing', addQArgs[1][0], 'field name in static is not is_private_browsing');
                assert.isTrue(addQArgs[1][1]);
            });
        });

        it('send is_private_browsing value of false successfully', async function () {
            this.privateBrowsingDetectorStub.detectPrivateMode.callsArgWith(0, false);
            const ipbFeature = new IsPrivateBrowsingFeature(this.dataQueueStub, this.privateBrowsingDetectorStub);
            ipbFeature.startFeature();

            await TestUtils.waitForNoAssertion(() => {
                const addQArgs = this.dataQueueStub.addToQueue.getCall(0).args;
                assert.equal('static_fields', addQArgs[0], 'is_private_browsing added event not to static part');
                assert.equal('is_private_browsing', addQArgs[1][0], 'field name in static is not is_private_browsing');
                assert.isFalse(addQArgs[1][1]);
            });
        });
    });
});
