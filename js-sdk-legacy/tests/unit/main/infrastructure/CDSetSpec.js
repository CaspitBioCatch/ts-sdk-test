import { assert } from 'chai';
import * as CDSet from '../../../../src/main/infrastructure/CDSet';

describe('CDSet test:', function () {
    describe('constructor tests:', function(){
            it('should create empty set', function(){
                const set = CDSet.createLocal();
                assert.equal(set._set.length, 0);
            });

        it('should create set with initial values', function(){
            const set = CDSet.createLocal(['a', 'b']);
            assert.equal(set._set.length, 2);
            assert.isTrue(set.has('a'));
            assert.isTrue(set.has('b'));
        });

        it('should create using builtin set with initial values', function(){
            const set = CDSet.createLocal(['a', 'b']);
            assert.equal(set._set.length, 2);
            assert.isTrue(set.has('a'));
            assert.isTrue(set.has('b'));
        });
    });

    describe('set tests:', function () {
        it('should set item', function () {
            const set = CDSet.createLocal();
            const item = 'item';
            set.add('key', item);

            assert.isTrue(set.has('key'));
        });

        it('should update set item', function () {
            const set = CDSet.createLocal();
            const item = 'item';
            set.add('key', item);

            assert.isTrue(set.has('key'));

            set.add('key', null);

            assert.isTrue(set.has('key'));
        });

        it('should set item when key is an object', function () {
            const set = CDSet.createLocal();
            const item = { text: 'text' };
            set.add(item, item);

            const item2 = { text: 'text2' };
            set.add(item2, item2);

            assert.isTrue(set.has(item));
            assert.isTrue(set.has(item2));
        });
    });

    describe('has tests:', function () {
        it('should return true when item is in set', function () {
            const set = CDSet.createLocal();
            const item = 'item';
            set.add('key', item);

            assert.isTrue(set.has('key'));
        });

        it('should return false when item is not in set', function () {
            const set = CDSet.createLocal();
            const item = 'item';
            set.add('key', item);

            assert.isFalse(set.has('key2'));
        });

        it('should return false when item was removed from map', function () {
            const set = CDSet.createLocal();
            const item = 'item';
            set.add('key', item);

            assert.isTrue(set.has('key'));

            set.delete('key');

            assert.isFalse(set.has('key'));
        });
    });

    describe('delete tests:', function () {
        it('should delete item', function () {
            const set = CDSet.createLocal();
            const item = 'item';
            set.add('key', item);

            assert.isTrue(set.has('key'));

            assert.isTrue(set.delete('key'));
            assert.isFalse(set.has('key'));
        });

        it('should not delete item if its not in the set', function () {
            const set = CDSet.createLocal();

            assert.isFalse(set.delete('key'));
        });

        it('should not delete item if it was already deleted from the set', function () {
            const set = CDSet.createLocal();
            const item = 'item';
            set.add('key', item);

            assert.isTrue(set.has('key'));

            assert.isTrue(set.delete('key'));
            assert.isFalse(set.has('key'));

            assert.isFalse(set.delete('key'));
        });
    });

    describe('forEach tests:', function () {
        it('should iterate items in set', function () {
            const set = CDSet.createLocal();
            let item = 'item';
            set.add('key', item);

            item = 'item';
            set.add('key2', item);

            assert.isTrue(set.has('key'));
            assert.isTrue(set.has('key2'));

            const iteratedItems = [];
            set.forEach((key) => {
                iteratedItems.push(key);
            });

            assert.equal(iteratedItems.length, 2);
            assert.equal(iteratedItems[0], 'key');
            assert.deepEqual(iteratedItems[1], 'key2');
        });
    });

    describe('clear tests:', function () {
        it('should clear all items', function () {
            const set = CDSet.createLocal();
            const item = 'item';
            set.add('key', item);

            assert.isTrue(set.has('key'));

            set.clear();
            assert.isFalse(set.has('key'));
        });

        it('should not throw error if there are no items to clear', function () {
            const set = CDSet.createLocal();

            assert.doesNotThrow(() => { return set.clear(); });
        });
    });
});
