import { assert } from 'chai';
import FramesDetector from '../../../../../src/main/core/frames/FramesDetector';
import ConfigurationRepository from '../../../../../src/main/core/configuration/ConfigurationRepository';
import TestFeatureSupport from '../../../../TestFeatureSupport';
import ElementsMutationObserverFactory from '../../../../../src/main/core/browsercontexts/ElementsMutationObserverFactory';
import ElementsMutationObserver from '../../../../../src/main/core/browsercontexts/ElementsMutationObserver';
import { MockObjects } from '../../../mocks/mockObjects';
import { SystemFrameName } from '../../../../../src/main/core/frames/SystemFrameName';

describe('FramesDetector tests:', function () {
    function createNodeStub(sandbox) {
        const nodeStub = sandbox.stub();
        nodeStub.hasChildNodes = sandbox.stub();
        nodeStub.querySelectorAll = sandbox.stub();
        nodeStub.contentWindow = sandbox.stub();
        nodeStub.contentWindow.document = sandbox.stub();
        nodeStub.contentWindow.document.querySelectorAll = sandbox.stub();
        nodeStub.contentWindow.document.querySelectorAll.returns([]);

        return nodeStub;
    }

    beforeEach(function () {
        if (!TestFeatureSupport.isMutationObserverSupported()) {
            this.skip();
            return;
        }

        this.sandbox = sinon.createSandbox();
        this.configurationRepositoryStub = this.sandbox.stub(new ConfigurationRepository());

        this.nodeStub = createNodeStub(this.sandbox);
        this.nodeStub2 = createNodeStub(this.sandbox);
        this.nodeStub3 = createNodeStub(this.sandbox);

        this.domUtilsStub = this.sandbox.stub(MockObjects.domUtils);

        this.elementsMutationObserverFactoryStub = this.sandbox.createStubInstance(ElementsMutationObserverFactory);
        this.elementsMutationObserverStub = this.sandbox.createStubInstance(ElementsMutationObserver);
        this.elementsMutationObserverStub.nodeAdded = this.sandbox.stub();
        this.elementsMutationObserverStub.nodeAdded.subscribe = this.sandbox.stub();
        this.elementsMutationObserverStub.nodeRemoved = this.sandbox.stub()
        this.elementsMutationObserverStub.nodeRemoved.subscribe = this.sandbox.stub();

        this.elementsMutationObserverFactoryStub.create.returns(this.elementsMutationObserverStub);

        this.windowStub = this.sandbox.stub();
        this.windowStub.document = this.sandbox.stub();
        this.framesDetector = new FramesDetector(this.elementsMutationObserverFactoryStub, this.domUtilsStub, this.configurationRepositoryStub);
        this.framesDetector.start(window);

        this.frameAddedCallback = this.sandbox.spy();
        this.framesDetector.frameAdded.subscribe(this.frameAddedCallback);
        this.frameRemovedCallback = this.sandbox.spy();
        this.framesDetector.frameRemoved.subscribe(this.frameRemovedCallback);
        this.frameInaccessibleCallback = this.sandbox.spy();
        this.framesDetector.frameInaccessible.subscribe(this.frameInaccessibleCallback);
    });

    afterEach(function () {
        this.framesDetector.stop();

        this.sandbox.restore();
    });

    describe('frames detection:', function () {
        beforeEach(function () {
            this.domUtilsStub.matches.returns(true);
            this.domUtilsStub.canAccessIFrame.returns(true);
            this.domUtilsStub.isWindowDocumentReady.returns(true);
        });

        it('node is matched again iframe and legacy frame elements', function () {
            const nodeAddedCallback = this.elementsMutationObserverStub.nodeAdded.subscribe.firstCall.args[0];
            nodeAddedCallback(this.nodeStub);

            assert.isTrue(this.domUtilsStub.matches.calledOnce);
            assert.equal(this.domUtilsStub.matches.firstCall.args[0], this.nodeStub);
            assert.equal(this.domUtilsStub.matches.firstCall.args[1], 'frame, iframe');

        });

        it('frame is added', function () {
            const nodeAddedCallback = this.elementsMutationObserverStub.nodeAdded.subscribe.firstCall.args[0];
            nodeAddedCallback(this.nodeStub);

            assert.isTrue(this.frameAddedCallback.calledOnce, `frame added Callback was not called once. It was called ${this.frameAddedCallback.callCount}`);
            assert.isTrue(this.frameAddedCallback.calledWith(this.nodeStub), 'the expected frames array was not passed to frameAdded callback');
            assert.isTrue(this.frameRemovedCallback.notCalled, `frame removed Callback was called. It was called ${this.frameRemovedCallback.callCount}`);
        });

        it('frame is removed', async function () {
            const nodeAddedCallback = this.elementsMutationObserverStub.nodeAdded.subscribe.firstCall.args[0];
            nodeAddedCallback(this.nodeStub);

            assert.isTrue(this.frameAddedCallback.calledOnce, `frame added Callback was not called once. It was called ${this.frameAddedCallback.callCount}`);

            const nodeRemovedCallback = this.elementsMutationObserverStub.nodeRemoved.subscribe.firstCall.args[0];
            nodeRemovedCallback(this.nodeStub);

            assert.isTrue(this.frameRemovedCallback.calledOnce, `frame removed Callback was not called once. It was called ${this.frameRemovedCallback.callCount}`);
            assert.isTrue(this.frameRemovedCallback.calledWith(this.nodeStub), 'the expected frames array was not passed to framesRemoved callback');
        });

        it('multiple frames are added and removed', async function () {
            const nodeAddedCallback = this.elementsMutationObserverStub.nodeAdded.subscribe.firstCall.args[0];
            nodeAddedCallback(this.nodeStub);
            nodeAddedCallback(this.nodeStub2);

            assert.isTrue(this.frameAddedCallback.calledTwice, `frame added Callback was not called twice. It was called ${this.frameAddedCallback.callCount}`);
            assert.isTrue(this.frameAddedCallback.calledWith(this.nodeStub), 'the expected frames array was not passed to frameAdded callback');
            assert.isTrue(this.frameAddedCallback.calledWith(this.nodeStub2), 'the expected frames array was not passed to frameAdded callback');

            const nodeRemovedCallback = this.elementsMutationObserverStub.nodeRemoved.subscribe.firstCall.args[0];
            nodeRemovedCallback(this.nodeStub2);

            nodeAddedCallback(this.nodeStub3);

            nodeRemovedCallback(this.nodeStub);

            assert.isTrue(this.frameAddedCallback.calledThrice, `frame added Callback was not called thrice. It was called ${this.frameAddedCallback.callCount}`);
            assert.isTrue(this.frameAddedCallback.calledWith(this.nodeStub), 'the expected frames array was not passed to frameAdded callback');
            assert.isTrue(this.frameAddedCallback.calledWith(this.nodeStub2), 'the expected frames array was not passed to frameAdded callback');
            assert.isTrue(this.frameAddedCallback.calledWith(this.nodeStub3), 'the expected frames array was not passed to frameAdded callback');
            assert.isTrue(this.frameRemovedCallback.calledTwice, `frame removed Callback was not called twice. It was called ${this.frameRemovedCallback.callCount}`);
            assert.isTrue(this.frameRemovedCallback.calledWith(this.nodeStub2), 'the expected frames array was not passed to framesRemoved callback');
            assert.isTrue(this.frameRemovedCallback.calledWith(this.nodeStub), 'the expected frames array was not passed to framesRemoved callback');

            nodeRemovedCallback(this.nodeStub3);

            assert.isTrue(this.frameRemovedCallback.calledThrice, `frames removed Callback was not called thrice. It was called ${this.frameRemovedCallback.callCount}`);
            assert.isTrue(this.frameRemovedCallback.calledWith(this.nodeStub2), 'the expected frames array was not passed to framesRemoved callback');
            assert.isTrue(this.frameRemovedCallback.calledWith(this.nodeStub), 'the expected frames array was not passed to framesRemoved callback');
            assert.isTrue(this.frameRemovedCallback.calledWith(this.nodeStub3), 'the expected frames array was not passed to framesRemoved callback');
        });

        it('frame is removed and re-added', async function () {
            const nodeAddedCallback = this.elementsMutationObserverStub.nodeAdded.subscribe.firstCall.args[0];
            nodeAddedCallback(this.nodeStub);

            assert.isTrue(this.frameAddedCallback.calledOnce, `frame added Callback was not called once. It was called ${this.frameAddedCallback.callCount}`);

            const nodeRemovedCallback = this.elementsMutationObserverStub.nodeRemoved.subscribe.firstCall.args[0];
            nodeRemovedCallback(this.nodeStub);

            assert.isTrue(this.frameRemovedCallback.calledOnce, `frame removed Callback was not called once. It was called ${this.frameRemovedCallback.callCount}`);
            assert.isTrue(this.frameRemovedCallback.calledWith(this.nodeStub), 'the expected frames array was not passed to framesRemoved callback');

            assert.equal(this.framesDetector.frames.length, 0, 'frames detector frames list doesnt contain correct amount of frames');

            this.frameAddedCallback.resetHistory();

            nodeAddedCallback(this.nodeStub);

            assert.isTrue(this.frameAddedCallback.calledOnce, `frame added Callback was not called once. It was called ${this.frameAddedCallback.callCount}`);
            assert.isTrue(this.frameAddedCallback.calledWith(this.nodeStub), 'the expected frames array was not passed to frameAdded callback');

            assert.equal(this.framesDetector.frames.length, 1, 'frames detector frames list doesnt contain correct amount of frames');
        });

        it('frame is not added since it is in the ignore list', async function () {
            this.nodeStub.id = 'bobid';
            this.framesDetector.addToIgnoreList(this.nodeStub.id);

            const nodeAddedCallback = this.elementsMutationObserverStub.nodeAdded.subscribe.firstCall.args[0];
            nodeAddedCallback(this.nodeStub);

            assert.isTrue(this.frameAddedCallback.notCalled, `frame added Callback was called. It was called ${this.frameAddedCallback.callCount}`);
            assert.isTrue(this.frameRemovedCallback.notCalled, `frame removed Callback was called. It was called ${this.frameRemovedCallback.callCount}`);

            assert.equal(this.framesDetector.frames.length, 0, 'frames detector frames list doesnt contain correct amount of frames');
        });

        it('frame is not added since it contains an ignore prefix', async function () {
            this.nodeStub.id = SystemFrameName.ignorePrefixFrame + 'bobid';

            const nodeAddedCallback = this.elementsMutationObserverStub.nodeAdded.subscribe.firstCall.args[0];
            nodeAddedCallback(this.nodeStub);

            assert.isTrue(this.frameAddedCallback.notCalled, `frame added Callback was called. It was called ${this.frameAddedCallback.callCount}`);
            assert.isTrue(this.frameRemovedCallback.notCalled, `frame removed Callback was called. It was called ${this.frameRemovedCallback.callCount}`);

            assert.equal(this.framesDetector.frames.length, 0, 'frames detector frames list doesnt contain correct amount of frames');
        });

        it('cross domain frame is detected', async function () {
            this.domUtilsStub.canAccessIFrame.returns(false);

            const nodeAddedCallback = this.elementsMutationObserverStub.nodeAdded.subscribe.firstCall.args[0];
            nodeAddedCallback(this.nodeStub);

            assert.isTrue(this.domUtilsStub.canAccessIFrame.calledOnce);
            assert.equal(this.domUtilsStub.canAccessIFrame.firstCall.args[0], this.nodeStub);

            assert.isTrue(this.frameInaccessibleCallback.called, `frame inaccessible Callback was not called once. It was called ${this.frameInaccessibleCallback.callCount}`);
            assert.isTrue(this.frameInaccessibleCallback.calledWith(this.nodeStub), 'the expected frames array was not passed to frameAdded callback');

            assert.equal(this.framesDetector.frames.length, 0, 'frames detector frames list doesnt contain correct amount of frames');
        });

        it('frame which is not ready is skipped', async function () {
            this.domUtilsStub.isWindowDocumentReady.returns(false);

            const nodeAddedCallback = this.elementsMutationObserverStub.nodeAdded.subscribe.firstCall.args[0];
            nodeAddedCallback(this.nodeStub);

            assert.isTrue(this.domUtilsStub.canAccessIFrame.calledOnce);
            assert.equal(this.domUtilsStub.canAccessIFrame.firstCall.args[0], this.nodeStub);
            assert.isTrue(this.domUtilsStub.isWindowDocumentReady.calledOnce);
            assert.equal(this.domUtilsStub.isWindowDocumentReady.firstCall.args[0], this.nodeStub.contentWindow);

            assert.isTrue(this.frameInaccessibleCallback.notCalled, `frame inaccessible Callback was not called once. It was called ${this.frameInaccessibleCallback.callCount}`);

            assert.equal(this.framesDetector.frames.length, 0, 'frames detector frames list doesnt contain correct amount of frames');
        });

        it('child frame is detected', function () {
            this.domUtilsStub.matches.withArgs(this.nodeStub).returns(false);
            this.domUtilsStub.matches.withArgs(this.nodeStub2).returns(true);
            this.nodeStub.hasChildNodes.returns(true);
            this.nodeStub.querySelectorAll.returns([this.nodeStub2]);

            const nodeAddedCallback = this.elementsMutationObserverStub.nodeAdded.subscribe.firstCall.args[0];
            nodeAddedCallback(this.nodeStub);

            assert.isTrue(this.frameAddedCallback.calledOnce, `frame added Callback was not called once. It was called ${this.frameAddedCallback.callCount}`);
            assert.isTrue(this.frameAddedCallback.calledWith(this.nodeStub2), 'the expected frames array was not passed to frameAdded callback');
            assert.isTrue(this.frameRemovedCallback.notCalled, `frame removed Callback was called. It was called ${this.frameRemovedCallback.callCount}`);

        });

        it('div with sub frame is removed', async function () {
            this.domUtilsStub.matches.withArgs(this.nodeStub).returns(false);
            this.domUtilsStub.matches.withArgs(this.nodeStub2).returns(true);
            this.nodeStub.hasChildNodes.returns(true);
            this.nodeStub.querySelectorAll.returns([this.nodeStub2]);

            const nodeAddedCallback = this.elementsMutationObserverStub.nodeAdded.subscribe.firstCall.args[0];
            nodeAddedCallback(this.nodeStub);

            assert.isTrue(this.frameAddedCallback.calledOnce, `frame added Callback was not called once. It was called ${this.frameAddedCallback.callCount}`);

            const nodeRemovedCallback = this.elementsMutationObserverStub.nodeRemoved.subscribe.firstCall.args[0];
            nodeRemovedCallback(this.nodeStub);

            assert.isTrue(this.frameRemovedCallback.calledOnce, `frame removed Callback was not called once. It was called ${this.frameRemovedCallback.callCount}`);
            assert.isTrue(this.frameRemovedCallback.calledWith(this.nodeStub2), 'the expected frames array was not passed to framesRemoved callback');
        });
    });

    describe('stop detection:', function () {
        it('stop detection stops detection of frames', async function () {
            this.framesDetector.stop();

            assert.isTrue(this.elementsMutationObserverStub.disconnect.called);
        });

        it('stop clears the detected frames list', async function () {
            const nodeAddedCallback = this.elementsMutationObserverStub.nodeAdded.subscribe.firstCall.args[0];
            nodeAddedCallback(this.nodeStub);

            this.framesDetector.stop();

            assert.equal(this.framesDetector.frames.length, 0);
        });
    });
});
