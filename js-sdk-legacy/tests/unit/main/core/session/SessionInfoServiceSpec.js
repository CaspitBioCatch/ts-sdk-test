import { assert } from 'chai';
import SessionInfoService from '../../../../../src/main/core/session/SessionInfoService';
import { TestUtils } from '../../../../TestUtils';

describe('SessionInfoService tests:', function () {
    it('Mark and get startTime', function () {
        const sessionInfoService = new SessionInfoService();
        sessionInfoService.markStartTime();
        assert.isNotNull(sessionInfoService.getStartTime());
    });

    it('Marking StartTime Multiple Times Updates The StartTime', async function () {
        const sessionInfoService = new SessionInfoService();
        sessionInfoService.markStartTime();
        const initialStartTime = sessionInfoService.getStartTime();

        await TestUtils.waitForNoAssertion(() => {
            sessionInfoService.markStartTime();
            assert.notEqual(sessionInfoService.getStartTime(), initialStartTime);
        });
    });

    it('Mark and get startTime', function () {
        const sessionInfoService = new SessionInfoService();
        assert.isNotNull(sessionInfoService.getStartTime());
    });
});
