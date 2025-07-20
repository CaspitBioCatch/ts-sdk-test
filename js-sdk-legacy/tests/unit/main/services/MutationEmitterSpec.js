import { assert } from 'chai';
import MessageBus from '../../../../src/main/technicalServices/MessageBus';
import MutationEmitter from '../../../../src/main/services/MutationEmitter';
import { TestUtils } from '../../../TestUtils';
import TestFeatureSupport from '../../../TestFeatureSupport';
import BrowserContext from '../../../../src/main/core/browsercontexts/BrowserContext';

describe('MutationEmitter Service Tests:', function () {
    beforeEach(function () {
        if (!TestFeatureSupport.isMutationObserverSupported()) {
            this.skip();
            return;
        }
        this._messageBus = new MessageBus(self.Map, self.Set);

        this._mutationEmitter = new MutationEmitter(this._messageBus);
        sinon.spy(this._mutationEmitter, 'handleMutationEvent');
    });

    afterEach(function () {
        this._messageBus = null;
        sinon.restore();
    });

    it('Should create a new instance of MutationEmitter service', function () {
       assert.isObject(this._mutationEmitter, 'Could not create a new MutationEmitter instance');
    });

    it('Should call handleMutationEvent method upon document changes', async function () {
        this._mutationEmitter.startObserver(new BrowserContext(self));

        this.inputElement = document.createElement('input');
        this.inputElement.setAttribute('id', 'txt1');
        this.inputElement.type = 'text';
        this.inputElement.value = 'Some input field text 1';
        this.inputElement.className = 'input-text-class'; // set the CSS class
        document.body.appendChild(this.inputElement); // put it into the DOM

        await TestUtils.waitForNoAssertion(() => {
            assert.isTrue(this._mutationEmitter.handleMutationEvent.called, 'handleMutationEvent was not called upon document changes');
        });
    });
});
