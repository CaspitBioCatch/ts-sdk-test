import KeyboardLayoutFeature from "../../../../../src/main/collectors/static/KeyboardLayoutFeature";
import DataQ from "../../../../../src/main/technicalServices/DataQ";
import Log from "../../../../../src/main/technicalServices/log/Logger";
import sinon from "sinon";
import {assert} from "chai";
import KeyboardLayoutContract from "../../../../../src/main/contract/staticContracts/KeyboardLayoutContract";
import {x64hash128} from "../../../../../src/main/technicalServices/Hash";

describe('KeyboardLayoutFeature additional tests:', function () {

    beforeEach(function () {
        this.sandbox = sinon.createSandbox();
        this.dataQ = this.sandbox.createStubInstance(DataQ);
        this.logErrorStub = this.sandbox.stub(Log, 'error');
        this.logInfoStub = this.sandbox.stub(Log, 'info');
        this.keyboardLayoutFeature = new KeyboardLayoutFeature(this.dataQ);
    });

    afterEach(function () {
        this.sandbox.restore();
    });

    it('should log info when _collectKeyboardLayoutInfo starts', async function () {
        const keyboardLayoutData = "b0e106ee1de7ce5ea7bcc1bd50542ddd";
        this.sandbox.stub(this.keyboardLayoutFeature, '_getKeyboardLayoutInfo').resolves(keyboardLayoutData);

        await this.keyboardLayoutFeature._collectKeyboardLayoutInfo();
        assert.isTrue(this.logInfoStub.calledWith("Collecting keyboard layout properties"));
    });

    it('should add to data queue only if _getKeyboardLayoutInfo resolves with data', async function () {
        const keyboardLayoutData = "b0e106ee1de7ce5ea7bcc1bd50542ddd";
        this.sandbox.stub(this.keyboardLayoutFeature, '_getKeyboardLayoutInfo').resolves(keyboardLayoutData);

        const contractData = "contractKeyboardLayoutData";
        this.sandbox.stub(KeyboardLayoutContract.prototype, 'buildQueueMessage').returns(contractData);

        await this.keyboardLayoutFeature._collectKeyboardLayoutInfo();

        assert.isTrue(this.dataQ.addToQueue.calledOnceWith('static_fields', contractData, false));
    });

    it('should resolve with a keyboardLayout from _getKeyboardLayoutInfo', async function () {
        const mockLayoutMap = new Map([
            ['KeyA', 'a'],
            ['KeyB', 'b'],
        ]);
        const mockLayoutMapValues = Array.from(mockLayoutMap.values()).join("");
        const keyboardLayoutData = x64hash128(mockLayoutMapValues);
        const mockKeyboard = {
            getLayoutMap: async () => mockLayoutMap,
        };

        this.sandbox.stub(this.keyboardLayoutFeature, 'getKeyboard').returns(mockKeyboard);

        const result = await this.keyboardLayoutFeature._getKeyboardLayoutInfo();

        assert.equal(result, keyboardLayoutData);
    });

    it('should not add to data queue if getLayoutMap fails in _collectKeyboardLayoutInfo', async function () {
        const mockKeyboard = {
            getLayoutMap: async () => {
                throw new Error('Keyboard layout failed');
            }
        };
        this.sandbox.stub(this.keyboardLayoutFeature, 'getKeyboard').returns(mockKeyboard);

        await this.keyboardLayoutFeature._collectKeyboardLayoutInfo();

        assert.isFalse(this.dataQ.addToQueue.called);
    });
});
