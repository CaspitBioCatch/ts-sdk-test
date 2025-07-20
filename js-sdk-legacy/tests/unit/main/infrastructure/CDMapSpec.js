import { assert } from 'chai';
import * as CDMap from '../../../../src/main/infrastructure/CDMap';

describe('CDMap test:', function () {
    describe('set tests:', function () {
        it('should set item', function () {
            const map = CDMap.createLocal();
            const item = 'item';
            map.set('key', item);

            assert.isTrue(map.has('key'));
            assert.equal(map.get('key'), item);
        });

        it('should update set item', function () {
            const map = CDMap.createLocal();
            const item = 'item';
            map.set('key', item);

            assert.isTrue(map.has('key'));
            assert.equal(map.get('key'), item);

            map.set('key', null);

            assert.isTrue(map.has('key'));
            assert.equal(map.get('key'), null);
        });

        it('should set item when key is an object', function () {
            const map = CDMap.createLocal();
            const item = { text: 'text' };
            map.set(item, item);

            const item2 = { text: 'text2' };
            map.set(item2, item2);

            assert.isTrue(map.has(item));
            assert.isTrue(map.has(item2));

            assert.deepEqual(map.get(item), item);
            assert.deepEqual(map.get(item2), item2);
        });
    });

    describe('has tests:', function () {
        it('should return true when item is in map', function () {
            const map = CDMap.createLocal();
            const item = 'item';
            map.set('key', item);

            assert.isTrue(map.has('key'));
        });

        it('should return false when item is not in map', function () {
            const map = CDMap.createLocal();
            const item = 'item';
            map.set('key', item);

            assert.isFalse(map.has('key2'));
        });

        it('should return false when item was removed from map', function () {
            const map = CDMap.createLocal();
            const item = 'item';
            map.set('key', item);

            assert.isTrue(map.has('key'));

            map.delete('key');

            assert.isFalse(map.has('key'));
        });
    });

    describe('get tests:', function () {
        it('should get item', function () {
            const map = CDMap.createLocal();
            const item = 'item';
            map.set('key', item);

            assert.equal(map.get('key'), item);
        });

        it('should not get item when its not in the map', function () {
            const map = CDMap.createLocal();

            assert.equal(map.get('key'), undefined);
        });

        it('should not get item when it was removed from the map', function () {
            const map = CDMap.createLocal();
            const item = 'item';
            map.set('key', item);

            assert.equal(map.get('key'), item);

            map.delete('key');

            assert.equal(map.get('key'), undefined);
        });
    });

    describe('delete tests:', function () {
        it('should delete item', function () {
            const map = CDMap.createLocal();
            const item = 'item';
            map.set('key', item);

            assert.isTrue(map.has('key'));

            assert.isTrue(map.delete('key'));
            assert.equal(map.get('key'), undefined);
        });

        it('should not delete item if its not in the map', function () {
            const map = CDMap.createLocal();

            assert.isFalse(map.delete('key'));
        });

        it('should not delete item if it was already deleted from the map', function () {
            const map = CDMap.createLocal();
            const item = 'item';
            map.set('key', item);

            assert.isTrue(map.has('key'));

            assert.isTrue(map.delete('key'));
            assert.equal(map.get('key'), undefined);

            assert.isFalse(map.delete('key'));
        });
    });

    describe('forEach tests:', function () {
        it('should iterate items in map', function () {
            const map = CDMap.createLocal();
            let item = 'item';
            map.set('key', item);

            item = 'item';
            map.set('key2', item);

            assert.isTrue(map.has('key'));
            assert.isTrue(map.has('key2'));

            const iteratedItems = [];
            map.forEach((value, key) => {
                iteratedItems.push({ key, value });
            });

            assert.equal(iteratedItems.length, 2);
            assert.equal(iteratedItems[0].key, 'key');
            assert.equal(iteratedItems[0].value, item);
            assert.deepEqual(iteratedItems[1].key, 'key2');
            assert.deepEqual(iteratedItems[1].value, item);
        });
    });

    describe('clear tests:', function () {
        it('should clear all items', function () {
            const map = CDMap.createLocal();
            const item = 'item';
            map.set('key', item);

            assert.isTrue(map.has('key'));

            map.clear();
            assert.equal(map.get('key'), undefined);
        });

        it('should not throw error if there are no items to clear', function () {
            const map = CDMap.createLocal();

            assert.doesNotThrow(() => {
                return map.clear();
            });
        });
    });
});
