import { MessageBusEventType } from './MessageBusEventType';

export default class ApiCustomerMetadataEventHandler {
    constructor(messageBus, handleMetadata) {
        this._messageBus = messageBus;
        this._handleMetadata = handleMetadata;

        this._messageBus.subscribe(MessageBusEventType.ApiCustomerMetadataEvent, this._handle.bind(this));
    }

    _handle(event) {
        this._handleMetadata.onCustomerMetadata(event);
    }
}
