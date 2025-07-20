import { assert } from 'chai';
import WupServerSessionState from '../../../../src/worker/communication/WupServerSessionState';
import WupMessageBuilder from '../../../../src/worker/communication/WupMessageBuilder';
import DataPacker from '../../../../src/worker/wup/DataPacker';
import {DEFAULT_WUP_TYPE} from '../../../../src/worker/communication/Constants';

describe('WupMessageBuilder tests:', function () {
    beforeEach(function () {
        this._wupServerSessionState = new WupServerSessionState();

        this._wupServerSessionState.setSid('cdsnum');
        this._wupServerSessionState.setCsid('csid');
        this._wupServerSessionState.setPsid('psid');
        this._wupServerSessionState.setMuid('muid');
        this._wupServerSessionState.setContextName('context');
        this._wupServerSessionState.setRequestId(1234);
        this._wupServerSessionState.setAgentType('primary');
        this._wupServerSessionState.setAgentId('some_agent_id');
    });

    describe('build tests:\n', function () {
        it('Config Message is built successfully', function () {
            const wupMessageBuilder = new WupMessageBuilder(this._wupServerSessionState, new DataPacker());

            const wupMessage = wupMessageBuilder.build('js', { stumProp: 'nothingSpecial' });

            assert.exists(wupMessage);

            assert.equal(wupMessage.getConfigurationName(), 'js');
            assert.equal(wupMessage.getDataSource(), 'js');
            assert.equal(wupMessage.getSid(), 'cdsnum');
            assert.equal(wupMessage.getCsid(), 'csid');
            assert.equal(wupMessage.getPsid(), 'psid');
            assert.equal(wupMessage.getMuid(), 'muid');
            assert.equal(wupMessage.getContextName(), 'context');
            assert.equal(wupMessage.getRequestId(), 1234);
            assert.isUndefined(wupMessage.getData());
        });

        it('Data Message is built successfully', function () {
            const wupMessageBuilder = new WupMessageBuilder(this._wupServerSessionState, new DataPacker());

            this._wupServerSessionState.setSts('sts');
            this._wupServerSessionState.setStd('std');

            const wupMessage = wupMessageBuilder.build(DEFAULT_WUP_TYPE, { data: 'lotsofdata' });

            assert.exists(wupMessage);

            assert.isUndefined(wupMessage.getConfigurationName());
            assert.equal(wupMessage.getDataSource(), 'js');
            assert.equal(wupMessage.getSid(), 'cdsnum');
            assert.equal(wupMessage.getCsid(), 'csid');
            assert.equal(wupMessage.getPsid(), 'psid');
            assert.equal(wupMessage.getMuid(), 'muid');
            assert.equal(wupMessage.getContextName(), 'context');
            assert.equal(wupMessage.getRequestId(), 1234);
            assert.deepEqual(wupMessage.getData(), [new DataPacker().pack({ data: 'lotsofdata' })]);
        });

        it('Config Message is sent with sts and std when available', function () {
            const wupMessageBuilder = new WupMessageBuilder(this._wupServerSessionState, new DataPacker());

            this._wupServerSessionState.setSts('sts');
            this._wupServerSessionState.setStd('std');

            const wupMessage = wupMessageBuilder.build('js', { data: 'lotsofdata' });

            assert.exists(wupMessage);

            assert.equal(wupMessage.getConfigurationName(), 'js');
            assert.equal(wupMessage.getDataSource(), 'js');
            assert.equal(wupMessage.getSid(), 'cdsnum');
            assert.equal(wupMessage.getCsid(), 'csid');
            assert.equal(wupMessage.getPsid(), 'psid');
            assert.equal(wupMessage.getMuid(), 'muid');
            assert.equal(wupMessage.getContextName(), 'context');
            assert.equal(wupMessage.getRequestId(), 1234);
            assert.equal(wupMessage.getSts(), 'sts');
            assert.equal(wupMessage.getStd(), 'std');
            assert.isUndefined(wupMessage.getData());
        });

        it('Data Message is sent with sts and std when available', function () {
            const wupMessageBuilder = new WupMessageBuilder(this._wupServerSessionState, new DataPacker());

            this._wupServerSessionState.setSts('sts');
            this._wupServerSessionState.setStd('std');

            const wupMessage = wupMessageBuilder.build(DEFAULT_WUP_TYPE, { data: 'lotsofdata' });

            assert.exists(wupMessage);

            assert.isUndefined(wupMessage.getConfigurationName());
            assert.equal(wupMessage.getDataSource(), 'js');
            assert.equal(wupMessage.getSid(), 'cdsnum');
            assert.equal(wupMessage.getCsid(), 'csid');
            assert.equal(wupMessage.getPsid(), 'psid');
            assert.equal(wupMessage.getMuid(), 'muid');
            assert.equal(wupMessage.getContextName(), 'context');
            assert.equal(wupMessage.getRequestId(), 1234);
            assert.equal(wupMessage.getSts(), 'sts');
            assert.equal(wupMessage.getStd(), 'std');
            assert.deepEqual(wupMessage.getData(), [new DataPacker().pack({ data: 'lotsofdata' })]);
        });

        it('Config Message is sent without sts and std if unavailable', function () {
            const wupMessageBuilder = new WupMessageBuilder(this._wupServerSessionState, new DataPacker());

            this._wupServerSessionState.setSts(null);
            this._wupServerSessionState.setStd(null);

            const wupMessage = wupMessageBuilder.build('js', { data: 'lotsofdata' });

            assert.exists(wupMessage);

            assert.equal(wupMessage.getConfigurationName(), 'js');
            assert.equal(wupMessage.getDataSource(), 'js');
            assert.equal(wupMessage.getSid(), 'cdsnum');
            assert.equal(wupMessage.getCsid(), 'csid');
            assert.equal(wupMessage.getPsid(), 'psid');
            assert.equal(wupMessage.getMuid(), 'muid');
            assert.equal(wupMessage.getContextName(), 'context');
            assert.equal(wupMessage.getRequestId(), 1234);
            assert.isUndefined(wupMessage.getSts());
            assert.isUndefined(wupMessage.getStd());
            assert.isUndefined(wupMessage.getData());
        });

        it('Data Message is sent without sts and std if unavailable', function () {
            const wupMessageBuilder = new WupMessageBuilder(this._wupServerSessionState, new DataPacker());

            this._wupServerSessionState.setSts(null);
            this._wupServerSessionState.setStd(null);

            const wupMessage = wupMessageBuilder.build(DEFAULT_WUP_TYPE, { data: 'lotsofdata' });

            assert.exists(wupMessage);

            assert.isUndefined(wupMessage.getConfigurationName());
            assert.equal(wupMessage.getDataSource(), 'js');
            assert.equal(wupMessage.getSid(), 'cdsnum');
            assert.equal(wupMessage.getCsid(), 'csid');
            assert.equal(wupMessage.getPsid(), 'psid');
            assert.equal(wupMessage.getMuid(), 'muid');
            assert.equal(wupMessage.getContextName(), 'context');
            assert.equal(wupMessage.getRequestId(), 1234);
            assert.isUndefined(wupMessage.getSts());
            assert.isUndefined(wupMessage.getStd());
            assert.deepEqual(wupMessage.getData(), [new DataPacker().pack({ data: 'lotsofdata' })]);
        });

        it('Brand is added to the message when it is set - no static fields in the data', function() {
            const wupMessageBuilder = new WupMessageBuilder(this._wupServerSessionState, new DataPacker());

            const updateDataWithBrandSpy = sinon.spy(wupMessageBuilder, '_updateDataWithBrand');

            this._wupServerSessionState.setSts('sts');
            this._wupServerSessionState.setStd('std');
            this._wupServerSessionState.setBrand('myBrand');

            wupMessageBuilder.build(DEFAULT_WUP_TYPE, { data: 'lotsofdata' });

            const expectedData = {
                data: 'lotsofdata',
                static_fields: [['brand', 'myBrand']],
            };

            assert.isTrue(updateDataWithBrandSpy.calledOnce);
            assert.deepEqual(updateDataWithBrandSpy.firstCall.args[0], expectedData);
        });

        it('Brand is added to the message when it is set - static_fields already exist in the data', function() {
            const wupMessageBuilder = new WupMessageBuilder(this._wupServerSessionState, new DataPacker());

            const updateDataWithBrandSpy = sinon.spy(wupMessageBuilder, '_updateDataWithBrand');

            this._wupServerSessionState.setSts('sts');
            this._wupServerSessionState.setStd('std');
            this._wupServerSessionState.setBrand('myBrand');

            wupMessageBuilder.build(DEFAULT_WUP_TYPE, { data: 'lotsofdata', static_fields: [['is_emulator', false]] });

            const expectedData = {
                data: 'lotsofdata',
                static_fields: [['is_emulator', false], ['brand', 'myBrand']],
            };

            assert.isTrue(updateDataWithBrandSpy.calledOnce);
            assert.deepEqual(updateDataWithBrandSpy.firstCall.args[0], expectedData);
        });

        describe('V4 Wup contract tests\n', function () {
            let wupMessageBuilder;
            beforeEach(function () {
                wupMessageBuilder = new WupMessageBuilder(this._wupServerSessionState, new DataPacker());
            });

            afterEach(function () {
                wupMessageBuilder = null;
            });
            it('Config Message is built successfully with agentType', function () {
                const wupMessage = wupMessageBuilder.build('js', { stumProp: 'nothingSpecial' });

                assert.exists(wupMessage);
                assert.equal(wupMessage.getConfigurationName(), 'js');
                assert.equal(wupMessage.getDataSource(), 'js');
                assert.equal(wupMessage.getSid(), 'cdsnum');
                assert.equal(wupMessage.getCsid(), 'csid');
                assert.equal(wupMessage.getPsid(), 'psid');
                assert.equal(wupMessage.getMuid(), 'muid');
                assert.equal(wupMessage.getContextName(), 'context');
                assert.equal(wupMessage.getRequestId(), 1234);
                assert.equal(wupMessage.getAgentType(), 'primary');
                assert.isUndefined(wupMessage.getData());
            });

            it('Config Message is built successfully with agentId', function () {
                const wupMessage = wupMessageBuilder.build('js', { stumProp: 'nothingSpecial' });
                assert.exists(wupMessage);
                assert.equal(wupMessage.getAgentId(), 'some_agent_id');
            });

            it('Config Message is sent with ott when available', function () {
                this._wupServerSessionState.setOtt('some-ott');
                const wupMessage = wupMessageBuilder.build('js', { data: 'lotsofdata' });

                assert.exists(wupMessage);

                assert.equal(wupMessage.getConfigurationName(), 'js');
                assert.equal(wupMessage.getDataSource(), 'js');
                assert.equal(wupMessage.getSid(), 'cdsnum');
                assert.equal(wupMessage.getCsid(), 'csid');
                assert.equal(wupMessage.getPsid(), 'psid');
                assert.equal(wupMessage.getMuid(), 'muid');
                assert.equal(wupMessage.getContextName(), 'context');
                assert.equal(wupMessage.getRequestId(), 1234);
                assert.equal(wupMessage.getOtt(), 'some-ott');
                assert.isUndefined(wupMessage.getData());
            });

            it('Config Message is sent when ott is not available', function () {
                this._wupServerSessionState.setOtt(null);
                const wupMessage = wupMessageBuilder.build('js', { data: 'lotsofdata' });

                assert.exists(wupMessage);

                assert.equal(wupMessage.getConfigurationName(), 'js');
                assert.equal(wupMessage.getDataSource(), 'js');
                assert.equal(wupMessage.getSid(), 'cdsnum');
                assert.equal(wupMessage.getCsid(), 'csid');
                assert.equal(wupMessage.getPsid(), 'psid');
                assert.equal(wupMessage.getMuid(), 'muid');
                assert.equal(wupMessage.getContextName(), 'context');
                assert.equal(wupMessage.getRequestId(), 1234);
                assert.equal(wupMessage.getOtt(), null);
                assert.isUndefined(wupMessage.getData());
                assert.isUndefined(wupMessage.getOtt());
            });

        });
    });
});
