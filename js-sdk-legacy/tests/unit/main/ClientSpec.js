import { expect } from 'chai';
import sinon from 'sinon';
import CdApiFacade from '../../../src/main/api/CdApiFacade';
import SystemBootstrapper from '../../../src/main/core/SystemBootstrapper';
import Log from '../../../src/main/technicalServices/log/Logger';
import Client from '../../../src/main/Client';
import StartupConfigurations from '../../../src/main/api/StartupConfigurations';
import CollectionSettings from '../../../src/main/api/CollectionSettings';
import ClientSettings from '../../../src/main/api/ClientSettings';
import { MessageBusEventType } from '../../../src/main/events/MessageBusEventType';

describe('Client tests:', () => {
  let client;
  let cdApiFacadeMock;
  let systemBootstrapperMock;
  let configurationLoadedCallbackMock;

  const mockServerUrl = 'http://mockserver.com?cid=test-cid'

  let configurations = new StartupConfigurations(
    mockServerUrl,
    '',
    true,
    true,
    true,
    false,
    '',
    false,
    new ClientSettings({
      enableFlush: true,
      enableCoordinatesMasking: true,
      enableWupMessagesHashing: false
    }),
    new CollectionSettings({
      mode: {
        // agentType: 'secondary',
      },
      elementSettings: {
        customElementAttribute: 'data-bc',
        maskElementsAttributes: [
          {
            name: 'payee_id_for_',
            regexPattern: '^payee_id_for_'
          }
        ],
        keyEventsMaskSpecialChars: true
      },
      customInputElementSettings: {
        parentElementSelector: 'ngx-slider',
        childElementWithCustomAttribute: 'span.ngx-slider-span.ngx-slider-pointer.ngx-slider-pointer-min',
        elementDataAttribute: 'ariaValueNow',
        customButtons: [
          'body > app-root > div > div.slider-container > button:nth-child(1)',
          'body > app-root > div > div.slider-container > button:nth-child(3)'
        ]
      }
    }),
    true,
    0,
    100,
    '[]'
  );

  let originalCdApi;

  beforeEach(() => {
    originalCdApi = window.cdApi;

    // Mock the SystemBootstrapper and CdApiFacade classes
    systemBootstrapperMock = sinon.createStubInstance(SystemBootstrapper);
    cdApiFacadeMock = sinon.createStubInstance(CdApiFacade);

    // Mock the methods and properties
    sinon.stub(CdApiFacade.prototype, 'createClientInterface').returns();

    sinon.stub(CdApiFacade.prototype, 'getConfigurations').yields(configurations);

    // Mock the Log methods
    sinon.stub(Log, 'error');
    sinon.stub(Log, 'info');

    // Mock callback
    configurationLoadedCallbackMock = sinon.spy();

    // Create an instance of Client
    client = new Client();
  });

  afterEach(() => {
    window.cdApi = originalCdApi;
    sinon.restore(); // Restore the original state
  });

  describe('autoStart', () => {

    it('should call cdApiFacade.getConfigurations and handle valid configurations', () => {

      CdApiFacade.prototype.getConfigurations.restore();
      const getConfigurationsSpy = sinon.spy(CdApiFacade.prototype, 'getConfigurations');

      client.autoStart(configurationLoadedCallbackMock);

      expect(getConfigurationsSpy.calledOnce).to.be.true;
      expect(Log.error.notCalled).to.be.true; // Ensure no errors were logged
    });

    it('should log an error and throw when configurations are invalid', () => {
      CdApiFacade.prototype.getConfigurations.yields(null); // Simulate invalid configurations

      client.autoStart(configurationLoadedCallbackMock);

      expect(Log.error.calledWith('Failed starting the JS SDK. Received invalid start configurations')).to.be.true;
    });

    it('should log an error and throw when server URL is missing', () => {
      CdApiFacade.prototype.getConfigurations.yields({
        getWupServerURL: () => {
          return null;
        }, // Simulate missing server URL
        getUseUrlWorker: () => {
          return false;
        },
        getClientSettings: () => {
          return {};
        }
      });

      client.autoStart(configurationLoadedCallbackMock);

      expect(Log.error.calledWith('Missing server URL. Unable to start the library.')).to.be.true;
    });
  });

  it('should log an error and throw when getUseUrlWorker() is true and getWorkerUrl() returns an empty string', () => {

    CdApiFacade.prototype.getConfigurations.yields({
      getWupServerURL: () => {
        return mockServerUrl;
      }, // Simulate missing server URL
      getUseUrlWorker: () => {
        return true;
      },
      getWorkerUrl: () => {
        return '';
      }
    });

    client.autoStart(() => {
    });

    expect(Log.error.calledWith('Failed starting the JS SDK. Received invalid WorkerUrl configuration')).to.be.true;
  });

  it('should not call createClientInterface when getClientSettings() returns undefined', () => {

    let configurations = new StartupConfigurations(
      mockServerUrl,
      '',
      true,
      true,
      true,
      false,
      '',
      false,
      undefined,
      new CollectionSettings({
        mode: {
          // agentType: 'secondary',
        },
        elementSettings: {
          customElementAttribute: 'data-bc',
          maskElementsAttributes: [
            {
              name: 'payee_id_for_',
              regexPattern: '^payee_id_for_'
            }
          ],
          keyEventsMaskSpecialChars: true
        },
        customInputElementSettings: {
          parentElementSelector: 'ngx-slider',
          childElementWithCustomAttribute: 'span.ngx-slider-span.ngx-slider-pointer.ngx-slider-pointer-min',
          elementDataAttribute: 'ariaValueNow',
          customButtons: [
            'body > app-root > div > div.slider-container > button:nth-child(1)',
            'body > app-root > div > div.slider-container > button:nth-child(3)'
          ]
        }
      }),
      true,
      0,
      100,
      '[]'
    );


    CdApiFacade.prototype.getConfigurations.yields(configurations);

    client.autoStart(() => {
    });

    expect(cdApiFacadeMock.createClientInterface.notCalled).to.be.true;
  });

  describe('manualStart', () => {
    it('should call createClientInterface and start method', () => {
      const startSpy = sinon.spy(client, 'start');

      client.manualStart(configurations, mockServerUrl, configurationLoadedCallbackMock);

      expect(CdApiFacade.prototype.createClientInterface.calledOnce).to.be.true;
      expect(startSpy.calledOnce).to.be.true;
    });
  });

  describe('start', () => {
    it('should initialize SystemBootstrapper and log server URL', () => {
      sinon.stub(SystemBootstrapper.prototype, 'start').callsFake(() => {
      });
      sinon.stub(SystemBootstrapper.prototype, 'getPerfMonitor').returns({
        startMonitor: sinon.spy()
      });
      sinon.stub(SystemBootstrapper.prototype, 'getConfigurationService').returns({
        setConfigurationLoadedCallback: sinon.spy(),
      });
      sinon.stub(SystemBootstrapper.prototype, 'getSessionService').returns({
        startNewSession: sinon.spy(),
        resumeOrStartSession: sinon.spy()
      });
      sinon.stub(SystemBootstrapper.prototype, 'getFeatureService').returns({
        buildFrameRelatedLists: sinon.spy(),
        runDefault: sinon.spy()
      });
      sinon.stub(SystemBootstrapper.prototype, 'getFeatureBuilder').returns({
        buildFeatures: sinon.spy()
      });
      sinon.stub(SystemBootstrapper.prototype, 'getApiBridge').returns({
        enableApi: sinon.spy()
      });
      sinon.stub(SystemBootstrapper.prototype, 'getContextMgr').returns({
        initContextHandling: sinon.spy()
      });
      sinon.stub(SystemBootstrapper.prototype, 'registerPostLoadEvents').callsFake(() => {
      });
      sinon.stub(SystemBootstrapper.prototype, 'getMuidService').returns({
        initMuid: sinon.spy()
      });
      sinon.stub(SystemBootstrapper.prototype, 'getConfigurationRepository').returns({
        get: sinon.stub().returns(false) // Control this return value in the test
      });

      client.start(cdApiFacadeMock, configurations, configurationLoadedCallbackMock);

      expect(SystemBootstrapper.prototype.start.calledWith(cdApiFacadeMock, configurations)).to.be.true;
      expect(Log.info.calledWith('Got server address: ' + mockServerUrl)).to.be.true;
    });
  });

  describe('stop', () => {
    it('should call systemBootstrapper.stop', () => {
      client.systemBootstrapper = systemBootstrapperMock;

      client.stop();

      expect(systemBootstrapperMock.stop.calledOnce).to.be.true;
    });
  });

  describe('restart', () => {
    it('should call systemBootstrapper.stop', () => {

      sinon.stub(SystemBootstrapper.prototype, 'start').callsFake(() => {
      });
      sinon.stub(SystemBootstrapper.prototype, 'stop').callsFake(() => {
      });
      sinon.stub(SystemBootstrapper.prototype, 'getPerfMonitor').returns({
        startMonitor: sinon.spy()
      });
      sinon.stub(SystemBootstrapper.prototype, 'getConfigurationService').returns({
        setConfigurationLoadedCallback: sinon.spy(),
      });
      sinon.stub(SystemBootstrapper.prototype, 'getSessionService').returns({
        startNewSession: sinon.spy(),
        resumeOrStartSession: sinon.spy()
      });
      sinon.stub(SystemBootstrapper.prototype, 'getFeatureService').returns({
        buildFrameRelatedLists: sinon.spy(),
        runDefault: sinon.spy()
      });
      sinon.stub(SystemBootstrapper.prototype, 'getFeatureBuilder').returns({
        buildFeatures: sinon.spy()
      });
      sinon.stub(SystemBootstrapper.prototype, 'getApiBridge').returns({
        enableApi: sinon.spy()
      });
      sinon.stub(SystemBootstrapper.prototype, 'getContextMgr').returns({
        initContextHandling: sinon.spy()
      });
      sinon.stub(SystemBootstrapper.prototype, 'registerPostLoadEvents').callsFake(() => {
      });
      sinon.stub(SystemBootstrapper.prototype, 'getMuidService').returns({
        initMuid: sinon.spy()
      });
      sinon.stub(SystemBootstrapper.prototype, 'getEncryptedMuidService').returns({
        _initMuid: sinon.spy()
      });
      sinon.stub(SystemBootstrapper.prototype, 'getConfigurationRepository').returns({
        get: sinon.stub().returns(false) // Control this return value in the test
      });

      client.start(cdApiFacadeMock, configurations, configurationLoadedCallbackMock);

      client.restart();

      expect(SystemBootstrapper.prototype.stop.calledOnce).to.be.true;
    });
  });

  describe('flush', () => {
    it('should call systemBootstrapper.flushAllMessages', () => {
      client.systemBootstrapper = systemBootstrapperMock;

      client.flush();

      expect(systemBootstrapperMock.flushAllMessages.calledOnce).to.be.true;
    });
  });

  describe('pause', () => {
    it('should call window.cdApi.pauseCollection', () => {
      const postMessageSpy = sinon.spy(window, 'postMessage');

      client.pause();

      expect(postMessageSpy.calledOnce).to.be.true;
      expect(postMessageSpy.calledWith(
          { type: 'cdChangeState', toState: 'pause' },
          window.location.href
      )).to.be.true;

      postMessageSpy.restore();
    });
  });

  describe('setCoordinatesMasking', () => {
    it('should call systemBootstrapper.handleCoordinatesMaskingConfigurationUpdate', () => {
      client.systemBootstrapper = systemBootstrapperMock;

      client.setCoordinatesMasking(true);

      expect(systemBootstrapperMock.handleCoordinatesMaskingConfigurationUpdate.calledOnce).to.be.true;
    });
  });

  describe('resume', () => {
    it('should call window.cdApi.resumeCollection', () => {
      const postMessageSpy = sinon.spy(window, 'postMessage');

      client.resume();

      expect(postMessageSpy.calledOnce).to.be.true;
      expect(postMessageSpy.calledWith(
          { type: 'cdChangeState', toState: 'run' },
          window.location.href
      )).to.be.true;

      postMessageSpy.restore();
    });
  });

  it('should call window.cdApi.setCustomerSessionId with the correct argument in updateCustomerSessionID', () => {
    const postMessageSpy = sinon.spy(window, 'postMessage');
    const customerSessionID = 'newSession123';

    client.updateCustomerSessionID(customerSessionID);

    expect(postMessageSpy.calledOnce).to.be.true;
    expect(postMessageSpy.calledWith(
        { type: 'cdSetCsid', csid: customerSessionID },
        window.location.href
    )).to.be.true;

    postMessageSpy.restore();
  });

  it('should call window.cdApi.changeContext with the given contextName', () => {
    const postMessageSpy = sinon.spy(window, 'postMessage');
    const contextName = 'newContextName';

    client.changeContext(contextName);

    expect(postMessageSpy.calledOnce).to.be.true;
    expect(postMessageSpy.calledWith(
        { type: 'ContextChange', context: contextName },
        window.location.href
    )).to.be.true;

    postMessageSpy.restore();
  });

  it('should call window.cdApi.startNewSession with the given sessionId', () => {
    const postMessageSpy = sinon.spy(window, 'postMessage');
    const csId = 'customerSessionId';

    client.startNewSession(csId);

    expect(postMessageSpy.calledOnce).to.be.true;
    expect(postMessageSpy.calledWith(
        {  type: 'ResetSession', resetReason: 'customerApi', csid: csId  },
        window.location.href
    )).to.be.true;

    postMessageSpy.restore();
  });

  it('should call publish on the message bus with the correct event and custom element', () => {
    let messageBusMock = {
      publish: sinon.spy()
    };

    client.systemBootstrapper = new SystemBootstrapper();

    sinon.stub(client.systemBootstrapper, 'getMessageBus').returns(messageBusMock);

    const customElement = { id: 'testElement' };

    // Call the method under test
    client.submitCustomElement(customElement);

    // Check that the publish method was called with the correct arguments
    expect(messageBusMock.publish.calledWith(
      MessageBusEventType.CustomElementSubmitted,
      customElement
    )).to.be.true;
  });

});
