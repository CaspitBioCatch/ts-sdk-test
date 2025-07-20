import ElementsMutationObserver from '../../../../../src/main/core/browsercontexts/ElementsMutationObserver';
import { ConfigurationFields } from '../../../../../src/main/core/configuration/ConfigurationFields';
import CDEvent from '../../../../../src/main/infrastructure/CDEvent';
import {TestUtils} from "../../../../TestUtils";

describe('ElementsMutationObserver Tests', function () {
    let sandbox, mutationObserverMock, configurationRepositoryStub, elementsMutationObserver, fakeDocument;

    beforeEach(function () {
        sandbox = sinon.createSandbox();

        // Create a fake MutationObserver class
        class FakeMutationObserver {
            constructor(callback) {
                this.callback = callback;
                this.observe = sandbox.stub();
                this.disconnect = sandbox.stub();
            }

            // Manually trigger mutations
            triggerMutation(mutations) {
                this.callback(mutations);
            }
        }

        mutationObserverMock = new FakeMutationObserver((mutations) => {
            elementsMutationObserver._mutationObserved({}, mutations);
        });

        // Stub ConfigurationRepository
        configurationRepositoryStub = {
            get: sandbox.stub()
        };
        configurationRepositoryStub.get.withArgs(ConfigurationFields.mutationMaxChunkSize).returns(50);

        // Create a fake document with a valid Node type
        fakeDocument = {
            body: document.createElement('body'),
            querySelectorAll: () => []
        };

        // Initialize `ElementsMutationObserver`
        elementsMutationObserver = new ElementsMutationObserver({}, FakeMutationObserver, configurationRepositoryStub);

        // Stub requestIdleCallbackSafe to call the callback immediately
        this.stubRIC = sandbox.stub(elementsMutationObserver, 'requestIdleCallbackSafe').callsFake((cb) => cb());
    });

    afterEach(function () {
        sandbox.restore();
    });

    it('Constructor initializes with correct dependencies', function () {
        expect(elementsMutationObserver._mutationObserver).to.be.an('object');
        expect(elementsMutationObserver.nodesAdded).to.be.instanceOf(CDEvent);
        expect(elementsMutationObserver.nodesRemoved).to.be.instanceOf(CDEvent);
        expect(elementsMutationObserver._configurationRepository).to.equal(configurationRepositoryStub);
    });

    it('`observe()` calls MutationObserver.observe()', function () {
        elementsMutationObserver.observe(fakeDocument);
        expect(elementsMutationObserver._mutationObserver.observe.calledWith(fakeDocument, {
            childList: true,
            subtree: true
        })).to.be.true;
    });

    it('`disconnect()` calls MutationObserver.disconnect()', function () {
        elementsMutationObserver.disconnect();
        expect(elementsMutationObserver._mutationObserver.disconnect.called).to.be.true;
    });

    it('`_mutationObserved()` correctly queues mutations', function () {
        this.stubRIC.restore()
        const fakeMutation = {
            type: 'childList',
            addedNodes: [document.createElement('div')],
            removedNodes: []
        };

        mutationObserverMock.triggerMutation([fakeMutation]);

        expect(elementsMutationObserver.mutationQueue.length).to.equal(1);
    });

    it('`_processMutationQueue()` processes mutations in batches', function () {
        const fakeMutation = {
            type: 'childList',
            addedNodes: [document.createElement('div')],
            removedNodes: []
        };

        elementsMutationObserver.mutationQueue.push(fakeMutation);
        elementsMutationObserver._processMutationQueue({});

        expect(elementsMutationObserver.mutationQueue.length).to.equal(0);
    });

    it('`_processMutation()` correctly publishes events', async function () {
        const fakeNode = document.createElement('div');
        const fakeMutation = {
            type: 'childList',
            addedNodes: [fakeNode],
            removedNodes: []
        };

        const nodesAddedSpy = sandbox.spy(elementsMutationObserver.nodesAdded, 'publish');
        elementsMutationObserver._processMutation({}, fakeMutation);

        await TestUtils.wait(100);

        expect(nodesAddedSpy.calledOnce).to.be.true;
    });

    it('`_isValidNodeType()` correctly filters node types', function () {
        const validNode = document.createElement('div');
        const invalidNode = document.createTextNode('text');

        expect(elementsMutationObserver._isValidNodeType(validNode)).to.be.true;
        expect(elementsMutationObserver._isValidNodeType(invalidNode)).to.be.false;
    });

    it('`_publishNodesMutationEvents()` calls event publishing correctly', async function () {
        const nodesAddedSpy = sandbox.spy(elementsMutationObserver.nodesAdded, 'publish');
        const nodesRemovedSpy = sandbox.spy(elementsMutationObserver.nodesRemoved, 'publish');

        elementsMutationObserver._publishNodesMutationEvents({}, [document.createElement('div')], []);
        await TestUtils.wait(100);
        expect(nodesAddedSpy.calledOnce).to.be.true;
        expect(nodesRemovedSpy.called).to.be.false;
    });
});