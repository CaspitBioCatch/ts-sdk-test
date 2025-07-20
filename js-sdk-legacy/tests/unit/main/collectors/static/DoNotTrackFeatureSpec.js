import { assert } from 'chai';
import DoNotTrackFeature from '../../../../../src/main/collectors/static/DoNotTrackFeature';
import TestFeatureSupport from '../../../../TestFeatureSupport';
import DataQ from '../../../../../src/main/technicalServices/DataQ';

describe('DoNotTrackFeature test:', function () {
    beforeEach(function () {
        if (!TestFeatureSupport.isDoNotTrackSupported()) {
            this.skip();
        }
    });

    it('startFeature should call addToQueue with a value of do not track', function () {
        const dataQ = sinon.createStubInstance(DataQ);
        const dntFeature = new DoNotTrackFeature(dataQ);
        dntFeature.startFeature();

        const addQArgs = dataQ.addToQueue.getCall(0).args;
        assert.equal('static_fields', addQArgs[0], 'DoNotTrack added event not to static part');
        assert.equal('dnt', addQArgs[1][0], 'field name in static is not dnt');
        assert.equal(addQArgs[1][1], 0);
    });
});
