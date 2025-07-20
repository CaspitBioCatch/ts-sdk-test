import ElementsMutationObserver from './ElementsMutationObserver';

export default class ElementsMutationObserverFactory {
    create(context, mutationObserver, configurationRepository) {
        return new ElementsMutationObserver(context, mutationObserver, configurationRepository);
    }
}
