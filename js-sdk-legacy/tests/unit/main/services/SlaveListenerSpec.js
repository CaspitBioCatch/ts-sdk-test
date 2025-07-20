import { assert } from 'chai';
import ConfigurationRepository from '../../../../src/main/core/configuration/ConfigurationRepository';
import SlaveListener from '../../../../src/main/services/SlaveListener';
import CDUtils from '../../../../src/main/technicalServices/CDUtils';
import { MasterSlaveMessage } from '../../../../src/slave/MasterSlaveMessage';
import { SIDChangeType } from '../../../../src/main/core/session/SIDChangeType';
import { MockObjects } from '../../mocks/mockObjects';
import DataQ from '../../../../src/main/technicalServices/DataQ';

describe('SlaveListener tests:', function () {
    function getWindowMsgMock(msgType, data) {
        return {
 data: { msgType, data },
            source: { postMessage: sinon.spy() },
origin: 'myOrigin',
};
    }

    beforeEach(function () {
        this.sandbox = sinon.createSandbox();

        this.addEventListener = this.sandbox.stub(CDUtils, 'addEventListener');
        this.dataQ = this.sandbox.createStubInstance(DataQ);
        this.confMgr = this.sandbox.stub(new ConfigurationRepository());
        this.logDataQ = this.sandbox.createStubInstance(DataQ);
        this.ctxMgr = this.sandbox.stub(MockObjects.contextMgr);
    });

    afterEach(function () {
        this.sandbox.restore();
    });

    describe('Message passing tests:', function () {
        it('dataFromSlave should be added to the dataQ', function () {
            const sl = new SlaveListener(this.dataQ, this.confMgr, CDUtils, this.logDataQ, this.ctxMgr);
            sl.listen();

            // get the cb to mock messages that arrives
            const onMsgCb = this.addEventListener.getCall(0).args[2];

            const event = { eventName: 'mouse_events', data: [1, 2, 3, 4] };
            const dataFromSlaveMsg = getWindowMsgMock('dataFromSlave', event);
            onMsgCb(dataFromSlaveMsg);

            assert(this.dataQ.addToQueue.calledWith(event.eventName, event.data));
        });

        it('registerSlave should add the slave to the slave list and send back config to slave', function () {
            const sl = new SlaveListener(this.dataQ, this.confMgr, CDUtils, this.logDataQ, this.ctxMgr);
            sl.listen();

            // get the cb to mock messages that arrives
            const onMsgCb = this.addEventListener.getCall(0).args[2];

            const registerSlaveMsg = getWindowMsgMock('registerSlave');

            const configData = { a: 'a', b: 'b' };
            this.confMgr.getAll.returns(configData);

            onMsgCb(registerSlaveMsg);

            assert.equal(sl._slaves.length, 1, 'slaves length should be 1');
            const slave = sl._slaves[0];
            assert.equal(slave.source, registerSlaveMsg.source, 'the source of the slave not equal');
            assert.equal(slave.origin, registerSlaveMsg.origin, 'the origin of the slave not equal');

            // verify that the configuration was posted to the slave
            assert(registerSlaveMsg.source.postMessage.calledWith({ msgType: 'updateSlaveConf', data: configData }),
                'updateSlaveConf was not called on slave');
        });

        it('logPerfSlave msg should be added to logPerfQ if it contains eventName', function () {
            const sl = new SlaveListener(this.dataQ, this.confMgr, CDUtils, this.logDataQ, this.ctxMgr);
            sl.listen();

            // get the cb to mock messages that arrives
            const onMsgCb = this.addEventListener.getCall(0).args[2];

            const logPerfSlaveMsg = getWindowMsgMock('logPerfSlave', { eventName: 'log', data: ['a', 'b'] });

            onMsgCb(logPerfSlaveMsg);

            assert(this.logDataQ.addToQueue.calledWith(logPerfSlaveMsg.data.data.eventName, logPerfSlaveMsg.data.data.data),
                'logPerfDataQ was not called with expected data');
        });

        it('logPerfSlave msg should not be added to logPerfQ if it does not contain eventName', function () {
            const sl = new SlaveListener(this.dataQ, this.confMgr, CDUtils, this.logDataQ, this.ctxMgr);
            sl.listen();

            // get the cb to mock messages that arrives
            const onMsgCb = this.addEventListener.getCall(0).args[2];

            const logPerfSlaveMsg = getWindowMsgMock('logPerfSlave', { data: ['a', 'b'] });

            onMsgCb(logPerfSlaveMsg);

            assert(this.logDataQ.addToQueue.notCalled, 'logPerfDataQ was called while it should not');
        });

        it('updateMasterContext should call setContext of context manager', function () {
            const sl = new SlaveListener(this.dataQ, this.confMgr, CDUtils, this.logDataQ, this.ctxMgr);
            sl.listen();

            // get the cb to mock messages that arrives
            const onMsgCb = this.addEventListener.getCall(0).args[2];

            const updateMasterContextMsg = getWindowMsgMock('updateMasterContext', { context: 'myContext' });

            onMsgCb(updateMasterContextMsg);

            assert(this.ctxMgr.setContext.calledWith({ context: 'myContext' }));
        });

        it('resetSessionTriggerFromSlave should call trigger onResetSessionTrigger event', function () {
            const sl = new SlaveListener(this.dataQ, this.confMgr, CDUtils, this.logDataQ, this.ctxMgr);
            sl.listen();

            const onResetSessionTriggerSpy = sinon.spy(sl.onResetSessionTrigger, 'publish');

            // get the cb to mock messages that arrives
            const onMsgCb = this.addEventListener.getCall(0).args[2];

            const resetSessionFromSlaveMsg = getWindowMsgMock(MasterSlaveMessage.resetSessionTriggerFromSlave, { resetReason: SIDChangeType.configurationFromSlave });

            onMsgCb(resetSessionFromSlaveMsg);

            assert(onResetSessionTriggerSpy.calledWith({ resetReason: SIDChangeType.configurationFromSlave }));
        });

        it('mouseChallengeTriggerFromSlave should trigger onMouseChallengeTrigger event', function () {
            const sl = new SlaveListener(this.dataQ, this.confMgr, CDUtils, this.logDataQ, this.ctxMgr);
            sl.listen();

            const onMouseChallengeTriggerPublishSpy = sinon.spy(sl.onMouseChallengeTrigger, 'publish');

            // get the cb to mock messages that arrives
            const onMsgCb = this.addEventListener.getCall(0).args[2];

            const resetSessionFromSlaveMsg = getWindowMsgMock(MasterSlaveMessage.mouseChallengeTriggerFromSlave, { 'mouseTimer': 100, 'keyTimer': 200, 'time': 300 });

            onMsgCb(resetSessionFromSlaveMsg);

            assert(onMouseChallengeTriggerPublishSpy.calledWith({ 'mouseTimer': 100, 'keyTimer': 200, 'time': 300 }));
        });
    });

    it('sendToSlaves should send to all slaves', function () {
        const sl = new SlaveListener(this.dataQ, this.confMgr, CDUtils, this.logDataQ, this.ctxMgr);
        sl.listen();

        // get the cb to mock messages that arrives
        const onMsgCb = this.addEventListener.getCall(0).args[2];

        const registerFirstSlaveMsg = getWindowMsgMock('registerSlave');
        registerFirstSlaveMsg.origin = 'firstSlave';
        const registerSecondSlaveMsg = getWindowMsgMock('registerSlave');
        registerSecondSlaveMsg.origin = 'secondSlave';

        // register the slaves
        onMsgCb(registerFirstSlaveMsg);
        onMsgCb(registerSecondSlaveMsg);

        const myData = { myData: true };
        sl.sendToSlaves('myMessage', myData);

        assert(registerFirstSlaveMsg.source.postMessage.calledWith({ msgType: 'myMessage', data: myData },
            registerFirstSlaveMsg.origin), 'first slave did not got msg');
        assert(registerSecondSlaveMsg.source.postMessage.calledWith({ msgType: 'myMessage', data: myData },
            registerSecondSlaveMsg.origin), 'second slave did not got msg');
    });

    it('onConfigUpdate should send configurations to all slaves', function () {
        const sl = new SlaveListener(this.dataQ, this.confMgr, CDUtils, this.logDataQ, this.ctxMgr);
        sl.listen();

        // get the cb to mock messages that arrives
        const onMsgCb = this.addEventListener.getCall(0).args[2];

        const registerFirstSlaveMsg = getWindowMsgMock('registerSlave');
        registerFirstSlaveMsg.origin = 'firstSlave';
        const registerSecondSlaveMsg = getWindowMsgMock('registerSlave');
        registerSecondSlaveMsg.origin = 'secondSlave';

        // register the slaves
        onMsgCb(registerFirstSlaveMsg);
        onMsgCb(registerSecondSlaveMsg);

        const conf = { a: 'a' };
        this.confMgr.getAll.returns(conf);

        sl.onConfigUpdate();

        assert(registerFirstSlaveMsg.source.postMessage.calledWith({ msgType: 'updateSlaveConf', data: conf },
            registerFirstSlaveMsg.origin), 'first slave did not got config');
        assert(registerSecondSlaveMsg.source.postMessage.calledWith({ msgType: 'updateSlaveConf', data: conf },
            registerSecondSlaveMsg.origin), 'second slave did not got config');
    });

    it('notifyStateChange should send new state to all slaves', function () {
        const sl = new SlaveListener(this.dataQ, this.confMgr, CDUtils, this.logDataQ, this.ctxMgr);
        sl.listen();

        // get the cb to mock messages that arrives
        const onMsgCb = this.addEventListener.getCall(0).args[2];

        const registerFirstSlaveMsg = getWindowMsgMock('registerSlave');
        registerFirstSlaveMsg.origin = 'firstSlave';
        const registerSecondSlaveMsg = getWindowMsgMock('registerSlave');
        registerSecondSlaveMsg.origin = 'secondSlave';

        // register the slaves
        onMsgCb(registerFirstSlaveMsg);
        onMsgCb(registerSecondSlaveMsg);

        const stateMsg = { toState: 'run' };
        sl.notifyStateChange(stateMsg);

        assert(registerFirstSlaveMsg.source.postMessage.calledWith({ msgType: MasterSlaveMessage.updateSlaveState, data: stateMsg },
            registerFirstSlaveMsg.origin), 'first slave did not got config');
        assert(registerSecondSlaveMsg.source.postMessage.calledWith({ msgType: MasterSlaveMessage.updateSlaveState, data: stateMsg },
            registerSecondSlaveMsg.origin), 'second slave did not got config');
    });

    describe('_isScriptVersionMessage',function(){
        it('addCtxId argument of DataQ should be false',  function(){
            const sl = new SlaveListener(this.dataQ, this.confMgr, CDUtils, this.logDataQ, this.ctxMgr);
            const isScriptVersionMessageSpy = this.sandbox.spy(sl,'_isScriptVersionMessage');
            sl.listen();

            const onMsgCb = this.addEventListener.getCall(0).args[2];
            const data = { eventName: 'static_fields', data: ['slave_version_client','dev-version.0.0ac']};
            const dataFromSlaveMsg = getWindowMsgMock('dataFromSlave', data);
            onMsgCb(dataFromSlaveMsg);

            const msg = dataFromSlaveMsg.data
            const args = isScriptVersionMessageSpy.getCall(0).args[0];
            const queueArgs  = sl._dataQ.addToQueue.getCall(0).args;

            isScriptVersionMessageSpy.restore();

            assert.isFalse(queueArgs[2], 'expected to addCtxId to be false');
            assert.isTrue(sl._isScriptVersionMessage(msg), 'expected function to return true');
            assert.equal(msg.data.eventName,args.data.eventName, 'expected for static_fields');
            assert.equal(msg.msgType,args.msgType, 'expected msgType to be dataFromSlave');
            assert.equal(args.data.data[0],'slave_version_client', 'expected first argument in array to be slave_version_client');
            assert.equal(args.data.data[1],'dev-version.0.0ac', 'expected second argument in array to be dev-version.0.0ac');

        });

        it('_isScriptVersionMessage should return false', function(){
            const sl = new SlaveListener(this.dataQ, this.confMgr, CDUtils, this.logDataQ, this.ctxMgr);
            const isScriptVersionMessageSpy = this.sandbox.spy(sl,'_isScriptVersionMessage');
            sl.listen();
            //this returns the handler of the eventListener
            const onMsgCb = this.addEventListener.getCall(0).args[2];
            //the data to be sent in the post message from slave to main
            const data = { eventName: 'mouseEvent', data: ['slave_version_client','dev-version.0.0ac']};
            const dataFromSlaveMsg = getWindowMsgMock('dataFromSlave',data);
            onMsgCb(dataFromSlaveMsg);
            const dataToFunction = dataFromSlaveMsg.data;
            const dataQArgs  = sl._dataQ.addToQueue.getCall(0).args;

            isScriptVersionMessageSpy.restore();

            assert.isTrue(isScriptVersionMessageSpy.calledWith(dataToFunction), 'expected isScripVersionMessage to be called with a dataToFunction object');
            assert.equal(isScriptVersionMessageSpy.returnValues[0],false, 'expected function to return false');
            assert.equal(dataQArgs.length,2,'expected length to be 2');
        })
    })
});
