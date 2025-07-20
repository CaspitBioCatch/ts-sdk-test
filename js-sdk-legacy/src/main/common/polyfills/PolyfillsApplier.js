import applyPerformancePolyfill from './PerformancePolyfill';
import applyPolyfills from './Polyfills';
import applyWeakMapPolyfill from './WeakMapPolyfill';

export default function apply() {
    applyPerformancePolyfill(self);
    applyPolyfills();
    applyWeakMapPolyfill(typeof self !== 'undefined' ? self : typeof window !== 'undefined' ? window : this);
}
