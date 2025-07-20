// Import font versions from external files
import { default as FontVersionType } from './v2/types/FontVersionType';
import fontsVersion1 from './v1/FontsVersion1';
import fontsVersion2 from './v2/FontsVersion2';

/**
 * FontsProvider
 * A class to manage font versions and provide font lists based on version type.
 */
class FontsProvider {
    constructor() {
        // Static font lists for different versions
        this.fontVersions = {
            [FontVersionType.VERSION1]: fontsVersion1,
            [FontVersionType.VERSION2]: fontsVersion2,
        };
    }

    /**
     * Get fonts by version type
     * @param {string} versionType - The type of font version (use FontVersionType enum)
     * @returns {string[]} - List of fonts for the specified version type
     * @throws {Error} - If an invalid version type is passed
     */
    getFontsByVersion(versionType) {
        if (this.fontVersions[versionType]) {
            return this.fontVersions[versionType];
        } else {
            throw new Error(`Invalid version type. Use one of: ${Object.keys(FontVersionType).join(", ")}`);
        }
    }
}

export default FontsProvider;
