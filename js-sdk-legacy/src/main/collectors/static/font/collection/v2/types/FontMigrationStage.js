/**
 * FontMigrationStage
 * 
 * Defines the different stages of font collection migration from V1 to V2.
 * Each stage represents a different phase in the migration process:
 * 
 * V1_ONLY (0): Only V1 collector is active
 * DUAL_COLLECTION_V1_PRIORITY (1): Both collectors active, V1 is primary
 * DUAL_COLLECTION_V2_PRIORITY (2): Both collectors active, V2 is primary
 * V2_ONLY (3): Only V2 collector is active
 */

const FontMigrationStage = {
    V1_ONLY: "0",
    DUAL_COLLECTION_V1_PRIORITY: "1",
    DUAL_COLLECTION_V2_PRIORITY: "2",
    V2_ONLY: "3",

    /**
     * Checks if a given stage is valid
     * @param {string} stage - The migration stage to validate
     * @returns {boolean} True if the stage is valid, false otherwise
     */
    isValid: (stage) => {
        return Object.values(FontMigrationStage).includes(stage);
    },

    /**
     * Gets a description of what each stage represents
     * @param {string} stage - The migration stage to get description for
     * @returns {string} Description of the stage
     */
    getDescription: (stage) => {
        const descriptions = {
            [FontMigrationStage.V1_ONLY]: "Only V1 collector is active",
            [FontMigrationStage.DUAL_COLLECTION_V1_PRIORITY]: "Both collectors active, V1 is primary",
            [FontMigrationStage.DUAL_COLLECTION_V2_PRIORITY]: "Both collectors active, V2 is primary",
            [FontMigrationStage.V2_ONLY]: "Only V2 collector is active"
        };
        return descriptions[stage] || "Unknown stage";
    }
};

export default FontMigrationStage; 