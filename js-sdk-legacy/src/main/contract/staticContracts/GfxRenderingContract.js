import Log from "../../technicalServices/log/Logger";
import StaticContract from "./StaticContract";

export default class GfxRenderingContract extends StaticContract{

    /*
     * @param {boolean} winding
     * @param {string} text
     * @param {string} geometry
     */
    constructor(winding, text, geometry) {
        super();
        this.validateParams(winding, text, geometry);
        this.winding = winding;
        this.text = text;
        this.geometry = geometry;
    }

    /*
     * @param {boolean} winding
     * @param {string} text
     * @param {string} geometry
     */
    validateParams(winding, text, geometry) {
        let isValid = (
            typeof winding === 'boolean' &&
            typeof text === 'string' &&
            typeof geometry === 'string'
        );

        if (!isValid) {
            const logMsg = `wrong type in GfxRenderingContract parameters. winding: {expected: boolean, received: ${typeof winding}}, text: {expected: string, received: ${typeof text}},
            geometry: {expected: string, received: ${typeof geometry}}`;
            Log.warn(logMsg);
        }
    }

    /**
     * @return  {[string,[boolean, string, string]]} for example: ['gfx', [true, 'abcdefg' , 'a1b2c3']]
     */
    buildQueueMessage() {
        let name = this.getName();
        let message = [name, [
            this.winding,
            this.text,
            this.geometry
        ]];

        this.validateMessage(message);
        return message;
    }

    validateMessage(message) {
        let isValid = (
            typeof message[0] === 'string' &&
            Array.isArray(message[1]) &&
            message[1].length === 3
        );

        if (!isValid) {
            Log.warn('GfxRendering - Contract verification failed');
        }
    }

    getName() {
        return 'gfx';
    }
}
