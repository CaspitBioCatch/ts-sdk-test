import { assert } from 'chai';
import CdApiFacade from '../../../../../src/main/api/CdApiFacade';
import CDUtils from '../../../../../src/main/technicalServices/CDUtils';
import MessageBus from '../../../../../src/main/technicalServices/MessageBus';
import ConfigurationRepository from '../../../../../src/main/core/configuration/ConfigurationRepository';
import CollectionSettings from '../../../../../src/main/api/CollectionSettings';
import { ConfigurationFields } from '../../../../../src/main/core/configuration/ConfigurationFields';
import CustomInputEvents from '../../../../../src/main/collectors/events/CustomInputEvents';
import TestFeatureSupport from '../../../../TestFeatureSupport';
import StandardCustomInputEmitter from '../../../../../src/main/services/StandardCustomInputEmitter';
import ElementsCollector from '../../../../../src/main/collectors/events/ElementsCollector';
import BrowserContext from '../../../../../src/main/core/browsercontexts/BrowserContext';
import { MessageBusEventType } from '../../../../../src/main/events/MessageBusEventType';
import DataQ from '../../../../../src/main/technicalServices/DataQ';
import EventAggregator from '../../../../../src/main/system/EventAggregator';
import sinon from "sinon";
import { attachCdApi, detachCdApi } from '../../../../../src/main/samples/CdApiUtils';


