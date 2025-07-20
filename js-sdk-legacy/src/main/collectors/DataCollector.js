/**
 * Base class for all data collectors in the system.
 * 
 * Feature Settings Properties:
 * @property {string} configKey - Unique identifier for the feature configuration
 * @property {boolean} isDefault - Whether the feature is enabled by default
 * @property {boolean} shouldRunPerContext - Whether the feature should run for each context (like iframe)
 * @property {boolean} shouldRunPerSession - Whether the feature should run for each session
 * @property {boolean} shouldRun - Master switch for the feature
 * @property {boolean} isFrameRelated - Whether the feature is related to iframe functionality
 * @property {boolean} runInSlave - Whether the feature should run in slave mode
 * @property {boolean} runInLean - Whether the feature should run in lean mode
 * @property {boolean} runInUns - Whether the feature should run in uns mode
 * @property {boolean} isRunning - Runtime state indicator
 * @property {Object|null} instance - Holds the instance of the feature when it's running
 * 
 * Feature Modes:
 * - Slave Mode: Features that run in slave mode are executed in a separate context, typically used for
 *   features that need to run in iframes or other isolated contexts. These features are initialized
 *   separately from the main context and can operate independently. Used in the slave system loader
 *   to determine which features should be loaded in the slave context.
 * 
 * - Lean Mode: Features that run in lean mode are included in the lean version of the application.
 *   These features are essential for basic functionality and are selected based on the collection mode.
 *   The lean mode is used to optimize performance by only loading necessary features. Used in
 *   FeaturesList.registerLeanFeatures() to determine which features should be included in the lean version.
 * 
 * - Uns Mode: Features that run in uns mode are executed in an unsecured context. These features
 *   typically handle sensitive data or operations that require special security considerations.
 *   They are only enabled when the application is running in an unsecured environment. Used in
 *   various features like BrowserPropsFeature and ContextPropsFeature to determine if they should
 *   run in unsecured contexts.
 */

import CDUtils from '../technicalServices/CDUtils';

export default class DataCollector {
    /**
     * Starts the feature. Override this method in subclasses to implement feature-specific startup logic.
     */
    startFeature() {
    }

    /**
     * Stops the feature. Override this method in subclasses to implement feature-specific cleanup logic.
     */
    stopFeature() {
    }

    /**
     * Updates the feature configuration. Override this method in subclasses to handle configuration changes.
     */
    updateFeatureConfig() {
    }

    /**
     * Sends data to the queue. Override this method in subclasses to implement data collection logic.
     */
    sendToQueue() {
    }

    // There is a bug in jquery (1.7.1) that timestamp doesn't work correctly (ie, firefox)
    // The bug is defined in http://bugs.jquery.com/ticket/10755
    // The timestamp in FF is from the opening of the browser
    // timestamp doesn't always exist
    getEventTimestamp() {
        return CDUtils.dateNow();
    }

    /**
     * Gets the timestamp from an event object.
     * @param {Event} e - The event object
     * @returns {number} The event timestamp or 0 if not available
     */
    getTimestampFromEvent(e) {
        return e.timeStamp ? CDUtils.cutDecimalPointDigits(e.timeStamp, 3) : 0;
    }
}
