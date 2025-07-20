import {assert} from 'chai';
import sinon from 'sinon';
import SlaveBrowserProps from "../../../../../src/slave/collectors/SlaveBrowserProps";
import {TestUtils} from "../../../../TestUtils";
import {MockObjects} from "../../../mocks/mockObjects";
import DataQ from '../../../../../src/main/technicalServices/DataQ';
import Log from "../../../../../src/main/technicalServices/log/Logger";

describe("SlaveBrowserProps class", function(){

    async function waitForNoAssertion(callback){
        await TestUtils.waitForNoAssertion(()=>{
            callback();
        });
    }

    let sandbox=null;
    let cdUtils=null;
    let dataQ=null;
    let slaveBrowserProps=null;

    beforeEach(function(){
        sandbox =sinon.createSandbox();
        cdUtils = sinon.stub(MockObjects.cdUtils);
        dataQ = sinon.createStubInstance(DataQ);
        slaveBrowserProps = new SlaveBrowserProps(dataQ,cdUtils);
    });

    afterEach(function(){
        sandbox.restore();
        cdUtils= null;
        dataQ = null;
        slaveBrowserProps = null;
    });

    describe('DataQ', function(){
        it('should send slave script version + sending info Log',async function(){
            const logSpy = sandbox.spy(Log,'info');
            slaveBrowserProps.startFeature();

            await waitForNoAssertion(()=>{
                const dataQArgs = slaveBrowserProps._dataQ.addToQueue.getCall(0).args;

                assert.equal(dataQArgs[0],'static_fields','expected string to static_fields');
                assert.equal(dataQArgs[1][0],'slave_version_client','expected to slave_version_client');
                assert.equal(dataQArgs[1][1],'scriptVersion','expected to scriptVersion');
                assert.equal(dataQArgs[2],false,'expected to be false');

                const dataQArgs2 = slaveBrowserProps._dataQ.addToQueue.getCall(1).args;
                assert.equal(dataQArgs2[0],'static_fields','expected string to static_fields');
                assert.equal(dataQArgs2[1][0],'device_source','expected to device_source');
                assert.equal(dataQArgs2[1][1],'js','expected to js');
                assert.equal(dataQArgs2[2],false,'expected to be false');

                assert.isTrue(slaveBrowserProps._dataQ.addToQueue.calledTwice, 'expected addToQueue to be called twice');

                const logArgs = logSpy.getCall(0).args;
                assert.equal(logArgs[0], 'Slave version is scriptVersion', 'expected to Slave version is scriptVersion');

            });
        });
    });

});