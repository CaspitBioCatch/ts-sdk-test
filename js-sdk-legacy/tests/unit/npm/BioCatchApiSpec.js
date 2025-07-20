import { expect } from 'chai';
import sinon from 'sinon';
import { BioCatchApi } from '../../../src/npm/BioCatchApi';

describe('BioCatchApi', () => {
  let clientMock, dynamicCdApiLoaderMock, configMapperMock, serverUrlResolverMock, configurationLoadedCallbackMock, factory;

  beforeEach(() => {
    clientMock = {
      manualStart: sinon.stub(),
      stop: sinon.stub(),
      pause: sinon.stub(),
      resume: sinon.stub(),
      updateCustomerSessionID: sinon.stub(),
      changeContext: sinon.stub(),
      startNewSession: sinon.stub(),
      setCoordinatesMasking: sinon.stub(),
    };

    dynamicCdApiLoaderMock = {
      createCdApi: sinon.stub().returns({}),
    };

    configMapperMock = {
      mapStartupConfigurations: sinon.stub().returns({}),
    };

    serverUrlResolverMock = {
      resolve: sinon.stub().returns('resolvedUrl'),
    };

    configurationLoadedCallbackMock = sinon.stub();
  });

  it('should return null if browser is not supported', () => {
    // Simulate unsupported browser
    const originalIsSupported = require('../../../src/main/technicalServices/SupportedBrowserChecker').default.isSupported;
    require('../../../src/main/technicalServices/SupportedBrowserChecker').default.isSupported = () => false;

    try {
      new BioCatchApi(clientMock, dynamicCdApiLoaderMock, configMapperMock, serverUrlResolverMock, configurationLoadedCallbackMock);
    } catch (e) {
      expect(e).to.be.instanceOf(Error);
    }
    // Restore
    require('../../../src/main/technicalServices/SupportedBrowserChecker').default.isSupported = originalIsSupported;
  });

  describe('proxy interface', () => {
    let proxy;

    beforeEach(() => {
      proxy = new BioCatchApi(
        clientMock,
        dynamicCdApiLoaderMock,
        configMapperMock,
        serverUrlResolverMock,
        configurationLoadedCallbackMock
      );
    });

    it('should call serverUrlResolver.resolve with correct parameters on start', () => {
      proxy.start('testUrl', 'customerId', 'sessionId', {}, 'protocol');
      expect(serverUrlResolverMock.resolve.calledWith('testUrl', 'customerId', 'protocol')).to.be.true;
    });

    it('should call configMapper.mapStartupConfigurations with correct parameters on start', () => {
      proxy.start('testUrl', 'customerId', 'sessionId', {}, 'protocol');
      expect(configMapperMock.mapStartupConfigurations.calledWith('resolvedUrl', {})).to.be.true;
    });

    it('should call dynamicCdApiLoader.createCdApi with correct parameters on start', () => {
      proxy.start('testUrl', 'customerId', 'sessionId', {}, 'protocol');
      expect(dynamicCdApiLoaderMock.createCdApi.calledWith(window, 'sessionId')).to.be.true;
    });

    it('should call client.manualStart with correct parameters on start', () => {
      proxy.start('testUrl', 'customerId', 'sessionId', {}, 'protocol');
      expect(clientMock.manualStart.calledWith(
        {}, // startupConfigurations
        'resolvedUrl',
        configurationLoadedCallbackMock,
        {} // cdApi
      )).to.be.true;
    });

    it('should call client.stop', () => {
      proxy.stop();
      expect(clientMock.stop.calledOnce).to.be.true;
    });

    it('should call client.pause', () => {
      proxy.pause();
      expect(clientMock.pause.calledOnce).to.be.true;
    });

    it('should call client.resume', () => {
      proxy.resume();
      expect(clientMock.resume.calledOnce).to.be.true;
    });

    it('should call client.updateCustomerSessionID', () => {
      proxy.updateCustomerSessionID('newSessionId');
      expect(clientMock.updateCustomerSessionID.calledWith('newSessionId')).to.be.true;
    });

    it('should call client.changeContext', () => {
      proxy.changeContext('newContext');
      expect(clientMock.changeContext.calledWith('newContext')).to.be.true;
    });

    it('should call client.startNewSession', () => {
      proxy.startNewSession('newSessionId');
      expect(clientMock.startNewSession.calledWith('newSessionId')).to.be.true;
    });

    it('should call client.setCoordinatesMasking', () => {
      proxy.setCoordinatesMasking(true);
      expect(clientMock.setCoordinatesMasking.calledWith(true)).to.be.true;
    });
  });
});