export default class SupportedBrowserChecker {
    static isSupported() {
        if (typeof WeakMap === 'undefined' || !window.Worker || !window.MutationObserver) {
            return false;
        }

        return true;
    }
}
