import { assert } from 'chai';
import WupServerSessionState from '../../../../src/worker/communication/WupServerSessionState';
import WupRequestBodyBuilder from '../../../../src/worker/communication/WupRequestBodyBuilder';
import WupMessage from '../../../../src/worker/communication/WupMessage';
import {DATA_SOURCE_TYPE} from '../../../../src/worker/communication/Constants';

describe('WupRequestBodyBuilder tests:', function () {
    beforeEach(function () {
        this.sandbox = sinon.createSandbox();
        this.wupServerSessionStateStub = this.sandbox.stub(new WupServerSessionState());
        this.wupRequestBodyBuilder = new WupRequestBodyBuilder(this.wupServerSessionStateStub);
    });

    afterEach(function () {
        this.sandbox.restore();
    });

    describe('build tests:\n', function () {
        it('Body is built successfully', function () {
            arrangeWupServerSessionStateStub.call(this, 'sid1', 'sts2', 'std3');

            const wupMessage = createWupMessage();
            const {expectedBody, wupRequestBody} = buildWupRequestBody.call(this, wupMessage);

            assert.exists(wupRequestBody, expectedBody);

            assert.isTrue(this.wupServerSessionStateStub.getSid.calledOnce);
            assert.isTrue(this.wupServerSessionStateStub.getSts.calledOnce);
            assert.isTrue(this.wupServerSessionStateStub.getStd.calledOnce);
        });

        it('Body is built successfully with flush indicator when flush wup message requested', function () {
            arrangeWupServerSessionStateStub.call(this, 'sidNewer', 'sts2', 'std3');

            const wupMessage = createWupMessage();
            const setFlushSpy = sinon.spy(wupMessage, 'setFlush');

            const {expectedBody, wupRequestBody} = buildWupRequestBody.call(this, wupMessage, true);

            assert.exists(wupRequestBody, expectedBody);

            assert.isTrue(this.wupServerSessionStateStub.getSid.calledOnce);
            assert.isTrue(this.wupServerSessionStateStub.getSts.calledOnce);
            assert.isTrue(this.wupServerSessionStateStub.getStd.calledOnce);
            assert.isTrue(setFlushSpy.calledOnce);
            assert.isTrue(setFlushSpy.calledWith(DATA_SOURCE_TYPE));
            assert.equal(JSON.parse(wupRequestBody).f, 'js');
        });

        it('sid is overwritten with newer one', function () {
            arrangeWupServerSessionStateStub.call(this, 'sidNewer', 'sts2', 'std3');

            const wupMessage = createWupMessage();
            const {expectedBody, wupRequestBody} = buildWupRequestBody.call(this, wupMessage);

            assert.exists(wupRequestBody, expectedBody);
            assert.equal(JSON.parse(wupRequestBody).cdsnum, 'sidNewer');
        });

        it('sts is overwritten with newer one', function () {
            arrangeWupServerSessionStateStub.call(this, 'sid1', 'stsNew', 'std3');

            const wupMessage = createWupMessage();
            const {expectedBody, wupRequestBody} = buildWupRequestBody.call(this, wupMessage);

            assert.exists(wupRequestBody, expectedBody);
            assert.equal(JSON.parse(wupRequestBody).sts, 'stsNew');
        });

        it('std is overwritten with newer one', function () {
            arrangeWupServerSessionStateStub.call(this, 'sid1', 'sts2', 'stdNe');
            const wupMessage = createWupMessage();
            const {expectedBody, wupRequestBody} = buildWupRequestBody.call(this, wupMessage);

            assert.exists(wupRequestBody, expectedBody);
            assert.equal(JSON.parse(wupRequestBody).std, 'stdNe');
        });

        function arrangeWupServerSessionStateStub(sid, sts, std) {
            this.wupServerSessionStateStub.getSid.returns(sid);
            this.wupServerSessionStateStub.getSts.returns(sts);
            this.wupServerSessionStateStub.getStd.returns(std);
        }

        function createWupMessage() {
            const wupMessage = new WupMessage();
            wupMessage.setSid('sid1');
            wupMessage.setStd('sts2');
            wupMessage.setStd('std3');
            return wupMessage;
        }

        function buildWupRequestBody(wupMessage, shouldFlush = false) {
            const expectedBody = JSON.stringify(wupMessage.getInternalMessage());

            const wupRequestBody = this.wupRequestBodyBuilder.build(wupMessage, shouldFlush);
            return {expectedBody, wupRequestBody};
        }
    });
});
