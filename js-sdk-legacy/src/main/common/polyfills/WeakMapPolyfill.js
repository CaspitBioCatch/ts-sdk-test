/*!
 * weakmap-polyfill v2.0.0 - ECMAScript6 WeakMap polyfill
 * https://github.com/polygonplanet/weakmap-polyfill
 * Copyright (c) 2015-2016 polygon planet <polygon.planet.aqua@gmail.com>
 * @license MIT
 */

export default function apply(self) {
    if (self.WeakMap) {
        return;
    }

    const hasOwnProperty = Object.prototype.hasOwnProperty;
    const defineProperty = function (object, name, value) {
        if (Object.defineProperty) {
            Object.defineProperty(object, name, {
                configurable: true,
                writable: true,
                value,
            });
        } else {
            object[name] = value;
        }
    };

    function isObject(x) {
        return Object(x) === x;
    }

    self.WeakMap = (function () {
        function checkInstance(x, methodName) {
            if (!isObject(x) || !hasOwnProperty.call(x, '_id')) {
                throw new TypeError(methodName + ' method called on incompatible receiver ' + typeof x);
            }
        }

        function rand() {
            return Math.random().toString().substring(2);
        }

        function genId(prefix) {
            return prefix + '_' + rand() + '.' + rand();
        }

        // ECMA-262 23.3 WeakMap Objects
        function WeakMap() {
            /* eslint-disable no-void */
            if (this === void 0) {
                throw new TypeError("Constructor WeakMap requires 'new'");
            }
            /* eslint-enable no-void */

            defineProperty(this, '_id', genId('_WeakMap'));

            // ECMA-262 23.3.1.1 WeakMap([iterable])
            if (arguments.length > 0) {
                // Currently, WeakMap `iterable` argument is not supported
                throw new TypeError('WeakMap iterable is not supported');
            }
        }

        // ECMA-262 23.3.3.2 WeakMap.prototype.delete(key)
        defineProperty(WeakMap.prototype, 'delete', function (key) {
            checkInstance(this, 'delete');

            if (!isObject(key)) {
                return false;
            }

            const entry = key[this._id];
            if (entry && entry[0] === key) {
                delete key[this._id];
                return true;
            }

            return false;
        });

        // ECMA-262 23.3.3.3 WeakMap.prototype.get(key)
        defineProperty(WeakMap.prototype, 'get', function (key) {
            checkInstance(this, 'get');

            if (!isObject(key)) {
                /* eslint-disable no-void */
                return void 0;
                /* eslint-enable no-void */
            }

            const entry = key[this._id];
            if (entry && entry[0] === key) {
                return entry[1];
            }

            /* eslint-disable no-void */
            return void 0;
            /* eslint-enable no-void */
        });

        // ECMA-262 23.3.3.4 WeakMap.prototype.has(key)
        defineProperty(WeakMap.prototype, 'has', function (key) {
            checkInstance(this, 'has');

            if (!isObject(key)) {
                return false;
            }

            const entry = key[this._id];
            if (entry && entry[0] === key) {
                return true;
            }

            return false;
        });

        // ECMA-262 23.3.3.5 WeakMap.prototype.set(key, value)
        defineProperty(WeakMap.prototype, 'set', function (key, value) {
            checkInstance(this, 'set');

            if (!isObject(key)) {
                throw new TypeError('Invalid value used as weak map key');
            }

            const entry = key[this._id];
            if (entry && entry[0] === key) {
                entry[1] = value;
                return this;
            }

            defineProperty(key, this._id, [key, value]);
            return this;
        });

        defineProperty(WeakMap, '_polyfill', true);
        return WeakMap;
    }());
}
