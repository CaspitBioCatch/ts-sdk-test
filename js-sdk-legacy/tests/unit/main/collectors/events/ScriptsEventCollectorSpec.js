import { assert } from 'chai';
import ScriptEventCollector, { ScriptEventType } from '../../../../../src/main/collectors/events/ScriptEventCollector';
import CDUtils from '../../../../../src/main/technicalServices/CDUtils';
import { EventStructure as ScripEventStructure } from '../../../../../src/main/collectors/events/ScriptEventCollector';
import { dataQueue } from '../../../mocks/mockObjects';
import { TestUtils } from '../../../../TestUtils';
import TestBrowserUtils from '../../../../TestBrowserUtils';
import SupportedBrowserVersions from '../../../../SupportedBrowserVersions';

describe('Script executeEvents tests:', function () {
    beforeEach(function () {
        if (TestBrowserUtils.isFirefox(window.navigator.userAgent, SupportedBrowserVersions.FirefoxOldestSupportedVersion)) {
            this.skip();
            return;
        }
    });

    describe('ScriptEventCollector tests:', function () {
        it('initialize ScriptEvents module', function () {
            const scrEvents = new ScriptEventCollector(CDUtils, dataQueue);
            scrEvents.startFeature(self);
            assert.isTrue(typeof scrEvents !== 'undefined' && scrEvents != null);
            scrEvents.stopFeature(self);
        });

        it('should identify script event and call queue', async function () {
            this.timeout(6000);
            // This is a flaky test so we will retry on failure for now
            this.retries(3);

            dataQueue.requests = [];
            const scrEvents = new ScriptEventCollector(CDUtils, dataQueue);
            // Reduce script check timeout to 1 ms just for the test otherwise we might take to long to detect
            // the script
            scrEvents._timeoutValue = 1;
            scrEvents.startFeature(self);

            const scriptSource = 'base/tests/unit/dummyScript.js';
            const script = document.createElement('script');
            const head = document.getElementsByTagName('head')[0];
            script.setAttribute('type', 'text/javascript');
            script.setAttribute('src', scriptSource);
            head.appendChild(script);

            await TestUtils.waitForNoAssertion(() => {
                assert.isTrue(dataQueue.requests.length > 0, 'did event work?');
                assert.equal(dataQueue.requests[0][ScripEventStructure.indexOf('eventType') + 1], ScriptEventType.load);
                assert.equal(dataQueue.requests[0][ScripEventStructure.indexOf('scriptType') + 1], 'text/javascript');
                assert.include(dataQueue.requests[0][ScripEventStructure.indexOf('scriptSource') + 1], scriptSource);
            }).finally(() => {
                scrEvents.stopFeature(self);
                head.removeChild(script);
            });
        });

        describe('stopFeature tests', function () {
            it('scripts are not collected once stopFeature is called', async function () {
                this.timeout(6000);
                // This is a flaky test so we will retry on failure for now
                this.retries(3);

                dataQueue.requests = [];
                const scrEvents = new ScriptEventCollector(CDUtils, dataQueue);
                // Reduce script check timeout to 1 ms just for the test otherwise we might take to long to detect
                // the script
                scrEvents._timeoutValue = 1;
                scrEvents.startFeature(self);

                let scriptSource = 'base/tests/unit/dummyScript.js';
                const script = document.createElement('script');
                let head = document.getElementsByTagName('head')[0];
                script.setAttribute('type', 'text/javascript');
                script.setAttribute('src', scriptSource);
                head.appendChild(script);

                // First lets see that the feature collects scripts
                await TestUtils.waitForNoAssertion(() => {
                    assert.isTrue(dataQueue.requests.length > 0, 'did event work?');
                    assert.equal(dataQueue.requests[0][ScripEventStructure.indexOf('eventType') + 1], ScriptEventType.load);
                    assert.equal(dataQueue.requests[0][ScripEventStructure.indexOf('scriptType') + 1], 'text/javascript');
                    assert.include(dataQueue.requests[0][ScripEventStructure.indexOf('scriptSource') + 1], scriptSource);
                });

                // Now we stop the feature
                scrEvents.stopFeature(self);
                dataQueue.requests = []; // To empty the 'elements' event
                scriptSource = 'base/tests/unit/dummyScript2.js';
                const script2 = document.createElement('script');
                head = document.getElementsByTagName('head')[0];
                script.setAttribute('type', 'text/javascript');
                script.setAttribute('src', scriptSource);
                head.appendChild(script2);

                await TestUtils.wait(600);
                // now verify no event
                await TestUtils.waitForNoAssertion(() => {
                    assert.isTrue(dataQueue.requests.length === 0, 'event worked and shouldnt have');
                }).finally(() => {
                    head.removeChild(script2);
                    head.removeChild(script);
                });
            });
        });
    });
});
