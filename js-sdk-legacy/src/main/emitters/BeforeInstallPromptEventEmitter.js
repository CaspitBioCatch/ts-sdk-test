import { MessageBusEventType } from '../events/MessageBusEventType';

class BeforeInstallPromptEventEmitter {
    constructor(messageBus, EventAggregator) {
        this._messageBus = messageBus;
        this._eventAggregator = EventAggregator;
    }

    start(windowInstance) {
        if (!windowInstance) {
            throw new Error('invalid window parameter');
        }

        this._eventAggregator.addEventListener(windowInstance, 'beforeinstallprompt', this.handleBeforeInstallPrompt);
    }

    stop(windowInstance) {
        if (!windowInstance) {
            throw new Error('invalid window parameter');
        }

        this._eventAggregator.removeEventListener(windowInstance, 'beforeinstallprompt', this.handleBeforeInstallPrompt);
    }

    handleBeforeInstallPrompt = (e) => {
        this._messageBus.publish(MessageBusEventType.BeforeInstallPromptEvent, e);
    }
}

export default BeforeInstallPromptEventEmitter;
