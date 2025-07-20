import HeartBeatEvent, { statusTypes } from '../../../../src/main/events/HeartBeatEvent';

describe('HeartBeatEvent tests:', function () {
    const assert = chai.assert;

    it('should create event successfully', function () {
        const category = 'categoryA';
        const status = statusTypes.Ok;
        const heartBeatEvent = new HeartBeatEvent(category, status);

        assert.equal(heartBeatEvent.category, category);
        assert.equal(heartBeatEvent.status, status);
    });
});
