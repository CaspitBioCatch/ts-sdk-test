import { assert } from 'chai';
import AdblockerListsCollector from '../../../../../../src/main/collectors/static/adblock/AdblockerListsCollector';
import { adblockSelectors } from '../../../../../../src/main/collectors/static/adblock/AdBlockSelectors';
import Log from '../../../../../../src/main/technicalServices/log/Logger';
import sinon from 'sinon';

describe('AdblockerListsCollector test:', function () {
    let collector;
    let sandbox;
    let mockIframe;
    let mockIframeDocument;
    let mockIframeBody;
    let mockIframeRoot;
    let mockElements;

    beforeEach(function () {
        // Create a sandbox for stubbing
        sandbox = sinon.createSandbox();
        
        // Create mock elements
        mockElements = [];
        for (let i = 0; i < 10; i++) {
            mockElements.push({
                offsetParent: i % 2 === 0 ? null : { id: 'parent' }
            });
        }
        
        // Create mock iframe document
        mockIframeBody = {
            appendChild: sandbox.stub()
        };
        
        mockIframeRoot = {
            appendChild: sandbox.stub()
        };
        
        mockIframeDocument = {
            createElement: sandbox.stub().callsFake((tagName) => {
                if (tagName === 'body') return mockIframeBody;
                if (tagName === 'div') return mockIframeRoot;
                return { appendChild: sandbox.stub() };
            }),
            documentElement: {
                appendChild: sandbox.stub()
            },
            body: mockIframeBody
        };
        
        // Create mock iframe
        mockIframe = {
            style: {},
            contentDocument: mockIframeDocument,
            contentWindow: {
                document: mockIframeDocument
            },
            parentNode: {
                removeChild: sandbox.stub()
            }
        };
        
        // Stub document methods
        sandbox.stub(document, 'createElement').callsFake((tagName) => {
            if (tagName === 'iframe') return mockIframe;
            return { appendChild: sandbox.stub() };
        });
        
        sandbox.stub(document.body, 'appendChild');
        
        // Create collector instance
        collector = new AdblockerListsCollector({ debug: true });
        
        // Mock setTimeout to execute immediately
        this.clock = sandbox.useFakeTimers();
    });
    
    afterEach(function () {
        // Restore sandbox (this will restore all stubs)
        sandbox.restore();
        
        // Restore real timers
        this.clock.restore();
    });
    
    describe('constructor', function () {
        it('should initialize with default options', function () {
            const defaultCollector = new AdblockerListsCollector({});
            assert.equal(defaultCollector.debug, false);
        });
        
        it('should initialize with custom options', function () {
            const customCollector = new AdblockerListsCollector({}, { debug: true });
            assert.equal(customCollector.debug, true);
        });
    });
    
    describe('startFeature', function () {
        it('should call detectActiveAdblockLists', function () {
            const spy = sandbox.spy(collector, 'detectActiveAdblockLists');
            collector.startFeature();
            assert.isTrue(spy.called);
        });
        
        it('should handle errors gracefully', function () {
            const errorSpy = sandbox.spy(Log, 'error');
            sandbox.stub(collector, 'detectActiveAdblockLists').throws(new Error('Test error'));
            
            collector.startFeature();
            assert.isTrue(errorSpy.calledWith('Error detecting ad blocker lists:', sinon.match.instanceOf(Error)));
        });
    });
    
    describe('stopFeature', function () {
        it('should not throw any errors', function () {
            assert.doesNotThrow(() => collector.stopFeature());
        });
    });
    
    describe('canRunDetection', function () {
        it('should always return true', function () {
            assert.isTrue(collector.canRunDetection());
        });
    });
    
    describe('detectActiveAdblockLists', function () {
        it('should return an array of active filter lists', async function () {
            // Mock getBlockedSelectors to return a set of blocked selectors
            const blockedSelectors = new Set();
            // Add some selectors from different lists to simulate blocking
            blockedSelectors.add(adblockSelectors.adGuardBase[0]);
            blockedSelectors.add(adblockSelectors.adGuardBase[1]);
            blockedSelectors.add(adblockSelectors.adGuardAnnoyances[0]);
            blockedSelectors.add(adblockSelectors.adGuardAnnoyances[1]);
            
            sandbox.stub(collector, 'getBlockedSelectors').resolves(blockedSelectors);
            
            const result = await collector.detectActiveAdblockLists();
            
            // Should include lists with at least 2 blocked selectors
            assert.include(result, 'adGuardBase');
            assert.include(result, 'adGuardAnnoyances');
            
            // Should not include lists with fewer than 2 blocked selectors
            assert.notInclude(result, 'adBlockFinland');
        });
        
        it('should handle errors gracefully', async function () {
            sandbox.stub(collector, 'getBlockedSelectors').rejects(new Error('Test error'));
            const errorSpy = sandbox.spy(Log, 'error');
            
            const result = await collector.detectActiveAdblockLists();
            
            assert.deepEqual(result, []);
            assert.isTrue(errorSpy.calledWith('Error in detectActiveAdblockLists:', sinon.match.instanceOf(Error)));
        });
    });
    
    describe('getBlockedSelectors', function () {
        it('should create an iframe and check for blocked selectors', async function () {
            // Mock the selectorToElement method to return elements with offsetParent
            sandbox.stub(collector, 'selectorToElement').returns({ offsetParent: null });
            
            // Create a promise that will resolve when the test is complete
            const testPromise = new Promise(resolve => {
                // Override the setTimeout to execute immediately
                sandbox.stub(global, 'setTimeout').callsFake(callback => {
                    callback();
                    resolve();
                    return 123; // Return a fake timer ID
                });
                
                // Start the test
                collector.getBlockedSelectors(['#test1', '#test2', '#test3'])
                    .then(result => {
                        // Check if iframe was created
                        assert.isTrue(document.createElement.calledWith('iframe'));
                        assert.isTrue(document.body.appendChild.calledWith(mockIframe));
                        
                        // Check if iframe was cleaned up
                        assert.isTrue(mockIframe.parentNode.removeChild.calledWith(mockIframe));
                        
                        // Check if result is a Set
                        assert.instanceOf(result, Set);
                    })
                    .catch(error => {
                        assert.fail(`Test failed with error: ${error.message}`);
                    });
            });
            
            // Wait for the test to complete
            await testPromise;
        });
        
        it('should handle errors gracefully', async function () {
            sandbox.stub(collector, 'selectorToElement').throws(new Error('Test error'));
            const errorSpy = sandbox.spy(Log, 'error');
            const selectors = ['#test1'];
            
            const result = await collector.getBlockedSelectors(selectors);
            
            assert.instanceOf(result, Set);
            assert.equal(result.size, 0);
            assert.isTrue(errorSpy.calledWith('Error in getBlockedSelectors:', sinon.match.instanceOf(Error)));
        });
    });
    
    describe('selectorToElement', function () {
        it('should create an element with the correct tag and attributes', function () {
            const mockElement = {
                setAttribute: sandbox.stub()
            };
            
            mockIframeDocument.createElement.returns(mockElement);
            
            collector.selectorToElement('div.test-class#test-id[data-test="value"]', mockIframeDocument);
            
            assert.isTrue(mockIframeDocument.createElement.calledWith('div'));
            assert.isTrue(mockElement.setAttribute.calledWith('class', 'test-class'));
            assert.isTrue(mockElement.setAttribute.calledWith('id', 'test-id'));
            assert.isTrue(mockElement.setAttribute.calledWith('data-test', 'value'));
        });
        
        it('should use div as default tag if none specified', function () {
            const mockElement = {
                setAttribute: sandbox.stub()
            };
            
            mockIframeDocument.createElement.returns(mockElement);
            
            collector.selectorToElement('.test-class', mockIframeDocument);
            
            assert.isTrue(mockIframeDocument.createElement.calledWith('div'));
        });
    });
    
    describe('parseSimpleCssSelector', function () {
        it('should parse a simple tag selector', function () {
            const [tag, attributes] = collector.parseSimpleCssSelector('div');
            assert.equal(tag, 'div');
            assert.deepEqual(attributes, {});
        });
        
        it('should parse a class selector', function () {
            const [tag, attributes] = collector.parseSimpleCssSelector('.test-class');
            assert.isUndefined(tag);
            assert.deepEqual(attributes.class, ['test-class']);
        });
        
        it('should parse an id selector', function () {
            const [tag, attributes] = collector.parseSimpleCssSelector('#test-id');
            assert.isUndefined(tag);
            assert.deepEqual(attributes.id, ['test-id']);
        });
        
        it('should parse an attribute selector', function () {
            const [tag, attributes] = collector.parseSimpleCssSelector('[data-test="value"]');
            assert.isUndefined(tag);
            assert.deepEqual(attributes['data-test'], ['value']);
        });
        
        it('should parse a complex selector', function () {
            const [tag, attributes] = collector.parseSimpleCssSelector('div.test-class#test-id[data-test="value"]');
            assert.equal(tag, 'div');
            assert.deepEqual(attributes.class, ['test-class']);
            assert.deepEqual(attributes.id, ['test-id']);
            assert.deepEqual(attributes['data-test'], ['value']);
        });
        
        it('should handle multiple classes', function () {
            const [tag, attributes] = collector.parseSimpleCssSelector('div.class1.class2');
            assert.equal(tag, 'div');
            assert.deepEqual(attributes.class, ['class1', 'class2']);
        });
        
        
    });
});
