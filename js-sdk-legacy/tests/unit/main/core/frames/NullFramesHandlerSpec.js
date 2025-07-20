import { assert } from 'chai';
import NullFramesHandler from '../../../../../src/main/core/frames/NullFramesHandler';

describe('NullFramesHandler tests:', function () {
    it('startFeatures exists', function () {
        const nullFramesHandler = new NullFramesHandler();
        assert.exists(nullFramesHandler.startFeatures);
    });

    it('startFeature exists', function () {
        const nullFramesHandler = new NullFramesHandler();
        assert.exists(nullFramesHandler.startFeature);
    });

    it('stopFeatures exists', function () {
        const nullFramesHandler = new NullFramesHandler();
        assert.exists(nullFramesHandler.stopFeatures);
    });

    it('stopFeature exists', function () {
        const nullFramesHandler = new NullFramesHandler();
        assert.exists(nullFramesHandler.stopFeature);
    });

    it('updateFeatureConfig exists', function () {
        const nullFramesHandler = new NullFramesHandler();
        assert.exists(nullFramesHandler.updateFeatureConfig);
    });
});
