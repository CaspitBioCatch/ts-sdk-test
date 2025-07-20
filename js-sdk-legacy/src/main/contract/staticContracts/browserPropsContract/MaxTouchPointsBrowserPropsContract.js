import StaticContract from '../StaticContract';
import Log from '../../../technicalServices/log/Logger';

export default class MaxTouchPointsBrowserPropsContract extends StaticContract {
    /**
     * @param  {number} maxTouchPoints, indicates the maximum number of simultaneous touch contact points that are supported by the current device.
     */
    constructor(maxTouchPoints) {
        super();
        this.validateParams(maxTouchPoints);
        this.maxTouchPoints = maxTouchPoints;
    }

    validateParams(maxTouchPoints) {
        const isValid = maxTouchPoints !== undefined && typeof maxTouchPoints === 'number';
        if(!isValid) {
            Log.warn(`wrong type in MaxTouchPointsContract parameters. Expected: number, received: ${typeof maxTouchPoints}`);
        }
    }

    /**
     * @return  {[string, number]} for example: ['navigator_max_touch_points', 0]
     */
    buildQueueMessage() {
        const name = this.getName();
        const message = [name, this.maxTouchPoints];
        this.validateMessage(message);
        return message;
    }

    validateMessage(message) {
        const isValid = typeof message[0] === 'string' && typeof message[1] === 'number';
        if(!isValid) {
            Log.warn(`navigator_max_touch_points, BrowserPropsContract - Contract verification failed`);
        }
    }

    getName() {
        return 'navigator_max_touch_points';
    }
}
