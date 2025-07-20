import { assert } from 'chai';
import DataPacker from '../../../../src/worker/wup/DataPacker';

const msgpack = require('../../../../src/worker/libs/msgpack.min');
const pako = require('../../../../src/worker/libs/pako.min');

describe('DataPacker tests:', function () {
    describe('pack tests', function () {
        beforeEach(function () {
            this.msgpackEncode = sinon.stub(msgpack, 'encode');
            this.pakoDeflate = sinon.stub(pako, 'deflateRaw');
            this.pakoDeflate.returns('aaa');
        });

        afterEach(function () {
            this.pakoDeflate.restore();
            this.msgpackEncode.restore();
        });

        it('pack is packing data successfully', function () {
            const mouseData = { aProp: 'aVal', bProp: 'bVal' };
            const keyData = { cProp: 2 };

            const rawData = [{ type: 'MouseEvents', data: mouseData }, { type: 'KeyEvents', data: keyData }];

            const dataPacker = new DataPacker();
            const packedData = dataPacker.pack(rawData);
            assert.isNotNull(packedData);

            assert.deepEqual(this.msgpackEncode.firstCall.args[0], rawData);
            assert.equal(btoa('aaa'), packedData);
            assert.isTrue(this.pakoDeflate.calledOnce, 'packDeflate was not called once');
        });
    });
});
