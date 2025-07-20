import { assert } from 'chai';
import ContextPropsFeature from '../../../../../src/main/collectors/perContext/ContextPropsFeature';
import { MockObjects } from '../../../mocks/mockObjects';
import PerfMonitor from '../../../../../src/main/technicalServices/PerfMonitor';
import DataQ from '../../../../../src/main/technicalServices/DataQ';
import TestFeatureSupport from "../../../../TestFeatureSupport";
import sinon from 'sinon';
import {TestUtils} from "../../../../TestUtils";
import CDUtils from "../../../../../src/main/technicalServices/CDUtils";
import Log from "../../../../../src/main/technicalServices/log/Logger";
import DOMUtils from "../../../../../src/main/technicalServices/DOMUtils";
import {ConfigurationFields} from "../../../../../src/main/core/configuration/ConfigurationFields";
import ConfigurationRepository from "../../../../../src/main/core/configuration/ConfigurationRepository";
import {AgentType} from "../../../../../src/main/contract/AgentType";


describe("ContextPropsFeature class",function(){

     async function waitForNoAssertion(callback){
        await TestUtils.waitForNoAssertion(() => {
             callback();
        })
    }

    let sandbox = null;
    let dataQ = null;
    let perfMon = null;
    let domUtils = null;
    let contextProps = null;
    let configurationRepository = null;
    let shouldCollectStaticFields = null;

    beforeEach(function(){
        sandbox = sinon.createSandbox();
        dataQ = sinon.createStubInstance(DataQ);
        perfMon = sinon.createStubInstance(PerfMonitor);
        domUtils = sinon.stub(MockObjects.domUtils);
        configurationRepository = sinon.createStubInstance(ConfigurationRepository);
        configurationRepository.get.withArgs(ConfigurationFields.agentType).returns('primary');
        configurationRepository.get.withArgs(ConfigurationFields.useLegacyZeroTimeout).returns(true);
        contextProps = new ContextPropsFeature(dataQ,domUtils,perfMon,configurationRepository);

        shouldCollectStaticFields = sandbox.stub(contextProps,'_shouldCollectStaticFields');
        shouldCollectStaticFields.returns(true);
    });

    afterEach(function(){
        dataQ=null;
        perfMon=null;
        domUtils=null;
        contextProps=null;
        configurationRepository=null;
        shouldCollectStaticFields=null;
        sandbox.restore();
    });
    describe("starting the feature",function(){
        it("should add data to DataQ",function(){
            const reportPageLoadTimeSpy = sandbox.spy(contextProps,'reportPageLoadTime');
            domUtils.onPageLoad.callsArg(1);
            contextProps.startFeature();
            const dataQCalls =contextProps._dataQ.addToQueue.getCall(0).args;
            const val = window.devicePixelRatio ? window.devicePixelRatio : -1;
            assert.equal(dataQCalls[0],'static_fields', 'expected to get a string of static_fileds');
            assert.equal(dataQCalls[1][0],'display','expected to get a string of display');
            assert.equal(dataQCalls[1][1][3],screen.availHeight, 'expected to be equal to availHeight');
            assert.equal(dataQCalls[1][1][4],screen.availWidth, 'expected to be equal to availWidth');
            assert.equal(dataQCalls[1][1][6],val,'expected values to be equaled')
            assert.equal(dataQCalls[1].length,2,'expected for length of 2')
            assert.isTrue(dataQ.addToQueue.calledOnce, 'expected addToQueue function to be called once');
            assert.isTrue(reportPageLoadTimeSpy.calledOnce, 'expected reportPageLoad time to be called once');
        });
    });

    describe("report the page loading time",  function(){
        beforeEach(function(){
            //if browser does not support the interface these set of testing is being skipped
                if(!(TestFeatureSupport.isPerformanceNavigationTimingSupported() && TestFeatureSupport.isObserverSupportsTypeAttribute())) {
                    this.skip();
                }
        });

        describe("reportPageLoading function", function(){
            it("should call isEntrySupportedByBrowser", async function(){
                const isEntrySupportedByBrowserSpy = sandbox.spy(contextProps, '_isEntrySupportedByBrowser');
                domUtils.onPageLoad.callsArg(1);
                contextProps.startFeature();
                const isSupportedData = contextProps._isEntrySupportedByBrowser.getCall(0).args;
                assert.equal(isSupportedData[0],'navigation','expected the string navigation');
                assert.isTrue(isEntrySupportedByBrowserSpy.calledOnce, 'expected isEntrySupportedByBrowser to be called');
            });
            it("should call the observerCallback",async function(){
                const observerCallbackSpy = sandbox.spy(contextProps, '_observerCallback');
                domUtils.onPageLoad.callsArg(1);
                contextProps.startFeature();
                await waitForNoAssertion(()=>{
                   assert.isTrue(observerCallbackSpy.called, 'expected observerCallback to be called');
               });
            });

        });

        describe("observeCallback function",  function(){
            it("should get PerformanceObserverEntryList object",async function(){
                const observerFunction = sandbox.spy(contextProps,'_observerCallback');
                const reportPageLoadTimeFallbackSpy = sandbox.spy(contextProps,'reportPageLoadTimeFallback');
                domUtils.onPageLoad.callsArg(1);
                contextProps.startFeature();
                try{
                    let entryList;
                    const observer = new PerformanceObserver((list)=>{
                        entryList = list;
                    });
                    observer.observe({type:'navigation', buffered:true});
                    await waitForNoAssertion( ()=>{
                        const observerFunctionArg = contextProps._observerCallback.getCall(0).args;
                        assert.deepEqual(observerFunctionArg[0],entryList, 'expected args to be from type of PerformanceObserverEntryList')
                        assert.isTrue(observerFunction.called,'expected observerCallback to be called');

                    });
                }
                catch(e){
                    await waitForNoAssertion( ()=>{
                        assert.isTrue(reportPageLoadTimeFallbackSpy.calledOnce, 'expected reportPageLoadTimeFallback to be called once');
                    });
                }

            });

        });

        describe("calcTime function + report monitor", function(){
            it("should have a duration property greater than zero",async function(){
                const calcTimeSpy = sandbox.spy(contextProps,'calcTime');
                domUtils.onPageLoad.callsArg(1);
                contextProps.startFeature();

                await waitForNoAssertion(()=>{
                    const perfMonArgs = perfMon.reportMonitor.getCall(0).args
                    assert.equal(perfMonArgs[0],'t.timeTillPageLoad', 'expected to be t.timeTillPageLoad');
                    assert.isNumber(perfMonArgs[1], 'expected value to be a number');
                    assert.isTrue(perfMonArgs[1]>0, 'expected the number to be greater than zero');
                    const calcTimeArgs = contextProps.calcTime.getCall(0).args;
                    const performanceNavigationTiming = window.performance.getEntriesByType('navigation');
                    assert.isNumber(calcTimeArgs[0].duration, 'expected the duration property to be a number');
                    assert.isTrue(calcTimeArgs[0].duration>0, 'expected duration to be greater than zero');
                    assert.deepEqual(calcTimeArgs,performanceNavigationTiming, 'expected both objects to be from a type of PerformanceNavigationTiming');
                    assert.isTrue(calcTimeSpy.calledOnce,'expected calcTime to be called once');


                });
            });
        });

    });

    describe("reportPageLoadTimeFallback function", function(){
        it("should fallback to reportPageLoadTimeFallback when PerformanceObserver is not supported", async function(){
            const reportPageLoadTimeFallbackSpy = sandbox.spy(contextProps,'reportPageLoadTimeFallback');
            const isEntrySupportedByBrowserStub = sandbox.stub(contextProps, '_isEntrySupportedByBrowser');
            const asyncCallSpy = sandbox.spy(contextProps,'callMethod');
            const calcTimeSpy = sandbox.spy(contextProps, 'calcTime');
            isEntrySupportedByBrowserStub.returns(false);

            domUtils.onPageLoad.callsArg(1);
            contextProps.startFeature();

            await waitForNoAssertion(()=>{
                assert.isTrue(asyncCallSpy.called,'expected asyncCall to be called');
                assert.isTrue(calcTimeSpy.called,'expected calcTime to be called');
                const calcTimeArgs = contextProps.calcTime.getCall(0).args;
                assert.isTrue(reportPageLoadTimeFallbackSpy.calledOnce, 'expected reportPageLoadTimeFallback to be called once');
                assert.isNumber(calcTimeArgs[0].duration, 'expected duration to be a number');
                assert.isTrue(calcTimeArgs[0].duration>0, 'expected duration to be greater than zero');
            });

        });
    });

    describe('entries is an undefined object', function(){
        it('should send warning log when entries is undefined object', async function(){
            const calcTimeSpy = sandbox.spy(contextProps,'calcTime');
            const log = sandbox.spy(Log,'warn');
            const isUndefinedNull = sandbox.stub(CDUtils,'isUndefinedNull');
            isUndefinedNull.returns(true);
            domUtils.onPageLoad.callsArg(1);
            contextProps.startFeature();

            await waitForNoAssertion( ()=>{
                const logArgs =  Log.warn.getCall(0).args;
                 assert.equal(logArgs[0],'Context Props Feature: no entries of navigation timing were captured', 'expected to be equal')
                 assert.isTrue(calcTimeSpy.called,'expected calcTime to be called');
                 assert.isTrue(log.calledOnce, 'expected log warning to be dispatched');
                 assert.isFalse(contextProps._perfMonitor.reportMonitor.called,'expected reportMonitor to not be called');
            });
            isUndefinedNull.restore();

        });

    });

    describe("document ready state", function (){
        beforeEach(function(){
          if(TestFeatureSupport.isPerformanceNavigationTimingSupported()){
              this.skip();
              return;
          }
        });

        it("should call asycCall when readyState change is already complete",async function(){
            const isWindowDocumentReadyStub = sandbox.stub(DOMUtils,'isWindowDocumentReady') ;
            const asyncCallSpy = sandbox.spy(CDUtils,'asyncCall');
            const addEventListenerSpy = sandbox.spy(CDUtils,'addEventListener');
            const getEntriesByType = sandbox.spy(contextProps,'_getEntriesByType');
            DOMUtils.isWindowDocumentReady.onCall(0).returns(true);

            domUtils.onPageLoad.callsArg(1);
            contextProps.startFeature();

            await waitForNoAssertion(()=>{
                assert.isTrue(isWindowDocumentReadyStub.called, 'expected isWindowDocumentReadyStub to be called');
                assert.isTrue(asyncCallSpy.calledOnce,'expected asyncCall to be called once');
                assert.isTrue(getEntriesByType.called,'expected getEntriesByType to be called');
                assert.isFalse(addEventListenerSpy.called,'expected addEventListener to not be called');
            });

        });

        it("should call addEventListener", async function(){
            const isWindowDocumentReadyStub = sandbox.stub(DOMUtils,'isWindowDocumentReady') ;
            const addEventListenerSpy = sandbox.spy(CDUtils,'addEventListener');
            DOMUtils.isWindowDocumentReady.onCall(0).returns(false);

            domUtils.onPageLoad.callsArg(1);
            contextProps.startFeature();

            await waitForNoAssertion(()=>{
                assert.isTrue(isWindowDocumentReadyStub.called, 'expected isWindowDocumentReadyStub to be called');
                assert.isTrue(addEventListenerSpy.called,'expected addEventListener to be called');
            });
        });

    });

    describe('agent type is secondary', function () {
        it('should not collect static fields', function(){
            shouldCollectStaticFields.returns(false);
            contextProps.startFeature();
            assert.isTrue(shouldCollectStaticFields.called,'expected shouldCollectStaticFields to be called');
            assert.isTrue(dataQ.addToQueue.notCalled,'expected dataQ.add to not be called');
        });

        it('should return true for non-secondary agent types', function() {
            shouldCollectStaticFields.restore();
            configurationRepository.get.withArgs(ConfigurationFields.agentType).returns(AgentType.PRIMARY); // Use an appropriate value

            const result = contextProps._shouldCollectStaticFields();
            assert.isTrue(result, 'Should return true for non-secondary agent types');
        });

        it('should return false for secondary agent type', function() {
            shouldCollectStaticFields.restore();
            configurationRepository.get.withArgs(ConfigurationFields.agentType).returns(AgentType.SECONDARY);

            const result = contextProps._shouldCollectStaticFields();
            assert.isFalse(result, 'Should return false for secondary agent type');
        });
    });
});




