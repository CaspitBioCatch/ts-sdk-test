import { MessageBusEventType } from '../../main/events/MessageBusEventType';
import Log from '../../main/technicalServices/log/Logger';

export default class WupResponseProcessor {
    constructor(wupServerSessionState,
                messageBus,
                configurationRepository) {
        this._wupServerSessionState = wupServerSessionState;
        this._messageBus = messageBus;
        this._configurationRepository = configurationRepository;
    }

    process(response, processConfigurations) {
         //here we are getting updates from the server and checks the nature of message and react upon
        let publishConfigurationLoadedEvent = false;
        if (processConfigurations) {

            this._wupServerSessionState.markConfigurationReceived();
            // Update the worker instance configurations
            this._configurationRepository.loadConfigurations(response);
            publishConfigurationLoadedEvent = true;
        }

        // Update sts if we received an updated one
        if (response.sts) {
            this._wupServerSessionState.setSts(response.sts);
        }

        // Update std if we received an updated one
        if (response.std) {
            this._wupServerSessionState.setStd(response.std);
        }

        if(response.ott){
            this._wupServerSessionState.setOtt(response.ott);
        }

        // If session was reset and we have a new sid
        if (response.reset_session && response.new_sid) {
            this._wupServerSessionState.setSid(response.new_sid);
        }

        // If we get restored muid from the server
        if(response.rmd){
           this._wupServerSessionState.setMuid(response.rmd);
            this._messageBus.publish(MessageBusEventType.ServerRestoredMuidEvent,response.rmd);
        }

        if(response.agent_id){
            this._wupServerSessionState.setAgentId(response.agent_id);
            this._messageBus.publish(MessageBusEventType.ServerNewAgentIdEvent,response.agent_id);
        }

        // Notify on session state change
        this._messageBus.publish(MessageBusEventType.ServerStateUpdatedEvent, {
            requestId: this._wupServerSessionState.getRequestId(),
            sid: this._wupServerSessionState.getSid(),
            sts: this._wupServerSessionState.getSts(),
            std: this._wupServerSessionState.getStd(),
            ott: this._wupServerSessionState.getOtt(),
        });

        // Publish the configuration loaded event if required
        if (publishConfigurationLoadedEvent) {
            this._messageBus.publish(MessageBusEventType.ConfigurationLoadedEvent, this._configurationRepository);
        }

        // If session was reset we publish a bus event to handle the case
        if (response.reset_session) {
            if (response.new_sid) {
                this._messageBus.publish(MessageBusEventType.NewSessionStartedEvent, response.new_sid);
            } else {
                Log.warn('Received a reset session flag from the server without a new sid. Ignoring reset.');
            }
        }

        if (response.nextWupInterval) {
            if (response.nextWupInterval !== this._wupServerSessionState.getWupDispatchRate()) {
                this._wupServerSessionState.setWupDispatchRate(response.nextWupInterval);

                this._messageBus.publish(MessageBusEventType.WupDispatchRateUpdatedEvent, this._wupServerSessionState.getWupDispatchRate());
            }
        } else {
            Log.warn(`Received an invalid nextWupInterval value of ${response.nextWupInterval}. Ignoring value.`);
        }
    }
}
