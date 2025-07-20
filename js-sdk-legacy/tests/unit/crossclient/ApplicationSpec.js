import Application from '../../../src/crossclient/Application';
import { TestUtils } from '../../TestUtils';
import TestBrowserUtils from '../../TestBrowserUtils';
import SupportedBrowserVersions from '../../SupportedBrowserVersions';

describe.skip('Application tests', function () {
    beforeEach(function () {
        // Freaking Chrome 31 and its postmessage issues.
        if (TestBrowserUtils.isChrome(window.navigator.userAgent, SupportedBrowserVersions.ChromeOldestSupportedVersion)
            || TestBrowserUtils.isSafari(window.navigator.userAgent, SupportedBrowserVersions.SafariOldestSupportedVersion)
            || TestBrowserUtils.isFirefox(window.navigator.userAgent, SupportedBrowserVersions.FirefoxOldestSupportedVersion)
            || TestBrowserUtils.isIE11(window.navigator.userAgent)) {
            this.skip();
        }
    });

    afterEach(function () {
        window.localStorage.removeItem('muid');
        window.localStorage.removeItem('muid2');
    });

    describe('handleMessage', function () {
        it('set keys', async function () {
            const application = new Application();

            const message1 = {
                'muid': 'testMUID',
            };

            // We must remove the handler which is subscribed in the Application class constructor, otherwise we get
            // an infinite loop of handling the message in the Application class.
            window.removeEventListener('message', application.handleMessage, false);

            application.handleMessage({ data: JSON.stringify(message1), origin: window.location.href });

            await TestUtils.waitForNoAssertion(() => {
                const muid = window.localStorage.getItem('muid');

                assert.include(muid, 'testMUID');
            });

            const message2 = {
                'muid2': 'testMUID2',
            };

            application.handleMessage({ data: JSON.stringify(message2), origin: window.location.href });

            await TestUtils.waitForNoAssertion(() => {
                const muid = window.localStorage.getItem('muid2');

                assert.include(muid, 'testMUID2');
            });
        });
    });
});
