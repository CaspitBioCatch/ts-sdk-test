import { expect } from 'chai';
import sinon from 'sinon';
import BioCatchSDK from '../../../src/npm/entry';
import { BioCatchApi } from '../../../src/npm/BioCatchApi';
import { DynamicCdApiLoader } from '../../../src/main/core/DynamicCdApiLoader';
import { ConfigMapper } from '../../../src/main/core/ConfigMapper';
import { ServerUrlResolver } from '../../../src/main/core/ServerUrlResolver';
import Client from '../../../src/main/Client';

describe('entry.js', () => {
    let sandbox, clientApiMock;

    beforeEach(() => {
        sandbox = sinon.createSandbox();

        // Mock dependencies
        sinon.stub(BioCatchApi.prototype);
        sinon.stub(DynamicCdApiLoader.prototype);
        sinon.stub(ConfigMapper.prototype);
        sinon.stub(ServerUrlResolver.prototype);
        sinon.stub(Client.prototype);

        // Create a mock clientApi
        const clientApiMock = {
            start: sinon.stub(),
            stop: sinon.stub(),
            pause: sinon.stub(),
            resume: sinon.stub(),
            updateCustomerSessionID: sinon.stub(),
            changeContext: sinon.stub(),
            startNewSession: sinon.stub(),
            setCoordinatesMasking: sinon.stub(),
            setCustomerBrand: sinon.stub(),
        };

        // Initialize the singleton explicitly for testing
        BioCatchSDK._instance = null;
        BioCatchSDK.getInstance(clientApiMock);
    });

    afterEach(() => {
        sinon.restore();
        BioCatchSDK._instance = null;
    });

    it('should export BioCatchSDK singleton instance', () => {
        const instance = BioCatchSDK.getInstance();
        expect(instance).to.be.instanceOf(BioCatchSDK);
    });

    it('should return the same instance on multiple calls', () => {
        const instance1 = BioCatchSDK.getInstance();
        const instance2 = BioCatchSDK.getInstance();
        expect(instance1).to.equal(instance2);
    });
});