import { assert } from 'chai';
import MessageBus from '../../../../../src/main/technicalServices/MessageBus';
import CrossMuidCollector,
{
    CrossmuidEventType,
    CSP_REGEX,
    EventStructure as CrossDomainEventStructure,
} from '../../../../../src/main/collectors/identity/CrossDomainMuidCollector';
import { dataQueue } from '../../../mocks/mockObjects';
import CDUtils from '../../../../../src/main/technicalServices/CDUtils';
import ConfigurationRepository from '../../../../../src/main/core/configuration/ConfigurationRepository';
import { TestUtils } from '../../../../TestUtils';
import DOMUtils from '../../../../../src/main/technicalServices/DOMUtils';
import TestFeatureSupport from '../../../../TestFeatureSupport';
import WindowMessageEventEmitter from '../../../../../src/main/services/WindowMessageEventEmitter';
import { ConfigurationFields } from '../../../../../src/main/core/configuration/ConfigurationFields';
import BrowserContext from '../../../../../src/main/core/browsercontexts/BrowserContext';
import { SystemFrameName } from '../../../../../src/main/core/frames/SystemFrameName';

describe.skip('Deprecated CrossDomainMuidCollector Tests:', function () {
    const domainsList = [
        'https://rnd-bcdn.s3.amazonaws.com/clientDev/crossdomain/index.html',
    ];

    const updatedDomainsList = [
        'https://crossdomain1.com/index.html', 'https://crossdomain2.com/index.html'
    ];

    function getDomainIFrame() {
        // Now get the iframes currently on the DOM and see if any of them still exists after stop
        const _iframes = document.getElementsByTagName('iframe');
        let foundFrame = null;
        if (_iframes.length > 0) {
            [].slice.call(_iframes).forEach((frame) => {
                if (frame.src === domainsList[0]) {
                    foundFrame = frame;
                    return false;
                }
            });
        }

        return foundFrame;
    }

    beforeEach(function () {
        if (!TestFeatureSupport.isMutationObserverSupported()) {
            this.skip();
            return;
        }

        this.sandbox = sinon.createSandbox();

        this._messageBusStub = this.sandbox.stub(new MessageBus());

        this._browserContext = new BrowserContext(self);

        this.configurationRepositoryStub = this.sandbox.stub(new ConfigurationRepository());

        this._crossDomainBuilder = new CrossMuidCollector.Builder(
            this.configurationRepositoryStub,
            dataQueue,
            CDUtils,
            DOMUtils,
            CrossDomainEventStructure,
            CrossmuidEventType,
        );

        this._crossDomainBuilder.withMessageBus(this._messageBusStub);
        this._crossDomainBuilder.withWindowMessageEventEmitter(sinon.createStubInstance(WindowMessageEventEmitter));
        this._crossDomain = this._crossDomainBuilder.build();
    });

    afterEach(function () {
        this.sandbox.restore();
    });

    describe('startFeature', function () {
        it('start feature with invalid frame uses the window', function () {
            this.configurationRepositoryStub.get.withArgs(ConfigurationFields.isCrossDomain).returns(true);
            this.configurationRepositoryStub.get.withArgs(ConfigurationFields.crossDomainsList).returns(domainsList);
            this.configurationRepositoryStub.get.withArgs('crossDomainsTimeout').returns(5000);

            const expectedContext = new BrowserContext(null);

            this._crossDomain.startFeature(expectedContext);

            assert.isTrue(this._crossDomain._windowMessageEmitter.startObserver.called, 'windowMessageEmitter startObserver was not called upon startFeature');
            assert.equal(this._crossDomain._windowMessageEmitter.startObserver.firstCall.args[0], expectedContext);
        });

        it('start feature with invalid domains array aborts', function () {
            this.configurationRepositoryStub.get.withArgs(ConfigurationFields.isCrossDomain).returns(true);
            this.configurationRepositoryStub.get.withArgs(ConfigurationFields.crossDomainsList).returns('bad List');
            this.configurationRepositoryStub.get.withArgs(ConfigurationFields.crossDomainsTimeout).returns(5000);

            this._crossDomain.startFeature(this._browserContext);

            assert.isTrue(this._crossDomain._windowMessageEmitter.startObserver.notCalled);
        });

        it('start feature with an empty domains list aborts', function () {
            this.configurationRepositoryStub.get.withArgs(ConfigurationFields.isCrossDomain).returns(true);
            this.configurationRepositoryStub.get.withArgs(ConfigurationFields.crossDomainsList).returns([]);
            this.configurationRepositoryStub.get.withArgs(ConfigurationFields.crossDomainsTimeout).returns(5000);

            this._crossDomain.startFeature(this._browserContext);

            assert.isTrue(this._crossDomain._windowMessageEmitter.startObserver.notCalled);
        });
    });

    describe('stopFeature', function () {
        it('stop feature', function () {
            this._crossDomain.stopFeature(this._browserContext);

            assert.isTrue(this._crossDomain._windowMessageEmitter.stopObserver.calledOnce);
            assert.equal(this._crossDomain._windowMessageEmitter.stopObserver.firstCall.args[0], this._browserContext);
        });

        it('stop feature with invalid frame uses the window', function () {
            const expectedContext = new BrowserContext(null);

            this._crossDomain.stopFeature(expectedContext);

            assert.isTrue(this._crossDomain._windowMessageEmitter.stopObserver.calledOnce);
            assert.equal(this._crossDomain._windowMessageEmitter.stopObserver.firstCall.args[0], expectedContext);
        });
    });

    it('Should create a new instance of CrossDomain Data Collector', function () {
        this.configurationRepositoryStub.get.withArgs(ConfigurationFields.isCrossDomain).returns(true);
        assert.isObject(this._crossDomain, 'Could not construct a new ElementEvents Data Collector');
    });

    it('Should test if WindowMessageEventEmitter startObserver is called', function () {
        this.configurationRepositoryStub.get.withArgs(ConfigurationFields.isCrossDomain).returns(true);
        this.configurationRepositoryStub.get.withArgs(ConfigurationFields.crossDomainsList).returns(domainsList);
        this.configurationRepositoryStub.get.withArgs(ConfigurationFields.crossDomainsTimeout).returns(5000);
        this._crossDomain.startFeature(this._browserContext);
        assert.isTrue(this._crossDomain._windowMessageEmitter.startObserver.called, 'windowMessageEmitter startObserver was not called upon startFeature');
        this._crossDomain.stopFeature(this._browserContext);
    });

    it('Should test if WindowMessageEventEmitter stopObserver is called', function () {
        this.configurationRepositoryStub.get.withArgs(ConfigurationFields.isCrossDomain).returns(true);
        this.configurationRepositoryStub.get.withArgs(ConfigurationFields.crossDomainsList).returns(domainsList);
        this.configurationRepositoryStub.get.withArgs(ConfigurationFields.crossDomainsTimeout).returns(5000);
        this._crossDomain.startFeature(this._browserContext);
        this._crossDomain.stopFeature(this._browserContext);
        assert.isTrue(this._crossDomain._windowMessageEmitter.stopObserver.called, 'windowMessageEmitter stopObserver was not called upon stopFeature');
    });

    it('Should test if domainStates object is instantiated correctly', function () {
        this.configurationRepositoryStub.get.withArgs(ConfigurationFields.isCrossDomain).returns(true);
        this.configurationRepositoryStub.get.withArgs(ConfigurationFields.crossDomainsList).returns(domainsList);
        this.configurationRepositoryStub.get.withArgs(ConfigurationFields.crossDomainsTimeout).returns(5000);
        this._crossDomain.startFeature(this._browserContext);
        assert.isObject(this._crossDomain._domainsStates['https://rnd-bcdn.s3.amazonaws.com'],
            "this._crossDomain._domainsStates['https://rnd-bcdn.s3.amazonaws.com'] not an object");
        this._crossDomain.stopFeature(this._browserContext);
    });

    it('Should test if message operations are invoked after startFeature is called', async function () {
        // Flaky test so lets retry it
        this.retries(3);

        const connectDomainsSpy = sinon.spy(this._crossDomain, 'connectDomains');
        const isBlockedByCSPSpy = sinon.spy(this._crossDomain, 'isBlockedByCSP');
        const createIframeSpy = sinon.spy(this._crossDomain, 'createIframe');
        const postNextMessageSpy = sinon.spy(this._crossDomain, 'postNextMessage');

        this.configurationRepositoryStub.get.withArgs(ConfigurationFields.isCrossDomain).returns(true);
        this.configurationRepositoryStub.get.withArgs(ConfigurationFields.crossDomainsList).returns(domainsList);
        this.configurationRepositoryStub.get.withArgs(ConfigurationFields.crossDomainsTimeout).returns(20000);
        this._crossDomain.startFeature(this._browserContext);

        await TestUtils.waitForNoAssertion(() => {
            assert.isTrue(connectDomainsSpy.called, 'this._crossDomain.connectDomainsSpy should be called');
            assert.isTrue(isBlockedByCSPSpy.called, 'this._crossDomain.isBlockedByCSPSpy should be called');
            assert.isTrue(createIframeSpy.called, 'this._crossDomain.createIframeSpy should be called');
            assert.isTrue(postNextMessageSpy.called, 'this._crossDomain.postNextMessageSpy should be called');

            this._crossDomain.stopFeature(this._browserContext);
        });
    });

    it('Should test if usage of CSP rules is detected and domain is allowed', function () {
        const cspDummyString = 'frame-src https://rnd-bcdn.s3.amazonaws.com https://localhost:8000 http://localhost:9876;';

        const cspMatch = cspDummyString.match(CSP_REGEX);
        assert.isArray(cspMatch, 'CSP_REGEX should match content security policy tag with frame/child src usage');
        assert.isString(cspMatch[0], 'Should find frame-src or child-src tags in content security policy string using regex');
    });

    it('Should generate random ID using crossDomain.generateRandomID static method', function () {
        const randomId = CrossMuidCollector.generateRandomID();
        assert.isString(randomId, 'CrossDomain.generateRandomID() should return a string');
        assert.lengthOf(randomId, 16, 'CrossDomain.generateRandomID() should produce a 16 length string');
    });

    it('Should find an iframe with the provided cross domain origin', async function () {
        this.configurationRepositoryStub.get.withArgs(ConfigurationFields.isCrossDomain).returns(true);
        this.configurationRepositoryStub.get.withArgs(ConfigurationFields.crossDomainsList).returns(domainsList);
        this.configurationRepositoryStub.get.withArgs(ConfigurationFields.crossDomainsTimeout).returns(5000);
        this._crossDomain.startFeature(this._browserContext);

        await TestUtils.waitForNoAssertion(() => {
            const domainIFrame = getDomainIFrame();
            assert.exists(domainIFrame, 'Could not find iframe with the cross domain source');
        }).finally(() => {
            this._crossDomain.stopFeature(this._browserContext);
        });
    });

    it('Should find an iframe with a predefined prefix id', async function () {
        this.configurationRepositoryStub.get.withArgs(ConfigurationFields.isCrossDomain).returns(true);
        this.configurationRepositoryStub.get.withArgs(ConfigurationFields.crossDomainsList).returns(domainsList);
        this.configurationRepositoryStub.get.withArgs(ConfigurationFields.crossDomainsTimeout).returns(5000);
        this._crossDomain.startFeature(this._browserContext);

        await TestUtils.waitForNoAssertion(() => {
            const domainIFrame = getDomainIFrame();
            assert.isTrue(domainIFrame.id.includes(SystemFrameName.ignorePrefixFrame), 'Could not find iframe with the cross domain source');
        }).finally(() => {
            this._crossDomain.stopFeature(this._browserContext);
        });
    });

    it('Should not find the cross domain iframe followed a stopFeature call', async function () {
        this.configurationRepositoryStub.get.withArgs(ConfigurationFields.isCrossDomain).returns(true);
        this.configurationRepositoryStub.get.withArgs(ConfigurationFields.crossDomainsList).returns(domainsList);
        this.configurationRepositoryStub.get.withArgs(ConfigurationFields.crossDomainsTimeout).returns(5000);
        this._crossDomain.startFeature(this._browserContext);

        // Lets first find the iframe so we can later verify it was removed.
        await TestUtils.waitForNoAssertion(() => {
            const domainIFrame = getDomainIFrame();

            assert.exists(domainIFrame, 'Could not find iframe with the cross domain source');
        });

        // Now stop the feature to remove the iframes
        this._crossDomain.stopFeature(this._browserContext);

        const domainIFrame = getDomainIFrame();

        assert.notExists(domainIFrame, 'Cross domain iframe should be removed upon calling stopFeature');
    });

    it('Should clear the domains state upon stopFeature call', async function () {
        const clearFeaturesObjectsSpy = sinon.spy(this._crossDomain, '_clearFeaturesObjects');
        const clearIntervalSpy = sinon.spy(this._crossDomain, 'clearDomElements');
        this.configurationRepositoryStub.get.withArgs(ConfigurationFields.isCrossDomain).returns(true);
        this.configurationRepositoryStub.get.withArgs(ConfigurationFields.crossDomainsList).returns(domainsList);
        this.configurationRepositoryStub.get.withArgs(ConfigurationFields.crossDomainsTimeout).returns(5000);
        this._crossDomain.startFeature(this._browserContext);

        // Wait until document is ready and only then stop the feature. So we can make sure the iframes were added
        await DOMUtils.waitUntilDocumentIsReady(window);

        this._crossDomain.stopFeature(this._browserContext);
        await TestUtils.wait(1000);
        await TestUtils.waitForNoAssertion(() => {
            assert.isTrue(clearFeaturesObjectsSpy.called, 'this._crossDomain._clearFeaturesObjects should be called');
            assert.isTrue(clearIntervalSpy.called, 'this._crossDomain.clearIntervalSpy should be called');
            assert.lengthOf(this._crossDomain._domains, 0, 'this._crossDomain.domains length should be zero after stopFeature call');
            assert.lengthOf(Object.keys(this._crossDomain._domainsStates), 0, 'this._crossDomain._domainsStates length should be zero after stopFeature call');
        });
    });

    it('Should test if sendToQueue adds to queue', async function () {
        this.configurationRepositoryStub.get.withArgs(ConfigurationFields.isCrossDomain).returns(true);
        this.configurationRepositoryStub.get.withArgs(ConfigurationFields.crossDomainsList).returns(domainsList);
        this.configurationRepositoryStub.get.withArgs(ConfigurationFields.crossDomainsTimeout).returns(5000);
        this._crossDomain.startFeature(this._browserContext);

        const message = {
            'message': {
                'data': {
                    'found': {
                        'muid': '1234567',
                    },
                },
                'origin': 'https://rnd-bcdn.s3.amazonaws.com',
            },
        };

        this._crossDomain.windowMessageHandler(message);

        await TestUtils.waitForNoAssertion(() => {
            assert.isTrue(dataQueue.requests.length > 0, 'dataQueue has zero requests');
        });
    });

    it('should update domainResources and crossDomainsTimeout state', function () {
        this.configurationRepositoryStub.get.withArgs(ConfigurationFields.isCrossDomain).returns(true);
        this.configurationRepositoryStub.get.withArgs(ConfigurationFields.crossDomainsList).returns(domainsList);
        this.configurationRepositoryStub.get.withArgs(ConfigurationFields.crossDomainsTimeout).returns(5000);
        const clearTimeoutSpy = sinon.spy(self, 'clearTimeout');
        const connectDomainsSpy = sinon.spy(this._crossDomain, 'connectDomains');

        this._crossDomain.startFeature(this._browserContext);

        this.configurationRepositoryStub.get.withArgs(ConfigurationFields.crossDomainsList).returns(updatedDomainsList);
        this.configurationRepositoryStub.get.withArgs(ConfigurationFields.crossDomainsTimeout).returns(10000);


        this._crossDomain.updateFeatureConfig(this._browserContext);

        assert.equal(this._crossDomain._domainsResources, updatedDomainsList, "_domainsResources has not be updated calling updateFeatureConfig");
        assert.equal(this._crossDomain._crossDomainsTimeout, 10000, "_crossDomainsTimeouts has not be updated calling updateFeatureConfig");
        assert.isTrue(clearTimeoutSpy.called, "window.clearTimeout should be called upon updateFeatureConfig");
        assert.equal(this._crossDomain._domains.length, 2, "this._crossDomain._domains.length should equal 2");
        assert.isObject(this._crossDomain._domainsStates['https://rnd-bcdn.s3.amazonaws.com'], "Expected this._crossDomain._domainsStates['https://rnd-bcdn.s3.amazonaws.com'] to be an object");
        assert.isObject(this._crossDomain._domainsStates['https://crossdomain1.com'], "Expected this._crossDomain._domainsStates['https://rnd-bcdn.s3.amazonaws.com'] to be an object");
        assert.isObject(this._crossDomain._domainsStates['https://crossdomain2.com'], "Expected this._crossDomain._domainsStates['https://rnd-bcdn.s3.amazonaws.com'] to be an object");
        assert.isTrue(connectDomainsSpy.calledTwice, "Expected connectDomainsSpy to be called twice");
    });
});
