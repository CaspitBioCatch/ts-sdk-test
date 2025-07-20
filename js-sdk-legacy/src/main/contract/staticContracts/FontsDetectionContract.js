import StaticContract from "./StaticContract";
import Log from "../../technicalServices/log/Logger";

/**
 * Font Detection Contract
 * Handles the payload structure for font detection during migration phases.
 */
class FontsDetectionContract extends StaticContract {

    /**
     * @param  {string} dataType - Specifies the type of data being handled (e.g., 'v1', 'v2', 'v1+v2').
     * @param  {Array} fontList - A tuple containing font data in the format [v1Fonts (string), v2Fonts (array)].
     */
    constructor(dataType, fontList) {
        super();
        this.validateParams(dataType, fontList);
        this.dataType = dataType;
        this.fontList = fontList;
    }

    /**
     * Validates the parameters passed to the constructor.
     * @param {string} dataType - Type of font data (e.g., 'v1', 'v2', 'v1+v2').
     * @param {Array} fontList - Tuple containing font data, e.g., ['Arial, Verdana, Tahoma', ['Roboto', 'Open Sans']].
     */
    validateParams(dataType, fontList) {
        const isValid =
            Array.isArray(fontList) &&
            fontList.length === 2 &&
            Object.values(FontDataType).includes(dataType);

        if (!isValid) {
            Log.warn(
                `Invalid parameters in FontsDetectionContract. 
                dataType: {expected: ${Object.keys(FontDataType).join(", ")}, received: ${dataType}},
                fontList: {expected: tuple [string, array], received: ${JSON.stringify(fontList)}}`
            );
            throw new Error("Invalid parameters provided to FontsDetectionContract.");
        }
    }

    /**
     * Builds a queue message for font detection.
     * The structure is a tuple: [key, payload].
     * - Key is derived from `getName()`.
     * - Payload varies based on `dataType`:
     *   - "v1": A single string representing V1 fonts.
     *   - "v2": An array of strings representing V2 fonts.
     *   - "v1+v2": A tuple of [V1 fonts (string), V2 fonts (array)].
     * 
     * @return {Array} - Tuple [key, payload] for font detection.
     */
    buildQueueMessage() {
        let payload;

        // Determine the payload structure based on `dataType`
        if (this.dataType === FontDataType.V1_ONLY) {
            payload = this.fontList[0].join(','); // V1 as a single string
        } else if (this.dataType === FontDataType.V2_ONLY) {
            payload = this.fontList[1]; // V2 as an array of strings
        } else if (this.dataType === FontDataType.V1_AND_V2) {
            payload = [this.fontList[0].join(','), this.fontList[1]]; // Tuple of V1 and V2
        } else {
            throw new Error(`Invalid dataType: ${this.dataType}`);
        }

        const message = [this.getName(), [this.dataType, payload]];
        this.validateMessage(message);
        return message;
    }

    /**
    * Validates the generated message structure.
    * - Ensures the key is a valid string.
    * - Ensures the payload is structured as [dataType, payload]:
    *   - For "v1": payload should be a string.
    *   - For "v2": payload should be an array of strings.
    *   - For "v1+v2": payload should be a tuple [string, array].
    * 
    * @param {Array} message - The generated message array in the format [key, [dataType, payload]].
    */
    validateMessage(message) {
        // Validate the key (message[0])
        const isKeyValid = typeof message[0] === "string";

        // Validate the payload structure (message[1])
        const [dataType, payload] = message[1] || [];
        let isPayloadValid = false;

        if (dataType === FontDataType.V1_ONLY) {
            isPayloadValid = typeof payload === "string";
        } else if (dataType === FontDataType.V2_ONLY) {
            isPayloadValid = Array.isArray(payload) && payload.every(font => typeof font === "string");
        } else if (dataType === FontDataType.V1_AND_V2) {
            isPayloadValid =
                Array.isArray(payload) &&
                payload.length === 2 &&
                typeof payload[0] === "string" &&
                Array.isArray(payload[1]) &&
                payload[1].every(font => typeof font === "string");
        }

        // Combined validation
        if (!isKeyValid || !isPayloadValid) {
            Log.warn("FontsDetectionContract - Queue message validation failed.");
            Log.debug(`Invalid message: ${JSON.stringify(message)}`);
            throw new Error("Invalid message structure.");
        }
    }

    getName() {
        return "fonts";
    }
}

/**
 * Enum for font data types.
 */
const FontDataType = Object.freeze({
    V1_ONLY: "v1",         // Data from V1 only
    V2_ONLY: "v2",         // Data from V2 only
    V1_AND_V2: "v1+v2"    // Data from both V1 and V2 combined,
});

export { FontsDetectionContract, FontDataType };
