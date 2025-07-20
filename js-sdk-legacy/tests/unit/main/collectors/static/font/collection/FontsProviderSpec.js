import { assert } from "chai";
import FontsProvider from "../../../../../../../src/main/collectors/static/font/collection/FontsProvider";
import FontVersionType from "../../../../../../../src/main/collectors/static/font/collection/v2/types/FontVersionType";
import fontsVersion1 from "../../../../../../../src/main/collectors/static/font/collection/v1/FontsVersion1";
import fontsVersion2 from "../../../../../../../src/main/collectors/static/font/collection/v2/FontsVersion2";

describe("FontsProvider Tests", function () {
    let fontsProvider;

    beforeEach(() => {
        fontsProvider = new FontsProvider();
    });

    describe("Constructor Tests", function () {
        it("should initialize with font versions", function () {
            assert.deepEqual(fontsProvider.fontVersions, {
                [FontVersionType.VERSION1]: fontsVersion1,
                [FontVersionType.VERSION2]: fontsVersion2,
            });
        });
    });

    describe("getFontsByVersion Method Tests", function () {
        it("should return fonts for VERSION1", function () {
            const result = fontsProvider.getFontsByVersion(FontVersionType.VERSION1);
            assert.equal(result, fontsVersion1);
        });

        it("should return fonts for VERSION2", function () {
            const result = fontsProvider.getFontsByVersion(FontVersionType.VERSION2);
            assert.equal(result, fontsVersion2);
        });

        it("should throw an error for invalid version type", function () {
            const invalidVersion = "INVALID_VERSION";

            assert.throws(() => {
                fontsProvider.getFontsByVersion(invalidVersion);
            }, /Invalid version type. Use one of: VERSION1, VERSION2/);
        });
    });

    describe("Error Handling", function () {
        it("should handle missing or undefined versionType gracefully", function () {
            assert.throws(() => {
                fontsProvider.getFontsByVersion(undefined);
            }, /Invalid version type. Use one of: VERSION1, VERSION2/);
        });
    });
});
