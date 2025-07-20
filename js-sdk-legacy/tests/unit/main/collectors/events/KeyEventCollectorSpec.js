import { assert } from 'chai';
import ConfigurationRepository from '../../../../../src/main/core/configuration/ConfigurationRepository';
import KeyEventCollector, { KeyEventType } from '../../../../../src/main/collectors/events/KeyEventCollector';
import { ConfigurationFields } from '../../../../../src/main/core/configuration/ConfigurationFields';
import CDUtils from '../../../../../src/main/technicalServices/CDUtils';
import { EventStructure as KeyEventStructure } from '../../../../../src/main/collectors/events/KeyEventCollector';
import {
    dataQueue, MockObjects,
} from '../../../mocks/mockObjects';
import { MessageBusEventType } from '../../../../../src/main/events/MessageBusEventType';
import TestEvents from '../../../../TestEvents';
import TestBrowserUtils from '../../../../TestBrowserUtils';
import SupportedBrowserVersions from '../../../../SupportedBrowserVersions';
import MessageBus from '../../../../../src/main/technicalServices/MessageBus';
import ElementsCollector from '../../../../../src/main/collectors/events/ElementsCollector';
import SameCharService, { SameCharType } from '../../../../../src/main/services/SameCharService';
import BrowserContext from '../../../../../src/main/core/browsercontexts/BrowserContext';
import MaskingService from "../../../../../src/main/core/masking/MaskingService";
import sinon from "sinon";
import Log from "../../../../../src/main/technicalServices/log/Logger";
import StartupConfigurations from "../../../../../src/main/api/StartupConfigurations";

