import WorkerStartPoint from './WorkerStartPoint';
import apply from '../main/common/polyfills/TextEncoderPolyfill.js';

export default class Application {
    constructor() {
        apply(self);
    }
    start() {
        new WorkerStartPoint().start();
    }
}
