import { assert } from 'chai';
import ScriptsRepository from '../../../../../src/main/collectors/perContext/ScriptsRepository';
import { MockObjects } from '../../../mocks/mockObjects';

describe('ScriptsRepository test:', function () {
    beforeEach(function () {
        this.cdUtilsStub = sinon.stub(MockObjects.cdUtils);
    });

    describe('exists tests:', function () {
        it('script doesnt exist if not added', function () {
            this.cdUtilsStub.getHash.returns('sometext');

            const scriptsRep = new ScriptsRepository(this.cdUtilsStub);

            const notExistingScript = { src: 'myFile', text: '' };

            assert.isFalse(scriptsRep.exists(notExistingScript), 'script exists');
        });

        it('script exists once added', function () {
            this.cdUtilsStub.getHash.returns('sometext');

            const scriptsRep = new ScriptsRepository(this.cdUtilsStub);

            const existingScript = { src: 'myFile', text: '' };
            scriptsRep.add(existingScript);

            assert.isTrue(scriptsRep.exists(existingScript), 'script exists');
        });
    });

    describe('add tests:', function () {
        it('add script with src', function () {
            this.cdUtilsStub.getHash.returns(0);

            const scriptsRep = new ScriptsRepository(this.cdUtilsStub);

            const script = { src: 'myFile', text: '' };
            scriptsRep.add(script);

            assert.equal(scriptsRep.count(), 1, 'script was not added to repository');
        });

        it('add script with src with numbers', function () {
            this.cdUtilsStub.getHash.returns('hashed');
            this.cdUtilsStub.clearTextFromNumbers.returns('hashedAndCleared');

            const scriptsRep = new ScriptsRepository(this.cdUtilsStub);

            const script = { src: 'myFile123', text: 'lalala' };
            scriptsRep.add(script);
            assert.isTrue(this.cdUtilsStub.getHash.calledOnce);
            assert.equal(this.cdUtilsStub.getHash.firstCall.args[0], 'lalala');

            assert.equal(scriptsRep.count(), 1, 'script was not added to repository');
        });

        it('add script with text', function () {
            this.cdUtilsStub.getHash.returns(1234);

            const scriptsRep = new ScriptsRepository(this.cdUtilsStub);
            let script = { src: '', text: 'my script does things' };

            scriptsRep.add(script);
            assert.isTrue(scriptsRep.exists(script), 'script was added to repository');
            assert.equal(script.textHash, 1234, 'script hash was calculated to repository');
            script = { src: 'myScr', text: '' };
            this.cdUtilsStub.getHash.returns(0);
            assert.isFalse(scriptsRep.exists(script), 'not added script exists');
        });

        it('add multiple scripts', function () {
            this.cdUtilsStub.getHash.returns(0);

            const scriptsRep = new ScriptsRepository(this.cdUtilsStub);
            let script = { src: 'myScript', text: '' };
            scriptsRep.add(script);

            script = { src: '', text: 'this is the text' };
            this.cdUtilsStub.getHash.returns(1234);
            scriptsRep.add(script);

            script = { src: 'mySecondScript', text: '' };
            this.cdUtilsStub.getHash.returns(0);
            scriptsRep.add(script);

            assert.isTrue(scriptsRep.exists(script), 'script was added to repository');
            assert.isTrue(scriptsRep.exists({ src: 'myScript', text: '' }), 'script was added to repository');
            this.cdUtilsStub.getHash.returns(1234);
            assert.isTrue(scriptsRep.exists({ src: '', text: 'this is the text' }), 'script was added to repository');
        });
    });
});
