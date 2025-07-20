import Log from "../../technicalServices/log/Logger";
import StaticContract from "./StaticContract";

export default class StorageDirectoryContract extends StaticContract {
    /**
     * @param  {string} directoryName
     */
    constructor(directoryName) {
        super();
        this.validateParams(directoryName);
        this.directoryName = directoryName;
    }

    validateParams(directoryName) {
        let isValid = typeof directoryName === 'string';

        if (!isValid) {
            Log.warn(`wrong type in StorageDirectory parameters. directoryName : {expected: string, received: ${ typeof directoryName}}`)
        }
    }

    /**
     * @return  {[string, string]} for example: ['storage_directory', 'root']
     */
    buildQueueMessage() {
        let name = this.getName();
        let message = [name, this.directoryName];
        this.validateMessage(message);
        return message;
    }

    validateMessage(message) {
        let isValid = (typeof message[0] === 'string' && typeof message[1] === 'string')
        if (!isValid) {
            Log.warn('StorageDirectory - Contract verification failed')
        }
    }

    getName() {
        return 'storage_directory';
    }
}