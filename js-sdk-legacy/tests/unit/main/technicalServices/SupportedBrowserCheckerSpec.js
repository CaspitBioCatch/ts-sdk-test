import { assert } from 'chai';

import SupportedBrowserChecker from '../../../../src/main/technicalServices/SupportedBrowserChecker';

describe('SupportedBrowserChecker tests:', function () {
    describe('isSupported', function () {
        it('returns false when WeakMap is undefined', function () {
            const weakMap = window.WeakMap;

            window.WeakMap = undefined;

            assert.isFalse(SupportedBrowserChecker.isSupported());

            window.WeakMap = weakMap;
        });

        it('returns false when Worker is undefined', function () {
            const worker = window.Worker;

            window.Worker = undefined;

            assert.isFalse(SupportedBrowserChecker.isSupported());

            window.Worker = worker;
        });

        it('returns false when Worker is undefined', function () {
            const mutationObserver = window.MutationObserver;

            window.MutationObserver = undefined;

            assert.isFalse(SupportedBrowserChecker.isSupported());

            window.MutationObserver = mutationObserver;
        });

        it('returns true when browser is supported', function () {
            assert.isTrue(SupportedBrowserChecker.isSupported());
        });
    });
});
