import { assert } from 'chai';
import ContextApiHandler from '../../../../../src/main/core/context/ContextApiHandler';
import { MockObjects } from '../../../mocks/mockObjects';
import { TestUtils } from '../../../../TestUtils';
import DataQ from '../../../../../src/main/technicalServices/DataQ';

describe('ContextApiHandler tests:', function () {
    beforeEach(function () {
        this.sandbox = sinon.createSandbox();
        this.contextMgr = MockObjects.contextMgr;
        this.spy = this.sandbox.spy(this.contextMgr, 'changeContext');
        this.dataQ = this.sandbox.createStubInstance(DataQ);
    });

    afterEach(function () {
        this.sandbox.restore();
    });

    it('apiName should return ContextChange', function () {
        assert.equal('ContextChange', ContextApiHandler.apiName);
    });

    it('constructor should create a new context', async function () {
        const ctxApiH = new ContextApiHandler(this.contextMgr, this.dataQ);
        assert.exists(ctxApiH);

        await TestUtils.waitForNoAssertion(() => {
            assert.isTrue(this.contextMgr.changeContext.calledOnce, 'changeContext was not called');
            assert.equal('cd_auto', this.contextMgr.changeContext.getCall(0).args[0], 'changeContext was not called with A as contextName');
            assert.isTrue(this.dataQ.addToQueue.calledWith('contextChange'), 'changeContext event was not added to Q');
            const contextChangeArr = this.dataQ.addToQueue.getCall(0).args[1];
            assert.isNumber(contextChangeArr[3], 'context creation time was not supplied');
            assert.equal(contextChangeArr[3], 55, 'context creation time was not 55');
            assert.equal(contextChangeArr[2], 'cd_auto', 'context name is not the expected one');
            assert.equal(contextChangeArr[1], 'https://aaa.bbb.ccc', 'context url is not the expected one');
        });
    });

    it('handleContextChange should call changeContext and add the contextChange event to the Q', async function () {
        const ctxApiH = new ContextApiHandler(this.contextMgr, this.dataQ);

        ctxApiH.handleContextChange({ context: 'A' });
        await TestUtils.waitForNoAssertion(() => {
            assert.isTrue(this.contextMgr.changeContext.calledTwice, 'changeContext was not called');
            assert.equal('A', this.contextMgr.changeContext.getCall(1).args[0], 'changeContext was not called with A as contextName');
            assert.isTrue(this.dataQ.addToQueue.calledWith('contextChange'), 'changeContext event was not added to Q');
            const contextChangeArr = this.dataQ.addToQueue.getCall(1).args[1];
            assert.isNumber(contextChangeArr[3], 'context creation time was not supplied');
            assert.equal(contextChangeArr[2], 'A', 'context name is not the expected one');
            assert.equal(contextChangeArr[1], 'https://aaa.bbb.ccc', 'context url is not the expected one');
        });
    });

    it('handleContextChange called with the same context name should not change context', async function () {
        const ctxApiH = new ContextApiHandler(this.contextMgr, this.dataQ);

        ctxApiH.handleContextChange({ context: 'A' });
        await TestUtils.waitForNoAssertion(() => {
            assert.isTrue(this.contextMgr.changeContext.calledTwice, 'changeContext was not called');
            assert.equal('A', this.contextMgr.changeContext.getCall(1).args[0], 'changeContext was not called with A as contextName');
            assert.isTrue(this.dataQ.addToQueue.calledWith('contextChange'), 'changeContext event was not added to Q');
            const contextChangeArr = this.dataQ.addToQueue.getCall(1).args[1];
            assert.isNumber(contextChangeArr[3], 'context creation time was not supplied');
            assert.equal(contextChangeArr[2], 'A', 'context name is not the expected one');
            assert.equal(contextChangeArr[1], 'https://aaa.bbb.ccc', 'context url is not the expected one');
        });

        this.dataQ.addToQueue.reset();

        ctxApiH.handleContextChange({ context: 'A' });

        await TestUtils.waitForNoAssertion(() => {
            assert.isTrue(this.contextMgr.changeContext.calledThrice, 'changeContext was not called');
            assert.isTrue(this.dataQ.addToQueue.notCalled);
        });
    });

    it('handleContextChange should call changeContext and add the contextChange event to the Q with backward compatability for '
        + 'activityType parameter', async function () {
        const ctxApiH = new ContextApiHandler(this.contextMgr, this.dataQ);

        ctxApiH.handleContextChange({ activityType: 'A' });
        await TestUtils.waitForNoAssertion(() => {
            assert.isTrue(this.contextMgr.changeContext.calledTwice, 'changeContext was not called');
            assert.equal('A', this.contextMgr.changeContext.getCall(1).args[0], 'changeContext was not called with A as contextName');
            assert.isTrue(this.dataQ.addToQueue.calledWith('contextChange'), 'changeContext event was not added to Q');
            const contextChangeArr = this.dataQ.addToQueue.getCall(1).args[1];
            assert.isNumber(contextChangeArr[3], 'context creation time was not supplied');
            assert.equal(contextChangeArr[2], 'A', 'context name is not the expected one');
            assert.equal(contextChangeArr[1], 'https://aaa.bbb.ccc', 'context url is not the expected one');
            assert.isNotNull(contextChangeArr[4], 'no referrer');
            assert.isNotNull(contextChangeArr[5], 'no history length');
        });
    });
});
