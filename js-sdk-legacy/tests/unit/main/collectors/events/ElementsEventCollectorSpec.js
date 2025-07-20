import { assert } from 'chai';
import MessageBus from '../../../../../src/main/technicalServices/MessageBus';
import ElementEventCollector, { ElementEventType } from '../../../../../src/main/collectors/events/ElementEventCollector';
import SiteMapper from '../../../../../src/main/technicalServices/SiteMapper';
import ConfigurationRepository from '../../../../../src/main/core/configuration/ConfigurationRepository';
import CDUtils from '../../../../../src/main/technicalServices/CDUtils';
import { dataQueue, MockObjects } from '../../../mocks/mockObjects';
import { EventStructure as ElementEventStructure } from '../../../../../src/main/collectors/events/ElementEventCollector';
import DOMUtils from '../../../../../src/main/technicalServices/DOMUtils';
import { MessageBusEventType } from '../../../../../src/main/events/MessageBusEventType';
import TestFeatureSupport from '../../../../TestFeatureSupport';
import MutationEmitter from '../../../../../src/main/services/MutationEmitter';
import JqueryElementsHandler from '../../../../../src/main/collectors/events/handlers/JqueryElementsHandler';
import InputEvents from '../../../../../src/main/collectors/events/InputEvents';
import ClickEvents from '../../../../../src/main/collectors/events/ClickEvents';
import SelectElementEvents from '../../../../../src/main/collectors/events/SelectElementEvents';
import FormEvents from '../../../../../src/main/collectors/events/FormEvents';
import CustomInputEvents from '../../../../../src/main/collectors/events/CustomInputEvents';
import ElementsCollector from '../../../../../src/main/collectors/events/ElementsCollector';
import BrowserContext from '../../../../../src/main/core/browsercontexts/BrowserContext';
import sinon from "sinon";

