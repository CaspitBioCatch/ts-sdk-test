import { assert } from 'chai';

import GfxRenderingFeature from '../../../../../src/main/collectors/static/GfxRenderingFeature';
import DataQ from '../../../../../src/main/technicalServices/DataQ';
import CDUtils from "../../../../../src/main/technicalServices/CDUtils";
import {TestUtils} from "../../../../TestUtils";


describe('GfxRenderingFeature tests:', function () {

    describe('Correct behavior of digest_sha256 hashing', function () {

        beforeEach(function () {
            this.sandbox = sinon.createSandbox();
            this.dataQ = this.sandbox.createStubInstance(DataQ);
            this.digest_sha256 = sinon.stub(CDUtils, 'digest_sha256').callsFake(async function() {
                return "9c4c60ef065a4d7c069d34726b6a0d1ceecd8788a78373cb505ea73a29635290"
            });

            this.gfxRendering = new GfxRenderingFeature(this.dataQ, CDUtils);
        });

        afterEach(function () {
            this.gfxRendering.cleanUp();
            this.gfxRendering = null;
            this.dataQ = null;
            this.digest_sha256.restore();
            this.sandbox.restore();
        });

        it( 'should not call to addToQueue if Canvas2D is not supported', function() {
            this.sandbox.stub(this.gfxRendering, 'isCanvas2DSupported').returns(false);
            this.gfxRendering.startFeature();

            assert.isFalse(this.dataQ.addToQueue.called, 'addToQueue was called');
        });

        it('should collect gfx rendering', async function () {
            const dataQ = this.dataQ;
            const gfxRendering = this.gfxRendering;
            gfxRendering.startFeature();

            await TestUtils.waitForNoAssertion(() => {

                assert.isTrue(true, "This is a test");

                const callArgs = dataQ.addToQueue.getCall(0).args;
                const text = callArgs[1][1][1];
                const geometry = callArgs[1][1][2];

                assert.isTrue(dataQ.addToQueue.called, 'addToQueue was not called');
                assert.equal('static_fields', callArgs[0], 'expected event name to be static');
                assert.equal('gfx', callArgs[1][0], 'expected first field to be gfx');
                assert.notEqual(0, callArgs[1].length, 'the gfx rendering data is empty');
                assert.isString(text, 'expected text to be string');
                assert.isString(geometry, 'expected geometry to be string');
                assert.isTrue(text.length > 1, 'expected text to be string');
                assert.isTrue(geometry.length > 1, 'expected geometry to be string');
                assert.isNull(gfxRendering.canvasContext, 'canvasContext is not null');
                assert.isNull(gfxRendering.canvasElement, 'canvasElement is not null');
            });
        });

        it('should send "0" if the signature is different the second time the canvas is encoded', function() {
            // Stub the canvasToText method to return a different value the second time it is called
            const canvasToTextStub = this.sandbox.stub(this.gfxRendering, 'canvasToText');
            canvasToTextStub.onCall(0).returns('firstSignature');
            canvasToTextStub.onCall(1).returns('secondSignature');
            this.gfxRendering.startFeature();

            const callArgs = this.dataQ.addToQueue.getCall(0).args;
            assert.equal(callArgs[1][1][1], '0', 'expected text to be 0');
            assert.equal(callArgs[1][1][2], '0', 'expected geometry to be 0');
        });

        it ('should set geometry and text to "0" if the canvas encoding fails', async function() {
            const canvasToTextStub = this.sandbox.stub(this.gfxRendering, 'canvasToText');
            canvasToTextStub.onCall(0).returns("");
            canvasToTextStub.onCall(1).returns("");
            this.gfxRendering.startFeature();

            await TestUtils.waitForNoAssertion(() => {
                const callArgs = this.dataQ.addToQueue.getCall(0).args;
                assert.equal(callArgs[1][1][1], '0', 'expected text to be 0');
                assert.equal(callArgs[1][1][2], '0', 'expected geometry to be 0');
            });
        });

        it ( 'should set geometry and text to "0" if SecurityError exception is thrown by canvasElement.toDataURL()', async function() {
            this.gfxRendering.initCanvasAndContext();
            this.sandbox.stub(this.gfxRendering.canvasElement, 'toDataURL').throws(new Error('SecurityError'));
            this.gfxRendering.startFeature();

            await TestUtils.waitForNoAssertion(() => {
                const callArgs = this.dataQ.addToQueue.getCall(0).args;
                assert.equal(callArgs[1][1][1], '0', 'expected text to be 0');
                assert.equal(callArgs[1][1][2], '0', 'expected geometry to be 0');
            });
        });

        it ('should set winding to false if not supported', async function() {
            this.sandbox.stub(this.gfxRendering, 'hasWinding').returns(false);
            this.gfxRendering.startFeature();

            await TestUtils.waitForNoAssertion(() => {
                const callArgs = this.dataQ.addToQueue.getCall(0).args;
                assert.equal(callArgs[1][1][0], false, 'expected winding to be false');
            });
        });
    });

    describe('Incorrect behavior of digest_sha256 hashing', function () {
        beforeEach( function() {
            this.sandbox = sinon.createSandbox();
            this.dataQ = this.sandbox.createStubInstance(DataQ);
            this.digest_sha256 = sinon.stub(CDUtils, 'digest_sha256').callsFake(async function() {
                throw new Error('digest_sha256 failed');
            });

            this.gfxRendering = new GfxRenderingFeature(this.dataQ, CDUtils);
        });

        afterEach( function() {
            this.gfxRendering.cleanUp();
            this.gfxRendering = null;
            this.dataQ = null;
            this.digest_sha256.restore();
            this.sandbox.restore();
        });

        it('hashCanvasText should return empty string', async function() {
            this.gfxRendering.startFeature();

            await TestUtils.waitForNoAssertion(() => {
                const callArgs = this.dataQ.addToQueue.getCall(0).args;
                assert.equal(callArgs[1][1][1], '0', 'expected text to be 0');
                assert.equal(callArgs[1][1][2], '0', 'expected geometry to be 0');
            });
        });
    });

});
