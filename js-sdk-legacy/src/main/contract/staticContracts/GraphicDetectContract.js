import Log from "../../technicalServices/log/Logger";
import StaticContract from "./StaticContract";

export default class GraphicDetectContract extends StaticContract {
    /**
     * @param  {string} renderer
     * @param  {string} vendor
     * @param  {string} version
     * @param  {string} supportedExtensions
     */
    constructor(renderer, vendor, version, supportedExtensions) {
        super();
        this.validateParams(renderer, vendor, version, supportedExtensions);
        this.renderer = renderer;
        this.vendor = vendor;
        this.version = version;
        this.supportedExtensions = supportedExtensions;
    }

    validateParams(renderer, vendor, version, supportedExtensions) {
        let isValid = (
            typeof renderer === 'string' &&
            typeof vendor === 'string' &&
            typeof version === 'string' &&
            typeof supportedExtensions === 'string'
        )

        if (!isValid) {
            Log.warn(`wrong type in GraphicDetectContract parameters. renderer: {expected: string, received: ${typeof renderer}}, vendor: {expected: string, received: ${typeof vendor}},
            version: {expected: string, received: ${typeof version}}, supportedExtensions: {expected: string, received: ${typeof supportedExtensions}}`)
        }
    }

    /**
     * @return  {[string,[...string]]} for example: ['grph_card', ['renderer', 'vendor' , 'version', 'supportedExtensions']]
     */
    buildQueueMessage() {
        let name = this.getName();
        let message = [name, [
            this.renderer,
            this.vendor,
            this.version,
            this.supportedExtensions
        ]];
        this.validateMessage(message);
        return message;
    }

    validateMessage(message) {
        let isValid = (
            typeof message[0] === 'string' &&
            Array.isArray(message[1]) &&
            message[1].length === 4
        )
        if (!isValid) {
            Log.warn('GraphicDetect - Contract verification failed')
        }
    }

    getName() {
        return 'grph_card';
    }


}