describe('ElementEventCollector Tests:', function () {
    const siteMappingKey = 'jqueryElementListenerConfigKey';

    const ctxCfg = {
        triggers: [{
            selector: '#input1',
        }],
        mappings: [{
            selector: 'input[id=payment22]',
        }, {
            selector: 'input[id=payment]',
        }, {
            url: 'https://aaa.bbb.ccc/',
        }, {
            selector: '#input1',
        }],
    };
    let maskingServiceStub;

    const getInputEvent = (target, data) => {
        return {
            bubbles: true,
            cancelBubble: false,
            cancelable: false,
            composed: true,
            currentTarget: null,
            data,
            dataTransfer: null,
            defaultPrevented: false,
            detail: 0,
            eventPhase: 0,
            inputType: 'insertText',
            isComposing: false,
            isTrusted: true,
            returnValue: true,
            sourceCapabilities: null,
            srcElement: Object.assign(target, {}),
            target: Object.assign(target, {}),
            timestamp: Date.now(),
            type: 'input',
            view: null,
            which: 0,
        };
    };

    beforeEach(function () {
        if (!TestFeatureSupport.isMutationObserverSupported()) {
            this.skip();
            return;
        }

        maskingServiceStub = {
            maskAbsoluteIfRequired: sinon.stub().returnsArg(0),
            maskText: sinon.stub().returns('maskingServiceStub.maskText.mock'),
            _shouldMask: sinon.stub().returnsArg(0)
        };

        this._messageBus = new MessageBus();

        const inputElement = document.createElement('input');
        inputElement.setAttribute('id', 'txt1');
        inputElement.type = 'text';
        inputElement.value = 'Some input field text 1';
        inputElement.className = 'input-text-class'; // set the CSS class
        document.body.appendChild(inputElement); // put it into the DOM

        const inputElementB = document.createElement('input');
        inputElementB.setAttribute('id', 'txt2');
        inputElementB.type = 'text';
        inputElementB.value = 'Some input field text 2';
        inputElementB.className = 'input-text-class'; // set the CSS class
        document.body.appendChild(inputElementB); // put it into the DOM

        this.siteMapper = new SiteMapper(MutationObserver, CDUtils, DOMUtils, siteMappingKey);
        this.cdUtils = sinon.stub(MockObjects.cdUtils);
        this.domUtils = sinon.stub(MockObjects.domUtils);
        this.configurationRepository = sinon.createStubInstance(ConfigurationRepository);

        this.elementsStub = sinon.createStubInstance(ElementsCollector);
        this.elementsStub.getElementHashFromEvent.returns(32);
        this.elementsStub.isListed.returns(false);
        this.elementsStub._maskingService = maskingServiceStub

        this.configurationRepository.get.withArgs('parentElementSelector').returns('test');
        this.configurationRepository.get.withArgs('childElementWithCustomAttribute').returns('test');
        this.configurationRepository.get.withArgs('elementDataAttribute').returns('test');

        const configurationStub = {
            getMaxShadowDepth: () => 5, // or any number you want to test
            getIframeLoadingTimeout: () => 5000, // in milliseconds
        };

        this._elementEventsBuilder = new ElementEventCollector.Builder(
            this.configurationRepository,
            this.cdUtils,
            this.domUtils,
            this.elementsStub,
            dataQueue,
            configurationStub
        );
        this._elementEventsBuilder.withMessageBus(this._messageBus);
        this._elementEventsBuilder.withMutationEmitter(sinon.createStubInstance(MutationEmitter));
        this._elementEventsBuilder.withjQueryElementListenerSiteMapper(sinon.createStubInstance(SiteMapper));
        this._elementEventsBuilder.withjQueryElementsHandler(() => {
            return sinon.createStubInstance(JqueryElementsHandler);
        });
        this._elementEventsBuilder.withInputEvents(() => {
            return sinon.createStubInstance(InputEvents);
        });
        this._elementEventsBuilder.withClickEvents(() => {
            return sinon.createStubInstance(ClickEvents);
        });
        this._elementEventsBuilder.withSelectElementEvents(() => {
            return sinon.createStubInstance(SelectElementEvents);
        });
        this._elementEventsBuilder.withFormEvents(() => {
            return sinon.createStubInstance(FormEvents);
        });
        this._elementEventsBuilder.withCustomInputEventEmitter(() => {
            return sinon.createStubInstance(CustomInputEvents);
        });

        this._elementEvents = this._elementEventsBuilder.build();
    });

    afterEach(function () {
        let txt1Input = document.getElementById('txt1');
        let txt2Input = document.getElementById('txt2');

        document.body.removeChild(txt1Input);
        txt1Input = null;

        document.body.removeChild(txt2Input);
        txt2Input = null;
        dataQueue.requests = [];
        this._messageBus = null;
    });

    it('Should create a new instance of ElementEvents Data Collector', function () {
        assert.isObject(this._elementEvents, 'Could not construct a new ElementEvents Data Collector');
        assert.instanceOf(this._elementEvents, ElementEventCollector, 'this._elementEvents must be an instance of ElementEvents');
    });

    it('Should bind sub ElementEvents instances upon startFeature call', function () {
        this._elementEvents.startFeature(new BrowserContext(self));
        assert.isTrue(this._elementEvents._inputEvents.bind.called, 'InputEvents bind was not called upon startFeature');
        assert.isTrue(this._elementEvents._clickEvents.bind.called, 'ClickEvents bind was not called upon startFeature');
        assert.isTrue(this._elementEvents._selectElementEvents.bind.called, 'SelectElementEvents bind was not called upon startFeature');
        assert.isTrue(this._elementEvents._formEvents.bind.called, 'FormEvents bind was not called upon startFeature');
        assert.isTrue(this._elementEvents._customInputEvents.bind.called, 'CustomInputEvents bind was not called upon startFeature');
    });

    it('Should test if mutationObserver startObserver is called', function () {
        this.configurationRepository.get.withArgs('isMutationObserver').returns(true);
        this._elementEvents.startFeature(new BrowserContext(self));
        assert.isTrue(this._elementEvents._mutationEmitter.startObserver.called, 'mutationEmitter startObserver was not called upon startFeature');
    });

    it('Should test if mutationObserver stopObserver is called', function () {
        this.configurationRepository.get.withArgs('isMutationObserver').returns(true);
        this._elementEvents.stopFeature(new BrowserContext(self));
        assert.isTrue(this._elementEvents._mutationEmitter.stopObserver.called, 'mutationEmitter stopObserver was not called upon stopObserver');
    });

    it('Should test if mutationEmitter, events and siteMappers update functions are called upon updateFeatureConfig ', function () {
        this.configurationRepository.get.withArgs('isMutationObserver').returns(true);
        this.configurationRepository.get.withArgs(siteMappingKey).returns(JSON.stringify(ctxCfg));
        this._elementEvents._clickEvents.updateSettings = sinon.spy();
        this._elementEvents.startFeature(new BrowserContext(self));
        this._elementEvents.updateFeatureConfig(new BrowserContext(self));
        assert.isTrue(this._elementEvents._jQueryElementListenerSiteMapper.initTracking.called, 'updatedFeatureConfig called jQuery site mapper onConfigUpdate');
        assert.isTrue(this._elementEvents._jQueryElementListenerSiteMapper.onConfigUpdate.called, 'updatedFeatureConfig called jQuery site mapper onConfigUpdate');
        assert.isTrue(this._elementEvents._mutationEmitter.startObserver.called, 'mutationEmitter startObserver was not called upon updateFeatureConfig');
        assert.isTrue(this._elementEvents._elements.updateFeatureConfig.called, 'events updateFeatureConfig was not called upon updateFeatureConfig');
    });

    describe('sendToQueue', function () {
        it('Event data is merged and sent to queue successfully', function () {
            const e = getInputEvent(document.getElementById('txt1'), 'input event text');

            const eventTypeIndex = ElementEventStructure.indexOf('eventType') + 1;

            this._elementEvents.startFeature(new BrowserContext(self));
            this._elementEvents._utils.convertToArrayByMap = function (arrMap, jsonData) {
                const converted = [null];
                for (let i = 0, len = arrMap.length; i < len; i++) {
                    converted[i + 1] = jsonData[arrMap[i]];
                }
                return converted;
            };
            this._elementEvents.sendToQueue(e, {
                length: String('input event text').length,
                elementValues: 'input event text',
                selected: -1,
            });

            assert.equal(dataQueue.requests[0].length, 11, 'relativeTime is invalid');
            assert.exists(dataQueue.requests[0][ElementEventStructure.indexOf('timestamp') + 1], 'timestamp is invalid');
            assert.equal(dataQueue.requests[0][eventTypeIndex], ElementEventType.input, 'event type is not input');
            assert.equal(dataQueue.requests[0][ElementEventStructure.indexOf('isTrusted') + 1], 1, 'isTrusted is invalid');
            assert.equal(dataQueue.requests[0][ElementEventStructure.indexOf('elementHash') + 1], 32, 'elementHash is invalid');
            assert.equal(dataQueue.requests[0][ElementEventStructure.indexOf('length') + 1], 16, 'length is invalid');
            assert.equal(dataQueue.requests[0][ElementEventStructure.indexOf('elementValues') + 1], 'input event text', 'elementValues is invalid');
            assert.equal(dataQueue.requests[0][ElementEventStructure.indexOf('selected') + 1], -1, 'selected is invalid');
            assert.equal(dataQueue.requests[0][ElementEventStructure.indexOf('hashedValue') + 1], '', 'hashedValue is invalid');
            assert.equal(dataQueue.requests[0][ElementEventStructure.indexOf('relativeTime') + 1], 0, 'relativeTime is invalid');
        });

        it('Send data to queue', function () {
            const e = getInputEvent(document.getElementById('txt1'), 'input event text');

            const eventTypeIndex = ElementEventStructure.indexOf('eventType') + 1;

            this._elementEvents.startFeature(new BrowserContext(self));
            this._elementEvents._utils.convertToArrayByMap = function (arrMap, jsonData) {
                const converted = [null];
                for (let i = 0, len = arrMap.length; i < len; i++) {
                    converted[i + 1] = jsonData[arrMap[i]];
                }
                return converted;
            };
            this._elementEvents.sendToQueue(e, {
                length: String('input event text').length,
                elementValues: 'input event text',
                selected: -1,
            });
            assert.isTrue(dataQueue.requests.length > 0, 'dataQueue has zero requests');
            assert.equal(dataQueue.requests[0][eventTypeIndex], ElementEventType.input, 'event type is not input');
        });
    });

    it('Should unbind sub ElementEvents instances upon stopFeature call', function () {
        this._elementEvents.stopFeature(new BrowserContext(self));
        assert.isTrue(this._elementEvents._inputEvents.unbind.called, 'InputEvents unbind was not called upon stopFeature');
        assert.isTrue(this._elementEvents._clickEvents.unbind.called, 'ClickEvents unbind was not called upon stopFeature');
        assert.isTrue(this._elementEvents._selectElementEvents.unbind.called, 'SelectElementEvents unbind was not called upon stopFeature');
        assert.isTrue(this._elementEvents._formEvents.unbind.called, 'FormEvents unbind was not called upon stopFeature');
        assert.isTrue(this._elementEvents._customInputEvents.unbind.called, 'CustomInputEvents unbind was not called upon stopFeature');
        assert.isTrue(this._elementEvents._jQueryElementListenerSiteMapper.stopTracking.called, 'updatedFeatureConfig called jQuery site mapper onConfigUpdate');
    });

    it('Should call mutationMessageHandler upon publishing a MUTATIONSINGLE message', function () {
        this.configurationRepository.get.withArgs('isMutationObserver').returns(true);
        this._elementEvents.startFeature(new BrowserContext(self));
        this._messageBus.publish(MessageBusEventType.MutationSingleEvent, { frame: new BrowserContext(self) });

        assert.isTrue(this._elementEvents._inputEvents.addOnLoadInputData.called, 'InputEvents addOnLoadInputData was not called upon publishing a MUTATIONSINGLE message');
        assert.isTrue(this._elementEvents._inputEvents.bind.called, 'InputEvents bind was not called upon publishing a MUTATIONSINGLE message');
        assert.isTrue(this._elementEvents._clickEvents.bind.called, 'ClickEvents bind was not called upon publishing a MUTATIONSINGLE message');
        assert.isTrue(this._elementEvents._selectElementEvents.bind.called, 'SelectElementEvents bind was not called upon publishing a MUTATIONSINGLE message');
        assert.isTrue(this._elementEvents._formEvents.bind.called, 'FormEvents bind was not called upon publishing a MUTATIONSINGLE message');
        assert.isTrue(this._elementEvents._customInputEvents.addOnLoadInputData.called, 'CustomInputEvents addOnLoadInputData was not called upon publishing a MUTATIONSINGLE message');
        assert.isTrue(this._elementEvents._customInputEvents.bind.called, 'CustomInputEvents bind was not called upon publishing a MUTATIONSINGLE message');
    });
});


