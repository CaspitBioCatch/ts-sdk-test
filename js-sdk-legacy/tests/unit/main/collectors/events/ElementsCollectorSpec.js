import sinon from 'sinon';

import ElementsCollector from '../../../../../src/main/collectors/events/ElementsCollector';
import CDUtils from "../../../../../src/main/technicalServices/CDUtils";
import { EventStructure } from '../../../../../src/main/collectors/events/ElementsCollector';
import {ConfigurationFields} from "../../../../../src/main/core/configuration/ConfigurationFields";

describe('ElementsCollector', () => {
    let elementsCollector;
    let configurationRepositoryStub;
    let dataQueueStub;
    let contextMgrStub;
    let maskingServiceStub;
    let XPathHashProducerStub;
    let mockWeakMap;


    beforeEach(() => {
        configurationRepositoryStub = {
            get: sinon.stub(),
            set: sinon.stub()
        };

        // Stubbing the getHash function
        sinon.stub(CDUtils, 'getHash').returns('1234');

        dataQueueStub = {
            addToQueue: sinon.spy()
        };
        contextMgrStub = {
            contextName: 'testContext',
            contextId: '123'
        };
        maskingServiceStub = {
            maskAbsoluteIfRequired: sinon.stub().returnsArg(0),
            maskText: sinon.stub().returns('maskingServiceStub.maskText.mock'),
            _shouldMask: sinon.stub().returnsArg(0)
        };
        XPathHashProducerStub = {
            produce: sinon.stub().returns("xpath")
        };
        mockWeakMap = {
            set: sinon.stub(),
            get: sinon.stub().returns({
                hash: '1234',
                contextList: [contextMgrStub.contextName]
            }),
            has: sinon.stub().returns(false)
        };

        elementsCollector = new ElementsCollector(configurationRepositoryStub, CDUtils, dataQueueStub, contextMgrStub, maskingServiceStub);
        elementsCollector._XPathHashProducer = XPathHashProducerStub; // manually setting the stubbed XPathHashProducer
        elementsCollector._elementHashWMap = mockWeakMap;
    });

    describe('getElement', () => {
        it('should return -1 for undefined, null, document, or body elements', () => {
            expect(elementsCollector.getElement(null)).to.equal(-1);
            expect(elementsCollector.getElement(document)).to.equal(-1);
            expect(elementsCollector.getElement(document.body)).to.equal(-1);
        });

        // Add more test cases as needed
    });

    describe('general tests', function () {
        it('getElement handles null', function () {
            let hash = elementsCollector.getElement(null);

            assert.equal(hash, -1, 'expected to return hash -1');
            assert.isTrue(XPathHashProducerStub.produce.notCalled, 'getXPath should not be called');
            assert.isTrue(dataQueueStub.addToQueue.notCalled, 'addToQueue should not be called');
            hash = elementsCollector.getElement();

            assert.equal(hash, -1, 'expected to return hash -1');
            assert.isTrue(XPathHashProducerStub.produce.notCalled, 'getXPath should not be called');
        });

        it('getElement returns hash without calc for existing element', function () {

            mockWeakMap.has.returns(true);

            const input = document.createElement('input');
            input.setAttribute('id', Math.random().toString(36).substr(2, 3));
            input.type = 'password';
            input.className = 'element-class-name'; // set the CSS class
            input.name = 'myElement';
            input.value = 'secret1234$%^&';
            input.alt = 'enter password';
            input.title = 'enter password tooltip';
            document.body.appendChild(input); // put it into the DOM

            contextMgrStub.contextName = 'testA';

            let hash = elementsCollector.getElement(input);

            assert.equal(hash, 1234, 'expected to return hash 1234');
            assert.isTrue(XPathHashProducerStub.produce.notCalled, 'getXPath should not be called');
            assert.isFalse(dataQueueStub.addToQueue.calledOnce, 'addToQueue should not be called more than once');

            document.body.removeChild(input); // put it into the DOM
        });

        it('resendElementPerContext sends the element again after context change', function () {
            mockWeakMap.has.returns(true);

            const input = document.createElement('input');
            const inputId = 'myPasswordElementId2';
            input.setAttribute('id', inputId);
            input.type = 'password';
            input.className = 'element-class-name'; // set the CSS class
            input.name = 'myElement';
            input.value = 'lulu1234$%^&';
            input.alt = 'enter password';
            input.title = 'enter password tooltip';
            document.body.appendChild(input); // put it into the DOM
            contextMgrStub.contextName = 'testA';

            const hash = elementsCollector.getElement(input);

            assert.equal(hash, 1234, 'expected to return hash 1234');
            contextMgrStub.contextName = 'testB';
            contextMgrStub.contextHash = 5678;

            elementsCollector.resendElementPerContext(input);
            assert.isTrue(XPathHashProducerStub.produce.notCalled, 'getXPath should not be called');
            assert.isTrue(dataQueueStub.addToQueue.calledOnce, 'addToQueue not called');
            const data = dataQueueStub.addToQueue.firstCall.args[1];

            assert.equal(dataQueueStub.addToQueue.firstCall.firstArg, 'elements', 'expected to be called with elements');
            assert.equal(data[0], 5678, 'wrong context id');
            assert.equal(data[EventStructure.indexOf('id') + 1], inputId, 'expected to be ' + inputId);
            document.body.removeChild(input); // put it into the DOM
        });

        it('resendElementPerContext does not send the element no context change', function () {
            const inputId = 'myPasswordElementId3';
            const input = document.createElement('input');
            input.setAttribute('id', inputId);
            input.type = 'password';
            input.className = 'element-class-name'; // set the CSS class
            input.name = 'myElement';
            input.value = 'lulu1234$%^&';
            input.alt = 'enter password';
            input.title = 'enter password tooltip';
            document.body.appendChild(input); // put it into the DOM

            // Mocking context and hash map response
            contextMgrStub.contextName = 'testA';
            mockWeakMap.has.returns(true);
            mockWeakMap.get.returns({
                hash: '1234',
                contextList: ['testA'] // Current context is already in the context list
            });

            // Get hash for the element
            const hash = elementsCollector.getElement(input);

            // Assertions
            assert.equal(hash, '1234', 'expected to return hash 1234');
            elementsCollector.resendElementPerContext(input);
            assert.isTrue(XPathHashProducerStub.produce.notCalled, 'produce should not be called');
            assert.isTrue(dataQueueStub.addToQueue.notCalled, 'addToQueue should not be called');

            // Cleanup
            document.body.removeChild(input);
        });
    });

    describe('element data-automation-id tests:', function () {
        let input = null;

        beforeEach(function () {
            input = document.createElement('input');
            input.type = 'text';
            input.name = 'myElement';

            document.body.appendChild(input); // put it into the DOM
        });

        afterEach(function () {
            document.body.removeChild(input);
            dataQueueStub.addToQueue.resetHistory();
            maskingServiceStub.maskText.resetHistory();
        });

        it('collects the default value of customElementAttribute when available', function () {
            // Arrange
            const expectedDataAutomationId = 'dAutIDtaiddd';
            input.setAttribute('data-automation-id', expectedDataAutomationId);
            elementsCollector._customElementAttribute = 'data-automation-id'

            // Act
            elementsCollector.getElement(input);

            // Assert
            expect(configurationRepositoryStub.get.withArgs(ConfigurationFields.customElementAttribute).callCount).to.equal(1);
            expect(maskingServiceStub.maskAbsoluteIfRequired.callCount).to.equal(3);
            assert.isTrue(dataQueueStub.addToQueue.calledOnce, 'addToQueue should have been called once');
            const [queueName, data] = dataQueueStub.addToQueue.firstCall.args;

            assert.equal(queueName, 'elements', 'addToQueue should be called with "elements" as the first argument');
            assert.equal(data[EventStructure.indexOf('elementHash') + 1], '1234', 'Expected hash to be 1234');
            assert.equal(data[EventStructure.indexOf('tagName') + 1], 'INPUT', 'Tag name should be INPUT');
            assert.equal(data[EventStructure.indexOf('name') + 1], 'myElement', 'Name attribute should be myElement');
            assert.equal(data[EventStructure.indexOf('type') + 1], 'text', 'Type attribute should be text');
            assert.equal(input.getAttribute('data-automation-id'), expectedDataAutomationId,
                `input.getAttribute('data-automation-id') not equal expectedDataAutomationId`);
            assert.equal(data[EventStructure.indexOf('customElementAttribute') + 1], expectedDataAutomationId,
                `customElementAttribute should be ${expectedDataAutomationId}`);
        });

        it('should collect the customElementAttribute as an empty string when the attribute is unavailable', function () {
            // Arrange
            input.setAttribute('data-automation-id', '');
            configurationRepositoryStub.get.withArgs(ConfigurationFields.customElementAttribute).returns('data-automation-id');

            // Act
            elementsCollector.getElement(input);

            // Assert
            assert.isTrue(dataQueueStub.addToQueue.calledOnce, 'addToQueue should have been called exactly once');

            const [eventType, data] = dataQueueStub.addToQueue.firstCall.args;
            assert.equal(eventType, 'elements', 'addToQueue should have been called with "elements" as the first argument');

            assert.equal(data[EventStructure.indexOf('elementHash') + 1], '1234', 'The element hash should be "1234"');
            assert.equal(data[EventStructure.indexOf('tagName') + 1], 'INPUT', 'The tag name should be "INPUT"');
            assert.equal(data[EventStructure.indexOf('name') + 1], 'myElement', 'The name should be "myElement"');
            assert.equal(data[EventStructure.indexOf('type') + 1], 'text', 'The type should be "text"');
            assert.equal(data[EventStructure.indexOf('customElementAttribute') + 1], '', 'The customElementAttribute should be an empty string');
        });

        it('does not collect customElementAttribute when the related configuration is set to false', function () {
            // Arrange
            input.setAttribute('data-automation-id', 'dAutIDtaiddd');
            configurationRepositoryStub.get.withArgs(ConfigurationFields.collectCustomElementAttribute).returns(false);
            elementsCollector.updateFeatureConfig();

            // Act
            elementsCollector.getElement(input);

            // Assert
            assert.isTrue(dataQueueStub.addToQueue.calledOnce, 'addToQueue should have been called once');

            const data = dataQueueStub.addToQueue.firstCall.args[1];
            const eventStructureIndex = (key) => {return EventStructure.indexOf(key) + 1};

            assert.strictEqual(dataQueueStub.addToQueue.firstCall.firstArg, 'elements', 'addToQueue should have been called with "elements"');

            assert.strictEqual(data[eventStructureIndex('elementHash')], '1234', 'The element hash should be "1234"');
            assert.strictEqual(data[eventStructureIndex('tagName')], 'INPUT', 'The tagName should be "INPUT"');
            assert.strictEqual(data[eventStructureIndex('name')], 'myElement', 'The name should be "myElement"');
            assert.strictEqual(data[eventStructureIndex('type')], 'text', 'The type should be "text"');
            assert.strictEqual(data[eventStructureIndex('customElementAttribute')], '', 'customElementAttribute should be an empty string');
        });

        it('masks "data-automation-id" value when it contains 3 numeric values', function () {
            // Arrange
            input.setAttribute('data-automation-id', 'dAutIDta123iddd');
            configurationRepositoryStub.get.withArgs(ConfigurationFields.collectCustomElementAttribute).returns(true);
            configurationRepositoryStub.get.withArgs(ConfigurationFields.customElementAttribute).returns('data-automation-id');
            elementsCollector.updateFeatureConfig()

            // Act
            elementsCollector.getElement(input);

            // Assert
            assert.isTrue(dataQueueStub.addToQueue.calledOnce, 'addToQueue should have been called once');

            const callArgs = dataQueueStub.addToQueue.firstCall.args;
            const data = callArgs[1];
            const eventStructureIndex = (key) => {return EventStructure.indexOf(key) + 1};

            assert.strictEqual(callArgs[0], 'elements', 'addToQueue should have been called with "elements"');
            assert.strictEqual(data[eventStructureIndex('elementHash')], '1234', 'The element hash should be "1234"');
            assert.strictEqual(data[eventStructureIndex('tagName')], 'INPUT', 'The tagName should be "INPUT"');
            assert.strictEqual(data[eventStructureIndex('name')], 'myElement', 'The name should be "myElement"');
            assert.strictEqual(data[eventStructureIndex('type')], 'text', 'The type should be "text"');
            assert.strictEqual(data[eventStructureIndex('customElementAttribute')], 'dAutIDta***iddd', 'customElementAttribute should be masked as "dAutIDta***iddd"');
        });

        it('element customElementAttribute default value is collected as empty string when unavailable', function () {
            input.setAttribute('data-automation-id', 'dAutIDta123iddd');
            configurationRepositoryStub.get.withArgs(ConfigurationFields.customElementAttribute).returns(undefined)

            elementsCollector.updateFeatureConfig();

            elementsCollector.getElement(input);

            // Assert
            assert.isTrue(dataQueueStub.addToQueue.calledOnce, 'addToQueue should have been called once');

            const callArgs = dataQueueStub.addToQueue.firstCall.args;
            const data = callArgs[1];
            const eventStructureIndex = (key) => {return EventStructure.indexOf(key) + 1};

            assert.strictEqual(callArgs[0], 'elements', 'addToQueue should have been called with "elements"');
            assert.strictEqual(data[eventStructureIndex('elementHash')], '1234', 'The element hash should be "1234"');
            assert.strictEqual(data[eventStructureIndex('tagName')], 'INPUT', 'The tagName should be "INPUT"');
            assert.strictEqual(data[eventStructureIndex('name')], 'myElement', 'The name should be "myElement"');
            assert.strictEqual(data[eventStructureIndex('type')], 'text', 'The type should be "text"');
            assert.strictEqual(data[eventStructureIndex('customElementAttribute')], '', 'expected to be an empty string');
        });
    });

    describe( 'Extra long text node values tests:', function () {
        let testElement1 = null;
        let long_val = "";

        beforeEach(function () {
            for (let i = 0; i < 30; i++) {
                long_val += "b";
            }
        });

        afterEach(function () {
            document.body.removeChild(testElement1);
            dataQueueStub.addToQueue.resetHistory();
            long_val = "";
        });

        it('elements value is greater then max length', function () {
            testElement1 = document.createTextNode(long_val);
            document.body.appendChild(testElement1);

            configurationRepositoryStub.get.withArgs('maxElValLen').returns(20);
            elementsCollector.updateFeatureConfig();
            elementsCollector.getElement(testElement1);

            // Assert
            assert.isTrue(dataQueueStub.addToQueue.calledOnce, 'addToQueue should have been called once');

            const callArgs = dataQueueStub.addToQueue.firstCall.args;
            const data = callArgs[1];
            const eventStructureIndex = (key) => {return EventStructure.indexOf(key) + 1};

            assert.strictEqual(callArgs[0], 'elements', 'addToQueue should have been called with "elements"');
            assert.strictEqual(data[eventStructureIndex('elementHash')], '1234', 'The element hash should be "1234"');
            assert.strictEqual(data[eventStructureIndex('elementValue')], '', 'expected to be empty');
            assert.strictEqual(data[eventStructureIndex('unmaskedElementValue')], '', 'expected to be empty');
        });

        it('elements value is greater then max length but is used in the unmasked list', function () {
            testElement1 = document.createTextNode(long_val);
            document.body.appendChild(testElement1);

            configurationRepositoryStub.get.withArgs('maxElValLen').returns(20);
            configurationRepositoryStub.get.withArgs(ConfigurationFields.enableUnmaskedValues).returns(true);
            configurationRepositoryStub.get.withArgs(ConfigurationFields.allowedUnmaskedValuesList).returns([long_val]);
            elementsCollector.updateFeatureConfig();
            elementsCollector.getElement(testElement1);

            // Assert
            assert.isTrue(dataQueueStub.addToQueue.calledOnce, 'addToQueue should have been called once');

            const callArgs = dataQueueStub.addToQueue.firstCall.args;
            const data = callArgs[1];
            const eventStructureIndex = (key) => {return EventStructure.indexOf(key) + 1};

            assert.strictEqual(callArgs[0], 'elements', 'addToQueue should have been called with "elements"');
            assert.strictEqual(data[eventStructureIndex('elementHash')], '1234', 'The element hash should be "1234"');
            assert.strictEqual(data[eventStructureIndex('elementValue')], '', ' elementValue expected to be empty');
            assert.strictEqual(data[eventStructureIndex('unmaskedElementValue')], long_val, 'expected to be ' + long_val);

        });

        it('elements value is greater then max length and unmaksed list improperly configured', function () {
            testElement1 = document.createTextNode(long_val);
            document.body.appendChild(testElement1);

            // Set up configurationRepositoryStub
            configurationRepositoryStub.get.withArgs('maxElValLen').returns(20);
            configurationRepositoryStub.get.withArgs(ConfigurationFields.enableUnmaskedValues).returns(true);
            configurationRepositoryStub.get.withArgs(ConfigurationFields.allowedUnmaskedValuesList).returns([{ foo: 'bar' }]);

            // Act
            elementsCollector.updateFeatureConfig();
            elementsCollector.getElement(testElement1);

            // Assert
            assert.isTrue(dataQueueStub.addToQueue.calledOnce, 'addToQueue not called');
            const data = dataQueueStub.addToQueue.firstCall.args[1];
            assert.equal(dataQueueStub.addToQueue.firstCall.firstArg, 'elements', 'expected to be called with elements');
            assert.isFalse(dataQueueStub.addToQueue.firstCall.args[2]);
            assert.equal(data[EventStructure.indexOf('elementHash') + 1], 1234, 'expected hash to be 1234');
            assert.equal(data[EventStructure.indexOf('elementValue') + 1], '', 'expected to be empty');
            assert.equal(data[EventStructure.indexOf('unmaskedElementValue') + 1], '', 'unmaskedElementValue expected to be empty');
            assert.equal(maskingServiceStub.maskText.callCount, 0, 'mask function should not be called');
        });

        it('elements value is greater then max length but maxElValLen is improperly configured', function () {
            const textValue = "zxcvbnm,.lkjhgfdsaqwertyuiop091"
            testElement1 = document.createTextNode(textValue);
            document.body.appendChild(testElement1);

            // Invokes the _sendElementToServer in response to maxElValLen update
            configurationRepositoryStub.get.withArgs('maxElValLen').returns(NaN);

            elementsCollector.updateFeatureConfig();
            elementsCollector.getElement(testElement1);

            assert.isTrue(dataQueueStub.addToQueue.calledOnce, 'addToQueue not called');
            const data = dataQueueStub.addToQueue.firstCall.args[1];
            assert.equal(dataQueueStub.addToQueue.firstCall.firstArg, 'elements', 'expected to be called with elements');
            assert.isFalse(dataQueueStub.addToQueue.firstCall.args[2]);
            assert.equal(data[EventStructure.indexOf('elementHash') + 1], 1234,
                'expected hash to be 1234');
            assert.equal(data[EventStructure.indexOf('elementValue') + 1], '', 'elementValue expected to be empty');
            assert.equal(data[EventStructure.indexOf('unmaskedElementValue') + 1], '', 'expected to be empty');
            assert.equal(maskingServiceStub.maskText.callCount, 0,'mask function should not be called');
        });

        it('elements value equals to the maxElValLen', function () {
            const textValue = "1234567890qwertyuiopasdfghjkl;"
            testElement1 = document.createTextNode(textValue);
            document.body.appendChild(testElement1);


            // Invokes the _sendElementToServer in response to maxElValLen update
            configurationRepositoryStub.get.withArgs('maxElValLen').returns(NaN);

            elementsCollector.updateFeatureConfig();
            elementsCollector.getElement(testElement1);

            assert.isTrue(dataQueueStub.addToQueue.calledOnce, 'addToQueue not called');
            assert.equal(testElement1.textContent.length, 30, 'testElement1.textContent.length = 30')
            assert.equal(elementsCollector._maxElemValLength, 30, '_maxElemValLength need to be 30')
            const data = dataQueueStub.addToQueue.firstCall.args[1];
            assert.equal(dataQueueStub.addToQueue.firstCall.firstArg, 'elements', 'expected to be called with elements');
            assert.isFalse(dataQueueStub.addToQueue.firstCall.args[2]);
            assert.equal(data[EventStructure.indexOf('elementHash') + 1], 1234,
                'expected hash to be 1234');
            assert.isTrue(maskingServiceStub.maskText.calledOnce,'mask function should be called');
            assert.equal(data[EventStructure.indexOf('elementValue') + 1], 'maskingServiceStub.maskText.mock', 'expected to be maskingServiceStub.maskText.mock');
            assert.equal(data[EventStructure.indexOf('unmaskedElementValue') + 1], '', 'expected to be empty');
        });
    });

    describe( 'Empty values elements tests:', function () {
        it('elements value is empty when no text node is available', function () {
            let testElement1 = null;
            testElement1 = document.createElement('i');
            testElement1.setAttribute('id', Math.random().toString(36).substr(2, 3));
            document.body.appendChild(testElement1);

            elementsCollector.updateFeatureConfig();
            elementsCollector.getElement(testElement1);

            assert.isTrue(dataQueueStub.addToQueue.calledOnce, 'addToQueue not called');
            const data = dataQueueStub.addToQueue.firstCall.args[1];
            assert.equal(dataQueueStub.addToQueue.firstCall.firstArg, 'elements', 'expected to be called with elements');
            assert.isFalse(dataQueueStub.addToQueue.firstCall.args[2]);
            assert.equal(data[EventStructure.indexOf('elementHash') + 1], 1234,
                'expected hash to be 1234');
            assert.equal(data[EventStructure.indexOf('elementValue') + 1], 'maskingServiceStub.maskText.mock', 'expected to be maskingServiceStub.maskText.mock');
            assert.equal(data[EventStructure.indexOf('unmaskedElementValue') + 1], '', 'expected to be empty');
            assert.equal(maskingServiceStub.maskText.callCount, 1,'mask function should be called');

            document.body.removeChild(testElement1);

        });
    });

    describe('Unmasked value feature tests:', function () {

        let testElement = null;

        beforeEach(function () {
            testElement = null;
            testElement = document.createElement('i');
            testElement.setAttribute('id', Math.random().toString(36).substr(2, 3));
            const okValue = document.createTextNode("ok");
            testElement.appendChild(okValue);
            document.body.appendChild(testElement);
        });

        afterEach(function () {
            document.body.removeChild(testElement);
        });

        it('unmasked values feature is undefined', function () {
            configurationRepositoryStub.get.withArgs(ConfigurationFields.enableUnmaskedValues).returns(undefined);
            elementsCollector.updateFeatureConfig();
            elementsCollector.getElement(testElement);

            assert.isTrue(dataQueueStub.addToQueue.calledOnce, 'addToQueue not called');
            const data = dataQueueStub.addToQueue.firstCall.args[1];
            const unmaksedValue = data[EventStructure.indexOf('unmaskedElementValue') + 1];

            assert.equal(dataQueueStub.addToQueue.firstCall.firstArg, 'elements', 'expected to be called with elements');
            assert.isFalse(dataQueueStub.addToQueue.firstCall.args[2]);
            assert.equal(data[EventStructure.indexOf('elementHash') + 1], 1234,
                'expected hash to be 1234');
            assert.equal(data[EventStructure.indexOf('elementValue') + 1], 'maskingServiceStub.maskText.mock', 'expected to be maskingServiceStub.maskText.mock');
            assert.equal(unmaksedValue, '', 'expected to be empty');
            assert.equal(unmaksedValue.length, 0, 'unmasked string length should be zero');
            assert.equal(maskingServiceStub.maskText.callCount, 1,'mask function should be called');
            assert.equal(maskingServiceStub.maskText.firstCall.firstArg, 'ok', 'Correct elements value not passed to maskText');
        });

        it('unmasked logic skipped when an object is provided', function () {
            configurationRepositoryStub.get.withArgs(ConfigurationFields.enableUnmaskedValues).returns(true);
            configurationRepositoryStub.get.withArgs(ConfigurationFields.allowedUnmaskedValuesList).returns({});
            elementsCollector.updateFeatureConfig();
            elementsCollector.getElement(testElement);

            const data = dataQueueStub.addToQueue.firstCall.args[1];

            assert.equal(data[EventStructure.indexOf('unmaskedElementValue') + 1], '', 'expected to be empty');
            assert.equal(maskingServiceStub.maskText.callCount, 1,'mask function should be called');
            assert.equal(maskingServiceStub.maskText.firstCall.firstArg, 'ok', 'Correct elements value not passed to maskText');
        });

        it('unmasked logic skipped when a string is provided', function () {
            configurationRepositoryStub.get.withArgs(ConfigurationFields.enableUnmaskedValues).returns(true);
            configurationRepositoryStub.get.withArgs(ConfigurationFields.allowedUnmaskedValuesList).returns('ok');
            elementsCollector.updateFeatureConfig();
            elementsCollector.getElement(testElement);

            const data = dataQueueStub.addToQueue.firstCall.args[1];

            assert.equal(data[EventStructure.indexOf('unmaskedElementValue') + 1], '', 'expected to be empty');
            assert.equal(maskingServiceStub.maskText.callCount, 1,'mask function should be called');
            assert.equal(maskingServiceStub.maskText.firstCall.firstArg, 'ok', 'Correct elements value not passed to maskText');
        });

        it('unmasked logic skipped when a string is provided and unmasked is disabled', function () {

            configurationRepositoryStub.get.withArgs(ConfigurationFields.enableUnmaskedValues).returns(true);
            configurationRepositoryStub.get.withArgs(ConfigurationFields.allowedUnmaskedValuesList).returns('ok');
            elementsCollector.updateFeatureConfig();
            elementsCollector.getElement(testElement);

            const data = dataQueueStub.addToQueue.firstCall.args[1];

            assert.equal(data[EventStructure.indexOf('unmaskedElementValue') + 1], '', 'expected to be empty');
            assert.equal(maskingServiceStub.maskText.callCount, 1,'mask function should be called');
            assert.equal(maskingServiceStub.maskText.firstCall.firstArg, 'ok', 'Correct elements value not passed to maskText');
        });

        it('Unsupported allowedUnmaskedValuesList value is skipped', function () {

            configurationRepositoryStub.get.withArgs(ConfigurationFields.enableUnmaskedValues).returns(true);
            configurationRepositoryStub.get.withArgs(ConfigurationFields.allowedUnmaskedValuesList).returns([{ "foo": "bar"},'ok']);
            elementsCollector.updateFeatureConfig();
            elementsCollector.getElement(testElement);

            const data = dataQueueStub.addToQueue.firstCall.args[1];

            assert.equal(data[EventStructure.indexOf('unmaskedElementValue') + 1], 'ok', 'expected to be ok');
            assert.equal(maskingServiceStub.maskText.callCount, 1,'mask function should be called');
            assert.equal(maskingServiceStub.maskText.firstCall.firstArg, 'ok', 'Correct elements value not passed to maskText');

        });

        it('Unsupported allowedUnmaskedValuesList values are skipped and value is masked', function () {

            configurationRepositoryStub.get.withArgs(ConfigurationFields.enableUnmaskedValues).returns(true);
            configurationRepositoryStub.get.withArgs(ConfigurationFields.allowedUnmaskedValuesList).returns([{ "foo": "bar"}, 555]);
            elementsCollector.updateFeatureConfig();
            elementsCollector.getElement(testElement);

            assert.isTrue(dataQueueStub.addToQueue.calledOnce, 'addToQueue not called');
            const data = dataQueueStub.addToQueue.firstCall.args[1];
            assert.equal(dataQueueStub.addToQueue.firstCall.firstArg, 'elements', 'expected to be called with elements');
            assert.isFalse(dataQueueStub.addToQueue.firstCall.args[2]);
            assert.equal(data[EventStructure.indexOf('elementHash') + 1], 1234,
                'expected hash to be 1234');
            assert.equal(data[EventStructure.indexOf('elementValue') + 1], 'maskingServiceStub.maskText.mock', 'expected to be maskingServiceStub.maskText.mock');
            assert.equal(data[EventStructure.indexOf('unmaskedElementValue') + 1], '', 'expected to be empty');
            assert.equal(maskingServiceStub.maskText.callCount, 1,'mask function should be called');
            assert.equal(maskingServiceStub.maskText.firstCall.firstArg, 'ok', 'Correct elements value not passed to maskText');

        });

        it('unmasked values feature is enabled but allowed list is undefined', function () {
            configurationRepositoryStub.get.withArgs(ConfigurationFields.enableUnmaskedValues).returns(true);
            configurationRepositoryStub.get.withArgs(ConfigurationFields.allowedUnmaskedValuesList).returns(undefined);
            elementsCollector.updateFeatureConfig();
            elementsCollector.getElement(testElement);

            assert.isTrue(dataQueueStub.addToQueue.calledOnce, 'addToQueue not called');
            const data = dataQueueStub.addToQueue.firstCall.args[1];
            assert.equal(dataQueueStub.addToQueue.firstCall.firstArg, 'elements', 'expected to be called with elements');
            assert.isFalse(dataQueueStub.addToQueue.firstCall.args[2]);
            assert.equal(data[EventStructure.indexOf('elementHash') + 1], 1234,
                'expected hash to be 1234');
            assert.equal(data[EventStructure.indexOf('elementValue') + 1], 'maskingServiceStub.maskText.mock', 'expected to be maskingServiceStub.maskText.mock');
            assert.equal(data[EventStructure.indexOf('unmaskedElementValue') + 1], '', 'expected to be empty');
            assert.equal(maskingServiceStub.maskText.callCount, 1,'mask function should be called');
            assert.equal(maskingServiceStub.maskText.firstCall.firstArg, 'ok', 'Correct elements value not passed to maskText');

        });

        it('unmasked values feature is enabled but allowed list is null', function () {
            configurationRepositoryStub.get.withArgs(ConfigurationFields.enableUnmaskedValues).returns(true);
            configurationRepositoryStub.get.withArgs(ConfigurationFields.allowedUnmaskedValuesList).returns(null);
            elementsCollector.updateFeatureConfig();
            elementsCollector.getElement(testElement);

            assert.isTrue(dataQueueStub.addToQueue.calledOnce, 'addToQueue not called');
            const data = dataQueueStub.addToQueue.firstCall.args[1];
            assert.equal(dataQueueStub.addToQueue.firstCall.firstArg, 'elements', 'expected to be called with elements');
            assert.isFalse(dataQueueStub.addToQueue.firstCall.args[2]);
            assert.equal(data[EventStructure.indexOf('elementHash') + 1], 1234,
                'expected hash to be 1234');
            assert.equal(data[EventStructure.indexOf('elementValue') + 1], 'maskingServiceStub.maskText.mock', 'expected to be maskingServiceStub.maskText.mock');
            assert.equal(data[EventStructure.indexOf('unmaskedElementValue') + 1], '', 'expected to be empty');
            assert.equal(maskingServiceStub.maskText.callCount, 1,'mask function should be called');
            assert.equal(maskingServiceStub.maskText.firstCall.firstArg, 'ok', 'Correct elements value not passed to maskText');
        });

        it('unmasked values feature is enabled allowed unmasked list has empty string', function () {
            configurationRepositoryStub.get.withArgs(ConfigurationFields.enableUnmaskedValues).returns(true);
            configurationRepositoryStub.get.withArgs(ConfigurationFields.allowedUnmaskedValuesList).returns(['']);

            elementsCollector.updateFeatureConfig();
            elementsCollector.getElement(testElement);

            const data = dataQueueStub.addToQueue.firstCall.args[1];
            assert.isFalse(dataQueueStub.addToQueue.firstCall.args[2]);
            assert.equal(data[EventStructure.indexOf('elementValue') + 1], 'maskingServiceStub.maskText.mock', 'expected to be maskingServiceStub.maskText.mock');
            assert.equal(data[EventStructure.indexOf('unmaskedElementValue') + 1], '', 'expected to be empty');
            assert.equal(maskingServiceStub.maskText.callCount, 1,'mask function should be called');
            assert.equal(maskingServiceStub.maskText.firstCall.firstArg, 'ok', 'Correct elements value not passed to maskText');
        });

        it('unmasked values feature is enabled but allowed list is empty', function () {
            configurationRepositoryStub.get.withArgs(ConfigurationFields.enableUnmaskedValues).returns(true);
            configurationRepositoryStub.get.withArgs(ConfigurationFields.allowedUnmaskedValuesList).returns([]);
            elementsCollector.updateFeatureConfig();
            elementsCollector.getElement(testElement);

            assert.isTrue(dataQueueStub.addToQueue.calledOnce, 'addToQueue not called');
            const data = dataQueueStub.addToQueue.firstCall.args[1];
            assert.equal(dataQueueStub.addToQueue.firstCall.firstArg, 'elements', 'expected to be called with elements');
            assert.isFalse(dataQueueStub.addToQueue.firstCall.args[2]);
            assert.equal(data[EventStructure.indexOf('elementHash') + 1], 1234,
                'expected hash to be 1234');
            assert.equal(data[EventStructure.indexOf('elementValue') + 1], 'maskingServiceStub.maskText.mock', 'expected to be maskingServiceStub.maskText.mock');
            assert.equal(data[EventStructure.indexOf('unmaskedElementValue') + 1], '', 'expected to be empty');
            assert.equal(maskingServiceStub.maskText.callCount, 1,'mask function should be called');
            assert.equal(maskingServiceStub.maskText.firstCall.firstArg, 'ok', 'Correct elements value not passed to maskText');
        });

        it('unmasked values feature is disabled', function () {

            configurationRepositoryStub.get.withArgs(ConfigurationFields.enableUnmaskedValues).returns(false);
            configurationRepositoryStub.get.withArgs(ConfigurationFields.allowedUnmaskedValuesList).returns(["ok", "cancel"]);
            elementsCollector.updateFeatureConfig();
            elementsCollector.getElement(testElement);

            assert.isTrue(dataQueueStub.addToQueue.calledOnce, 'addToQueue not called');
            const data = dataQueueStub.addToQueue.firstCall.args[1];
            assert.equal(dataQueueStub.addToQueue.firstCall.firstArg, 'elements', 'expected to be called with elements');
            assert.isFalse(dataQueueStub.addToQueue.firstCall.args[2]);
            assert.equal(data[EventStructure.indexOf('elementHash') + 1], 1234,
                'expected hash to be 1234');
            assert.equal(data[EventStructure.indexOf('elementValue') + 1], 'maskingServiceStub.maskText.mock', 'expected to be maskingServiceStub.maskText.mock');
            assert.equal(data[EventStructure.indexOf('unmaskedElementValue') + 1], '', 'expected to be empty');
            assert.equal(maskingServiceStub.maskText.callCount, 1,'mask function should be called');
            assert.equal(maskingServiceStub.maskText.firstCall.firstArg, 'ok', 'Correct elements value not passed to maskText');
        });

        it('unmasked values feature is disabled and list is empty', function () {
            configurationRepositoryStub.get.withArgs(ConfigurationFields.enableUnmaskedValues).returns(false);
            configurationRepositoryStub.get.withArgs(ConfigurationFields.allowedUnmaskedValuesList).returns([]);
            elementsCollector.updateFeatureConfig();
            elementsCollector.getElement(testElement);

            assert.isTrue(dataQueueStub.addToQueue.calledOnce, 'addToQueue not called');
            const data = dataQueueStub.addToQueue.firstCall.args[1];
            assert.equal(dataQueueStub.addToQueue.firstCall.firstArg, 'elements', 'expected to be called with elements');
            assert.isFalse(dataQueueStub.addToQueue.firstCall.args[2]);
            assert.equal(data[EventStructure.indexOf('elementHash') + 1], 1234,
                'expected hash to be 1234');
            assert.equal(data[EventStructure.indexOf('elementValue') + 1], 'maskingServiceStub.maskText.mock', 'expected to be maskingServiceStub.maskText.mock');
            assert.equal(data[EventStructure.indexOf('unmaskedElementValue') + 1], '', 'expected to be empty');
            assert.equal(maskingServiceStub.maskText.callCount, 1,'mask function should be called');
            assert.equal(maskingServiceStub.maskText.firstCall.firstArg, 'ok', 'Correct elements value not passed to maskText');
        });

        it('unmasked values feature is disabled and list is not an array', function () {
            configurationRepositoryStub.get.withArgs(ConfigurationFields.enableUnmaskedValues).returns(false);
            configurationRepositoryStub.get.withArgs(ConfigurationFields.allowedUnmaskedValuesList).returns({});
            elementsCollector.updateFeatureConfig();
            elementsCollector.getElement(testElement);

            assert.isTrue(dataQueueStub.addToQueue.calledOnce, 'addToQueue not called');
            const data = dataQueueStub.addToQueue.firstCall.args[1];
            assert.equal(dataQueueStub.addToQueue.firstCall.firstArg, 'elements', 'expected to be called with elements');
            assert.isFalse(dataQueueStub.addToQueue.firstCall.args[2]);
            assert.equal(data[EventStructure.indexOf('elementHash') + 1], 1234,
                'expected hash to be 1234');
            assert.equal(data[EventStructure.indexOf('elementValue') + 1], 'maskingServiceStub.maskText.mock', 'expected to be maskingServiceStub.maskText.mock');
            assert.equal(data[EventStructure.indexOf('unmaskedElementValue') + 1], '', 'expected to be empty');
            assert.equal(maskingServiceStub.maskText.callCount, 1,'mask function should be called');
            assert.equal(maskingServiceStub.maskText.firstCall.firstArg, 'ok', 'Correct elements value not passed to maskText');
        });

        it('element value is not contained in allowed unmasked values list test', function () {
            configurationRepositoryStub.get.withArgs(ConfigurationFields.enableUnmaskedValues).returns(true);
            configurationRepositoryStub.get.withArgs(ConfigurationFields.allowedUnmaskedValuesList).returns(["submit", "cancel"]);

            elementsCollector.updateFeatureConfig();
            elementsCollector.getElement(testElement);

            assert.isTrue(dataQueueStub.addToQueue.calledOnce, 'addToQueue not called');
            const data = dataQueueStub.addToQueue.firstCall.args[1];
            const unmaksedValue = data[EventStructure.indexOf('unmaskedElementValue') + 1];
            assert.equal(dataQueueStub.addToQueue.firstCall.firstArg, 'elements', 'expected to be called with elements');
            assert.isFalse(dataQueueStub.addToQueue.firstCall.args[2]);
            assert.equal(data[EventStructure.indexOf('elementHash') + 1], 1234,
                'expected hash to be 1234');
            assert.equal(data[EventStructure.indexOf('elementValue') + 1], 'maskingServiceStub.maskText.mock', 'expected to be maskingServiceStub.maskText.mock');
            assert.equal(unmaksedValue, '', 'expected to be empty');
            assert.equal(unmaksedValue.length, 0, 'unmasked string length should be zero');
            assert.equal(maskingServiceStub.maskText.callCount, 1,'mask function should be called');
            assert.equal(maskingServiceStub.maskText.firstCall.firstArg, 'ok', 'Correct elements value not passed to maskText');
        });

        it('Unmasked elements value not contained in response to default values', function () {
            elementsCollector.getElement(testElement);

            assert.isTrue(dataQueueStub.addToQueue.calledOnce, 'addToQueue not called');
            const data = dataQueueStub.addToQueue.firstCall.args[1];
            const unmaksedValue = data[EventStructure.indexOf('unmaskedElementValue') + 1];
            assert.equal(dataQueueStub.addToQueue.firstCall.firstArg, 'elements', 'expected to be called with elements');
            assert.isFalse(dataQueueStub.addToQueue.firstCall.args[2]);
            assert.equal(data[EventStructure.indexOf('elementHash') + 1], 1234,
                'expected hash to be 1234');
            assert.equal(data[EventStructure.indexOf('elementValue') + 1], 'maskingServiceStub.maskText.mock', 'expected to be maskingServiceStub.maskText.mock');
            assert.equal(unmaksedValue, '', 'expected to be empty');
            assert.equal(unmaksedValue.length, 0, 'unmasked string length should be zero');
            assert.equal(maskingServiceStub.maskText.callCount, 1,'mask function should be called');
            assert.equal(maskingServiceStub.maskText.firstCall.firstArg, 'ok', 'Correct elements value not passed to maskText');

        });

        it('element value contained in allowed unmasked values list test', function () {
            configurationRepositoryStub.get.withArgs(ConfigurationFields.enableUnmaskedValues).returns(true);
            configurationRepositoryStub.get.withArgs(ConfigurationFields.allowedUnmaskedValuesList).returns(["ok", "cancel"]);

            elementsCollector.updateFeatureConfig();
            elementsCollector.getElement(testElement);

            assert.isTrue(dataQueueStub.addToQueue.calledOnce, 'addToQueue not called');
            const data = dataQueueStub.addToQueue.firstCall.args[1];
            assert.equal(data.length, 22, 'Unexpected length of elements data array');
            assert.equal(dataQueueStub.addToQueue.firstCall.firstArg, 'elements', 'expected to be called with elements');
            assert.isFalse(dataQueueStub.addToQueue.firstCall.args[2]);
            assert.equal(data[EventStructure.indexOf('elementHash') + 1], 1234,
                'expected hash to be 1234');
            assert.equal(data[EventStructure.indexOf('elementValue') + 1], 'maskingServiceStub.maskText.mock', 'expected to be maskingServiceStub.maskText.mock');
            assert.equal(data[EventStructure.indexOf('unmaskedElementValue') + 1], 'ok', 'expected to be \"ok\"');
            assert.equal(maskingServiceStub.maskText.callCount, 1,'mask function should be called');
            assert.equal(maskingServiceStub.maskText.firstCall.firstArg, 'ok', 'Correct elements value not passed to maskText');
        });

        it('element value contained in allowed unmasked values list test with upper case letters', function () {
            configurationRepositoryStub.get.withArgs(ConfigurationFields.enableUnmaskedValues).returns(true);
            configurationRepositoryStub.get.withArgs(ConfigurationFields.allowedUnmaskedValuesList).returns(["Ok", "Cancel"]);

            elementsCollector.updateFeatureConfig();
            elementsCollector.getElement(testElement);

            assert.isTrue(dataQueueStub.addToQueue.calledOnce, 'addToQueue not called');
            const data = dataQueueStub.addToQueue.firstCall.args[1];
            assert.equal(dataQueueStub.addToQueue.firstCall.firstArg, 'elements', 'expected to be called with elements');
            assert.isFalse(dataQueueStub.addToQueue.firstCall.args[2]);
            assert.equal(data[EventStructure.indexOf('elementHash') + 1], 1234,
                'expected hash to be 1234');
            assert.equal(data[EventStructure.indexOf('elementValue') + 1], 'maskingServiceStub.maskText.mock', 'expected to be maskingServiceStub.maskText.mock');
            assert.equal(data[EventStructure.indexOf('unmaskedElementValue') + 1], 'Ok', 'expected to be \"Ok\"');
            assert.equal(maskingServiceStub.maskText.callCount, 1,'mask function should be called');
            assert.equal(maskingServiceStub.maskText.firstCall.firstArg, 'ok', 'Correct elements value not passed to maskText');

        });

        it('element value with spaces contained in allowed unmasked values list test', function () {
            let testElement1 = null;
            testElement1 = document.createElement('i');
            testElement1.setAttribute('id', Math.random().toString(36).substr(2, 3));
            const text_with_spaces = document.createTextNode(" ok "); // Asserts trim() is successfully performed
            testElement1.appendChild(text_with_spaces);
            document.body.appendChild(testElement1);

            configurationRepositoryStub.get.withArgs(ConfigurationFields.enableUnmaskedValues).returns(true);
            configurationRepositoryStub.get.withArgs(ConfigurationFields.allowedUnmaskedValuesList).returns(["ok", "cancel"]);

            elementsCollector.updateFeatureConfig();
            elementsCollector.getElement(testElement1);

            const data = dataQueueStub.addToQueue.firstCall.args[1];
            assert.isFalse(dataQueueStub.addToQueue.firstCall.args[2]);
            assert.equal(data[EventStructure.indexOf('elementValue') + 1], 'maskingServiceStub.maskText.mock', 'expected to be maskingServiceStub.maskText.mock');
            assert.equal(data[EventStructure.indexOf('unmaskedElementValue') + 1], 'ok', 'expected to be \"ok\"');
            assert.equal(maskingServiceStub.maskText.callCount, 1,'mask function should be called');
            assert.equal(maskingServiceStub.maskText.firstCall.firstArg, ' ok ', 'Correct elements value not passed to maskText');

            document.body.removeChild(testElement1);
        });

        it('element value is compared against a mix upper/lower case list value', function () {
            let testElement1 = null;
            let testElement2 = null;
            testElement1 = document.createElement('i');
            testElement2 = document.createElement('i');
            testElement1.setAttribute('id', Math.random().toString(36).substr(2, 3));
            testElement2.setAttribute('id', Math.random().toString(36).substr(2, 3));
            const text_with_spaces1 = document.createTextNode("OkOkOk"); // Asserts trim() is successfully performed
            testElement1.appendChild(text_with_spaces1);
            const text_with_spaces2 = document.createTextNode("canCel"); // Asserts trim() is successfully performed
            testElement2.appendChild(text_with_spaces2);
            document.body.appendChild(testElement1);
            document.body.appendChild(testElement2);

            configurationRepositoryStub.get.withArgs(ConfigurationFields.enableUnmaskedValues).returns(true);
            configurationRepositoryStub.get.withArgs(ConfigurationFields.allowedUnmaskedValuesList).returns(["oKoKoK", "CanCel"]);

            elementsCollector.updateFeatureConfig();
            elementsCollector.getElement(testElement1);
            elementsCollector.getElement(testElement2);

            const dataCall1 = dataQueueStub.addToQueue.firstCall.args[1];
            assert.isFalse(dataQueueStub.addToQueue.firstCall.args[2]);
            assert.equal(dataCall1[EventStructure.indexOf('elementValue') + 1], 'maskingServiceStub.maskText.mock', 'expected to be maskingServiceStub.maskText.mock');
            assert.equal(dataCall1[EventStructure.indexOf('unmaskedElementValue') + 1], 'oKoKoK', 'expected to be \"oKoKoK\"');
            assert.equal(maskingServiceStub.maskText.firstCall.firstArg, 'OkOkOk', 'Correct elements value not passed to maskText');

            const dataCall2 = dataQueueStub.addToQueue.getCall(1).args[1];
            assert.isFalse(dataQueueStub.addToQueue.getCall(1).args[2]);
            assert.equal(dataCall2[EventStructure.indexOf('elementValue') + 1], 'maskingServiceStub.maskText.mock', 'expected to be maskingServiceStub.maskText.mock');
            assert.equal(dataCall2[EventStructure.indexOf('unmaskedElementValue') + 1], 'CanCel', 'expected to be \"CanCel\"');
            assert.equal(maskingServiceStub.maskText.getCall(1).args[0], 'canCel', 'Correct elements value not passed to maskText');

            assert.equal(maskingServiceStub.maskText.callCount, 2,'mask function should be called');

            document.body.removeChild(testElement1);
            document.body.removeChild(testElement2);
        });
    });

    describe('element event is reported for all type of elements:', function () {

        it('reported for input element - bounding rect not obtained', function () {
            const input = document.createElement('input');
            input.setAttribute('id', 'somePass');
            input.type = 'password';
            input.className = 'element-class-name'; // set the CSS class
            input.name = 'myElement';
            input.value = 'secret1234$%^&';
            input.alt = 'enter password';
            input.title = 'enter password tooltip';
            document.body.appendChild(input); // put it into the DOM

            const datenow = sinon.stub(elementsCollector, 'getEventTimestamp');
            datenow.returns(12345678987654321);

            configurationRepositoryStub.get.withArgs('isElementsPosition').returns(false);

            elementsCollector.updateFeatureConfig()
            elementsCollector.getElement(input);

            assert.isTrue(dataQueueStub.addToQueue.calledOnce, 'addToQueue not called');
            const data = dataQueueStub.addToQueue.firstCall.args[1];
            assert.equal(dataQueueStub.addToQueue.firstCall.firstArg, 'elements', 'expected to be called with elements');
            assert.equal(data[EventStructure.indexOf('elementHash') + 1], 1234,
                'expected hash to be 1234');
            assert.equal(data[EventStructure.indexOf('tagName') + 1], 'INPUT', 'expected to be INPUT');
            assert.equal(data[EventStructure.indexOf('id') + 1], 'somePass', 'expected to be somePass');
            assert.equal(data[EventStructure.indexOf('name') + 1], 'myElement', 'expected to be myElement');
            assert.equal(data[EventStructure.indexOf('type') + 1], 'password', 'expected to be password');
            assert.equal(data[EventStructure.indexOf('leftPosition') + 1], -1, 'leftPosition expected to be -1');
            assert.equal(data[EventStructure.indexOf('topPosition') + 1], -1, 'topPosition expected to be -1');
            assert.equal(data[EventStructure.indexOf('width') + 1], -1, 'width expected to be -1');
            assert.equal(data[EventStructure.indexOf('height') + 1], -1, 'height expected to be -1');
            assert.equal(data[EventStructure.indexOf('className') + 1], 'element-class-name', 'expected to be element-class-name');
            assert.equal(data[EventStructure.indexOf('href') + 1], '', 'expected to be empty');
            assert.equal(data[EventStructure.indexOf('title') + 1], 'enter password tooltip', 'expected to be "enter password tooltip"');
            assert.equal(data[EventStructure.indexOf('alt') + 1], 'enter password', 'expected to be "enter password"');
            assert.equal(data[EventStructure.indexOf('selectValues') + 1], '', 'expected to be empty');
            assert.equal(data[EventStructure.indexOf('elementValue') + 1], 'maskingServiceStub.maskText.mock', 'expected to be maskingServiceStub.maskText.mock');
            assert.equal(data[EventStructure.indexOf('checked') + 1], 0, 'checked value not as expected ');
            assert.equal(data[EventStructure.indexOf('timestamp') + 1], 12345678987654321, 'time value not as expected ');

            document.body.removeChild(input);
            datenow.restore();
        });

        it('reported for input of type password', function () {
            const inputId = 'myPasswordElementId'
            const input = document.createElement('input');
            input.setAttribute('id', inputId);
            input.type = 'password';
            input.className = 'element-password-class'; // set the CSS class
            input.name = 'passwordElement';
            input.value = 'secret1234$%^&';
            input.alt = 'enter password';
            input.title = 'enter password tooltip';
            document.body.appendChild(input); // put it into the DOM

            const datenow = sinon.stub(elementsCollector, 'getEventTimestamp');
            datenow.returns(12345678987654321);

            elementsCollector.getElement(input);

            assert.isTrue(dataQueueStub.addToQueue.calledOnce, 'addToQueue not called');
            const data = dataQueueStub.addToQueue.firstCall.args[1];
            assert.equal(dataQueueStub.addToQueue.firstCall.firstArg, 'elements', 'expected to be called with elements');
            assert.equal(data[EventStructure.indexOf('elementHash') + 1], 1234,
                'expected hash to be 1234');
            assert.equal(data[EventStructure.indexOf('tagName') + 1], 'INPUT', 'expected to be INPUT');
            assert.equal(data[EventStructure.indexOf('id') + 1], inputId, 'expected to be ' + inputId);
            assert.equal(data[EventStructure.indexOf('name') + 1], 'passwordElement', 'expected to be passwordElement');
            assert.equal(data[EventStructure.indexOf('type') + 1], 'password', 'expected to be password');
            assert.notEqual(data[EventStructure.indexOf('leftPosition') + 1], -1, 'expected to be != -1');
            assert.notEqual(data[EventStructure.indexOf('topPosition') + 1], -1, 'expected to be != -1');
            assert.notEqual(data[EventStructure.indexOf('width') + 1], -1, 'expected to be != -1');
            assert.notEqual(data[EventStructure.indexOf('height') + 1], -1, 'expected to be != -1');
            assert.equal(data[EventStructure.indexOf('className') + 1], 'element-password-class', 'expected to be element-password-class');
            assert.equal(data[EventStructure.indexOf('href') + 1], '', 'expected to be empty');
            assert.equal(data[EventStructure.indexOf('title') + 1], 'enter password tooltip', 'expected to be "enter password tooltip"');
            assert.equal(data[EventStructure.indexOf('alt') + 1], 'enter password', 'expected to be "enter password"');
            assert.equal(data[EventStructure.indexOf('selectValues') + 1], '', 'expected to be empty');
            assert.equal(data[EventStructure.indexOf('elementValue') + 1], 'maskingServiceStub.maskText.mock', 'expected to be maskingServiceStub.maskText.mock');
            assert.equal(data[EventStructure.indexOf('checked') + 1], 0, 'checked value not as expected ');
            assert.equal(data[EventStructure.indexOf('timestamp') + 1], 12345678987654321, 'time value not as expected ');

            document.body.removeChild(input);
            datenow.restore();
        });

        it('reported for input of type text', function () {
            const input = document.createElement('input');
            input.setAttribute('id', 'txt1');
            input.type = 'text';
            input.className = 'element-class-name'; // set the CSS class
            input.name = 'myTextElement';
            input.value = 'someValue';
            input.alt = 'a text element';
            input.title = 'enter some text';
            document.body.appendChild(input); // put it into the DOM

            elementsCollector.getElement(input);

            const position = input.getBoundingClientRect && input.getBoundingClientRect();

            assert.isTrue(dataQueueStub.addToQueue.calledOnce, 'addToQueue not called');
            const data = dataQueueStub.addToQueue.firstCall.args[1];
            assert.equal(dataQueueStub.addToQueue.firstCall.firstArg, 'elements', 'expected to be called with elements');
            assert.equal(data[EventStructure.indexOf('elementHash') + 1], 1234,
                'expected hash to be 1234');
            assert.equal(data[EventStructure.indexOf('tagName') + 1], 'INPUT', 'expected to be INPUT');
            assert.equal(data[EventStructure.indexOf('id') + 1], 'txt1', 'expected to be txt1');
            assert.equal(data[EventStructure.indexOf('name') + 1], 'myTextElement', 'expected to be myTextElement');
            assert.equal(data[EventStructure.indexOf('type') + 1], 'text', 'expected to be password');
            assert.equal(data[EventStructure.indexOf('leftPosition') + 1], Math.round(position.left), 'leftPosition expected to be' + Math.round(position.left));
            assert.equal(data[EventStructure.indexOf('topPosition') + 1], Math.round(position.top), 'topPosition expected to be ' + Math.round(position.top));
            assert.equal(data[EventStructure.indexOf('width') + 1], Math.round(position.right - position.left), 'width expected to be ' + Math.round(position.right - position.left));
            assert.equal(data[EventStructure.indexOf('height') + 1], Math.round(position.bottom - position.top), 'height expected to be ' + Math.round(position.bottom - position.top));
            assert.equal(data[EventStructure.indexOf('className') + 1], 'element-class-name', 'expected to be element-class-name');
            assert.equal(data[EventStructure.indexOf('href') + 1], '', 'expected to be empty');
            assert.equal(data[EventStructure.indexOf('title') + 1], 'enter some text', 'expected to be "enter some text"');
            assert.equal(data[EventStructure.indexOf('alt') + 1], 'a text element', 'expected to be "a text element"');
            assert.equal(data[EventStructure.indexOf('selectValues') + 1], '', 'expected to be empty');
            assert.equal(data[EventStructure.indexOf('elementValue') + 1], 'maskingServiceStub.maskText.mock', 'expected to be maskingServiceStub.maskText.mock');

            document.body.removeChild(input);
        });

        it('reported for input of type radio', function () {
            const input = document.createElement('input');
            input.setAttribute('id', 'r1');
            input.type = 'radio';
            input.className = 'element-class-name'; // set the CSS class
            input.name = 'myElement';
            input.checked = true;
            input.alt = 'alt';
            input.title = 'title';
            document.body.appendChild(input); // put it into the DOM

            elementsCollector.getElement(input);

            assert.isTrue(dataQueueStub.addToQueue.calledOnce, 'addToQueue not called');
            const data = dataQueueStub.addToQueue.firstCall.args[1];
            assert.equal(dataQueueStub.addToQueue.firstCall.firstArg, 'elements', 'expected to be called with elements');
            assert.equal(data[EventStructure.indexOf('elementHash') + 1], 1234,
                'expected hash to be 1234');
            assert.equal(data[EventStructure.indexOf('tagName') + 1], 'INPUT', 'expected to be INPUT');
            assert.equal(data[EventStructure.indexOf('id') + 1], 'r1', 'expected to be r1');
            assert.equal(data[EventStructure.indexOf('name') + 1], 'myElement', 'expected to be myElement');
            assert.equal(data[EventStructure.indexOf('type') + 1], 'radio', 'expected to be password');
            assert.notEqual(data[EventStructure.indexOf('leftPosition') + 1], -1, 'expected to be != -1');
            assert.notEqual(data[EventStructure.indexOf('topPosition') + 1], -1, 'expected to be != -1');
            assert.notEqual(data[EventStructure.indexOf('width') + 1], -1, 'expected to be != -1');
            assert.notEqual(data[EventStructure.indexOf('height') + 1], -1, 'expected to be != -1');
            assert.equal(data[EventStructure.indexOf('className') + 1], 'element-class-name', 'expected to be element-class-name');
            assert.equal(data[EventStructure.indexOf('href') + 1], '', 'expected to be empty');
            assert.equal(data[EventStructure.indexOf('title') + 1], 'title', 'expected to be "enter password tooltip"');
            assert.equal(data[EventStructure.indexOf('alt') + 1], 'alt', 'expected to be "enter password"');
            assert.equal(data[EventStructure.indexOf('selectValues') + 1], '', 'expected to be empty');
            assert.equal(data[EventStructure.indexOf('elementValue') + 1], 'maskingServiceStub.maskText.mock', 'expected to be maskingServiceStub.maskText.mock');
            assert.equal(data[EventStructure.indexOf('checked') + 1], 1, 'checked expected to be 1');

            document.body.removeChild(input);
        });

        it('reported for input of type checkbox', function () {
            const input = document.createElement('input');
            input.setAttribute('id', 'cb1');
            input.type = 'checkbox';
            input.className = 'element-class-name'; // set the CSS class
            input.name = 'myCheckboxElement';
            input.checked = true;
            input.alt = 'check the box';
            input.title = 'some checkbox';
            document.body.appendChild(input); // put it into the DOM

            elementsCollector.getElement(input);

            assert.isTrue(dataQueueStub.addToQueue.calledOnce, 'addToQueue not called');
            const data = dataQueueStub.addToQueue.firstCall.args[1];
            assert.equal(dataQueueStub.addToQueue.firstCall.firstArg, 'elements', 'expected to be called with elements');
            assert.equal(data[EventStructure.indexOf('elementHash') + 1], 1234,
                'expected hash to be 1234');
            assert.equal(data[EventStructure.indexOf('tagName') + 1], 'INPUT', 'expected to be INPUT');
            assert.equal(data[EventStructure.indexOf('id') + 1], 'cb1', 'expected to be cb1');
            assert.equal(data[EventStructure.indexOf('name') + 1], 'myCheckboxElement', 'expected to be myCheckboxElement');
            assert.equal(data[EventStructure.indexOf('type') + 1], 'checkbox', 'expected to be password');
            assert.notEqual(data[EventStructure.indexOf('leftPosition') + 1], -1, 'expected to be != -1');
            assert.notEqual(data[EventStructure.indexOf('topPosition') + 1], -1, 'expected to be != -1');
            assert.notEqual(data[EventStructure.indexOf('width') + 1], -1, 'expected to be != -1');
            assert.notEqual(data[EventStructure.indexOf('height') + 1], -1, 'expected to be != -1');
            assert.equal(data[EventStructure.indexOf('className') + 1], 'element-class-name', 'expected to be element-class-name');
            assert.equal(data[EventStructure.indexOf('href') + 1], '', 'expected to be empty');
            assert.equal(data[EventStructure.indexOf('title') + 1], 'some checkbox', 'expected to be "some checkbox"');
            assert.equal(data[EventStructure.indexOf('alt') + 1], 'check the box', 'expected to be "check the box"');
            assert.equal(data[EventStructure.indexOf('selectValues') + 1], '', 'expected to be empty');
            assert.equal(data[EventStructure.indexOf('elementValue') + 1], 'maskingServiceStub.maskText.mock', 'expected to be maskingServiceStub.maskText.mock');

            document.body.removeChild(input);
        });

        it('reported for select element', function () {
            const select = document.createElement('select');
            const optionsValues = [];
            for (let i = 0; i < 5; i++) {
                const opt = document.createElement('option');
                opt.value = i;
                opt.text = i + '_text';
                optionsValues.push(maskingServiceStub.maskText(i + '_text'));
                select.appendChild(opt);
            }

            select.setAttribute('id', 'select1');
            select.selectedIndex = 0;
            select.title = 'tt';
            select.alt = 'alt';
            document.body.appendChild(select);
            maskingServiceStub.getDropDownListValues = sinon.stub().returns(optionsValues)

            // var dropDownStub = sinon.stub(CDUtils, "getDropDownListValues").returns(optionsValues);
            elementsCollector.getElement(select);

            assert.isTrue(dataQueueStub.addToQueue.calledOnce, 'addToQueue not called');
            const data = dataQueueStub.addToQueue.firstCall.args[1];
            assert.equal(dataQueueStub.addToQueue.firstCall.firstArg, 'elements', 'expected to be called with elements');
            assert.equal(data[EventStructure.indexOf('elementHash') + 1], 1234,
                'expected hash to be 1234');
            assert.equal(data[EventStructure.indexOf('tagName') + 1], 'SELECT', 'expected to be INPUT');
            assert.equal(data[EventStructure.indexOf('id') + 1], 'select1', 'expected to be select1');
            assert.equal(data[EventStructure.indexOf('name') + 1], '', 'expected to be myElement');
            assert.equal(data[EventStructure.indexOf('type') + 1], 'select-one', 'expected to be select-one');
            assert.notEqual(data[EventStructure.indexOf('leftPosition') + 1], -1, 'expected to be != -1');
            assert.notEqual(data[EventStructure.indexOf('topPosition') + 1], -1, 'expected to be != -1');
            assert.notEqual(data[EventStructure.indexOf('width') + 1], -1, 'expected to be != -1');
            assert.notEqual(data[EventStructure.indexOf('height') + 1], -1, 'expected to be != -1');
            assert.equal(data[EventStructure.indexOf('className') + 1], '', 'expected to be element-class-name');
            assert.equal(data[EventStructure.indexOf('href') + 1], '', 'expected to be empty');
            assert.equal(data[EventStructure.indexOf('title') + 1], 'tt', 'expected to be "enter password tooltip"');
            assert.equal(data[EventStructure.indexOf('alt') + 1], 'alt', 'expected to be "enter password"');
            assert.equal(data[EventStructure.indexOf('selectValues') + 1],
                optionsValues.join(';'), 'expected to include all the select values');
            assert.equal(data[EventStructure.indexOf('elementValue') + 1], 'maskingServiceStub.maskText.mock', 'expected to be maskingServiceStub.maskText.mock');

            document.body.removeChild(select);
            // dropDownStub.restore();
        });
    });

    describe('Send masked attribute to server when configured', function(){
        const input = document.createElement('input');
        input.setAttribute('id', 'password');
        input.setAttribute('name', 'password');
        input.setAttribute('data-bc', 'password');
        document.body.appendChild(input);

        const anchor = document.createElement('a');
        anchor.setAttribute('id', 'username');
        anchor.setAttribute('name', 'username');
        anchor.setAttribute('data-bc', 'username');
        document.body.appendChild(anchor);

        it('should use the masked value of the element ID',  function(){

            const expectedDataQueue = {password:'aaaaaaaa', username:'aaaaaaaa'}
            configurationRepositoryStub.get.withArgs(ConfigurationFields.maskElementsAttributes).returns({password:'aaaaaaaa', username:'aaaaaaaa'});
            configurationRepositoryStub.get.withArgs(ConfigurationFields.customElementAttribute).returns('data-bc');

            maskingServiceStub.maskAbsoluteIfRequired.withArgs('password').returns(expectedDataQueue.password)
            maskingServiceStub.maskAbsoluteIfRequired.withArgs('username').returns(expectedDataQueue.username)

            elementsCollector.updateFeatureConfig();
            elementsCollector._sendElementToServer(input,'erferfe');
            elementsCollector._sendElementToServer(anchor,'wewewew');

            const args1 = dataQueueStub.addToQueue.firstCall.args[1];
            const args2 = dataQueueStub.addToQueue.secondCall.args[1];

            //first call assertion
            assert.equal(args1[3],expectedDataQueue.password, 'expected to the 3 masked value');
            assert.equal(args1[4],expectedDataQueue.password, 'expected to the password masked value');
            assert.equal(args1[18],expectedDataQueue.password, 'expected to the password masked value');

            //second call assertion
            assert.equal(args2[3],expectedDataQueue.username, 'expected to the username masked value');
            assert.equal(args2[4],expectedDataQueue.username, 'expected to the username masked value');
            assert.equal(args2[18],expectedDataQueue.username, 'expected to the username masked value');

        });
    });

    describe('getElementData and getElementContextList', () => {
        it('should return element data from the weak map', () => {
            const elem = document.createElement('div');
            const result = elementsCollector.getElementData(elem);

            assert.isTrue(mockWeakMap.get.calledOnceWith(elem), 'Expected get to be called with the element');
            assert.deepEqual(result, { hash: '1234', contextList: ['testContext'] }, 'Expected element data to match mock data');
        });

        it('should return contextList from the element data', () => {
            const elem = document.createElement('div');
            const result = elementsCollector.getElementContextList(elem);

            assert.isTrue(mockWeakMap.get.calledOnceWith(elem), 'Expected get to be called with the element');
            assert.deepEqual(result, ['testContext'], 'Expected contextList to match mock data');
        });
    });

    // Add tests for other methods as needed
    afterEach(() => {
        sinon.restore();
    });
});
