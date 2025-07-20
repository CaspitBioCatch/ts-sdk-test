import { assert } from 'chai';
import ElementSettings from "../../../../src/main/api/ElementSettings";
import CollectionSettings from "../../../../src/main/api/CollectionSettings";
import {AgentType} from "../../../../src/main/contract/AgentType";
import sinon from "sinon";
import {APIConfigurationKey} from "../../../../src/main/contract/APIConfigurationKey";
import Log from "../../../../src/main/technicalServices/log/Logger";
import {CollectionMode} from "../../../../src/main/contract/CollectionMode";

describe('CollectionSettings tests:', function () {
    let sandbox;
    let logWarnStub;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        logWarnStub = sandbox.stub(Log, 'warn'); // Stub the Log.warn method
    });

    afterEach(() => {
        sandbox.restore();
    });
    it('getElementSettings as expected', function () {
        const settings = {'elementSettings': {'customElementAttribute': 'bob'}};
        const expectedElementSettings = new ElementSettings({'customElementAttribute': 'bob'});
        const collectionSettings = new CollectionSettings(settings);
        assert.deepEqual(collectionSettings.getElementSettings(), expectedElementSettings);
    });

    it("maskElementsAttributes as expected",  function(){
        const settings = {'elementSettings': {'maskElementsAttributes': ['password']}};
           const  expectedElementSettings = new ElementSettings({'maskElementsAttributes': ['password']})
           const  collectionSettings = new CollectionSettings(settings);
           assert.deepEqual(collectionSettings.getElementSettings().getAttributesToMask(),expectedElementSettings.getAttributesToMask(), 'expected to get the same object');

    })

    describe('_validateAgentType', () => {
        it('should return the valid agentType if provided', () => {
            const settings = new CollectionSettings({ [APIConfigurationKey.mode]: { agentType: AgentType.PRIMARY } });
            assert.equal(settings.getAgentType(), AgentType.PRIMARY);
            assert.isFalse(logWarnStub.called);
        });

        it('should return the default agentType if an invalid one is provided', () => {
            const settings = new CollectionSettings({ [APIConfigurationKey.mode]: { agentType: 'INVALID_TYPE' } });
            assert.equal(settings.getAgentType(), AgentType.PRIMARY);
            assert.isTrue(logWarnStub.calledWith('Invalid agent type: INVALID_TYPE. Defaulting to primary agent type.'));
        });

        it('should return the default agentType if none is provided without logging a warning', () => {
            const settings = new CollectionSettings({});
            assert.equal(settings.getAgentType(), AgentType.PRIMARY);
            assert.isFalse(logWarnStub.called);
        });
    });

    describe('_setAgentCollectionMode', () => {
        it('should return FULL mode for PRIMARY agentType', () => {
            const settings = new CollectionSettings({ [APIConfigurationKey.mode]: { agentType: AgentType.PRIMARY } });
            const result = settings._setAgentCollectionMode(CollectionMode.LEAN);
            assert.equal(result, CollectionMode.FULL);
        });

        it('should return validated mode for SECONDARY agentType', () => {
            const settings = new CollectionSettings({ [APIConfigurationKey.mode]: { agentType: AgentType.SECONDARY } });
            const result = settings._setAgentCollectionMode(CollectionMode.LEAN);
            assert.equal(result, CollectionMode.LEAN);
        });
    });

    describe('_validateCollectionMode', () => {
        it('should return the valid collectionMode if provided', () => {
            const settings = new CollectionSettings({});
            const result = settings._validateAgentMode(CollectionMode.FULL);
            assert.equal(result, CollectionMode.FULL);
            assert.isFalse(logWarnStub.called);
        });

        it('should return the default collectionMode if an invalid one is provided', () => {
            const settings = new CollectionSettings({});
            const result = settings._validateAgentMode('INVALID_MODE');
            assert.equal(result, CollectionMode.LEAN);
            assert.isTrue(logWarnStub.calledWith('Invalid collection mode: INVALID_MODE. Defaulting to lean collection mode.'));
        });

        it('should return the default collectionMode if none is provided without logging a warning', () => {
            const settings = new CollectionSettings({});
            const result = settings._validateAgentMode(undefined);
            assert.equal(result, CollectionMode.LEAN);
            assert.isFalse(logWarnStub.called);
        });

        it('should return the default collectionMode if an invalid one is provided and log a warning', () => {
            const settings = new CollectionSettings({});
            const result = settings._validateAgentMode('INVALID_MODE');
            assert.equal(result, CollectionMode.LEAN);

            // Assert that the log was called with the expected message
            assert.isTrue(logWarnStub.calledWith('Invalid collection mode: INVALID_MODE. Defaulting to lean collection mode.'));
        });
    });
});