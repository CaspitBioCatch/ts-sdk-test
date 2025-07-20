import { assert } from 'chai';
import ConfigurationRepository from '../../../../../src/main/core/configuration/ConfigurationRepository';
import CidCache from '../../../../../src/main/core/session/CidCache';
import ConfigurationService from '../../../../../src/main/core/configuration/ConfigurationService';
import { WorkerEvent } from '../../../../../src/main/events/WorkerEvent';
import CDUtils from '../../../../../src/main/technicalServices/CDUtils';
import WorkerCommunicator from '../../../../../src/main/technicalServices/WorkerCommunicator';
import { MessageBusEventType } from '../../../../../src/main/events/MessageBusEventType';
import MessageBus from '../../../../../src/main/technicalServices/MessageBus';
import { ConfigurationFields } from '../../../../../src/main/core/configuration/ConfigurationFields';
import sinon from 'sinon';
import { WorkerCommand } from '../../../../../src/main/events/WorkerCommand';

describe('ConfigurationService tests:', function() {
  const bgWorkerApi = {
    _port: {
      _onMsgCb: undefined,
      _respData: undefined,
      start() {
      },
      setonmessage(cb) {
        this._onMsgCb = cb;
      },
      get onmessage() {
        return this._onMsgCb;
      },
      postMessage(data) {
        if (data.msgType !== 'updateLogUrl') {
          this._onMsgCb(this._respData);
        }
      }
    },
    get port() {
      return this._port;
    },
    stamFunc() {
      // no implementation. This function is here just to allow for stubbing of this object.
    }
  };

  beforeEach(function() {
    this.sandbox = sinon.createSandbox();

    this.messasgeBusStub = this.sandbox.createStubInstance(MessageBus);
    this.configurationRepositoryStub = this.sandbox.createStubInstance(ConfigurationRepository);
    this.cidCacheStub = this.sandbox.createStubInstance(CidCache);
  });

  afterEach(function() {
    this.sandbox.restore();
  });

  describe('basic tests:', function() {
    it('should create a Configuration module if supported', function() {
      const configurationService = new ConfigurationService(CDUtils, this.configurationRepositoryStub, this.messasgeBusStub, this.cidCacheStub);
      assert.isTrue(typeof configurationService !== 'undefined' && configurationService != null);
    });

    it('configuration service registers for configuration load event if worker communicator is available', function() {
      const workerCommunicatorStub = this.sandbox.createStubInstance(WorkerCommunicator);

      const configurationService = new ConfigurationService(CDUtils, this.configurationRepositoryStub, this.messasgeBusStub, this.cidCacheStub, workerCommunicatorStub);
      assert.isTrue(typeof configurationService !== 'undefined' && configurationService != null);

      assert.isTrue(workerCommunicatorStub.addMessageListener.calledOnce);
      assert.equal(workerCommunicatorStub.addMessageListener.firstCall.args[0], WorkerEvent.ConfigurationLoadedEvent);
    });

    xit('should test decoding function', function() {
      const configurationService = new ConfigurationService(CDUtils, this.configurationRepositoryStub, this.messasgeBusStub, this.cidCacheStub);
      assert.isTrue(typeof configurationService !== 'undefined' && configurationService != null);

      const data = '3gA3p2lzRm9udHOkVHJ1ZbBpc1NjcmlwdHNGZWF0dXJlpFRydWW1aXNBY2NlbGVyb21ldGVyRXZl\nbnRzpFRydWW/YWNjZWxlcm9tZXRlckV2ZW50c1NhbXBsZVBlcmlvZKEwsmlzRWxlbWVudHNQb3Np\n'
        + 'dGlvbqRUcnVlsWlzRG9tRWxlbWVudFN0YXRzpFRydWWraXNLZXlFdmVudHOkVHJ1ZbFpc0NsaXBi\nb2FyZEV2ZW50c6RUcnVlr2lzVXNpbmdSZXNldFNpZKRUcnVlrGlzRm9ybUV2ZW50c6RUcnVlrHd1\n'
        + 'cHNTZW5kUmF0ZaQ1MDAwvW9yaWVudGF0aW9uRXZlbnRzU2FtcGxlUGVyaW9kozMwMK9pc1Njcm9s\nbENvbGxlY3SkVHJ1ZaxjdXN0b21lck5hbWWkYmNxYbppc1BlcmZvcm1hbmNlUmVzb3VyY2VTbG90\n'
        + 'aKRUcnVls2lzVW5zdXBwb3J0ZWRSZXBvcnSkVHJ1Zaxpc0ZvbnRzRmxhc2ikVHJ1Zatpc1VzaW5n\nQ3NpZKRUcnVlqWlzRW5hYmxlZKRUUlVFs2d5cm9FdmVudHNUaHJlc2hvbGSjMC4zsGlzRWxlbWVu\n'
        + 'dHNFdmVudHOkVHJ1Za1pc01vdXNlRXZlbnRzpFRydWWyc3RhdGVDaGFuZ2VFbmFibGVkpFRydWWw\naXNEaXNwbGF5RmVhdHVyZaRUcnVltmd5cm9FdmVudHNTYW1wbGVQZXJpb2ShMK1pc1ZNRGV0ZWN0\n'
        + 'aW9upFRydWWmaXNFdGFnpFRydWWraXNab29tTGV2ZWykVHJ1Zatpc0NhbGNDYWNoZaRUcnVlrmlz\nV2luZG93RXZlbnRzpFRydWWsaXNOZXR3b3JrQXBppFRydWWqbG9nQWRkcmVzc9oAPGh0dHBzOi8v\n'
        + 'bG9ncy5iY3FhLmJjMi5jdXN0b21lcnMuYmlvY2F0Y2guY29tL2FwaS92MS9zZW5kTG9nc7lpc0Rl\ndmljZU9yaWVudGF0aW9uRXZlbnRzpFRydWWyaXNTY3JpcHRFeGVjdXRlRXZlpFRydWWySXNNdXRh\n'
        + 'dGlvbk9ic2VydmVypFRydWWxaXNQcml2YXRlQnJvd3NpbmekVHJ1Zalpc0NhbGNGcHOkVHJ1Zbtp\nc0FkdmFuY2VkQnJvd3NlclByb3BlcnRpZXOkVHJ1Za9pc0VsZW1lbnRzVGl0bGWkVHJ1ZbdkYXRh\n'
        + 'UVBhc3NXb3JrZXJJbnRlcnZhbKM1MDCraXNGbGFzaE11aWSkVHJ1Za1zZXJ2ZXJBZGRyZXNz2gA9\naHR0cHM6Ly93dXAuYmNxYS5iYzIuY3VzdG9tZXJzLmJpb2NhdGNoLmNvbS9jbGllbnQvdjMvd2Vi\n'
        + 'L3d1cK5pc0lwQ29sbGVjdGlvbqRUcnVlrmlzRWxlbWVudHNTaXplpFRydWWraXNBYmNFdmVudHOl\nRmFsc2WuaXNFbGVtZW50c0hyZWakVHJ1Za9pc0dlc3R1cmVFdmVudHOkVHJ1Zalpc1BsdWdpbnOk\n'
        + 'VHJ1Zaxpc0d5cm9FdmVudHOkVHJ1Za1pc1RvdWNoRXZlbnRzpFRydWW6b3JpZW50YXRpb25FdmVu\ndHNUaHJlc2hvbGShMbBpc1Jlc2V0RXZlcnlMb2FkpUZhbHNltWlzUGVyZm9ybWFuY2VSZXNvdXJj\n'
        + 'ZaRUcnVls2lzRWxlbWVudHNDbGFzc05hbWWkVHJ1ZapjdXN0b21lcklkpGJjcWE=';

      const resp = configurationService.decodeMessage(data);
      assert.isNotNull(resp, 'decoding returned null');
      assert.isNotNull(resp.key_events, 'data does not contain key_events');
      assert.isNotNull(resp.mouse_events, 'data does not contain mouse_events');
      assert.equal(resp.key_events.length, 0, 'data is not as expected');
      assert.equal(resp.mouse_events.length, 28, 'data is not as expected');
    });
  });

  describe('updateLogUrlWorker', function() {

    it('dont do anything in case log url is invalid', function() {
      this.configurationRepositoryStub.get.withArgs(ConfigurationFields.logAddress).returns('not_valid_url');
      const workerCommunicatorStub = this.sandbox.createStubInstance(WorkerCommunicator);

      const configurationService = new ConfigurationService(CDUtils, this.configurationRepositoryStub, this.messasgeBusStub, this.cidCacheStub);
      configurationService.updateLogUrlToWorker('mock_sid', 'mock_csid', workerCommunicatorStub);

      assert.isTrue(workerCommunicatorStub.sendAsync.notCalled);
    });

    it('update log address when enableMinifiedLogUri is false', function() {
      this.configurationRepositoryStub.get.withArgs(ConfigurationFields.logAddress).returns('http://www.log.url/sendLog/v1');
      this.configurationRepositoryStub.get.withArgs(ConfigurationFields.enableMinifiedLogUri).returns(false);

      this.cidCacheStub.get.returns('mock_cid');

      const workerCommunicatorStub = this.sandbox.createStubInstance(WorkerCommunicator);

      const configurationService = new ConfigurationService(CDUtils, this.configurationRepositoryStub, this.messasgeBusStub, this.cidCacheStub);
      configurationService.updateLogUrlToWorker('mock_sid', 'mock_csid', workerCommunicatorStub);

      const expectedMessage = {
        logAddress: 'http://www.log.url/sendLog/v1',
        sessionIdentifiers: {
          cid: 'mock_cid',
          sid: 'mock_sid',
          csid: 'mock_csid',
          ds: 'js',
          sdkVer: '@@scriptVersion'
        }
      }

      assert.isTrue(workerCommunicatorStub.sendAsync.calledWith(WorkerCommand.updateLogUrlCommand, expectedMessage));
    });

    it('update log address when enableMinifiedLogUri is true', function() {
      this.configurationRepositoryStub.get.withArgs(ConfigurationFields.logAddress).returns('http://www.log.url/sendLog/v1');
      this.configurationRepositoryStub.get.withArgs(ConfigurationFields.enableMinifiedLogUri).returns(true);
      this.cidCacheStub.get.returns('mock_cid');

      const workerCommunicatorStub = this.sandbox.createStubInstance(WorkerCommunicator);

      const configurationService = new ConfigurationService(CDUtils, this.configurationRepositoryStub, this.messasgeBusStub, this.cidCacheStub);
      configurationService.updateLogUrlToWorker('mock_sid', 'mock_csid', workerCommunicatorStub);

      const expectedMessage = {
        logAddress: 'http://www.log.url',
        sessionIdentifiers: {
          cid: 'mock_cid',
          sid: 'mock_sid',
          csid: 'mock_csid',
          ds: 'js',
          sdkVer: '@@scriptVersion'
        }
      }

      assert.isTrue(workerCommunicatorStub.sendAsync.calledWith(WorkerCommand.updateLogUrlCommand, expectedMessage));
    });
  });

  describe('server configuration tests:', function() {
    it('handle configuration loaded event successfully', function() {
      const response = {
        'abcToInitiate': 0,
        'action': 1,
        'allowedAbcTypes': [
          0
        ],
        'configuration': {
          'dataWupDispatchRateSettings': '{"type": "incremental", "initialRateValueMs": 500,"incrementStepMs": 500,"incrementStopMs": 5000,"incrementStartWupSendCount": 20}',
          'logWupDispatchRateSettings': '{"type": "constant", "initialRateValueMs": 2500}',
          'serverCommunicationSettings': '{"sendRetryRate": 1000, "queueLoadThreshold": 100}',
          'wupStatisticsLogIntervalMs': 1000
        },
        'debugLevel': 0,
        'nextState': 1,
        'startAbcAutonomously': false,
        'success': true,
        'timeToWait': 0
      };
      const bgWorkerMock = this.sandbox.stub(bgWorkerApi);
      bgWorkerMock.port._respData = { data: { msgType: 'initCommSuccess', data: { a: 'b', b: 'cc', c: 'ddd' } } };
      const workerComm = new WorkerCommunicator();
      workerComm.setMessagingPort(bgWorkerMock.port);

      const config = new ConfigurationService(CDUtils, this.configurationRepositoryStub, this.messasgeBusStub, this.cidCacheStub);

      config._onConfigurationLoadedEvent(response.configuration);

      assert.isTrue(this.configurationRepositoryStub.loadConfigurations.calledOnce);
      assert.deepEqual(this.configurationRepositoryStub.loadConfigurations.firstCall.args[0], response.configuration);
      assert.isTrue(this.messasgeBusStub.publish.calledOnce);
      assert.equal(this.messasgeBusStub.publish.firstCall.args[0], MessageBusEventType.ConfigurationLoadedEvent);
      assert.isTrue(this.messasgeBusStub.publish.firstCall.args[1] === this.configurationRepositoryStub);
    });
  });
});
