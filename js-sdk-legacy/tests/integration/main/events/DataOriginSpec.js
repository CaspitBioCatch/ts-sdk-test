import { assert } from 'chai';
import {TestUtils} from "../../../TestUtils";
import sinon from "sinon";
import ConfigurationChanger from "../ConfigurationChanger";

describe('Data Origin tests', function(){

    beforeEach(function () {
        const elementEvents = this.systemBootstrapper.getFeatureBuilder()._features.list.ElementEvents.instance;

        if (this._updateFeatureConfigSpy) {
            this._updateFeatureConfigSpy.restore();
        }

        this._updateFeatureConfigSpy = sinon.spy(elementEvents, 'updateFeatureConfig');

        // Modify the configuration before the scenario
        ConfigurationChanger.change(this.systemBootstrapper, {
            isElementsEvent: true,
        });
    });

    after(function () {
        if (this._updateFeatureConfigSpy) {
            this._updateFeatureConfigSpy.restore();
        }
    });

    it('should have data origin to sendDataCommand events that dispatch by the JS', async function(){
        const origin ='BC';
        let serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;

        let e = document.createEvent('Event');
        e.initEvent('focus', false, true);
        const input = document.getElementById('txt1');
        input.dispatchEvent(e);

        e = document.createEvent('Event');
        e.initEvent('blur', false, true);
        input.dispatchEvent(e);

        e = document.createEvent('Event');
        e.initEvent('input', false, true);
        input.dispatchEvent(e);

        TestUtils.verifyMsgToWorker(serverWorkerSendAsync,'sendDataCommand', function(data){
            if(data.eventName === 'element_events'){
                assert.equal(data.origin, origin,'origin has not been sent');
            }
        })
        serverWorkerSendAsync.resetHistory();
    });

})