import {assert} from 'chai';
import BrowserContext from '../../../../../src/main/core/browsercontexts/BrowserContext';
import BrowserContextMutationObserver
    from '../../../../../src/main/core/browsercontexts/BrowserContextMutationObserver';
import TestFeatureSupport from '../../../../TestFeatureSupport';
import * as CDMap from '../../../../../src/main/infrastructure/CDMap';
import MessageBus from '../../../../../src/main/technicalServices/MessageBus';
import {TestUtils} from '../../../../TestUtils';
import {MessageBusEventType} from '../../../../../src/main/events/MessageBusEventType';
import ElementsMutationObserverFactory from '../../../../../src/main/core/browsercontexts/ElementsMutationObserver';
import NodesAddedMutationEvent from '../../../../../src/main/events/NodesAddedMutationEvent';
import NodesRemovedMutationEvent from '../../../../../src/main/events/NodesRemovedMutationEvent';

describe('BrowserContexts tests:', function () {
    it('Can successfully represent a window element in a BrowserContext', function () {
        const browserContext = new BrowserContext(self);
        assert.equal(browserContext.Context, self);
        assert.equal(browserContext.getDocument(), self.document);
    });

    describe('BrowserContextMutationObserver Tests', function () {
        beforeEach(function () {
            if (!TestFeatureSupport.isMutationObserverSupported()) {
                this.skip();
                return;
            }

            this.sandbox = sinon.createSandbox();
            this.windowMutationObservers = CDMap.create();
            this.messageBus = new MessageBus();
            this.browserContext = sinon.createStubInstance(BrowserContext);
            sinon.stub(this.browserContext, 'Context').get(function getterFn() {
                return self;
            });
            this.browserContext.getDocument.returns(document);

            this.inputElement = document.createElement('input');
            this.inputElement.setAttribute('id', 'bcsIE1');
            this.inputElement.type = 'text';
            this.inputElement.value = 'Some input field text 1';
            this.inputElement.className = 'input-text-class'; // set the CSS class
        });

        it('Mutation events are handled by BrowserContextMutationObserver', async function () {
            const messageBusPublishSpy = this.sandbox.spy(this.messageBus, 'publish');
            const browserContextMutationObserver = new BrowserContextMutationObserver(this.windowMutationObservers, this.messageBus);
            browserContextMutationObserver.monitorWindow(this.browserContext);
            assert.equal(this.windowMutationObservers.size, 1);

            document.body.appendChild(this.inputElement);

            await TestUtils.waitForNoAssertion(() => {
                assert.isTrue(messageBusPublishSpy.calledOnce);
                assert.isTrue(messageBusPublishSpy.calledWith(MessageBusEventType.MutationAddedNodes,
                    this.sandbox.match.instanceOf(NodesAddedMutationEvent)));
            });

            document.body.removeChild(this.inputElement);

            await TestUtils.waitForNoAssertion(() => {
                assert.isTrue(messageBusPublishSpy.calledTwice);
                assert.isTrue(messageBusPublishSpy.calledWith(MessageBusEventType.MutationRemovedNodes,
                    this.sandbox.match.instanceOf(NodesRemovedMutationEvent)));
            });

            browserContextMutationObserver.unMonitorWindow(this.browserContext);
            assert.equal(this.windowMutationObservers.size, 0);
        });

        it('A browser context by MessageBusEventType.BrowserContextAdded is monitored', function () {
            const browserContextMutationObserver = new BrowserContextMutationObserver(this.windowMutationObservers, this.messageBus);
            browserContextMutationObserver.monitorWindow(this.browserContext);
            this.messageBus.publish(MessageBusEventType.BrowserContextAdded, this.browserContext);
            assert.equal(this.windowMutationObservers.size, 1);
        });
    });
});
