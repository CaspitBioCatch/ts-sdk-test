import { MessageBusEventType } from './MessageBusEventType';
import Log from '../technicalServices/log/Logger';

export default class ApiSetCustomerBrandEventHandler {
    /**
     *
     * @param messageBus {MessageBus}
     * @param brandService {BrandService}
     */
    constructor(messageBus, brandService) {
        this._messageBus = messageBus;
        this._brandService = brandService;

        this._messageBus.subscribe(MessageBusEventType.ApiSetCustomerBrand, this._handle.bind(this))
    }

    _handle(event) {
        if(!event.brand) {
            Log.warn(`Received an empty brand name. Ignoring the API call`);
            return;
        }

        this._brandService.set(event.brand);
    }
}
