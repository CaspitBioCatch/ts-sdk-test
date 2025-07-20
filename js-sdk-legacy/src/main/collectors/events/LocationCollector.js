/**
 * Collect the user permissions granted to the domain. The permissions are per domain and
 * different from browser to browser. There are 3 possible values: granted, prompt, denied
 *  Supported in: Chrome, FF, Opera
 *  collecting the Geolocation of the user only if the permissions is granted
 */
import DataCollector from '../DataCollector';

import Log from '../../technicalServices/log/Logger';
import { ConfigurationFields } from '../../core/configuration/ConfigurationFields';

const featureSettings = {
    configKey: 'isLocationEvents',
    isDefault: false,
    shouldRunPerContext: false,
    shouldRunPerSession: true,
    shouldRun: false,
    isFrameRelated: false,
    runInSlave: false,
    runInLean: false,
    runInUns: false,
    isRunning: false,
    instance: null,
};

export const EventStructure = ['eventSequence', 'timestamp', 'longitude', 'latitude', 'accuracy', 'speed', 'provider'];

export default class LocationCollector extends DataCollector {
    static getDefaultSettings() {
        return featureSettings;
    }

    constructor(dataQ, utils, configurationRepository, navigator = window.navigator) {
        super();
        this._configurationRepository = configurationRepository;
        this._locationEventsTimeoutMsec = this._configurationRepository.get(ConfigurationFields.locationEventsTimeoutMsec);
        this._utils = utils;
        this._dataQ = dataQ;
        this._navigator = navigator;
        this._watcherID = null;
        this._locationEventsTimeoutID = null;
    }

    startFeature() {
        this._subscribeForLocationIfPermissionGranted();
    }

    stopFeature() {
        this._unsubscribeFromLocationEvents();
    }

    updateFeatureConfig() {
        try {
            if ((this._configurationRepository.get(ConfigurationFields.locationEventsTimeoutMsec) !== this._locationEventsTimeoutMsec)) {
                this._locationEventsTimeoutMsec = this._configurationRepository.get(ConfigurationFields.locationEventsTimeoutMsec);
            }
        } catch (err) {
            Log.error(`LocationEvents: updateFeatureConfig failed, msg: ${err.message}`, err);
        }
    }

    _subscribeForLocationIfPermissionGranted() {
        if (this._navigator.permissions && this._navigator.permissions.query) {
            this._navigator.permissions.query({ name: 'geolocation' })
                .then((result) => {
                    if (result.state === 'granted') {
                        this._subscribeForLocationEvents();
                    } else {
                        Log.info('location permission is denied. Location data will not be collected');
                    }
                })
                .catch((ex) => {
                    Log.error(`Failed querying for geolocation permission. ${ex.message}`);
                });
        }
    }

    _subscribeForLocationEvents = () => {
        // Unsubscribe from any existing events
        this._unsubscribeFromLocationEvents();

        this._watcherID = this._navigator.geolocation.watchPosition(this._onGeoLocationPositionEvent, this._onGeoLocationPositionError);

        // Cancel an existing timeouts before setting up a new one
        this._clearLocationEventsTimeout();

        this._locationEventsTimeoutID = setTimeout(() => {
            this._unsubscribeFromLocationEvents();
        });
    };

    _unsubscribeFromLocationEvents = () => {
        this._clearLocationEventsTimeout();

        // If there is no watch we abort at this point.
        if (!this._watcherID) {
            return;
        }

        this._navigator.geolocation.clearWatch(this._watcherID);
        this._watcherID = null;
    };

    _clearLocationEventsTimeout() {
        if (this._locationEventsTimeoutID) {
            clearTimeout(this._locationEventsTimeoutID);
        }

        this._locationEventsTimeoutID = null;
    }

    _onGeoLocationPositionEvent = (position) => {
        this._sendData(position);
    };

    _onGeoLocationPositionError = (err) => {
        Log.warn(`Failed getting geolocation with code ${err.code}. ${err.message}`);
    };

    _sendData(pos) {
        const crd = pos.coords;
        const eventSeq = this._utils.StorageUtils.getAndUpdateEventSequenceNumber();
        const time = this.getEventTimestamp();
        this._dataQ.addToQueue('location_events',
            this._utils.convertToArrayByMap(EventStructure, {
                eventSequence: eventSeq,
                timestamp: time,
                longitude: crd.longitude || -1,
                latitude: crd.latitude || -1,
                accuracy: crd.accuracy || -1,
                speed: crd.speed || -1,
                provider: '',
            }));
    }
}
