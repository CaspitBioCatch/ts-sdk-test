import StaticContract from "./StaticContract";

export default class DevDebugInfoContract extends StaticContract {
    /**
     * @param  {Object} data - The data object to be used in the contract.
     */
    constructor(data) {
        super();
        this.validateParams(data);
        this.data = data;
    }

    /**
     * Validates the parameters passed to the constructor.
     * @param {Object} data - The data object to validate.
     * @throws {Error} If the data is not valid.
     */
    validateParams(data) {
        if (data === null || typeof data !== 'object' || Array.isArray(data)) {
            throw new Error(
                `DevDebugInfoContract - Invalid parameter: data should be a non-null object. Received: ${JSON.stringify(
                    data
                )}`
            );
        }
    }

    /**
     * Builds the queue message to be used for logging or further processing.
     * @return {[string, Object]} A tuple containing the name and data.
     */
    buildQueueMessage() {
        const name = this.getName();
        const message = [name, this.data];
        this.validateMessage(message);
        return message;
    }

    /**
     * Validates the message structure.
     * @param {Array} message - The message array to validate.
     * @throws {Error} If the message is not valid.
     */
    validateMessage(message) {
        const [name, data] = message;
        const isValid =
            typeof name === 'string' &&
            typeof data === 'object' &&
            data !== null;

        if (!isValid) {
            throw new Error(
                `DevDebugInfoContract - Message validation failed. Invalid message structure: ${JSON.stringify(
                    message
                )}`
            );
        }
    }

    /**
     * Retrieves the name for the contract.
     * @return {string} The name of the contract.
     */
    getName() {
        return 'client_debug_info';
    }
}