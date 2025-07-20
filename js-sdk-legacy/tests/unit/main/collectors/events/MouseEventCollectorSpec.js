import { assert } from 'chai';
import MouseEventCollector, { MouseEventType } from '../../../../../src/main/collectors/events/MouseEventCollector';
import { EventStructure as MouseEventStructure } from '../../../../../src/main/collectors/events/MouseEventCollector';
import CDUtils from '../../../../../src/main/technicalServices/CDUtils';
import { dataQueue, MockObjects } from '../../../mocks/mockObjects';
import DOMUtils from '../../../../../src/main/technicalServices/DOMUtils';
import TestEvents from '../../../../TestEvents';
import ElementsCollector from '../../../../../src/main/collectors/events/ElementsCollector';
import BrowserContext from '../../../../../src/main/core/browsercontexts/BrowserContext';
import sinon from "sinon";
import DataQ from "../../../../../src/main/technicalServices/DataQ";
import ConfigurationRepository from "../../../../../src/main/core/configuration/ConfigurationRepository";
import StartupConfigurations from "../../../../../src/main/api/StartupConfigurations";

describe('MouseEventCollector tests:', function () {
    let sandbox = null;
    let maskingServiceStub;

    beforeEach(function () {
        sandbox = sinon.createSandbox();
        maskingServiceStub = {
            maskAbsoluteIfRequired: sinon.stub().returnsArg(0),
            maskText: sinon.stub().returns('maskingServiceStub.maskText.mock'),
            _shouldMask: sinon.stub().returnsArg(0),
            shouldMaskCoordinates: sinon.stub().returns(false), // Default: masking disabled
        };

        this._browserContext = new BrowserContext(self);
        this.elementsStub = sinon.createStubInstance(ElementsCollector);
        this.elementsStub.getElement.returns(32);
        this.elementsStub.isListed.returns(false);
        this.elementsStub._maskingService = maskingServiceStub

        this.startupConfigurations = sandbox.createStubInstance(StartupConfigurations);

        const input = document.createElement('input');
        input.setAttribute('id', 'txt1');
        input.textContent = 'asdd';
        input.className = 'class-name-txt'; // set the CSS class
        document.body.appendChild(input); // put it into the DOM
    });

    afterEach(function () {
        sandbox.restore();
        const input = document.getElementById('txt1');
        document.body.removeChild(input);
        dataQueue.requests = [];
    });

    describe('constructor tests:', function () {
        it('initialize MouseEvents events module', function () {
            const mouseEvents = new MouseEventCollector(MockObjects.cdUtils, MockObjects.domUtils, this.elementsStub, dataQueue,maskingServiceStub, this.startupConfigurations);
            mouseEvents.startFeature(this._browserContext);
            assert.isTrue(typeof mouseEvents !== 'undefined' && mouseEvents != null);
            mouseEvents.stopFeature(this._browserContext);
        });
    });

    describe('Should create element and execute events:', function () {
        it('should call onMouseEvents for ', function () {
            const mouseEvents = new MouseEventCollector(CDUtils, DOMUtils, this.elementsStub, dataQueue,maskingServiceStub, this.startupConfigurations);
            mouseEvents.startFeature(this._browserContext);
            const input = document.getElementById('txt1');
            input.click();
            assert.isTrue(dataQueue.requests.length > 0, 'did mouse event work?');
            assert.equal(dataQueue.requests[0][MouseEventStructure.indexOf('eventType') + 1],
                MouseEventType.click, 'the event is not click');
            const isIE = !!document.documentMode;
            if (!isIE) {
                TestEvents.publishMouseEvent('mousemove', 0, 'q', 55, 0, 0, 0);
                TestEvents.publishMouseEvent('mousedown', 2, 'q', 55, 0, 0, 0);
                TestEvents.publishMouseEvent('wheel', 4, 'q', 55, 0, 0, 0);

                // Todo add event tests
                assert.isTrue(dataQueue.requests.length > 1, 'did mouse event work?');
                assert.equal(dataQueue.requests[1].length, MouseEventStructure.length + 1, 'is mouse event data ok?');
                assert.equal(dataQueue.requests[1][MouseEventStructure.indexOf('eventType') + 1],
                    MouseEventType.mousemove, 'event should be mousemove');
                assert.equal(dataQueue.requests[2][MouseEventStructure.indexOf('eventType') + 1],
                    MouseEventType.mousedown, 'event should be mousedown');
                assert.equal(dataQueue.requests[2][MouseEventStructure.indexOf('buttonNew') + 1],
                    2, 'event should be button number 2');
                assert.equal(dataQueue.requests[3][MouseEventStructure.indexOf('eventType') + 1],
                    MouseEventType.wheel, 'event should be wheel');
                assert.equal(dataQueue.requests[3][MouseEventStructure.indexOf('buttonNew') + 1],
                    4, 'event should be button number 4');
            }
            mouseEvents.stopFeature(this._browserContext);
        });

        it('stopFeature should remove listeners and stop reporting on mouse events', function () {
            const mouseEvents = new MouseEventCollector(CDUtils, DOMUtils, this.elementsStub, dataQueue,maskingServiceStub, this.startupConfigurations);
            mouseEvents.startFeature(this._browserContext);

            const input = document.getElementById('txt1');
            input.click();
            const isIE = !!document.documentMode;
            if (!isIE) {
                TestEvents.publishMouseEvent('mousemove', 0, 'q', 55, 0, 0, 0);
                TestEvents.publishMouseEvent('mousedown', 1, 'q', 55, 0, 0, 0);
                TestEvents.publishMouseEvent('wheel', 4, 'q', 55, 0, 0, 0);
            }

            assert.isTrue(dataQueue.requests.length > 0, 'Q is empty');
            dataQueue.requests = [];

            mouseEvents.stopFeature(this._browserContext);
            input.click();
            if (!isIE) {
                TestEvents.publishMouseEvent('mousemove', 0, 'q', 55, 0, 0, 0);
                TestEvents.publishMouseEvent('mousedown', 1, 'q', 55, 0, 0, 0);
                TestEvents.publishMouseEvent('wheel', 4, 'q', 55, 0, 0, 0);
            }

            assert.equal(0, dataQueue.requests.length, 'Q is not empty');
        });
    });
});
