import applyPolyfills from '../main/common/polyfills/PolyfillsApplier';
import SlaveStartPoint from './SlaveStartPoint';

export default class Application {
    constructor() {
        // Apply all the polyfills
        applyPolyfills();
    }

    start() {
        return new SlaveStartPoint().start();
    }
}
