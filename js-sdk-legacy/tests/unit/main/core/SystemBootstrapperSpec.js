import { assert } from 'chai';
import StartupConfigurations from '../../../../src/main/api/StartupConfigurations';
import CdApiFacade from '../../../../src/main/api/CdApiFacade';
import SystemBootstrapper from '../../../../src/main/core/SystemBootstrapper';
import Log from '../../../../src/main/technicalServices/log/Logger';
import sinon from "sinon";
import {CollectionMode} from "../../../../src/main/contract/CollectionMode";
import FeaturesList from "../../../../src/main/collectors/FeaturesList";
import {WorkerCommand} from "../../../../src/main/events/WorkerCommand";
import ClientSettings from '../../../../src/main/api/ClientSettings';
import CollectionSettings from '../../../../src/main/api/CollectionSettings';

const mockServerUrl = 'http://mockserver.com?cid=mock_sid';

describe('SystemBootstrapper tests:', function () {
    beforeEach(function () {
        this.systemBootstrapper = new SystemBootstrapper();
    });

    afterEach(function () {
        if (this.systemBootstrapper) {
            this.systemBootstrapper.stop();
        }
    });

    describe('start tests:', function () {
        it('should load the system', function () {
            const cdApiFacadeMock = sinon.createStubInstance(CdApiFacade);
            const configurations = _createConfigurations(false)
            this.systemBootstrapper.start(cdApiFacadeMock, configurations);

            assert.exists(this.systemBootstrapper.getServerWorkerCommunicator(), 'No ServerWorkerCommunicator');
            assert.exists(this.systemBootstrapper.getFeatureBuilder(), 'No FeatureBuilder');
            assert.exists(this.systemBootstrapper.getFeatureService(), 'No FeatureService');
            assert.exists(this.systemBootstrapper.getConfigurationService(), 'No ConfigurationService');
            assert.exists(this.systemBootstrapper.getConfigurationRepository(), 'No ConfigurationRepository');
            assert.exists(this.systemBootstrapper.getSessionService(), 'No SessionService');
            assert.exists(this.systemBootstrapper.getContextMgr(), 'No ContextManager');
            assert.exists(this.systemBootstrapper.getMuidService(), 'No MuidService');
            assert.exists(this.systemBootstrapper.getEncryptedMuidService(), 'No Encrypted Muid Service');
            assert.exists(this.systemBootstrapper.getApiBridge(), 'No CustomerApiBridge');
            assert.exists(this.systemBootstrapper.getPerfMonitor(), 'No PerfMonitor');
            assert.exists(this.systemBootstrapper.getServerStateMgr(), 'No ServerStateManager');
            assert.exists(this.systemBootstrapper.getMessageBus(), 'No MessageBus');
            assert.exists(this.systemBootstrapper.getAgentIdService(), 'No AgentIdService');
        });

        it('should NOT set log server url if unavailable in configurations', function () {
            const cdApiFacadeMock = sinon.createStubInstance(CdApiFacade);

            const configurations = new StartupConfigurations(mockServerUrl);
            this.systemBootstrapper.start(cdApiFacadeMock, configurations);

            assert.notExists(this.systemBootstrapper.getConfigurationRepository().get('logAddress'));
        });

        it('should set enableFramesProcessing value if available in configurations', function () {
            const cdApiFacadeMock = sinon.createStubInstance(CdApiFacade);

            const configurations = new StartupConfigurations(mockServerUrl, '', false);
            this.systemBootstrapper.start(cdApiFacadeMock, configurations);

            assert.equal(this.systemBootstrapper.getConfigurationRepository().get('enableFramesProcessing'), false);
        });

        it('enableFramesProcessing value is true by default if NOT overridden by configurations', function () {
            const cdApiFacadeMock = sinon.createStubInstance(CdApiFacade);

            const configurations = new StartupConfigurations(mockServerUrl, '');
            this.systemBootstrapper.start(cdApiFacadeMock, configurations);

            assert.equal(this.systemBootstrapper.getConfigurationRepository().get('enableFramesProcessing'), true);
        });

        it('should set enableCustomElementsProcessing value if available in configurations', function () {
            const cdApiFacadeMock = sinon.createStubInstance(CdApiFacade);

            const configurations = new StartupConfigurations(mockServerUrl, '', false, true);
            this.systemBootstrapper.start(cdApiFacadeMock, configurations);

            assert.equal(this.systemBootstrapper.getConfigurationRepository().get('enableCustomElementsProcessing'), true);
        });

        it('enableCustomElementsProcessing value is false by default if NOT overridden by configurations', function () {
            const cdApiFacadeMock = sinon.createStubInstance(CdApiFacade);

            const configurations = new StartupConfigurations(mockServerUrl, '');
            this.systemBootstrapper.start(cdApiFacadeMock, configurations);

            assert.equal(this.systemBootstrapper.getConfigurationRepository().get('enableCustomElementsProcessing'), false);
        });

        it('should set enableSameSiteNoneAndSecureCookies value if available in configurations', function () {
            const cdApiFacadeMock = sinon.createStubInstance(CdApiFacade);

            const configurations = new StartupConfigurations(mockServerUrl, '', false, true, false);
            this.systemBootstrapper.start(cdApiFacadeMock, configurations);

            assert.equal(this.systemBootstrapper.getConfigurationRepository().get('enableSameSiteNoneAndSecureCookies'), false);
        });

        it('enableSameSiteNoneAndSecureCookies value is false by default if NOT overridden by configurations', function () {
            const cdApiFacadeMock = sinon.createStubInstance(CdApiFacade);

            const configurations = new StartupConfigurations(mockServerUrl, '');
            this.systemBootstrapper.start(cdApiFacadeMock, configurations);

            assert.equal(this.systemBootstrapper.getConfigurationRepository().get('enableSameSiteNoneAndSecureCookies'), true);
        });

        it('should not bootstrap muidService if agent type is secondary', async function () {
            const cdApiFacadeMock = sinon.createStubInstance(CdApiFacade);
            const configurations = new StartupConfigurations(mockServerUrl);
            configurations._collectionSettings._agentType = 'secondary';
            this.systemBootstrapper._loadSystem(cdApiFacadeMock, configurations);

            assert.exists(this.systemBootstrapper.getServerWorkerCommunicator(), 'No ServerWorkerCommunicator');
            assert.exists(this.systemBootstrapper.getFeatureBuilder(), 'No FeatureBuilder');
            assert.exists(this.systemBootstrapper.getFeatureService(), 'No FeatureService');
            assert.exists(this.systemBootstrapper.getConfigurationService(), 'No ConfigurationService');
            assert.exists(this.systemBootstrapper.getConfigurationRepository(), 'No ConfigurationRepository');
            assert.exists(this.systemBootstrapper.getSessionService(), 'No SessionService');
            assert.exists(this.systemBootstrapper.getContextMgr(), 'No ContextManager');
            assert.notExists(this.systemBootstrapper.getMuidService(), 'No MuidService');
            assert.exists(this.systemBootstrapper.getApiBridge(), 'No CustomerApiBridge');
            assert.exists(this.systemBootstrapper.getPerfMonitor(), 'No PerfMonitor');
            assert.exists(this.systemBootstrapper.getServerStateMgr(), 'No ServerStateManager');
            assert.exists(this.systemBootstrapper.getMessageBus(), 'No MessageBus');
        });

    });

    describe('Collection mode registration: ', function () {
        let sandbox;

        beforeEach(function() {
            sandbox = sinon.createSandbox();
        });
        afterEach(function () {
            sandbox.restore();
        });

        it('should register lean features for LEAN mode', function() {
            const logStub = sandbox.stub(Log, 'info');
            const registerLeanFeaturesSpy = sandbox.spy(FeaturesList, 'registerLeanFeatures');

            this.systemBootstrapper._registerFeatures(CollectionMode.LEAN);

            assert.isTrue(logStub.calledWith('Build features per collection mode: LEAN'), 'Log.info was not called correctly');
            assert.isTrue(registerLeanFeaturesSpy.calledOnce, 'registerLeanFeatures was not called');
        });

        it('should register all features for FULL mode', function() {
            const logStub = sandbox.stub(Log, 'info');
            const registerSpy = sandbox.spy(FeaturesList, 'register');

            this.systemBootstrapper._registerFeatures(CollectionMode.FULL);

            assert.isTrue(logStub.calledWith('Build features per collection mode: FULL'), 'Log.info was not called correctly');
            assert.isTrue(registerSpy.calledOnce, 'register was not called');
        });
    });

    describe('shouldEnableWorkerWupMessageHashing', function () {
        let systemBootstrapper;
        let sandbox;
        let mockServerWorkerCommunicator;

        beforeEach(function () {
            systemBootstrapper = new SystemBootstrapper();
            sandbox = sinon.createSandbox();
            mockServerWorkerCommunicator = {
                sendAsync: sandbox.fake()
            };
        });

        afterEach(function () {
            sandbox.restore();
            systemBootstrapper = null;
            mockServerWorkerCommunicator = null;
        });

        it('should not call sendAsync when enableWupMessagesHashing is false', () => {
            systemBootstrapper._shouldEnableWorkerWupMessagesHashing(false, mockServerWorkerCommunicator);
            assert.isTrue(mockServerWorkerCommunicator.sendAsync.notCalled, 'sendAsync was called')
        });

        it('should call sendAsync with the correct command when enableWupMessagesHashing is true', () => {
            systemBootstrapper._shouldEnableWorkerWupMessagesHashing(true, mockServerWorkerCommunicator);
            assert.isTrue(mockServerWorkerCommunicator.sendAsync.called, 'sendAsync was not called');
            assert.equal(mockServerWorkerCommunicator.sendAsync.firstCall.args[0], WorkerCommand.enableWupMessagesHashingCommand);
            assert.deepEqual(mockServerWorkerCommunicator.sendAsync.firstCall.args[1], { enableWupMessagesHashing: true });
        });
    });

    it('should attach flutterBridge to bcClient when isFlutterApp configuration enabled', function () {
        let originalBcClient = window.bcClient;

        window.bcClient = {};

        const cdApiFacadeMock = sinon.createStubInstance(CdApiFacade);

        const configurations = _createConfigurations(true);

        this.systemBootstrapper.start(cdApiFacadeMock, configurations);

        expect(window.bcClient.flutterBridge != null).to.be.true;

        window.bClient = originalBcClient;
    });

    it('should not attach flutterBridge to bcClient when isFlutterApp configuration disabled', function () {
        let originalBcClient = window.bcClient;

        window.bcClient = {};

        const cdApiFacadeMock = sinon.createStubInstance(CdApiFacade);

        const configurations = _createConfigurations(false);

        this.systemBootstrapper.start(cdApiFacadeMock, configurations);

        expect(window.bcClient.flutterBridge != null).to.be.false;

        window.bClient = originalBcClient;
    });
});

function _createConfigurations(isFlutterApp) {
    return new StartupConfigurations(
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
      '[]',
      false,
      false,
      false,
      isFlutterApp === true,
    );

}
