import Log from './log/Logger';

export class UniqueIDConfiguration {
    constructor(componentsFormat, hierarchyFormat, enabledTags) {
        this.componentsFormat = componentsFormat;
        this.hierarchyFormat = hierarchyFormat;
        this.enabledTags = enabledTags;
    }

   /**
     * Cleans a format string by removing words that are NOT inside `{}` while retaining separators.
     * @param {string} format
     * @returns {string}
     */
   static cleanFormat(format) {
    if (!format) return '';
    // Retain valid placeholders enclosed in curly brackets and separators
    const regexPattern = /{[^}]+}|[:_]/g;
    return (format.match(regexPattern) || []).join('');
}

    static parse(config) {
        try {
            // If config is a string, parse it as JSON
            if (typeof config === 'string') {
                config = JSON.parse(config);
            }
            // Ensure config is an object before proceeding
            if (typeof config !== 'object' || config === null) {
                throw new Error("Invalid configuration format");
            }
            return new UniqueIDConfiguration(
                UniqueIDConfiguration.cleanFormat(config.componentsFormat),
                UniqueIDConfiguration.cleanFormat(config.hierarchyFormat),
                config.enabledTags
            );
        } catch (error) {
            Log.error("Failed to parse UniqueIDConfiguration:", error);
            return null;
        }
    }

    /**
     * Validates if the given tag is enabled in the configuration.
     * @param {string} tagName
     * @returns {boolean}
     */
    isTagEnabled(tagName) {
        if (typeof tagName !== 'string') {
            return false;
        }
        return this.enabledTags.length > 0 && this.enabledTags.includes(tagName.toLowerCase());
    }
}
