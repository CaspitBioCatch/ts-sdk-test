import ElementsMutationObserverFactory
    from '../../../../../src/main/core/browsercontexts/ElementsMutationObserverFactory';

describe('ElementsMutationObserverFactory tests:', function () {
    describe('create', function () {
        const elementsMutationObserverFactory = new ElementsMutationObserverFactory();

        const elementsMutationObserver = elementsMutationObserverFactory.create(null, window.MutationObserver);

        assert.exists(elementsMutationObserver);
    });
});
