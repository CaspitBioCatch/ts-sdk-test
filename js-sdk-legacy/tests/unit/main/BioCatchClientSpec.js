import { expect } from 'chai';
import sinon from 'sinon';
import SupportedBrowserChecker from '../../../src/main/technicalServices/SupportedBrowserChecker';
import { BioCatchClient } from '../../../src/main/system/main';

describe('BioCatchClient', () => {
  let clientMock, dynamicCdApiLoaderMock, configMapperMock, serverUrlResolverMock, configurationLoadedCallbackMock;

  beforeEach(() => {
    // Create stubs and mocks for dependencies
    clientMock = {
      autoStart: sinon.stub(),
      manualStart: sinon.stub(),
      stop: sinon.stub(),
      start: sinon.stub(),
      pause: sinon.stub(),
      resume: sinon.stub(),
      updateCustomerSessionID: sinon.stub(),
      changeContext: sinon.stub(),
      startNewSession: sinon.stub(),
      setCustomerBrand: sinon.stub()
    };

    dynamicCdApiLoaderMock = {
      attachCdApi: sinon.stub(),
    };

    configMapperMock = {
      mapStartupConfigurations: sinon.stub(),
    };

    serverUrlResolverMock = {
      resolve: sinon.stub(),
    };

    configurationLoadedCallbackMock = sinon.stub();

    // Stub external dependencies
    sinon.stub(SupportedBrowserChecker, 'isSupported').returns(true);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('constructor', () => {
    it('should apply polyfills during instantiation', () => {
      new BioCatchClient(clientMock, dynamicCdApiLoaderMock, configMapperMock, serverUrlResolverMock, configurationLoadedCallbackMock);
    });

    it('should check for supported browser', () => {
      new BioCatchClient(clientMock, dynamicCdApiLoaderMock, configMapperMock, serverUrlResolverMock, configurationLoadedCallbackMock);
      expect(SupportedBrowserChecker.isSupported.calledOnce).to.be.true;
    });

    it('should call client.autoStart if cdApi is in window', () => {
      window.cdApi = {};
      new BioCatchClient(clientMock, dynamicCdApiLoaderMock, configMapperMock, serverUrlResolverMock, configurationLoadedCallbackMock);
      expect(clientMock.autoStart.calledWith(configurationLoadedCallbackMock)).to.be.true;
      delete window.cdApi; // Clean up for other tests
    });

    it('should attach bcClient to window if cdApi is not present', () => {
      new BioCatchClient(clientMock, dynamicCdApiLoaderMock, configMapperMock, serverUrlResolverMock, configurationLoadedCallbackMock);
      expect(window.bcClient).to.be.not.undefined;
      delete window.bcClient; // Clean up for other tests
    });

    it('should not initialize if the browser is not supported', () => {
      SupportedBrowserChecker.isSupported.returns(false);
      new BioCatchClient(clientMock, dynamicCdApiLoaderMock, configMapperMock, serverUrlResolverMock, configurationLoadedCallbackMock);
      expect(clientMock.autoStart.called).to.be.false;
    });
  });

  describe('start', () => {
    it('should call serverUrlResolver.resolve with correct parameters', () => {
      new BioCatchClient(clientMock, dynamicCdApiLoaderMock, configMapperMock, serverUrlResolverMock, configurationLoadedCallbackMock);
      window.bcClient.start('testUrl', 'customerId', 'sessionId', {}, 'protocol');
      expect(serverUrlResolverMock.resolve.calledWith('testUrl', 'customerId', 'protocol')).to.be.true;
      delete window.bcClient; // Clean up for other tests
    });

    it('should call dynamicCdApiLoader.attachCdApi', () => {
      new BioCatchClient(clientMock, dynamicCdApiLoaderMock, configMapperMock, serverUrlResolverMock, configurationLoadedCallbackMock);
      window.bcClient.start('testUrl', 'customerId', 'sessionId', {});
      expect(dynamicCdApiLoaderMock.attachCdApi.calledWith(window, 'sessionId')).to.be.true;
      delete window.bcClient; // Clean up for other tests
    });

    it('should call client.manualStart with correct parameters', () => {
      const startupConfigurations = {};
      configMapperMock.mapStartupConfigurations.returns(startupConfigurations);
      const resolvedUrl = 'resolvedUrl';
      serverUrlResolverMock.resolve.returns(resolvedUrl);

      new BioCatchClient(clientMock, dynamicCdApiLoaderMock, configMapperMock, serverUrlResolverMock, configurationLoadedCallbackMock);
      window.bcClient.start('testUrl', 'customerId', 'sessionId', {});

      expect(clientMock.manualStart.calledWith(startupConfigurations, resolvedUrl, configurationLoadedCallbackMock)).to.be.true;
      delete window.bcClient; // Clean up for other tests
    });
  });

  describe('other methods', () => {
    it('should call client.stop', () => {
      new BioCatchClient(clientMock, dynamicCdApiLoaderMock, configMapperMock, serverUrlResolverMock, configurationLoadedCallbackMock);
      window.bcClient.stop();
      expect(clientMock.stop.calledOnce).to.be.true;
      delete window.bcClient; // Clean up for other tests
    });

    it('should call client.pause', () => {
      new BioCatchClient(clientMock, dynamicCdApiLoaderMock, configMapperMock, serverUrlResolverMock, configurationLoadedCallbackMock);
      window.bcClient.pause();
      expect(clientMock.pause.calledOnce).to.be.true;
      delete window.bcClient; // Clean up for other tests
    });

    it('should call client.resume', () => {
      new BioCatchClient(clientMock, dynamicCdApiLoaderMock, configMapperMock, serverUrlResolverMock, configurationLoadedCallbackMock);
      window.bcClient.resume();
      expect(clientMock.resume.calledOnce).to.be.true;
      delete window.bcClient; // Clean up for other tests
    });

    it('should call client.updateCustomerSessionID', () => {
      new BioCatchClient(clientMock, dynamicCdApiLoaderMock, configMapperMock, serverUrlResolverMock, configurationLoadedCallbackMock);
      window.bcClient.updateCustomerSessionID('newSessionId');
      expect(clientMock.updateCustomerSessionID.calledWith('newSessionId')).to.be.true;
      delete window.bcClient; // Clean up for other tests
    });

    it('should call client.changeContext', () => {
      new BioCatchClient(clientMock, dynamicCdApiLoaderMock, configMapperMock, serverUrlResolverMock, configurationLoadedCallbackMock);
      window.bcClient.changeContext('newContext');
      expect(clientMock.changeContext.calledWith('newContext')).to.be.true;
      delete window.bcClient; // Clean up for other tests
    });

    it('should call client.startNewSession', () => {
      new BioCatchClient(clientMock, dynamicCdApiLoaderMock, configMapperMock, serverUrlResolverMock, configurationLoadedCallbackMock);
      window.bcClient.startNewSession('newSessionId');
      expect(clientMock.startNewSession.calledWith('newSessionId')).to.be.true;
      delete window.bcClient; // Clean up for other tests
    });

    it('should call client.setCustomerBrand', () => {
      new BioCatchClient(clientMock, dynamicCdApiLoaderMock, configMapperMock, serverUrlResolverMock, configurationLoadedCallbackMock);
      window.bcClient.setCustomerBrand('newBrand');
      expect(clientMock.setCustomerBrand.calledWith('newBrand')).to.be.true;
      delete window.bcClient; // Clean up for other tests
    });
  });
});
