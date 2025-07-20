import { WorkerCommand } from '../../events/WorkerCommand';
import Log from '../../technicalServices/log/Logger';

export default class BrandService {
    /**
     *
     * @param workerCommunicator
     * @param brandRepository {BrandRepository}
     */
    constructor(workerCommunicator, brandRepository) {
        this._workerCommunicator = workerCommunicator;
        this._brandRepository = brandRepository;
    }

    set(brand) {
        if(!this._validateBrand(brand)) {
            return;
        }

        this._brandRepository.set(brand);

        this._workerCommunicator.sendAsync(WorkerCommand.updateBrandCommand, { brand });
    }

    update() {
        const foundBrand = this._brandRepository.get();
        if(foundBrand) {
            this.set(foundBrand);
        }
    }

    _validateBrand(brand) {
        if (brand.length > 200) {
            Log.warn(`The received brand name length is greater than 200. It is illegal. Ignoring the API call`);
            return false;
        }

        if(!/^[a-zA-Z0-9.\-,_ ]+$/.test(brand)) {
            Log.warn(`The received brand contains illegal characters. The legal characters are: A-Za-z0-9.-,_ and space. Ignoring the API call`);
            return false;
        }
        return true;
    }
}
