import BrowserContextsCache from '../../../../../src/main/core/browsercontexts/BrowserContextsCache';

describe('FramesCache tests:', function () {
    const assert = chai.assert;

    beforeEach(function () {
        this.iframe1 = document.createElement('iframe');
        this.iframe1.setAttribute('id', 'iframe1');
        document.body.appendChild(this.iframe1);
        this.iframe1.contentWindow.testSign = 'iframe1';

        this.iframe2 = document.createElement('iframe');
        this.iframe2.setAttribute('id', 'iframe2');
        document.body.appendChild(this.iframe2);
        this.iframe2.contentWindow.testSign = 'iframe2';
    });

    afterEach(function () {
        document.body.removeChild(this.iframe1);
        document.body.removeChild(this.iframe2);
        this.iframe1 = null;
        this.iframe2 = null;
    });

    describe('add frame tests:', function () {
        it('add should add a frame to the cache', function () {
            const framesCache = new BrowserContextsCache();
            framesCache.add(this.iframe1);

            assert.isTrue(framesCache.exists(this.iframe1), `frame ${this.iframe1.id} does not exist in cache`);
            assert.isFalse(framesCache.exists(this.iframe2), `frame ${this.iframe2.id} exists in cache`);
            assert.isTrue(framesCache.get(this.iframe1).registered);
            const keysArray = Array.from(framesCache.contexts);
            assert.isTrue(keysArray.length === 1);
            assert.equal(keysArray[0], this.iframe1);
        });

        it('Multiple frame adds', function () {
            const framesCache = new BrowserContextsCache();
            framesCache.add(this.iframe1);

            assert.isTrue(framesCache.exists(this.iframe1));
            assert.isFalse(framesCache.exists(this.iframe2));
            assert.isTrue(framesCache.get(this.iframe1).registered);
            let keysArray = Array.from(framesCache.contexts);
            assert.isTrue(keysArray.length === 1);
            assert.equal(keysArray[0], this.iframe1);

            framesCache.add(this.iframe2);
            keysArray = Array.from(framesCache.contexts);
            assert.isTrue(framesCache.exists(this.iframe2));
            assert.isTrue(framesCache.get(this.iframe2).registered);
            assert.isTrue(keysArray.length === 2);
            assert.equal(keysArray[1], this.iframe2);
        });
    });

    describe('remove frame tests:', function () {
        it('remove should remove a frame from the cache', function () {
            const framesCache = new BrowserContextsCache();
            framesCache.add(this.iframe1);

            assert.isTrue(framesCache.exists(this.iframe1));
            assert.isFalse(framesCache.exists(this.iframe2));
            assert.isTrue(framesCache.get(this.iframe1).registered);
            let keysArray = Array.from(framesCache.contexts);
            assert.isTrue(keysArray.length === 1);
            assert.equal(keysArray[0], this.iframe1);

            framesCache.remove(this.iframe1);
            assert.isFalse(framesCache.exists(this.iframe1));
            assert.isFalse(framesCache.exists(this.iframe2));
            keysArray = Array.from(framesCache.contexts);
            assert.isTrue(keysArray.length === 0);
        });

        it('remove non existing frame should do nothing', function () {
            const framesCache = new BrowserContextsCache();
            framesCache.add(this.iframe1);

            assert.isTrue(framesCache.exists(this.iframe1));
            assert.isFalse(framesCache.exists(this.iframe2));
            assert.isTrue(framesCache.get(this.iframe1).registered);
            let keysArray = Array.from(framesCache.contexts);
            assert.isTrue(keysArray.length === 1);
            assert.equal(keysArray[0], this.iframe1);

            framesCache.remove(this.iframe2);
            keysArray = Array.from(framesCache.contexts);
            assert.isTrue(framesCache.exists(this.iframe1));
            assert.isFalse(framesCache.exists(this.iframe2));
            assert.isTrue(keysArray.length === 1);
        });
    });

    describe('get frame tests:', function () {
        it('get frame returns the requested frame object', function () {
            const framesCache = new BrowserContextsCache();
            framesCache.add(this.iframe1);

            assert.isTrue(framesCache.get(this.iframe1).registered);
            const keysArray = Array.from(framesCache.contexts);
            assert.isTrue(keysArray.length === 1);
            assert.isDefined(keysArray[0]);
            assert.isNotNull(keysArray[0]);
        });

        it('multiple get operations returns the requested frame objects', function () {
            const framesCache = new BrowserContextsCache();
            framesCache.add(this.iframe1);
            framesCache.add(this.iframe2);

            assert.isTrue(framesCache.get(this.iframe1).registered);
            const keysArray = Array.from(framesCache.contexts);
            assert.isDefined(keysArray[0]);
            assert.isNotNull(keysArray[0]);

            assert.isTrue(framesCache.get(this.iframe2).registered);
            assert.isDefined(keysArray[1]);
            assert.isNotNull(keysArray[1]);
            assert.isTrue(keysArray.length === 2);
            assert.notEqual(framesCache.get(this.iframe1), framesCache.get(this.iframe2));
        });
    });

    describe('registerFrameFeature tests:', function () {
        it('register a frame feature', function () {
            const framesCache = new BrowserContextsCache();
            framesCache.add(this.iframe1);

            const dummyFeature = { configKey: 'dummyFeature' };
            framesCache.registerContextFeature(this.iframe1, dummyFeature);
            assert.isTrue(framesCache.hasFeature(this.iframe1, dummyFeature));
        });

        it('register multiple features for a frame', function () {
            const framesCache = new BrowserContextsCache();
            framesCache.add(this.iframe1);

            const dummyFeature = { configKey: 'dummyFeature' };
            const dummyFeature2 = { configKey: 'dummyFeature2' };
            const dummyFeature3 = { configKey: 'dummyFeature3' };
            const dummyFeature4 = { configKey: 'dummyFeature4' };

            framesCache.registerContextFeature(this.iframe1, dummyFeature);
            framesCache.registerContextFeature(this.iframe1, dummyFeature2);
            framesCache.registerContextFeature(this.iframe1, dummyFeature4);
            framesCache.registerContextFeature(this.iframe1, dummyFeature3);

            assert.isTrue(framesCache.hasFeature(this.iframe1, dummyFeature));
            assert.isTrue(framesCache.hasFeature(this.iframe1, dummyFeature2));
            assert.isTrue(framesCache.hasFeature(this.iframe1, dummyFeature4));
            assert.isTrue(framesCache.hasFeature(this.iframe1, dummyFeature3));
        });

        it('register multiple features for a frame', function () {
            const framesCache = new BrowserContextsCache();
            framesCache.add(this.iframe1);
            framesCache.add(this.iframe2);

            const dummyFeature = { configKey: 'dummyFeature' };
            const dummyFeature2 = { configKey: 'dummyFeature2' };
            const dummyFeature3 = { configKey: 'dummyFeature3' };
            const dummyFeature4 = { configKey: 'dummyFeature4' };

            framesCache.registerContextFeature(this.iframe1, dummyFeature);
            framesCache.registerContextFeature(this.iframe2, dummyFeature2);
            framesCache.registerContextFeature(this.iframe2, dummyFeature4);
            framesCache.registerContextFeature(this.iframe1, dummyFeature3);

            assert.isTrue(framesCache.hasFeature(this.iframe1, dummyFeature));
            assert.isTrue(framesCache.hasFeature(this.iframe2, dummyFeature2));
            assert.isTrue(framesCache.hasFeature(this.iframe2, dummyFeature4));
            assert.isTrue(framesCache.hasFeature(this.iframe1, dummyFeature3));
        });
    });

    describe('unRegisterFrameFeature tests:', function () {
        it('unRegister a frame feature', function () {
            const framesCache = new BrowserContextsCache();
            framesCache.add(this.iframe1);

            const dummyFeature = { configKey: 'dummyFeature' };
            framesCache.registerContextFeature(this.iframe1, dummyFeature);
            assert.isTrue(framesCache.hasFeature(this.iframe1, dummyFeature));

            framesCache.unRegisterContextFeature(this.iframe1, dummyFeature);
            assert.isFalse(framesCache.hasFeature(this.iframe1, dummyFeature));
        });

        it('unRegister multiple features for a frame', function () {
            const framesCache = new BrowserContextsCache();
            framesCache.add(this.iframe1);

            const dummyFeature = { configKey: 'dummyFeature' };
            const dummyFeature2 = { configKey: 'dummyFeature2' };
            const dummyFeature3 = { configKey: 'dummyFeature3' };
            const dummyFeature4 = { configKey: 'dummyFeature4' };

            framesCache.registerContextFeature(this.iframe1, dummyFeature);
            framesCache.registerContextFeature(this.iframe1, dummyFeature2);
            framesCache.registerContextFeature(this.iframe1, dummyFeature4);
            framesCache.registerContextFeature(this.iframe1, dummyFeature3);

            assert.isTrue(framesCache.hasFeature(this.iframe1, dummyFeature));
            assert.isTrue(framesCache.hasFeature(this.iframe1, dummyFeature2));
            assert.isTrue(framesCache.hasFeature(this.iframe1, dummyFeature4));
            assert.isTrue(framesCache.hasFeature(this.iframe1, dummyFeature3));

            framesCache.unRegisterContextFeature(this.iframe1, dummyFeature);
            framesCache.unRegisterContextFeature(this.iframe1, dummyFeature2);
            framesCache.unRegisterContextFeature(this.iframe1, dummyFeature4);
            framesCache.unRegisterContextFeature(this.iframe1, dummyFeature3);

            assert.isFalse(framesCache.hasFeature(this.iframe1, dummyFeature));
            assert.isFalse(framesCache.hasFeature(this.iframe1, dummyFeature2));
            assert.isFalse(framesCache.hasFeature(this.iframe1, dummyFeature4));
            assert.isFalse(framesCache.hasFeature(this.iframe1, dummyFeature3));
        });

        it('register multiple features for a frame', function () {
            const framesCache = new BrowserContextsCache();
            framesCache.add(this.iframe1);
            framesCache.add(this.iframe2);

            const dummyFeature = { configKey: 'dummyFeature' };
            const dummyFeature2 = { configKey: 'dummyFeature2' };
            const dummyFeature3 = { configKey: 'dummyFeature3' };
            const dummyFeature4 = { configKey: 'dummyFeature4' };

            framesCache.registerContextFeature(this.iframe1, dummyFeature);
            framesCache.registerContextFeature(this.iframe2, dummyFeature2);
            framesCache.registerContextFeature(this.iframe2, dummyFeature4);
            framesCache.registerContextFeature(this.iframe1, dummyFeature3);

            assert.isTrue(framesCache.hasFeature(this.iframe1, dummyFeature));
            assert.isTrue(framesCache.hasFeature(this.iframe2, dummyFeature2));
            assert.isTrue(framesCache.hasFeature(this.iframe2, dummyFeature4));
            assert.isTrue(framesCache.hasFeature(this.iframe1, dummyFeature3));

            framesCache.unRegisterContextFeature(this.iframe1, dummyFeature);
            framesCache.unRegisterContextFeature(this.iframe1, dummyFeature2);
            framesCache.unRegisterContextFeature(this.iframe1, dummyFeature4);
            framesCache.unRegisterContextFeature(this.iframe1, dummyFeature3);

            assert.isFalse(framesCache.hasFeature(this.iframe1, dummyFeature));
            assert.isFalse(framesCache.hasFeature(this.iframe1, dummyFeature2));
            assert.isFalse(framesCache.hasFeature(this.iframe1, dummyFeature4));
            assert.isFalse(framesCache.hasFeature(this.iframe1, dummyFeature3));
        });
    });

    describe('unRegisterFrameFeatures tests:', function () {
        it('unRegister a frame features', function () {
            const framesCache = new BrowserContextsCache();
            framesCache.add(this.iframe1);

            const dummyFeature = { configKey: 'dummyFeature' };
            const dummyFeature2 = { configKey: 'dummyFeature2' };

            framesCache.registerContextFeature(this.iframe1, dummyFeature);
            assert.isTrue(framesCache.hasFeature(this.iframe1, dummyFeature));

            framesCache.registerContextFeature(this.iframe1, dummyFeature2);
            assert.isTrue(framesCache.hasFeature(this.iframe1, dummyFeature));

            framesCache.unRegisterContextFeatures(this.iframe1, [dummyFeature, dummyFeature2]);

            assert.isFalse(framesCache.hasFeature(this.iframe1, dummyFeature));
            assert.isFalse(framesCache.hasFeature(this.iframe1, dummyFeature2));
        });
    });

    describe('hasFeature tests:', function () {
        it('frame has features', function () {
            const framesCache = new BrowserContextsCache();
            framesCache.add(this.iframe1);

            const dummyFeature = { configKey: 'dummyFeature' };
            const dummyFeature2 = { configKey: 'dummyFeature2' };

            framesCache.registerContextFeature(this.iframe1, dummyFeature);
            assert.isTrue(framesCache.hasFeature(this.iframe1, dummyFeature));

            framesCache.registerContextFeature(this.iframe1, dummyFeature2);
            assert.isTrue(framesCache.hasFeature(this.iframe1, dummyFeature));
        });

        it('frame doesnt have a feature which was not registered for him', function () {
            const framesCache = new BrowserContextsCache();
            framesCache.add(this.iframe1);

            const dummyFeature = { configKey: 'dummyFeature' };
            const dummyFeature2 = { configKey: 'dummyFeature2' };

            assert.isFalse(framesCache.hasFeature(this.iframe1, dummyFeature));

            framesCache.registerContextFeature(this.iframe1, dummyFeature2);
            assert.isTrue(framesCache.hasFeature(this.iframe1, dummyFeature2));
        });
    });
});
