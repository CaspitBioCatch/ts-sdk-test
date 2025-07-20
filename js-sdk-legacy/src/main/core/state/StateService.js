import { State } from './State';
import { MessageBusEventType } from '../../events/MessageBusEventType';

export default class StateService {
    constructor(messageBus) {
        this._messageBus = messageBus;
        this._state = State.stopped;
    }

    getState() {
        return this._state;
    }

    updateState(newState) {
        const state = State[newState];

        if (!state) {
            throw new Error(`Unknown state ${newState}`);
        }

        this._state = state;
        this._messageBus.publish(MessageBusEventType.StateChangedEvent, { state });
    }
}
