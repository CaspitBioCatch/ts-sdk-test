import { assert } from 'chai';
import TabEventCollector from '../../../../../src/main/collectors/events/TabEventCollector';
import CDUtils from '../../../../../src/main/technicalServices/CDUtils';
import { EventStructure as TabEventStructure } from '../../../../../src/main/collectors/events/TabEventCollector';
import { TabEventType } from '../../../../../src/main/collectors/events/TabEventCollector';
import DataQ from '../../../../../src/main/technicalServices/DataQ';
import BrowserContext from '../../../../../src/main/core/browsercontexts/BrowserContext';
import sinon from "sinon";
import Log from "../../../../../src/main/technicalServices/log/Logger";

describe('Tabs open/close events tests:', function () {
    beforeEach(function () {
        this.sandbox = sinon.createSandbox();
        this.getLocal = this.sandbox.stub(CDUtils.StorageUtils, 'getFromLocalStorage');
        this.getSession = this.sandbox.stub(CDUtils.StorageUtils, 'getFromSessionStorage');
        this._browserContext = new BrowserContext(self);
        this.dataQ = this.sandbox.createStubInstance(DataQ);
        this.tabEvents = new TabEventCollector(CDUtils, this.dataQ);

        // Stub Log methods to prevent console output during tests
        this.sandbox.stub(Log, 'error');
        this.sandbox.stub(Log, 'info');

        // Mock window object
        // Mock window.addEventListener and window.removeEventListener
        this.addEventListenerStub = this.sandbox.stub(window, 'addEventListener');
        this.removeEventListenerStub = this.sandbox.stub(window, 'removeEventListener');

    });

    afterEach(function () {
        this.sandbox.restore();
    });

    describe('TabsEvents tests:', function () {
        it('should identify new tab open event and close event and call queue', function () {
            this.getLocal.returns('');
            this.getSession.returns('');

            this.tabEvents.startFeature(this._browserContext);
            assert.isTrue(this.dataQ.addToQueue.called, 'addToQueue should be called');
            assert.equal(this.dataQ.addToQueue.firstCall.args[0], 'tab_events', 'wrong event type');
            const data = this.dataQ.addToQueue.firstCall.args[1];
            assert.isTrue(data[TabEventStructure.indexOf('type') + 1] === TabEventType.newTab
                || data[TabEventStructure.indexOf('type') + 1] === TabEventType.openTab, 'wrong tab event type');
            const list = JSON.parse(data[TabEventStructure.indexOf('currentTabsList') + 1]);
            if (list && list.length > 0) {
                assert.equal(list[0][0], data[TabEventStructure.indexOf('id') + 1], 'wrong event id');
                assert.equal(list[0][1], data[TabEventStructure.indexOf('timestamp') + 1], 'wrong event time');
            }

            this.dataQ.addToQueue.resetHistory();
            this.getLocal.returns([[data[TabEventStructure.indexOf('id') + 1], 1513071499304]]);
            this.tabEvents._onUnloadTab();
            assert.isTrue(this.dataQ.addToQueue.called, 'addToQueue should be called for close event');
            assert.equal(this.dataQ.addToQueue.firstCall.args[1][TabEventStructure.indexOf('type') + 1], TabEventType.closeTab, 'wrong event type');
        });

        it('should identify new tab open event and list of tabs and call queue', function () {
            this.getLocal.returns([['fa753ae0-c3a2-42c1-971d-6e129ccbd889', 1513008189590]]);
            this.getSession.returns('');

            this.tabEvents.startFeature(this._browserContext);

            assert.isTrue(this.dataQ.addToQueue.called, 'addToQueue should be called');
            const data = this.dataQ.addToQueue.firstCall.args[1];

            assert.isTrue(data[TabEventStructure.indexOf('type') + 1] === TabEventType.newTab
                || data[TabEventStructure.indexOf('type') + 1] === TabEventType.openTab, 'wrong event type');
            const list = JSON.parse(data[TabEventStructure.indexOf('currentTabsList') + 1]);
            if (list && list.length > 1) {
                assert.equal(list.length, 2, 'wrong list length');
                assert.equal(list[0][0], 'fa753ae0-c3a2-42c1-971d-6e129ccbd889');
                assert.equal(list[1][0], data[TabEventStructure.indexOf('id') + 1]);
                assert.equal(list[0][1], 1513008189590);
                assert.equal(list[1][1], data[TabEventStructure.indexOf('timestamp') + 1]);
            }
            this.dataQ.addToQueue.resetHistory();
            this.tabEvents._onUnloadTab();
            assert.isTrue(this.dataQ.addToQueue.called, 'addToQueue should be called for close event');
            assert.equal(this.dataQ.addToQueue.firstCall.args[1][TabEventStructure.indexOf('type') + 1], TabEventType.closeTab, 'wrong event type');

            const tabList = this.getLocal.returnValues[0];
            assert.equal(tabList.length, 1, 'wrong list length');
            assert.equal(tabList[0][0], 'fa753ae0-c3a2-42c1-971d-6e129ccbd889');
        });

        describe('startFeature', function () {
            it('should add beforeunload event listener to window', function () {
                this.tabEvents.startFeature();

                assert.isTrue(Log.info.calledWith('Starting tab events feature'), 'Should log start message');
                assert.isTrue(window.addEventListener.calledOnce, 'addEventListener should be called once');
                assert.isTrue(window.addEventListener.calledWith('beforeunload', sinon.match.func), 'addEventListener should be called with correct arguments');
            });
        });

        describe('stopFeature', function () {
            it('should remove beforeunload event listener from window', function () {
                this.tabEvents.stopFeature();

                assert.isTrue(Log.info.calledWith('Stopping tab events feature'), 'Should log stop message');
                assert.isTrue(window.removeEventListener.calledOnce, 'removeEventListener should be called once');
                assert.isTrue(window.removeEventListener.calledWith('beforeunload', sinon.match.func), 'removeEventListener should be called with correct arguments');
            });
        });

        it('should use the same function for adding and removing the beforeunload listener', function () {
            this.tabEvents.startFeature();
            const addedListener = window.addEventListener.firstCall.args[1];
            this.tabEvents.stopFeature();
            const removedListener = window.removeEventListener.firstCall.args[1];

            assert.strictEqual(addedListener, removedListener, 'The same function should be used for adding and removing the beforeunload listener');
        });
    });
});