describe('CustomInputEvents Event Tests:', function () {
    let inputElement;
    let increasBtn;
    let decreasBtn;
    let getConfigurations;
    let sendToQueue;
    let customInputEvents;
    let configurationRepositoryStub;
    let subscribeSpy;
    let addListenersBySelectorSpy;
    let handleInputEventsSpy;
    let getSelectElementsFromDocSpy;
    let removeListenersBySelectorSpy;
    let maskingServiceStub;

    before(function () {
        attachCdApi()

        if (!TestFeatureSupport.isMutationObserverSupported()) {
            this.skip();
            return;
        }

        maskingServiceStub = {
            maskAbsoluteIfRequired: sinon.stub().returnsArg(0),
            maskText: sinon.stub().returns('maskingServiceStub.maskText.mock'),
            _shouldMask: sinon.stub().returnsArg(0)
        };


        window.cdApi.getCustomerConfigLocation = () => {};
        window.cdApi.getLogServerAddress = () => {};

        this.messageBus = new MessageBus();

        this._browserContext = new BrowserContext(self);
        this.sandbox = sinon.createSandbox();

        sendToQueue = sinon.spy();

        this.elementsStub = sinon.createStubInstance(ElementsCollector);
        this.elementsStub.getElement.returns(32);
        this.elementsStub.isListed.returns(false);
        this.elementsStub._maskingService = maskingServiceStub;

        this.DataQStub = sinon.createStubInstance(DataQ);

        getConfigurations = this.sandbox.stub(window.cdApi, 'getConfigurations');
        configurationRepositoryStub = sinon.stub(new ConfigurationRepository());
        configurationRepositoryStub.get.withArgs(ConfigurationFields.parentElementSelector).returns('ngx-slider');
        configurationRepositoryStub.get
            .withArgs(ConfigurationFields.childElementWithCustomAttribute)
            .returns('.ngx-slider-pointer');

        configurationRepositoryStub.get.withArgs(ConfigurationFields.elementDataAttribute).returns('ariaValueNow');
        configurationRepositoryStub.get
            .withArgs(ConfigurationFields.customButtons)
            .returns(['.increasBtn', '.decreasBtn']);

        const cdApiFacade = new CdApiFacade(CDUtils);
        const cb = this.sandbox.spy();
        cdApiFacade.getConfigurations(cb);

        this._eventAggregator = EventAggregator;

        this._standardCustomInputEmitter = new StandardCustomInputEmitter(
            this.messageBus,
            this._eventAggregator,
            CDUtils
        );

        this.inputElementSettings = {
            parentElementSelector: configurationRepositoryStub.get(ConfigurationFields.parentElementSelector),
            childElementWithCustomAttribute: configurationRepositoryStub.get(
                ConfigurationFields.childElementWithCustomAttribute
            ),
            elementDataAttribute: configurationRepositoryStub.get(ConfigurationFields.elementDataAttribute),
            customButtons: configurationRepositoryStub.get(ConfigurationFields.customButtons),
        };

        customInputEvents = new CustomInputEvents(
            this.elementsStub,
            sendToQueue,
            CDUtils,
            this.messageBus,
            sinon.createStubInstance(StandardCustomInputEmitter),
            maskingServiceStub,
            this.inputElementSettings
        );
        getSelectElementsFromDocSpy = sinon.spy(customInputEvents, 'getSelectElementsFromDoc');
        handleInputEventsSpy = sinon.spy(customInputEvents, 'handleInputEvents');
        addListenersBySelectorSpy = sinon.spy(customInputEvents, 'addListenersBySelector');
        removeListenersBySelectorSpy = sinon.spy(customInputEvents, 'removeListenersBySelector');
        subscribeSpy = sinon.spy(this.messageBus, 'subscribe');
    });

    after(function () {
        getConfigurations.restore();
        detachCdApi()
    });

    beforeEach(function () {
        inputElement = document.createElement('span');
        inputElement.setAttribute('ariaValueNow', '150');
        inputElement.className = 'ngx-slider-pointer';
        document.body.appendChild(inputElement);

        increasBtn = document.createElement('button');
        increasBtn.className = 'increasBtn';
        increasBtn.innerText = '+';
        document.body.appendChild(increasBtn);

        decreasBtn = document.createElement('button');
        decreasBtn.className = 'decreasBtn';
        decreasBtn.innerText = '-';
        document.body.appendChild(decreasBtn);
    });

    it('Should create a new CustomInputEvents instance', function () {
        assert.isObject(customInputEvents, 'Could not create a new instance of InputEvents');
        assert.instanceOf(customInputEvents, CustomInputEvents, 'customInputEvents is not an instance of InputEvents');
        getConfigurations.restore();
        document.body.removeChild(inputElement);
        document.body.removeChild(increasBtn);
        document.body.removeChild(decreasBtn);
    });

    it('getConfigurations.getCollectionSettings returns customInputElementSettings', function () {
        const cdApiFacade = new CdApiFacade(CDUtils);
        const collectionSettingsjson = {
            elementSettings: {},
            customInputElementSettings: {
                parentElementSelector: 'ngx-slider',
                childElementWithCustomAttribute: 'ngx-slider-pointer',
                elementDataAttribute: 'ariaValueNow',
                customButtons: [
                    'body > app-root > div > div.slider-container > button:nth-child(1)',
                    'body > app-root > div > div.slider-container > button:nth-child(3)',
                ],
            },
        };
        const expectedCollectionSettings = new CollectionSettings(collectionSettingsjson);
        const getConfigurations = this.sandbox.stub(window.cdApi, 'getConfigurations');

        getConfigurations.callsArgWith(0, {
            wupServerURL: 'https://wupserver.com/client/v3.1/web/wup?cid=mycid',
            logServerURL: 'bbb',
            enableCustomElementsProcessing: true,
            useUrlWorker: false,
            workerUrl: 'worker.js',
            collectionSettings: {
                elementSettings: {},
                customInputElementSettings: {
                    parentElementSelector: 'ngx-slider',
                    childElementWithCustomAttribute: 'ngx-slider-pointer',
                    elementDataAttribute: 'ariaValueNow',
                    customButtons: [
                        'body > app-root > div > div.slider-container > button:nth-child(1)',
                        'body > app-root > div > div.slider-container > button:nth-child(3)',
                    ],
                },
            },
        });
        const cb = this.sandbox.spy();
        cdApiFacade.getConfigurations(cb);

        const configurations = cb.firstCall.args[0];

        assert.deepEqual(configurations.getCollectionSettings(), expectedCollectionSettings);
        document.body.removeChild(inputElement);
        document.body.removeChild(increasBtn);
        document.body.removeChild(decreasBtn);
    });

    it('Should invoke start of events emitters', function () {
        const doc = this._browserContext.getDocument();
        customInputEvents.bind(this._browserContext);
        this.messageBus.publish(MessageBusEventType.CustomInputElement, inputElement);
        assert.isTrue(
            customInputEvents._StandardCustomInputEmitter.start.called,
            'customInputEvents._StandardCustomInputEmitter start method not called'
        );

        assert.isTrue(handleInputEventsSpy.called, 'handleInputEventsSpy method not called');
        assert.isTrue(customInputEvents.handleInputEvents.called, 'handleInputEvents method not called');
        assert.isTrue(addListenersBySelectorSpy.called, 'addListenersBySelectorSpy method not called');
        assert.isTrue(getSelectElementsFromDocSpy.called, 'getSelectElementsFromDocSpy method not called');
        const elements = [
            customInputEvents._elementsFromDoc?.mainElement,
            ...customInputEvents._elementsFromDoc.customButtons,
        ];

        assert.strictEqual(elements.length, 3);
        assert.strictEqual(
            customInputEvents._elementsFromDoc.mainElement,
            document.querySelector('.ngx-slider-pointer')
        );
        assert.strictEqual(customInputEvents._elementsFromDoc.customButtons[0], document.querySelector('.increasBtn'));
        assert.strictEqual(customInputEvents._elementsFromDoc.customButtons[1], document.querySelector('.decreasBtn'));
        assert.isDefined(doc);
        assert.strictEqual(doc.nodeType, 9);
        assert.isDefined(customInputEvents.addListenersBySelector);
        assert.isTrue(customInputEvents.addListenersBySelector.called);
        assert.equal(subscribeSpy.callCount, 1);
        assert.equal(subscribeSpy.firstCall.args[0], MessageBusEventType.CustomInputElement);
        assert.isTrue(maskingServiceStub.maskText.called, 'maskingServiceStub maskText method not called');

        document.body.removeChild(inputElement);
        document.body.removeChild(increasBtn);
        document.body.removeChild(decreasBtn);
    });

    it('Should invoke stop of event emitters', function () {
        customInputEvents.unbind(this._browserContext);
        assert.isTrue(
            customInputEvents._StandardCustomInputEmitter.stop.called,
            'StandardCustomInputEmitter stop method not called.'
        );
        assert.isTrue(removeListenersBySelectorSpy.called, '_removeListenersBySelectorSpy method not called');
        document.body.removeChild(inputElement);
        document.body.removeChild(increasBtn);
        document.body.removeChild(decreasBtn);
        const empty = {
            mainElement: '',
            customButtons: [],
        };
        assert.equal(customInputEvents._elementsFromDoc.mainElement, empty.mainElement);
        assert.equal(customInputEvents._elementsFromDoc.customButtons.length, empty.customButtons.length);
    });

    it('Should add elements upon invoking addOnLoadInputData', function () {
        customInputEvents.addOnLoadInputData(this._browserContext, false);
        assert.isTrue(
            this.elementsStub.getElement.called,
            '_elements.getElement was not called upon invoking addOnLoadInputData'
        );
        document.body.removeChild(inputElement);
        document.body.removeChild(increasBtn);
        document.body.removeChild(decreasBtn);
    });

    it('Should execute events', function () {
        customInputEvents.bind(this._browserContext);

        const e = document.createEvent('Event');
        e.initEvent('click', true, true);
        inputElement.dispatchEvent(e);
        inputElement.click();
        this.messageBus.publish(MessageBusEventType.CustomInputElement, inputElement);

        assert.isTrue(
            customInputEvents.handleInputEvents.called,
            'customInputEvents._sendToQueue was not called upon publishing message'
        );
        assert.isTrue(
            customInputEvents._sendToQueue.called,
            'customInputEvents._sendToQueue was not called upon publishing message'
        );
        assert.isTrue(
            this.elementsStub.getElement.called,
            'customInputEvents._sendToQueue was not called upon publishing message'
        );
    });

    it('should handle input events correctly', function () {
        const e = {
            getAttribute: () => {
                return 'attributeValue';
            },
            target: {
                ariaValueNow: 'targetAriaValueNow',
                value: 'targetValue',
            },
            elementDataAttribute: 'elementDataValue',
        };

        const _maskingService = {
            maskText: (value) => {
                return `masked_${value}`;
            },
        };
        const _sendToQueue = (e, data) => {
            assert.equal(data.length, 13);
            assert.equal(data.elementValues, 'masked_attributeValue');
            assert.equal(data.selected, -1);
        };

        customInputEvents.handleInputEvents.call(
            {
                _inputElementSettings: {
                    elementDataAttribute: 'attributeName',
                },
                _maskingService,
                _sendToQueue,
            },
            e
        );
    });

    it('should set the correct value for newValue when attribute is present', function () {
        const e = {
            getAttribute: () => {
                return 'ariaValueNow';
            },
            target: {
                ariaValueNow: 'targetAriaValueNow',
                value: 'targetValue',
            },
            elementDataAttribute: 'elementDataValue',
        };

        let newValue = '';
        let attribute = e.getAttribute?.(this.inputElementSettings?.elementDataAttribute);

        if (attribute) {
            newValue = attribute;
        } else if (e.target?.ariaValueNow) {
            newValue = e.target.ariaValueNow;
        } else if (e.target?.value) {
            newValue = e.target.value;
        } else if (e[this.inputElementSettings?.elementDataAttribute]) {
            newValue = e[this.inputElementSettings.elementDataAttribute];
        }

        assert.equal(newValue, 'ariaValueNow');
    });

    it('should set the correct value for newValue when attribute is not present', function () {
        const e = {
            getAttribute: () => {
                return null;
            },
            target: {
                ariaValueNow: 'targetAriaValueNow',
                value: 'targetValue',
            },
            elementDataAttribute: 'elementDataValue',
        };

        let newValue = '';
        let attribute = e.getAttribute?.(this.inputElementSettings?.elementDataAttribute);

        if (attribute) {
            newValue = attribute;
        } else if (e.target?.ariaValueNow) {
            newValue = e.target.ariaValueNow;
        } else if (e.target?.value) {
            newValue = e.target.value;
        } else if (e[this.inputElementSettings?.elementDataAttribute]) {
            newValue = e[this.inputElementSettings.elementDataAttribute];
        }
        assert.equal(newValue, 'targetAriaValueNow');
    });

    it('should set the correct value for newValue when attribute and ariaValueNow is not present', function () {
        const e = {
            getAttribute: () => {
                return null;
            },
            target: {
                value: 'targetValue',
            },
            elementDataAttribute: 'elementDataValue',
        };

        let newValue = '';
        let attribute = e.getAttribute?.(this.inputElementSettings?.elementDataAttribute || 'ariavaluenow');

        if (attribute) {
            newValue = attribute;
        } else if (e.target?.ariaValueNow) {
            newValue = e.target.ariaValueNow;
        } else if (e.target?.value) {
            newValue = e.target.value;
        } else if (e[this.inputElementSettings?.elementDataAttribute]) {
            newValue = e[this.inputElementSettings.elementDataAttribute];
        }

        assert.equal(newValue, 'targetValue');
    });

    it('should return early when parentElementSelector and childElementWithCustomAttribute are not defined', function () {
        const browserContext = {
            getDocument: () => {},
        };

        const _inputElementSettings = {
            parentElementSelector: undefined,
            childElementWithCustomAttribute: undefined,
        };

        const _elements = {
            isListed: () => {},
            getElement: () => {},
            resendElementPerContext: () => {},
        };

        const result = customInputEvents.addOnLoadInputData.call(
            {
                _inputElementSettings,
                _elements,
            },
            browserContext,
            false
        );
        assert.isUndefined(result);
    });

    it('should set the correct value for newValue when attribute and ariaValueNow is not present', function () {
        const e = {
            getAttribute: () => {
                return null;
            },
            target: {
                value: '',
            },
        };

        let newValue = '';
        let attribute = e.getAttribute?.(this.inputElementSettings?.elementDataAttribute);

        if (attribute) {
            newValue = attribute;
        } else if (e.target?.ariaValueNow) {
            newValue = e.target.ariaValueNow;
        } else if (e.target?.value) {
            newValue = e.target.value;
        } else if (e[this.inputElementSettings?.elementDataAttribute]) {
            newValue = e[this.inputElementSettings.elementDataAttribute];
        }
        const result = customInputEvents.handleInputEvents.call(e);

        assert.equal(newValue, '');
        assert.isUndefined(result);
    });

    it('should call the necessary functions when elements exist', function () {
        this.elementsStub.isListed.returns(true);
        customInputEvents.addOnLoadInputData(this._browserContext, false);
        assert.equal(this.elementsStub.resendElementPerContext.callCount, 3);
        assert.isTrue(this.elementsStub.getElement.called);
    });
});

