import GfxRenderingContract from "../../../../../src/main/contract/staticContracts/GfxRenderingContract";
import sinon from "sinon";
import Log from "../../../../../src/main/technicalServices/log/Logger";

describe('GfxRenderingContract test:', function () {

    beforeEach(function () {
        this.sandbox = sinon.createSandbox();
    });

    afterEach(function () {
        this.sandbox.restore();
    });

    it('parameters initialization', function () {
        let gfxRenderingContract = new GfxRenderingContract(true, 'text', 'geometry');
        assert.equal(gfxRenderingContract.winding, true, 'winding is not initialized correctly');
        assert.equal(gfxRenderingContract.text, 'text', 'text is not initialized correctly');
        assert.equal(gfxRenderingContract.geometry, 'geometry', 'geometry is not initialized correctly');
    });

    it('pre condition is valid, should not send log', function () {
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new GfxRenderingContract(true, 'text' , 'geometry');
        assert.isFalse(this._logWarnStub.called, 'did  send log message while should not');
    });

    it( 'pre condition is not valid: receive number instead of boolean. should send log', function() {
        let winding = 7;
        let text = 'text';
        let geometry = 'geometry';
        const logMessage = `wrong type in GfxRenderingContract parameters. winding: {expected: boolean, received: ${typeof winding}}, text: {expected: string, received: ${typeof text}},
            geometry: {expected: string, received: ${typeof geometry}}`;
        this._logWarnStub = this.sandbox.spy(Log, 'warn');
        new GfxRenderingContract(winding, text , geometry);
        assert.isTrue(this._logWarnStub.calledOnce, 'did not send log message while should');
        assert.equal(this._logWarnStub.firstCall.args[0], logMessage);
    });
});
