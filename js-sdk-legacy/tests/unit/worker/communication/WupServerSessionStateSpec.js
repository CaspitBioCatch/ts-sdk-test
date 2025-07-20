import {assert} from 'chai';
import WupServerSessionState from '../../../../src/worker/communication/WupServerSessionState';

describe('WupServerSessionState tests:', function () {
    describe('setSts tests:\n', function () {
        it('set STS value successfully', function () {
            const wupServerSessionState = new WupServerSessionState();

            wupServerSessionState.setSts('NewSTS');

            assert.equal(wupServerSessionState.getSts(), 'NewSTS');
        });

        it('STS value is updated successfully', function () {
            const wupServerSessionState = new WupServerSessionState();

            wupServerSessionState.setSts('NewSTS');

            assert.equal(wupServerSessionState.getSts(), 'NewSTS');

            wupServerSessionState.setSts('UPDATEDSTS');

            assert.equal(wupServerSessionState.getSts(), 'UPDATEDSTS');
        });
    });

    describe('setStd tests:\n', function () {
        it('set STD value successfully', function () {
            const wupServerSessionState = new WupServerSessionState();

            wupServerSessionState.setStd('NewSTD');

            assert.equal(wupServerSessionState.getStd(), 'NewSTD');
        });

        it('STD value is updated successfully', function () {
            const wupServerSessionState = new WupServerSessionState();

            wupServerSessionState.setStd('NewSTD');

            assert.equal(wupServerSessionState.getStd(), 'NewSTD');

            wupServerSessionState.setStd('UPDATEDSTD');

            assert.equal(wupServerSessionState.getStd(), 'UPDATEDSTD');
        });
    });

    describe('setSid tests:\n', function () {
        it('set SID value successfully', function () {
            const wupServerSessionState = new WupServerSessionState();

            wupServerSessionState.setSid('the SID');

            assert.equal(wupServerSessionState.getSid(), 'the SID');
        });

        it('SID value is updated successfully', function () {
            const wupServerSessionState = new WupServerSessionState();

            wupServerSessionState.setSid('the SID');

            assert.equal(wupServerSessionState.getSid(), 'the SID');

            wupServerSessionState.setSid('UPDATEDSID');

            assert.equal(wupServerSessionState.getSid(), 'UPDATEDSID');
        });
    });

    describe('setCsid tests:\n', function () {
        it('set CSID value successfully', function () {
            const wupServerSessionState = new WupServerSessionState();

            wupServerSessionState.setCsid('the CSID');

            assert.equal(wupServerSessionState.getCsid(), 'the CSID');
        });

        it('CSID value is updated successfully', function () {
            const wupServerSessionState = new WupServerSessionState();

            wupServerSessionState.setCsid('the CSID');

            assert.equal(wupServerSessionState.getCsid(), 'the CSID');

            wupServerSessionState.setCsid('UPDATEDCSID');

            assert.equal(wupServerSessionState.getCsid(), 'UPDATEDCSID');
        });
    });

    describe('setPsid tests:\n', function () {
        it('set PSID value successfully', function () {
            const wupServerSessionState = new WupServerSessionState();

            wupServerSessionState.setPsid('the PSID');

            assert.equal(wupServerSessionState.getPsid(), 'the PSID');
        });

        it('PSID value is updated successfully', function () {
            const wupServerSessionState = new WupServerSessionState();

            wupServerSessionState.setPsid('the PSID');

            assert.equal(wupServerSessionState.getPsid(), 'the PSID');

            wupServerSessionState.setPsid('UPDATEDPSID');

            assert.equal(wupServerSessionState.getPsid(), 'UPDATEDPSID');
        });
    });

    describe('setMuid tests:\n', function () {
        it('set MUID value successfully', function () {
            const wupServerSessionState = new WupServerSessionState();

            wupServerSessionState.setMuid('the MUID');

            assert.equal(wupServerSessionState.getMuid(), 'the MUID');
        });

        it('CSID value is updated successfully', function () {
            const wupServerSessionState = new WupServerSessionState();

            wupServerSessionState.setMuid('the MUID');

            assert.equal(wupServerSessionState.getMuid(), 'the MUID');

            wupServerSessionState.setMuid('UPDATEDMUID');

            assert.equal(wupServerSessionState.getMuid(), 'UPDATEDMUID');
        });
    });

    describe('setContextName tests:\n', function () {
        it('set Context name value successfully', function () {
            const wupServerSessionState = new WupServerSessionState();

            wupServerSessionState.setContextName('context Context CONTEXT');

            assert.equal(wupServerSessionState.getContextName(), 'context Context CONTEXT');
        });

        it('Context name value is updated successfully', function () {
            const wupServerSessionState = new WupServerSessionState();

            wupServerSessionState.setContextName('context Context CONTEXT');

            assert.equal(wupServerSessionState.getContextName(), 'context Context CONTEXT');

            wupServerSessionState.setContextName('UPDATEDcontext Context CONTEXT');

            assert.equal(wupServerSessionState.getContextName(), 'UPDATEDcontext Context CONTEXT');
        });
    });

    describe('setRequestId tests:\n', function () {
        it('set RequestId value successfully', function () {
            const wupServerSessionState = new WupServerSessionState();

            wupServerSessionState.setRequestId(1);

            assert.equal(wupServerSessionState.getRequestId(), 1);
        });

        it('RequestId value is updated successfully', function () {
            const wupServerSessionState = new WupServerSessionState();

            wupServerSessionState.setRequestId(12);

            assert.equal(wupServerSessionState.getRequestId(), 12);

            wupServerSessionState.setRequestId(11112);

            assert.equal(wupServerSessionState.getRequestId(), 11112);
        });

        it('Event is tiggered once RequestId changed', function () {
            const wupServerSessionState = new WupServerSessionState();

            const onServerStateUpdatedSpy = sinon.spy(wupServerSessionState, '_publish');
            wupServerSessionState.setRequestId(12);

            assert.equal(wupServerSessionState.getRequestId(), 12);

            assert.isTrue(onServerStateUpdatedSpy.calledOnce);
        });

        it('Event is not tiggered once RequestId changed if publishChange is false', function () {
            const wupServerSessionState = new WupServerSessionState();

            const onServerStateUpdatedSpy = sinon.spy(wupServerSessionState, '_publish');
            wupServerSessionState.setRequestId(12, false);

            assert.equal(wupServerSessionState.getRequestId(), 12);

            assert.isFalse(onServerStateUpdatedSpy.calledOnce);
        });
    });

    describe('markConfigurationRequested', function () {
        it('mark configuration requested successfully', function () {
            const wupServerSessionState = new WupServerSessionState();

            wupServerSessionState.markConfigurationRequested();

            assert.isFalse(wupServerSessionState.getHasConfiguration());
            assert.isTrue(wupServerSessionState.getHasPendingConfigurationRequest());
        });

        it('marking configuration request when configuration was already received is ignored', function () {
            const wupServerSessionState = new WupServerSessionState();

            wupServerSessionState.markConfigurationRequested();

            assert.isFalse(wupServerSessionState.getHasConfiguration());
            assert.isTrue(wupServerSessionState.getHasPendingConfigurationRequest());

            wupServerSessionState.markConfigurationReceived();

            assert.isTrue(wupServerSessionState.getHasConfiguration());
            assert.isFalse(wupServerSessionState.getHasPendingConfigurationRequest());

            wupServerSessionState.markConfigurationRequested();
            assert.isFalse(wupServerSessionState.getHasPendingConfigurationRequest());
        });
    });

    describe('markConfigurationReceived', function () {
        it('mark configuration received successfully', function () {
            const wupServerSessionState = new WupServerSessionState();

            wupServerSessionState.markConfigurationReceived();

            assert.isTrue(wupServerSessionState.getHasConfiguration());
            assert.isFalse(wupServerSessionState.getHasPendingConfigurationRequest());
        });

        it('mark configuration received multiple times is ignored silently', function () {
            const wupServerSessionState = new WupServerSessionState();

            wupServerSessionState.markConfigurationReceived();

            assert.isTrue(wupServerSessionState.getHasConfiguration());
            assert.isFalse(wupServerSessionState.getHasPendingConfigurationRequest());

            wupServerSessionState.markConfigurationReceived();
            wupServerSessionState.markConfigurationReceived();
            wupServerSessionState.markConfigurationReceived();

            assert.isTrue(wupServerSessionState.getHasConfiguration());
            assert.isFalse(wupServerSessionState.getHasPendingConfigurationRequest());
        });

        it('marking pending configuration request multiple times when config has not arrived is successful', function () {
            const wupServerSessionState = new WupServerSessionState();

            wupServerSessionState.markConfigurationRequested();
            wupServerSessionState.markConfigurationRequested();
            wupServerSessionState.markConfigurationRequested();
            wupServerSessionState.markConfigurationRequested();
            wupServerSessionState.markConfigurationRequested();

            assert.isFalse(wupServerSessionState.getHasConfiguration());
            assert.isTrue(wupServerSessionState.getHasPendingConfigurationRequest());

            wupServerSessionState.markConfigurationReceived();

            assert.isTrue(wupServerSessionState.getHasConfiguration());
        });
    });

    describe('getHasConfiguration', function () {
        it('get configuration', function () {
            const wupServerSessionState = new WupServerSessionState();

            wupServerSessionState.markConfigurationReceived();

            assert.isTrue(wupServerSessionState.getHasConfiguration());
        });
    });

    describe('getHasPendingConfigurationRequest', function () {
        it('get has pending configuration request is true', function () {
            const wupServerSessionState = new WupServerSessionState();

            wupServerSessionState.markConfigurationRequested();

            assert.isTrue(wupServerSessionState.getHasPendingConfigurationRequest());
        });

        it('get has pending configuration request is false when configuration is received', function () {
            const wupServerSessionState = new WupServerSessionState();

            wupServerSessionState.markConfigurationRequested();

            assert.isTrue(wupServerSessionState.getHasPendingConfigurationRequest());

            wupServerSessionState.markConfigurationReceived();

            assert.isFalse(wupServerSessionState.getHasPendingConfigurationRequest());
        });
    });

    describe('incrementRequestId tests:\n', function () {
        it('Increment RequestId value successfully', function () {
            const wupServerSessionState = new WupServerSessionState();

            wupServerSessionState.incrementRequestId();

            assert.equal(wupServerSessionState.getRequestId(), 1);
            assert.equal(wupServerSessionState.getRequestId(), 1);
        });

        it('incrementRequestId value is updated successfully', function () {
            const wupServerSessionState = new WupServerSessionState();

            let requestId = wupServerSessionState.incrementRequestId();

            assert.equal(wupServerSessionState.getRequestId(), 1);
            assert.equal(requestId, 1);

            requestId = wupServerSessionState.incrementRequestId();
            requestId = wupServerSessionState.incrementRequestId();
            requestId = wupServerSessionState.incrementRequestId();

            assert.equal(wupServerSessionState.getRequestId(), 4);
            assert.equal(requestId, 4);
        });

        it('Event is tiggered once RequestId is incremented', function () {
            const wupServerSessionState = new WupServerSessionState();

            const onServerStateUpdatedSpy = sinon.spy(wupServerSessionState, '_publish');
            wupServerSessionState.incrementRequestId();

            assert.equal(wupServerSessionState.getRequestId(), 1);

            assert.isTrue(onServerStateUpdatedSpy.calledOnce);
        });
    });

    describe('resetRequestId tests:\n', function () {
        it('RequestId value is reset successfully', function () {
            const wupServerSessionState = new WupServerSessionState();

            wupServerSessionState.incrementRequestId();
            wupServerSessionState.incrementRequestId();
            wupServerSessionState.incrementRequestId();
            wupServerSessionState.incrementRequestId();
            wupServerSessionState.incrementRequestId();
            wupServerSessionState.incrementRequestId();

            assert.equal(wupServerSessionState.getRequestId(), 6);

            wupServerSessionState.resetRequestId();

            assert.equal(wupServerSessionState.getRequestId(), 0);
        });
    });

    describe('initial state tests:\n', function () {
        it('state is reset when created', function () {
            const wupServerSessionState = new WupServerSessionState();

            assert.isNull(wupServerSessionState.getSts());
            assert.isNull(wupServerSessionState.getStd());
            assert.isNull(wupServerSessionState.getSid());
            assert.isNull(wupServerSessionState.getCsid());
            assert.isNull(wupServerSessionState.getMuid());
            assert.isNull(wupServerSessionState.getContextName());
            assert.isNull(wupServerSessionState.getAgentType());
            assert.equal(wupServerSessionState.getRequestId(), 0);
            assert.isFalse(wupServerSessionState.getHasConfiguration());
        });
    });

    describe('agentType tests:', function () {
        it('should set agentType correctly', function () {
            const wupServerSessionState = new WupServerSessionState();
            wupServerSessionState.setAgentType('primary');

            assert.equal(wupServerSessionState.getAgentType(), 'primary');
        });
    });
    describe('agentId tests:', function () {
        it('should set agentId correctly', function () {
            const wupServerSessionState = new WupServerSessionState();
            wupServerSessionState.setAgentId('1234');

            assert.equal(wupServerSessionState.getAgentId(), '1234');
        });
        it('should reset agentId', function () {
            const wupServerSessionState = new WupServerSessionState();
            wupServerSessionState.setAgentId('1234');
            wupServerSessionState.reset();

            assert.isNull(wupServerSessionState.getAgentId());
        })
    });

    describe('cid tests:', function () {
        it('should set cid correctly', function () {
            const wupServerSessionState = new WupServerSessionState();
            wupServerSessionState.setCid('mock_cid');

            assert.equal(wupServerSessionState.getCid(), 'mock_cid');
        });
        it('should reset cid', function () {
            const wupServerSessionState = new WupServerSessionState();
            wupServerSessionState.setAgentId('mock_cid');
            wupServerSessionState.reset();

            assert.isNull(wupServerSessionState.getCid());
        })
    });

    describe('baseServerUrl tests:', function () {
        it('should set baseServerUrl correctly', function () {
            const wupServerSessionState = new WupServerSessionState();
            wupServerSessionState.setBaseServerUrl('mock_server_url');

            assert.equal(wupServerSessionState.getBaseServerUrl(), 'mock_server_url');
        });
        it('should reset baseServerUrl', function () {
            const wupServerSessionState = new WupServerSessionState();
            wupServerSessionState.setBaseServerUrl('mock_server_url');
            wupServerSessionState.reset();

            assert.isNull(wupServerSessionState.getBaseServerUrl());
        })
    });

    describe('protocolType tests:', function () {
        it('should set protocolType correctly', function () {
            const wupServerSessionState = new WupServerSessionState();
            wupServerSessionState.setProtocolType('mock_protocol_type');

            assert.equal(wupServerSessionState.getProtocolType(), 'mock_protocol_type');
        });
        it('should reset protocolType', function () {
            const wupServerSessionState = new WupServerSessionState();
            wupServerSessionState.setProtocolType('mock_protocol_type');
            wupServerSessionState.reset();

            assert.isNull(wupServerSessionState.getProtocolType());
        })
    });

    describe('shouldMinifyUri tests:', function () {
        it('should set shouldMinifyUri correctly', function () {
            const wupServerSessionState = new WupServerSessionState();
            wupServerSessionState.setShouldMinifyUri(true);

            assert.equal(wupServerSessionState.getShouldMinifyUri(), true);
        });
        it('should reset shouldMinifyUri', function () {
            const wupServerSessionState = new WupServerSessionState();
            wupServerSessionState.setShouldMinifyUri(true);
            wupServerSessionState.reset();

            assert.isFalse(wupServerSessionState.getShouldMinifyUri());
        })
    });

    describe('ott tests:\n', function () {
        it('should set ott correctly', function () {
            const wupServerSessionState = new WupServerSessionState();
            wupServerSessionState.setOtt('1234');

            assert.equal(wupServerSessionState.getOtt(), '1234');
        });
        it('should reset ott', function () {
            const wupServerSessionState = new WupServerSessionState();
            wupServerSessionState.setOtt('1234');
            wupServerSessionState.reset();

            assert.isNull(wupServerSessionState.getOtt());
        })
    });
});
