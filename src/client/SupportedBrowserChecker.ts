/**
 * Utility class to check if the browser supports required features
 */
export class SupportedBrowserChecker {
    /**
     * Checks if the current browser supports all required features
     * @returns {boolean} true if browser is supported, false otherwise
     */
    static isSupported(): boolean {
        // Check if we're in a browser environment
        if (typeof window === 'undefined') {
            // In Node.js environment (testing/SSR), assume supported
            return true;
        }

        // Check for required browser features
        if (typeof WeakMap === 'undefined' || !window.Worker || !window.MutationObserver) {
            return false;
        }

        return true;
    }
}