describe('ElementEventCollector verify customeInput is not run by default:', function () {
    const siteMappingKey = 'jqueryElementListenerConfigKey';
    let maskingServiceStub;

    beforeEach(function () {
        if (!TestFeatureSupport.isMutationObserverSupported()) {
            this.skip();
            return;
        }
        maskingServiceStub = {
            maskAbsoluteIfRequired: sinon.stub().returnsArg(0),
            maskText: sinon.stub().returns('maskingServiceStub.maskText.mock'),
            _shouldMask: sinon.stub().returnsArg(0)
        };

        this._messageBus = new MessageBus();

        this.siteMapper = new SiteMapper(MutationObserver, CDUtils, DOMUtils, siteMappingKey);
        this.cdUtils = sinon.stub(MockObjects.cdUtils);
        this.domUtils = sinon.stub(MockObjects.domUtils);
        this.configurationRepository = sinon.createStubInstance(ConfigurationRepository);
        this.elementsStub = sinon.createStubInstance(ElementsCollector);
        this.elementsStub.getElement.returns(32);
        this.elementsStub.isListed.returns(false);
        this.elementsStub._maskingService = maskingServiceStub
        const configurationStub = {
            getMaxShadowDepth: () => 5, // or any number you want to test
            getIframeLoadingTimeout: () => 5000, // in milliseconds
        };

        this._elementEventsBuilder = new ElementEventCollector.Builder(
            this.configurationRepository,
            this.cdUtils,
            this.domUtils,
            this.elementsStub,
            dataQueue,
            configurationStub
        );
        this._elementEventsBuilder.withMessageBus(this._messageBus);
        this._elementEventsBuilder.withMutationEmitter(sinon.createStubInstance(MutationEmitter));
        this._elementEventsBuilder.withjQueryElementListenerSiteMapper(sinon.createStubInstance(SiteMapper));
        this._elementEventsBuilder.withjQueryElementsHandler(() => {
            return sinon.createStubInstance(JqueryElementsHandler);
        });
        this._elementEventsBuilder.withInputEvents(() => {
            return sinon.createStubInstance(InputEvents);
        });
        this._elementEventsBuilder.withClickEvents(() => {
            return sinon.createStubInstance(ClickEvents);
        });
        this._elementEventsBuilder.withSelectElementEvents(() => {
            return sinon.createStubInstance(SelectElementEvents);
        });
        this._elementEventsBuilder.withFormEvents(() => {
            return sinon.createStubInstance(FormEvents);
        });
        this._elementEventsBuilder.withCustomInputEventEmitter(() => {
            return sinon.createStubInstance(CustomInputEvents);
        });

        this._elementEvents = this._elementEventsBuilder.build();
    });

    afterEach(function () {
        dataQueue.requests = [];
        this._messageBus = null;
    });

    it('Should bind sub ElementEvents instances upon startFeature call', function () {
        this._elementEvents.startFeature(new BrowserContext(self));
        assert.equal(this._elementEvents._customInputEvents, null , 'CustomInputEvents is not define');
    });

    it('Should call mutationMessageHandler upon publishing a MUTATIONSINGLE message', function () {
        this.configurationRepository.get.withArgs('isMutationObserver').returns(true);
        this._elementEvents.startFeature(new BrowserContext(self));
        this._messageBus.publish(MessageBusEventType.MutationSingleEvent, { frame: new BrowserContext(self) });

        assert.equal(this._elementEvents._customInputEvents, null , 'CustomInputEvents is not define');
    });

});
