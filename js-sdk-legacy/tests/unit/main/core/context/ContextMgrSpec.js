import CDUtils from '../../../../../src/main/technicalServices/CDUtils';
import ContextMgr from '../../../../../src/main/core/context/ContextMgr';
import SiteMapper from '../../../../../src/main/technicalServices/SiteMapper';
import WorkerCommunicator from '../../../../../src/main/technicalServices/WorkerCommunicator';
import StorageUtilsWrapper from "../../../../../src/main/technicalServices/StorageUtilsWrapper";

describe('ContextMgr tests:', function () {
    const assert = chai.assert;

    describe('ContextMgr creation:', function () {
        beforeEach(function () {
            this.getDocUrl = sinon.stub(CDUtils, 'getDocUrl');
            this.siteMapper = sinon.createStubInstance(SiteMapper);
            this.workerComm = sinon.createStubInstance(WorkerCommunicator);
            this.storageUtilsWrapper = sinon.createStubInstance(StorageUtilsWrapper);
        });

        afterEach(function () {
            this.getDocUrl.restore();
        });

        it('should generate context id and collect the url from the CDUtils. Name should be empty', function () {
            this.getDocUrl.returns('https://aaa.bbb.ccc/');
            const ctxMgr = new ContextMgr(CDUtils, this.siteMapper, this.workerComm, this.storageUtilsWrapper);

            assert.isUndefined(ctxMgr.url, 'ContextMgr creation should not collect the url yet');
            assert.equal('', ctxMgr.getContextName(), 'context name is not empty');
            assert.isUndefined(ctxMgr.contextId, 'context id was generated');
        });

        it('changeContext should change contextId, update context name and url', function () {
            this.getDocUrl.returns('https://aaa.bbb.eee/');
            this.storageUtilsWrapper.getCookie.withArgs('cdContextId').returns('0');

            const ctxMgr = new ContextMgr(CDUtils, this.siteMapper, this.workerComm, this.storageUtilsWrapper);
            // first context assignment
            ctxMgr.changeContext('cd_auto');
            const firstCtxId = ctxMgr.contextId;
            this.storageUtilsWrapper.getCookie.withArgs('cdContextId').returns('1');
            ctxMgr.changeContext('newContext');

            assert.equal(ctxMgr.contextId, firstCtxId + 1, 'context id was not changed');
            assert.equal(ctxMgr.url, 'https://aaa.bbb.eee/', 'url was not changed');
            assert.equal(ctxMgr.getContextName(), 'newContext', 'context name was not updated');
            assert.isNotNull(ctxMgr.hLength, 'newContext', 'context history length was not updated');
            assert.isNotNull(ctxMgr.referrer, 'newContext', 'context referrer was not updated');
        });

        it('changeContext with no cookies should change contextId, update context name and url fallback to localstoage not valid is 0', function () {
            this.getDocUrl.returns('https://aaa.bbb.eee/');
            this.storageUtilsWrapper.getCookie.withArgs('cdContextId').returns(null);
            this.storageUtilsWrapper.getFromLocalStorage.withArgs('cdContextId').returns('abcdef');

            const ctxMgr = new ContextMgr(CDUtils, this.siteMapper, this.workerComm, this.storageUtilsWrapper);
            // first context assignment
            ctxMgr.changeContext('cd_auto');
            assert.equal(ctxMgr.contextId, 0, 'context id was changed');
            this.storageUtilsWrapper.getFromLocalStorage.withArgs('cdContextId').returns('3ab3cdef3');
            ctxMgr.changeContext('newContext');

            assert.equal(ctxMgr.contextId, 0, 'context id was changed');
            assert.equal(ctxMgr.url, 'https://aaa.bbb.eee/', 'url was not changed');
            assert.equal(ctxMgr.getContextName(), 'newContext', 'context name was not updated');
        });

        it('changeContext with no cookies should change contextId, update context name and url fallback to localstoage', function () {
            this.getDocUrl.returns('https://aaa.bbb.eee/');
            this.storageUtilsWrapper.getCookie.withArgs('cdContextId').returns(null);
            this.storageUtilsWrapper.getFromLocalStorage.withArgs('cdContextId').returns('0');

            const ctxMgr = new ContextMgr(CDUtils, this.siteMapper, this.workerComm, this.storageUtilsWrapper);
            // first context assignment
            ctxMgr.changeContext('cd_auto');
            const firstCtxId = ctxMgr.contextId;
            this.storageUtilsWrapper.getFromLocalStorage.withArgs('cdContextId').returns('1');
            ctxMgr.changeContext('newContext');

            assert.equal(ctxMgr.contextId, firstCtxId + 1, 'context id was not changed');
            assert.equal(ctxMgr.url, 'https://aaa.bbb.eee/', 'url was not changed');
            assert.equal(ctxMgr.getContextName(), 'newContext', 'context name was not updated');
            assert.isNotNull(ctxMgr.hLength, 'newContext', 'context history length was not updated');
            assert.isNotNull(ctxMgr.referrer, 'newContext', 'context referrer was not updated');
        });

        it('changeContext should NOT change contextId, context name and url if the name was not changed', function () {
            this.getDocUrl.returns('https://aaa.bbb.eee/');
            this.storageUtilsWrapper.getCookie.withArgs('cdContextId').returns('1');

            const ctxMgr = new ContextMgr(CDUtils, this.siteMapper, this.workerComm, this.storageUtilsWrapper);
            const onContextChangePublishSpy = sinon.spy(ctxMgr.onContextChange, 'publish');
            // first context assignment
            ctxMgr.changeContext('cd_auto');
            const firstCtxId = ctxMgr.contextId;
            this.storageUtilsWrapper.getCookie.withArgs('cdContextId').returns('2');
            ctxMgr.changeContext('newContext');

            assert.isTrue(onContextChangePublishSpy.calledTwice);
            assert.notEqual(ctxMgr.contextId, firstCtxId, 'context id was not changed');
            assert.equal(ctxMgr.url, 'https://aaa.bbb.eee/', 'url was not changed');
            assert.equal(ctxMgr.getContextName(), 'newContext', 'context name was not updated');

            const currCtxId = ctxMgr.contextId;

            ctxMgr.changeContext('newContext');

            // Still only called once since this change did nothing
            assert.isTrue(onContextChangePublishSpy.calledTwice);
            assert.equal(ctxMgr.contextId, currCtxId, 'context id was changed after a call with the same name');
            assert.equal(ctxMgr.url, 'https://aaa.bbb.eee/', 'url was changed');
            assert.equal(ctxMgr.getContextName(), 'newContext', 'context name changed');
        });

        it('setContext should set the context name and increase the context id', function () {
            this.getDocUrl.returns('https://aaa.bbb.eee/');
            this.storageUtilsWrapper.getCookie.withArgs('cdContextId').returns('23');
            const ctxMgr = new ContextMgr(CDUtils, this.siteMapper, this.workerComm, this.storageUtilsWrapper);
            // first context assignment
            ctxMgr.changeContext('ctx1');
            const firstCtxId = ctxMgr.contextId;
            this.storageUtilsWrapper.getCookie.withArgs('cdContextId').returns('24');
            const expectedCtx = {
                name: 'ctx2',
                contextId: 23,
                url: 'https://ddd.eee.fff',
                referrer: 'ref1',
                hLength: 7,
                timestamp: 15698756416,
            };
            ctxMgr.setContext(expectedCtx);

            const newCtx = ctxMgr.contextData();

            assert.equal(newCtx.name, expectedCtx.name, 'context name is not expected');
            assert.equal(newCtx.contextId, firstCtxId + 1, 'context id is not +1');
            assert.equal(newCtx.url, expectedCtx.url, 'context url is not expected');
            assert.equal(newCtx.referrer, expectedCtx.referrer, 'context referrer is not expected');
            assert.equal(newCtx.hLength, expectedCtx.hLength, 'context history is not expected');
            assert.equal(newCtx.timestamp, expectedCtx.timestamp, 'context timestamp is not expected');
        });

        it('onSiteMapperMatch should changeContext', function () {
            this.getDocUrl.returns('https://aaa.bbb.eee/');
            this.storageUtilsWrapper.getCookie.withArgs('cdContextId').returns('0');
            const ctxMgr = new ContextMgr(CDUtils, this.siteMapper, this.workerComm, this.storageUtilsWrapper);
            // first context assignment
            ctxMgr.changeContext('cd_auto');
            const firstCtxId = ctxMgr.contextId;
            this.storageUtilsWrapper.getCookie.withArgs('cdContextId').returns('1');
            ctxMgr.onSiteMapperMatch({ contextName: 'newContext' });

            assert.equal(ctxMgr.contextId, firstCtxId + 1, 'context id was not changed');
            assert.equal(ctxMgr.url, 'https://aaa.bbb.eee/', 'url was not changed');
            assert.equal(ctxMgr.getContextName(), 'newContext', 'context name was not updated');
            assert.isNotNull(ctxMgr.hLength, 'newContext', 'context history length was not updated');
            assert.isNotNull(ctxMgr.referrer, 'newContext', 'context referrer was not updated');
        });

        it('onSiteMapperMatch should not change context if we are already in this context', function () {
            this.getDocUrl.returns('https://aaa.bbb.eee/');
            this.storageUtilsWrapper.getCookie.withArgs('cdContextId').returns('0');
            const ctxMgr = new ContextMgr(CDUtils, this.siteMapper, this.workerComm, this.storageUtilsWrapper);
            const changeContextFuncSpy = sinon.spy(ctxMgr, 'changeContext');

            // first context assignment
            ctxMgr.changeContext('cd_auto');
            const firstCtxId = ctxMgr.contextId;
            this.storageUtilsWrapper.getCookie.withArgs('cdContextId').returns('1');
            changeContextFuncSpy.resetHistory();

            // Change into this context
            ctxMgr.onSiteMapperMatch({ contextName: 'newErContext' });

            assert.isTrue(changeContextFuncSpy.calledOnce, 'changeContext function was not called once');
            assert.equal(ctxMgr.contextId, firstCtxId + 1, 'context id was not changed');
            assert.equal(ctxMgr.url, 'https://aaa.bbb.eee/', 'url was not changed');
            assert.equal(ctxMgr.getContextName(), 'newErContext', 'context name was not updated');
            assert.isNotNull(ctxMgr.hLength, 'newErContext', 'context history length was not updated');
            assert.isNotNull(ctxMgr.referrer, 'newErContext', 'context referrer was not updated');

            changeContextFuncSpy.resetHistory();

            // Now change into this context again. This should not change the context
            ctxMgr.onSiteMapperMatch({ contextName: 'newErContext' });

            assert.isTrue(changeContextFuncSpy.notCalled, 'changeContext function was called');
        });
    });
});