describe('CustomInputEvents Event while ConfigurationRepository.CustomInputElementSettings is empty Tests:', function () {
    let inputElement;
    let increasBtn;
    let decreasBtn;
    let getConfigurations;
    let sendToQueue;
    let customInputEvents;
    let maskingServiceStub;
    let subscribeSpy;
    let addListenersBySelectorSpy;
    let getSelectElementsFromDocSpy;
    let removeListenersBySelectorSpy;
    let addOnLoadInputDataSpy;

    before(function () {
        attachCdApi()

        if (!TestFeatureSupport.isMutationObserverSupported()) {
            this.skip();
            return;
        }

        window.cdApi.getCustomerConfigLocation = () => {};
        window.cdApi.getLogServerAddress = () => {};

        maskingServiceStub = {
            maskAbsoluteIfRequired: sinon.stub().returnsArg(0),
            maskText: sinon.stub().returns('maskingServiceStub.maskText.mock'),
            _shouldMask: sinon.stub().returnsArg(0)
        };

        this.messageBus = new MessageBus();
        this._browserContext = new BrowserContext(self);
        this.sandbox = sinon.createSandbox();

        sendToQueue = sinon.spy();

        this.elementsStub = sinon.createStubInstance(ElementsCollector);
        this.elementsStub.getElement.returns(32);
        this.elementsStub.isListed.returns(false);
        this.elementsStub._maskingService = maskingServiceStub;

        this.DataQStub = sinon.createStubInstance(DataQ);

        getConfigurations = this.sandbox.stub(window.cdApi, 'getConfigurations');

        const cdApiFacade = new CdApiFacade(CDUtils);
        const cb = this.sandbox.spy();
        cdApiFacade.getConfigurations(cb);

        this._standardCustomInputEmitter = sinon.createStubInstance(StandardCustomInputEmitter);

        this.inputElementSettings = {
            parentElementSelector: undefined,
            childElementWithCustomAttribute: undefined,
            elementDataAttribute: undefined,
            customButtons: undefined,
        };

        customInputEvents = new CustomInputEvents(
            this.elementsStub,
            sendToQueue,
            CDUtils,
            this.messageBus,
            sinon.createStubInstance(StandardCustomInputEmitter),
            maskingServiceStub,
            this.inputElementSettings
        );

        getSelectElementsFromDocSpy = sinon.spy(customInputEvents, 'getSelectElementsFromDoc');
        addListenersBySelectorSpy = sinon.spy(customInputEvents, 'addListenersBySelector');
        removeListenersBySelectorSpy = sinon.spy(customInputEvents, 'removeListenersBySelector');
        addOnLoadInputDataSpy = sinon.spy(customInputEvents, 'addOnLoadInputData');
        subscribeSpy = sinon.spy(this.messageBus, 'subscribe');
    });

    after(function () {
        getConfigurations.restore();
        detachCdApi()
    });

    beforeEach(function () {
        inputElement = document.createElement('span');
        inputElement.setAttribute('ariaValueNow', '150');
        inputElement.className = 'ngx-slider-pointer';
        document.body.appendChild(inputElement);

        increasBtn = document.createElement('button');
        increasBtn.className = 'increasBtn';
        increasBtn.innerText = '+';
        document.body.appendChild(increasBtn);

        decreasBtn = document.createElement('button');
        decreasBtn.className = 'decreasBtn';
        decreasBtn.innerText = '-';
        document.body.appendChild(decreasBtn);
    });

    afterEach(() => {
        document.body.removeChild(inputElement);
        document.body.removeChild(increasBtn);
        document.body.removeChild(decreasBtn);
    });

    it('Should not invoke start of events emitters after call bind', function () {
        customInputEvents.bind(this._browserContext);
        assert.equal(customInputEvents.bind(this._browserContext), undefined);
        assert.equal(subscribeSpy.callCount, 0);
        assert.equal(addListenersBySelectorSpy.callCount, 0);
        assert.isNotTrue(
            customInputEvents._StandardCustomInputEmitter.start.called,
            'StandardCustomInputEmitter start method is called.'
        );
    });

    it('Should not invoke stop of events emitters after call unbind', function () {
        customInputEvents.unbind(this._browserContext);
        assert.equal(customInputEvents.unbind(this._browserContext), undefined);
        assert.equal(subscribeSpy.callCount, 0);
        assert.equal(removeListenersBySelectorSpy.callCount, 0);
        assert.isNotTrue(
            customInputEvents._StandardCustomInputEmitter.stop.called,
            'StandardCustomInputEmitter stop method is called.'
        );
    });

    it('Should not invoke ElementsCollector function', function () {
        assert.equal(addOnLoadInputDataSpy.callCount, 0);
        assert.equal(customInputEvents.addOnLoadInputData(this._browserContext, false), undefined);
        assert.isUndefined(customInputEvents.addOnLoadInputData(this._browserContext, false));
        assert.equal(getSelectElementsFromDocSpy.callCount, 0);
        assert.equal(this.elementsStub.getElement.callCount, 0);
        assert.equal(this.elementsStub.resendElementPerContext.callCount, 0);
    });
});
