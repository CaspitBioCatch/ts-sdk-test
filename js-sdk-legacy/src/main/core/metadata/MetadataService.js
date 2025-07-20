import Log from '../../technicalServices/log/Logger';

export default class MetadataService {
    _dataQ;

    constructor(configurationRepository, dataQ) {
        this._configurationRepository = configurationRepository;
        this._dataQ = dataQ;
        this._isEnabled = this._configurationRepository.get('isCustMetadata');
    }

    /**
     * Receive customer specific data from customer api implementation
     * and send to server
     * @param msg - the msg received from cdApi contains type and data
     */
    onCustomerMetadata(msg) {
        if (this._isEnabled === undefined || this._isEnabled == null || this._isEnabled === true) {
            Log.debug('HandleMetadata:onCustomerMetadata. data=' + JSON.stringify(msg.data));
            if (msg.data) {
                this._dataQ.addToQueue('customer_metadata', [null, msg.data]);
            }
        }
    }

    onConfigUpdate() {
        this._isEnabled = this._configurationRepository.get('isCustMetadata');
    }
}