describe('KeyEventCollector tests:', function () {
    let keyEvents = null;
    let maskingServiceStub;

    beforeEach(function () {
        this.sandbox = sinon.createSandbox();

        this._browserContext = new BrowserContext(self);
        maskingServiceStub = {
            maskAbsoluteIfRequired: sinon.stub().returnsArg(0),
            maskText: sinon.stub().returns('maskingServiceStub.maskText.mock'),
            _shouldMask: sinon.stub().returnsArg(0)
        };


        const input = document.createElement('input');
        input.setAttribute('id', 'txt1');
        input.textContent = 'asdd';
        input.className = 'class-name-txt'; // set the CSS class
        document.body.appendChild(input); // put it into the DOM

        this.elementsStub = this.sandbox.createStubInstance(ElementsCollector);
        this.elementsStub.getElement.returns(32);
        this.elementsStub.getRealEventTarget.returns(input);
        this.elementsStub.isListed.returns(false);
        this.elementsStub._maskingService = maskingServiceStub;
        this.sameChar = new SameCharService();

        this.startupConfigurations = this.sandbox.createStubInstance(StartupConfigurations);
        this.startupConfigurations.getMaxShadowDepth.returns(5);

        this.messageBusStub = this.sandbox.createStubInstance(MessageBus);


        // Stub Log.error to prevent console output during tests
        this.sandbox.stub(Log, 'error');
    });

    afterEach(function () {
        if (keyEvents) {
            keyEvents.stopFeature(this._browserContext);
        }

        this.sandbox.restore();

        const input = document.getElementById('txt1');
        document.body.removeChild(input);
        dataQueue.requests = [];
    });

    describe('constructor tests:', function () {
        it('initialize KeyEvents events module', function () {
            const configurationRepository = sinon.stub(new ConfigurationRepository());
            const maskingService = new MaskingService(configurationRepository);
            keyEvents = new KeyEventCollector(
                configurationRepository,
                MockObjects.cdUtils,
                this.elementsStub,
                dataQueue,
                this.messageBusStub,
                this.sameChar,
                maskingService,
                this.startupConfigurations);
            keyEvents.startFeature(this._browserContext);
            assert.isTrue(typeof keyEvents !== 'undefined' && keyEvents != null);
            keyEvents.stopFeature(this._browserContext);
        });
    });

    describe('startFeature', function () {
        beforeEach(function () {
            const configurationRepository = sinon.stub(new ConfigurationRepository());
            const maskingService = new MaskingService(configurationRepository);
            this.keyEvents = new KeyEventCollector(
                configurationRepository,
                MockObjects.cdUtils,
                this.elementsStub,
                dataQueue,
                this.messageBusStub,
                this.sameChar,
                maskingService,
                this.startupConfigurations);
            // Mock browserContext object
            this.mockBrowserContext = {
                getDocument: this.sandbox.stub().returns(this.mockDocument)
            };
            // Stub internal methods
            this.bindStub = this.sandbox.stub(this.keyEvents, '_bind');
            this.unbindStub = this.sandbox.stub(this.keyEvents, '_unbind');

        });
        afterEach(function () {
            if (this.keyEvents) {
                this.keyEvents.stopFeature(this._browserContext);
            }
            this.keyEvents = null;
        });

        it('should log error if an exception occurs', function () {
            this.mockBrowserContext.getDocument.throws(new Error('Test error'));

            this.keyEvents.startFeature(this.mockBrowserContext);

            assert.isTrue(Log.error.calledOnce, 'Log.error should be called once');
            assert.isTrue(Log.error.calledWith('KeyEvents:startFeature failed, msg: Test error'), 'Log.error should be called with correct message');
        });
    });

    describe('stopFeature', function () {
        beforeEach(function () {
            const configurationRepository = sinon.stub(new ConfigurationRepository());
            const maskingService = new MaskingService(configurationRepository);
            this.keyEvents = new KeyEventCollector(
                configurationRepository,
                MockObjects.cdUtils,
                this.elementsStub,
                dataQueue,
                this.messageBusStub,
                this.sameChar,
                maskingService,
                this.startupConfigurations);
            // Mock browserContext object
            this.mockBrowserContext = {
                getDocument: this.sandbox.stub().returns(this.mockDocument)
            };
            // Stub internal methods
            this.bindStub = this.sandbox.stub(this.keyEvents, '_bind');
            this.unbindStub = this.sandbox.stub(this.keyEvents, '_unbind');
        });
        afterEach(function () {
            if (this.keyEvents) {
                this.keyEvents.stopFeature(this._browserContext);
            }
            this.keyEvents = null;
        });

        it('should call _unbind with correct arguments', function () {
            this.keyEvents.stopFeature(this.mockBrowserContext);

            assert.isTrue(this.unbindStub.calledOnce, '_unbind should be called once');
            assert.isTrue(this.unbindStub.calledWith(
                this.mockDocument
            ), '_unbind should be called with correct arguments');
        });

        it('should log error if an exception occurs', function () {
            this.mockBrowserContext.getDocument.throws(new Error('Test error'));

            this.keyEvents.stopFeature(this.mockBrowserContext);

            assert.isTrue(Log.error.calledOnce, 'Log.error should be called once');
            assert.isTrue(Log.error.calledWith('KeyEvents:stopFeature failed, msg: Test error'), 'Log.error should be called with correct message');
        });
    });

    describe('_bind and _unbind', function () {
        beforeEach(function () {
            this.sandbox = sinon.createSandbox();

            const configurationRepository = sinon.stub(new ConfigurationRepository());
            const maskingService = new MaskingService(configurationRepository);
            this.keyEvents = new KeyEventCollector(
                configurationRepository,
                MockObjects.cdUtils,
                this.elementsStub,
                dataQueue,
                this.messageBusStub,
                this.sameChar,
                maskingService,
                this.startupConfigurations);

            // Mock browserContext and document object
            this.mockDocument = {
                addEventListener: this.sandbox.spy(),
                removeEventListener: this.sandbox.spy()
            };

            this.mockBrowserContext = {
                getDocument: this.sandbox.stub().returns(this.mockDocument)
            };

            // Stub internal methods
            this.bindStub = this.sandbox.stub(this.keyEvents, '_bind');
            this.unbindStub = this.sandbox.stub(this.keyEvents, '_unbind');
        });

        afterEach(function () {
            this.sandbox.restore();
        });

        it('should call _bind with correct arguments', function () {
            this.keyEvents.startFeature(this.mockBrowserContext);

            assert.isTrue(this.bindStub.calledOnce, '_bind should be called once');
            assert.isTrue(this.bindStub.calledWith(
                this.mockDocument,
                this.keyEvents._onKeyEvent,
                this.keyEvents._useCaptureEvents
            ), '_bind should be called with correct arguments');
        });

        it('should log error if an exception occurs', function () {
            this.mockBrowserContext.getDocument.throws(new Error('Test error'));

            this.keyEvents.startFeature(this.mockBrowserContext);

            assert.isTrue(Log.error.calledOnce, 'Log.error should be called once');
            assert.isTrue(Log.error.calledWith('KeyEvents:startFeature failed, msg: Test error'), 'Log.error should be called with correct message');
        });
    });

    describe('key region and combo tests:', function () {
        beforeEach(function () {
            this.sandbox = sinon.createSandbox();

            const configurationRepository = this.sandbox.createStubInstance(ConfigurationRepository);
            configurationRepository.get.withArgs(ConfigurationFields.collectKeyRegionValue).returns(true);
            const maskingService = new MaskingService(configurationRepository);
            keyEvents = new KeyEventCollector(
                configurationRepository,
                MockObjects.cdUtils,
                this.elementsStub,
                dataQueue,
                this.messageBusStub,
                this.sameChar,
                maskingService,
                this.startupConfigurations);
            keyEvents.startFeature(this._browserContext);
        });

        afterEach(function () {
            this.sandbox.restore();
        });
        describe('_getKeyRegion tests:', function () {
            it('Region 0', function () {
                const expectedResult = '0';
                const code = 'Digit2';
                const result = keyEvents._getKeyRegion(code);
                assert.equal(result, expectedResult, 'not the right key region row');
            });
            it('Region 1', function () {
                const expectedResult = '1';
                const code = 'Digit5';
                const result = keyEvents._getKeyRegion(code);
                assert.equal(result, expectedResult, 'not the right region');
            });
            it('Region 2', function () {
                const expectedResult = '2';
                const code = 'Digit9';
                const result = keyEvents._getKeyRegion(code);
                assert.equal(result, expectedResult, 'not the right region');
            });
            it('Region 3', function () {
                const expectedResult = '3';
                const code = 'KeyQ';
                const result = keyEvents._getKeyRegion(code);
                assert.equal(result, expectedResult, 'not the right region');
            });
            it('Region 4', function () {
                const expectedResult = '4';
                const code = 'KeyF';
                const result = keyEvents._getKeyRegion(code);
                assert.equal(result, expectedResult, 'not the right region');
            });
            it('Region 5', function () {
                const expectedResult = '5';
                const code = 'KeyJ';
                const result = keyEvents._getKeyRegion(code);
                assert.equal(result, expectedResult, 'not the right region');
            });
            it('Region 6', function () {
                const expectedResult = '6';
                const code = 'Period';
                const result = keyEvents._getKeyRegion(code);
                assert.equal(result, expectedResult, 'not the right region');
            });
            it('Region 7', function () {
                const expectedResult = '7';
                const code = 'BracketRight';
                const result = keyEvents._getKeyRegion(code);
                assert.equal(result, expectedResult, 'not the right region');
            });
            it('Region 8', function () {
                const expectedResult = '8';
                const code = 'Numpad1';
                const result = keyEvents._getKeyRegion(code);
                assert.equal(result, expectedResult, 'not the right region');
            });

            it('Default value is returned when key region is unidentified', function () {
                const result = keyEvents._getKeyRegion('');
                assert.equal(result, '-1', 'did not handle undefined');
            });
        });

        it('keyCombo tests', function () {
            it('ctrl/meta c masked', function () {
                const keyCode = {key: 'c', metaKey: true};
                const result = keyEvents._getComboType(keyCode, keyCode.key);
                assert.equal(result, '0', 'not the right comboKey');
            });

            it('ctrl/meta v masked', function () {
                const keyCode = {key: 'v', metaKey: true};
                const result = keyEvents._getComboType(keyCode, keyCode.key);
                assert.equal(result, '1', 'not the right comboKey');
            });

            it('ctrl/meta a masked', function () {
                const keyCode = {key: 'a', metaKey: true};
                const result = keyEvents._getComboType(keyCode, keyCode.key);
                assert.equal(result, '2', 'not the right comboKey');
            });

            it('ctrl/meta x masked', function () {
                const keyCode = {key: 'x', metaKey: true};
                const result = keyEvents._getComboType(keyCode, keyCode.key);
                assert.equal(result, '3', 'not the right comboKey');
            });

            it('ctrl/meta z masked', function () {
                const keyCode = {key: 'z', ctrlKey: true};
                const result = keyEvents._getComboType(keyCode, keyCode.key);
                assert.equal(result, '4', 'not the right comboKey');
            });

            it('ctrl/meta p ', function () {
                const keyCode = {key: 'p', ctrlKey: true};
                const result = keyEvents._getComboType(keyCode, keyCode.key);
                assert.equal(result, '5', 'not the right comboKey');
            });

            it('ctrl/meta s ', function () {
                const keyCode = {key: 's', ctrlKey: true};
                const result = keyEvents._getComboType(keyCode, keyCode.key);
                assert.equal(result, '6', 'not the right comboKey');
            });

            it('ctrl/meta s is not combo', function () {
                const keyCode = {key: 's', metaKey: false};
                const result = keyEvents._getComboType(keyCode, keyCode.key);
                assert.equal(result, '-1', 'not the right comboKey');
            });

            it('ctrl/meta s is not combo with no meta/ctrl', function () {
                const keyCode = {key: 'p', ctrlKey: false, metaKey: false};
                const result = keyEvents._getComboType(keyCode, keyCode.key);
                assert.equal(result, '-1', 'not the right comboKey');
            });

            it('ctrl/meta q is not combo', function () {
                const keyCode = {key: 'q', ctrlKey: true, metaKey: true};
                const result = keyEvents._getComboType(keyCode, keyCode.key);
                assert.equal(result, '-1', 'not the right comboKey');
            });

            it('ctrl/meta space is not combo', function () {
                const keyCode = {key: ' ', ctrlKey: true, metaKey: true};
                const result = keyEvents._getComboType(keyCode, keyCode.key);
                assert.equal(result, '-1', 'not the right comboKey');
            });
        });
    });

    if (!TestBrowserUtils.isFirefox(window.navigator.userAgent, SupportedBrowserVersions.FirefoxOldestSupportedVersion)) {
        describe('Should create element and execute events:', function () {
            it('should call onKeyEvents for keydown', function () {
                const configurationRepository = sinon.stub(new ConfigurationRepository());
                configurationRepository.get.withArgs(ConfigurationFields.collectKeyRegionValue).returns(true);
                const maskingService = new MaskingService(configurationRepository);
                keyEvents = new KeyEventCollector(
                    configurationRepository,
                    CDUtils,
                    this.elementsStub,
                    dataQueue,
                    this.messageBusStub,
                    this.sameChar,
                    maskingService,
                    this.startupConfigurations);
                keyEvents.startFeature(this._browserContext);

                const publishedEvent = TestEvents.publishKeyboardEvent('keydown', 'q', 'q', 81, '0', false, false, true, 'KeyQ');

                // Todo add event tests
                assert.isTrue(dataQueue.requests.length > 0, 'did key event work?');
                assert.equal(dataQueue.requests[0].length, KeyEventStructure.length + 1, 'is key event data ok?');
                assert.equal(dataQueue.requests[0][KeyEventStructure.indexOf('eventType') + 1], KeyEventType.keydown);
                const ts = CDUtils.cutDecimalPointDigits(publishedEvent.timeStamp, 3);
                assert.equal(dataQueue.requests[0][KeyEventStructure.indexOf('relativeTime') + 1], ts, 'wrong relative time');

                // Mobile Safari value is invalid so we don't test it
                if (!TestBrowserUtils.isMobileSafari(window.navigator.userAgent)
                    && !TestBrowserUtils.isEdge(window.navigator.userAgent)
                    && !TestBrowserUtils.isChrome(navigator.userAgent, 49)
                    && !TestBrowserUtils.isChrome(window.navigator.userAgent, SupportedBrowserVersions.ChromeOldestSupportedVersion)
                    && !TestBrowserUtils.isSafari(window.navigator.userAgent, SupportedBrowserVersions.SafariOldestSupportedVersion)) {
                    assert.equal(dataQueue.requests[0][KeyEventStructure.indexOf('keyRegion') + 1], '3', 'invalid key region');
                    assert.equal(dataQueue.requests[0][KeyEventStructure.indexOf('code') + 1], 'Key', 'wrong code');
                    assert.equal(dataQueue.requests[0][KeyEventStructure.indexOf('key') + 1], 'A', 'wrong code');
                }
            });

            it('should call onKeyEvents for keypress', function () {
                const configurationRepository = sinon.stub(new ConfigurationRepository());
                configurationRepository.get.withArgs(ConfigurationFields.collectKeyRegionValue).returns(true);
                const maskingService = new MaskingService(configurationRepository);
                keyEvents = new KeyEventCollector(
                    configurationRepository,
                    CDUtils,
                    this.elementsStub,
                    dataQueue,
                    this.messageBusStub,
                    this.sameChar,
                    maskingService,
                    this.startupConfigurations);
                keyEvents.startFeature(this._browserContext);

                const publishedEvent = TestEvents.publishKeyboardEvent('keypress', 'z', 'z', 122, '1', false, true, false, 'KeyZ');

                // Todo add event tests
                assert.isTrue(dataQueue.requests.length > 0, 'did key event work?');
                assert.equal(dataQueue.requests[0][KeyEventStructure.indexOf('eventType') + 1], KeyEventType.keypress);
                const ts = CDUtils.cutDecimalPointDigits(publishedEvent.timeStamp, 3);
                assert.equal(dataQueue.requests[0][KeyEventStructure.indexOf('relativeTime') + 1], ts, 'wrong relative time');

                // Mobile Safari value is invalid so we don't test it
                if (!TestBrowserUtils.isMobileSafari(window.navigator.userAgent)
                    && !TestBrowserUtils.isEdge(window.navigator.userAgent)
                    && !TestBrowserUtils.isChrome(navigator.userAgent, 49)
                    && !TestBrowserUtils.isChrome(window.navigator.userAgent, SupportedBrowserVersions.ChromeOldestSupportedVersion)
                    && !TestBrowserUtils.isSafari(window.navigator.userAgent, SupportedBrowserVersions.SafariOldestSupportedVersion)) {
                    assert.equal(dataQueue.requests[0][KeyEventStructure.indexOf('keyRegion') + 1], '3', 'invalid key region');
                }
            });

            it('should call onKeyEvents for keyup', function () {
                const configurationRepository = sinon.stub(new ConfigurationRepository());
                const maskingService = new MaskingService(configurationRepository);
                configurationRepository.get.withArgs(ConfigurationFields.collectKeyRegionValue).returns(true);

                keyEvents = new KeyEventCollector(
                    configurationRepository,
                    CDUtils,
                    this.elementsStub,
                    dataQueue,
                    this.messageBusStub,
                    this.sameChar,
                    maskingService,
                    this.startupConfigurations);
                keyEvents.startFeature(this._browserContext);

                const publishedEvent = TestEvents.publishKeyboardEvent('keyup', '4', '4', 52, '3', true, false, false, 'Numpad4');

                // Todo add event tests
                assert.isTrue(dataQueue.requests.length > 0, 'did key event work?');
                assert.equal(dataQueue.requests[0].length, KeyEventStructure.length + 1, 'is key event data ok?');
                assert.equal(dataQueue.requests[0][KeyEventStructure.indexOf('eventType') + 1], KeyEventType.keyup);
                const ts = CDUtils.cutDecimalPointDigits(publishedEvent.timeStamp, 3);
                assert.equal(dataQueue.requests[0][KeyEventStructure.indexOf('relativeTime') + 1], ts, 'wrong relative time');

                // Mobile Safari value is invalid so we don't test it
                if (!TestBrowserUtils.isMobileSafari(window.navigator.userAgent)
                    && !TestBrowserUtils.isEdge(window.navigator.userAgent)
                    && !TestBrowserUtils.isChrome(navigator.userAgent, 49)
                    && !TestBrowserUtils.isChrome(window.navigator.userAgent, SupportedBrowserVersions.ChromeOldestSupportedVersion)
                    && !TestBrowserUtils.isSafari(window.navigator.userAgent, SupportedBrowserVersions.SafariOldestSupportedVersion)) {
                    assert.equal(dataQueue.requests[0][KeyEventStructure.indexOf('keyRegion') + 1], '8', 'invalid key region');
                    assert.equal(dataQueue.requests[0][KeyEventStructure.indexOf('key') + 1], '1', 'key should be 1');
                    assert.equal(dataQueue.requests[0][KeyEventStructure.indexOf('code') + 1], 'Numpad', '');
                }
            });

            it('should call msgBus onKeyEvents for keyup, keydown', function () {
                const configurationRepository = sinon.stub(new ConfigurationRepository());
                const maskingService = new MaskingService(configurationRepository);
                const msgBus = this.sandbox.createStubInstance(MessageBus);

                keyEvents = new KeyEventCollector(
                    configurationRepository,
                    CDUtils,
                    this.elementsStub,
                    dataQueue,
                    msgBus,
                    this.sameChar,
                    maskingService,
                    this.startupConfigurations);
                keyEvents.startFeature(this._browserContext);

                TestEvents.publishKeyboardEvent('keydown', 'Q', 'q', 81, '0', false, false, true, 'KeyQ');

                TestEvents.publishKeyboardEvent('keypress', 'z', 'z', null, '1', false, true, false, 'KeyZ');

                TestEvents.publishKeyboardEvent('keyup', '4', '4', 81, '3', true, false, false, 'Numpad4');

                TestEvents.publishKeyboardEvent('keypress', "'", "'", 222, '', true, false, false, 'Quote');

                // Todo add event tests
                const calls = msgBus.publish.getCalls();
                assert.isTrue(msgBus.publish.calledTwice, 'msgBus was not called twice');
                assert.equal(calls[0].args[0], MessageBusEventType.KeyEvent, 'not key event type');
                assert.equal(calls[0].args[1].action, KeyEventType.keydown, 'not keydown type');
                assert.equal(calls[1].args[0], MessageBusEventType.KeyEvent, 'not keydown type');
                assert.equal(calls[1].args[1].action, KeyEventType.keyup, 'not keydown type');
            });
        });
    }

    if (!TestBrowserUtils.isSafari(window.navigator.userAgent, SupportedBrowserVersions.SafariOldestSupportedVersion)) {
        describe('same char tests:', function () {
            it('chars saved in sameChar class and return true', function () {
                const configurationRepository = new ConfigurationRepository();
                const maskingService = new MaskingService(configurationRepository);
                keyEvents = new KeyEventCollector(
                    configurationRepository,
                    CDUtils,
                    this.elementsStub,
                    dataQueue,
                    this.messageBusStub,
                    this.sameChar,
                    maskingService,
                    this.startupConfigurations);
                keyEvents.startFeature(this._browserContext);

                TestEvents.publishKeyboardEvent('keydown', 'q', 'q', 81, '0', false, false, true, 'KeyQ');

                TestEvents.publishKeyboardEvent('keypress', 'z', 'z', 81, '0', false, false, true, 'KeyZ');

                TestEvents.publishKeyboardEvent('keyup', 'z', 'z', 81, '0', false, false, true, 'KeyZ');

                TestEvents.publishKeyboardEvent('keydown', 'z', 'z', 81, '0', false, false, true, 'KeyZ');

                TestEvents.publishKeyboardEvent('keypress', 'z', 'z', 81, '0', false, false, true, 'KeyZ');

                TestEvents.publishKeyboardEvent('keyup', 'z', 'z', 81, '0', false, false, true, 'KeyZ');

                assert.equal(dataQueue.requests[0][19], SameCharType.undefined, 'should be undefined no record before this one.');
                assert.equal(dataQueue.requests[1][19], SameCharType.false, 'should be false after first detection');
                assert.equal(dataQueue.requests[2][19], SameCharType.undefined, 'should be undefined => type!=keypress');
                assert.equal(dataQueue.requests[3][19], SameCharType.undefined, 'should be undefined => type!=keypress');
                assert.equal(dataQueue.requests[4][19], SameCharType.true, 'should be true => z==z');
                assert.equal(dataQueue.requests[5][19], SameCharType.undefined, 'should be undefined => type!=keypress');
            });

            it('chars saved in sameChar class and return false', function () {
                const configurationRepository = new ConfigurationRepository();
                const maskingService = new MaskingService(configurationRepository);
                keyEvents = new KeyEventCollector(
                    configurationRepository,
                    CDUtils,
                    this.elementsStub,
                    dataQueue,
                    this.messageBusStub,
                    this.sameChar,
                    maskingService,
                    this.startupConfigurations);
                keyEvents.startFeature(this._browserContext);

                TestEvents.publishKeyboardEvent('keydown', 'z', 'z', 81, '0', false, false, true, 'KeyZ');

                TestEvents.publishKeyboardEvent('keypress', 'z', 'z', 81, '0', false, false, true, 'KeyZ');

                TestEvents.publishKeyboardEvent('keyup', 'z', 'z', 81, '0', false, false, true, 'KeyZ');

                TestEvents.publishKeyboardEvent('keydown', 'z', 'z', 81, '0', false, false, true, 'KeyZ');

                TestEvents.publishKeyboardEvent('keypress', 'a', 'a', 81, '0', false, false, true, 'KeyA');

                TestEvents.publishKeyboardEvent('keyup', 'z', 'z', 81, '0', false, false, true, 'KeyZ');

                assert.equal(dataQueue.requests[0][19], SameCharType.undefined, 'should be undefined no record before this one.');
                assert.equal(dataQueue.requests[1][19], SameCharType.false, 'should be false after first detection');
                assert.equal(dataQueue.requests[2][19], SameCharType.undefined, 'should be undefined => type!=keypress');
                assert.equal(dataQueue.requests[3][19], SameCharType.undefined, 'should be undefined => type!=keypress');
                assert.equal(dataQueue.requests[4][19], SameCharType.false, 'should be false => z!=a');
                assert.equal(dataQueue.requests[5][19], SameCharType.undefined, 'should be undefined => type!=keypress');
            });

            it('digits saved in sameChar class and return true', function () {
                const configurationRepository = new ConfigurationRepository();
                const maskingService = new MaskingService(configurationRepository);
                keyEvents = new KeyEventCollector(
                    configurationRepository,
                    CDUtils,
                    this.elementsStub,
                    dataQueue,
                    this.messageBusStub,
                    this.sameChar,
                    maskingService,
                    this.startupConfigurations);
                keyEvents.startFeature(this._browserContext);

                TestEvents.publishKeyboardEvent('keydown', '1', '1', 49, '0', false, false, true, 'Digit1');

                TestEvents.publishKeyboardEvent('keypress', '1', '1', 49, '0', false, false, true, 'Digit1');

                TestEvents.publishKeyboardEvent('keyup', '1', '1', 49, '0', false, false, true, 'Digit1');

                TestEvents.publishKeyboardEvent('keydown', '1', '1', 49, '0', false, false, true, 'Digit1');

                TestEvents.publishKeyboardEvent('keypress', '1', '1', 49, '0', false, false, true, 'Digit1');

                TestEvents.publishKeyboardEvent('keyup', '1', '1', 49, '0', false, false, true, 'Digit1');

                assert.equal(dataQueue.requests[0][19], SameCharType.undefined, 'should be undefined no record before this one.');
                assert.equal(dataQueue.requests[1][19], SameCharType.false, 'should be false after first detection');
                assert.equal(dataQueue.requests[2][19], SameCharType.undefined, 'should be undefined => type!=keypress');
                assert.equal(dataQueue.requests[3][19], SameCharType.undefined, 'should be undefined => type!=keypress');
                assert.equal(dataQueue.requests[4][19], SameCharType.true, 'should be true => 1==1');
                assert.equal(dataQueue.requests[5][19], SameCharType.undefined, 'should be undefined => type!=keypress');
            });

            it('digits saved in sameChar class and return false', function () {
                const configurationRepository = new ConfigurationRepository();
                const maskingService = new MaskingService(configurationRepository);
                keyEvents = new KeyEventCollector(
                    configurationRepository,
                    CDUtils,
                    this.elementsStub,
                    dataQueue,
                    this.messageBusStub,
                    this.sameChar,
                    maskingService,
                    this.startupConfigurations);
                keyEvents.startFeature(this._browserContext);

                TestEvents.publishKeyboardEvent('keydown', '1', '1', 49, '0', false, false, true, 'Digit1');

                TestEvents.publishKeyboardEvent('keypress', '1', '1', 49, '0', false, false, true, 'Digit1');

                TestEvents.publishKeyboardEvent('keyup', '1', '1', 49, '0', false, false, true, 'Digit1');

                TestEvents.publishKeyboardEvent('keydown', '2', '2', 49, '0', false, false, true, 'Digit2');

                TestEvents.publishKeyboardEvent('keypress', '2', '2', 49, '0', false, false, true, 'Digit2');

                TestEvents.publishKeyboardEvent('keyup', '2', '2', 49, '0', false, false, true, 'Digit2');

                assert.equal(dataQueue.requests[0][19], SameCharType.undefined, 'should be undefined no record before this one.');
                assert.equal(dataQueue.requests[1][19], SameCharType.false, 'should be false after first detection');
                assert.equal(dataQueue.requests[2][19], SameCharType.undefined, 'should be undefined => type!=keypress');
                assert.equal(dataQueue.requests[3][19], SameCharType.undefined, 'should be undefined => type!=keypress');
                assert.equal(dataQueue.requests[4][19], SameCharType.false, 'should be true => 1!=2');
                assert.equal(dataQueue.requests[5][19], SameCharType.undefined, 'should be undefined => type!=keypress');
            });

            it('numpad saved in sameChar class and return true', function () {
                const configurationRepository = new ConfigurationRepository();
                const maskingService = new MaskingService(configurationRepository);
                keyEvents = new KeyEventCollector(
                    configurationRepository,
                    CDUtils,
                    this.elementsStub,
                    dataQueue,
                    this.messageBusStub,
                    this.sameChar,
                    maskingService,
                    this.startupConfigurations);
                keyEvents.startFeature(this._browserContext);

                TestEvents.publishKeyboardEvent('keydown', '2', '2', 49, '0', false, false, true, 'Numpad2');

                TestEvents.publishKeyboardEvent('keypress', '1', '1', 49, '0', false, false, true, 'Numpad1');

                TestEvents.publishKeyboardEvent('keyup', '1', '1', 49, '0', false, false, true, 'Numpad1');

                TestEvents.publishKeyboardEvent('keydown', '1', '1', 49, '0', false, false, true, 'Numpad1');

                TestEvents.publishKeyboardEvent('keypress', '1', '1', 49, '0', false, false, true, 'Numpad1');

                TestEvents.publishKeyboardEvent('keyup', '1', '1', 49, '0', false, false, true, 'Numpad1');

                assert.equal(dataQueue.requests[0][19], SameCharType.undefined, 'should be undefined no record before this one.');
                assert.equal(dataQueue.requests[1][19], SameCharType.false, 'should be false after first detection');
                assert.equal(dataQueue.requests[2][19], SameCharType.undefined, 'should be undefined => type!=keypress');
                assert.equal(dataQueue.requests[3][19], SameCharType.undefined, 'should be undefined => type!=keypress');
                assert.equal(dataQueue.requests[4][19], SameCharType.true, 'should be true => 1==1');
                assert.equal(dataQueue.requests[5][19], SameCharType.undefined, 'should be undefined => type!=keypress');
            });

            it('numpad saved in sameChar class and return false', function () {
                const configurationRepository = new ConfigurationRepository();
                const maskingService = new MaskingService(configurationRepository);
                keyEvents = new KeyEventCollector(
                    configurationRepository,
                    CDUtils,
                    this.elementsStub,
                    dataQueue,
                    this.messageBusStub,
                    this.sameChar,
                    maskingService,
                    this.startupConfigurations);
                keyEvents.startFeature(this._browserContext);

                TestEvents.publishKeyboardEvent('keydown', '1', '1', 49, '0', false, false, true, 'Numpad1');

                TestEvents.publishKeyboardEvent('keypress', '1', '1', 49, '0', false, false, true, 'Numpad1');

                TestEvents.publishKeyboardEvent('keyup', '1', '1', 49, '0', false, false, true, 'Numpad1');

                TestEvents.publishKeyboardEvent('keydown', '2', '2', 49, '0', false, false, true, 'Numpad2');

                TestEvents.publishKeyboardEvent('keypress', '2', '2', 49, '0', false, false, true, 'Numpad2');

                TestEvents.publishKeyboardEvent('keyup', '2', '2', 49, '0', false, false, true, 'Numpad2');

                assert.equal(dataQueue.requests[0][19], SameCharType.undefined, 'should be undefined no record before this one.');
                assert.equal(dataQueue.requests[1][19], SameCharType.false, 'should be false after first detection');
                assert.equal(dataQueue.requests[2][19], SameCharType.undefined, 'should be undefined => type!=keypress');
                assert.equal(dataQueue.requests[3][19], SameCharType.undefined, 'should be undefined => type!=keypress');
                assert.equal(dataQueue.requests[4][19], SameCharType.false, 'should be true => 1==1');
                assert.equal(dataQueue.requests[5][19], SameCharType.undefined, 'should be undefined => type!=keypress');
            });
        });

        describe('Shadow DOM Event Handling Tests:', function () {
            beforeEach(function () {
                // Skip if Shadow DOM is not supported
                if (!('attachShadow' in Element.prototype)) {
                    this.skip();
                    return;
                }
            });

            afterEach(function () {
                // Clean up any shadow host elements
                const shadowHosts = document.querySelectorAll('.key-shadow-host-test');
                shadowHosts.forEach(host => {
                    if (host.parentNode) {
                        host.parentNode.removeChild(host);
                    }
                });
            });

            it('Should handle key events from elements inside shadow DOM using composedPath', function () {
                // Create a shadow host
                const shadowHost = document.createElement('div');
                shadowHost.className = 'key-shadow-host-test';
                document.body.appendChild(shadowHost);

                // Attach shadow root
                const shadowRoot = shadowHost.attachShadow({ mode: 'open' });

                // Create input element inside shadow root
                const shadowInput = document.createElement('input');
                shadowInput.setAttribute('id', 'shadow-key-input');
                shadowInput.type = 'text';
                shadowRoot.appendChild(shadowInput);

                // Stub getRealEventTarget to simulate composedPath behavior
                this.elementsStub.getRealEventTarget.returns(shadowInput);

                const configurationRepository = new ConfigurationRepository();
                const maskingService = new MaskingService(configurationRepository);
                keyEvents = new KeyEventCollector(
                    configurationRepository,
                    MockObjects.cdUtils,
                    this.elementsStub,
                    dataQueue,
                    this.messageBusStub,
                    this.sameChar,
                    maskingService,
                    this.startupConfigurations);
                keyEvents.startFeature(this._browserContext);
                dataQueue.resetHistory();

                // Create a mock key event with composedPath
                const mockEvent = {
                    type: 'keydown',
                    target: shadowHost, // The event target would be the shadow host
                    composedPath: () => [shadowInput, shadowRoot, shadowHost, document.body, document.documentElement, document],
                    key: 'a',
                    code: 'KeyA',
                    keyCode: 65,
                    ctrlKey: false,
                    shiftKey: false,
                    altKey: false,
                    metaKey: false,
                    location: 0,
                    repeat: false,
                    isTrusted: true,
                    timeStamp: Date.now()
                };

                // Verify that getRealEventTarget is called to get the real target from composedPath
                keyEvents._handleKeyEvent(mockEvent, 'key_events');

                assert.isTrue(this.elementsStub.getRealEventTarget.called, 'getRealEventTarget should be called to get real event target from shadow DOM');
                assert.isTrue(dataQueue.requests.length > 0, 'Key event should be recorded for shadow DOM input');
            });

            it('Should handle nested shadow DOM events with composedPath', function () {
                // Create main shadow host
                const shadowHost = document.createElement('div');
                shadowHost.className = 'key-shadow-host-test';
                document.body.appendChild(shadowHost);

                // Level 1 shadow root
                const shadowRoot1 = shadowHost.attachShadow({ mode: 'open' });
                
                // Level 2 shadow root
                const nestedHost = document.createElement('div');
                shadowRoot1.appendChild(nestedHost);
                const shadowRoot2 = nestedHost.attachShadow({ mode: 'open' });
                
                const deepInput = document.createElement('input');
                deepInput.setAttribute('id', 'deep-shadow-input');
                deepInput.type = 'text';
                shadowRoot2.appendChild(deepInput);

                // Stub to return the deep input element
                this.elementsStub.getRealEventTarget.returns(deepInput);
                this.elementsStub.getElement.returns(42); // Different hash for deep element

                const configurationRepository = new ConfigurationRepository();
                const maskingService = new MaskingService(configurationRepository);
                keyEvents = new KeyEventCollector(
                    configurationRepository,
                    CDUtils,
                    this.elementsStub,
                    dataQueue,
                    this.messageBusStub,
                    this.sameChar,
                    maskingService,
                    this.startupConfigurations);

                keyEvents.startFeature(this._browserContext);
                dataQueue.resetHistory();

                // Mock event with nested composedPath
                const mockEvent = {
                    type: 'keypress',
                    target: shadowHost,
                    composedPath: () => [deepInput, shadowRoot2, nestedHost, shadowRoot1, shadowHost, document.body, document.documentElement, document],
                    key: 'z',
                    code: 'KeyZ',
                    keyCode: 90,
                    ctrlKey: false,
                    shiftKey: false,
                    altKey: false,
                    metaKey: false,
                    location: 0,
                    repeat: false,
                    isTrusted: true,
                    timeStamp: Date.now()
                };

                keyEvents._handleKeyEvent(mockEvent, 'key_events');

                assert.isTrue(this.elementsStub.getRealEventTarget.called, 'getRealEventTarget should be called for nested shadow DOM');
                assert.isTrue(dataQueue.requests.length > 0, 'Key event should be recorded for nested shadow DOM input');
                
                // Verify the element hash is from the deep input
                const recordedEvent = dataQueue.requests[0];
                const elementEventTypeIndex = KeyEventStructure.indexOf('eventType') + 1;
                assert.equal(recordedEvent[elementEventTypeIndex], KeyEventType.keypress, 'Should record correct event type for deep shadow input');
            });

            it('Should fallback to event.target when composedPath is not available', function () {
                // Create a shadow host
                const shadowHost = document.createElement('div');
                shadowHost.className = 'key-shadow-host-test';
                document.body.appendChild(shadowHost);

                const shadowRoot = shadowHost.attachShadow({ mode: 'open' });
                const shadowInput = document.createElement('input');
                shadowInput.setAttribute('id', 'fallback-shadow-input');
                shadowRoot.appendChild(shadowInput);

                // Set up the stub to return the target when composedPath is not available
                this.elementsStub.getRealEventTarget.returns(shadowHost);

                const configurationRepository = new ConfigurationRepository();
                const maskingService = new MaskingService(configurationRepository);
                keyEvents = new KeyEventCollector(
                    configurationRepository,
                    CDUtils,
                    this.elementsStub,
                    dataQueue,
                    this.messageBusStub,
                    this.sameChar,
                    maskingService,
                    this.startupConfigurations);

                keyEvents.startFeature(this._browserContext);
                dataQueue.resetHistory();

                // Mock event without composedPath (older browser simulation)
                const mockEvent = {
                    type: 'keydown',
                    target: shadowHost,
                    // No composedPath method
                    key: 'b',
                    code: 'KeyB',
                    keyCode: 66,
                    ctrlKey: false,
                    shiftKey: false,
                    altKey: false,
                    metaKey: false,
                    location: 0,
                    repeat: false,
                    isTrusted: true,
                    timeStamp: Date.now()
                };

                keyEvents._handleKeyEvent(mockEvent, 'key_events');

                assert.isTrue(this.elementsStub.getRealEventTarget.called, 'getRealEventTarget should be called even without composedPath');
                assert.isTrue(dataQueue.requests.length > 0, 'Key event should be recorded even when composedPath is not available');
            });
        });
    }
});
