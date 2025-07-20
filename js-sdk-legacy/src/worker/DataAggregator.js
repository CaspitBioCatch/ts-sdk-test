export default class DataAggregator {
    // Server communicator should not be used by the repository but until we remove the requestId responsibility from it
    // we have to do it.
    constructor(wupServerSessionState) {
        this._wupServerSessionState = wupServerSessionState;
        this.reset();
    }

    add(message) {
        const eventName = message.eventName;
        const data = message.data;

        if (!eventName) {
            throw new Error('Unable to add data message. Missing eventName field');
        }

        if (!data) {
            throw new Error('Unable to add data message. Missing data field');
        }

        this._isEmpty = false;
        this._dataObj[eventName] = this._dataObj[eventName] || [];
        this._dataObj[eventName].push(data);
    }

    /**
     * Takes current data from the aggregator and removes it from the aggregator.
     * Aggregator is reset to initial empty state
     * @returns {{static_fields, key_events, mouse_events}|*}
     */
    take() {
        if (!this._isEmpty) {
            this._dataObj.static_fields.push(
                ['requestId', this._wupServerSessionState.incrementRequestId()],
            );
        }

        const currentDataObj = this._dataObj;
        this.reset();

        return currentDataObj;
    }

    reset() {
        this._isEmpty = true;
        this._dataObj = this.getFreshDataObj();
    }

    isEmpty() {
        return this._isEmpty;
    }

    getFreshDataObj() {
        return {
            static_fields: [],
            key_events: [],
            mouse_events: [],
        };
    }
}
