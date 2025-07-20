//TODO: use this class to store client settings. All client settings are currently stored in the StartupConfigurations class.
// enableFlush, enableCoordinatesMasking, enableWupMessagesHashing
export default class ClientSettings {
    constructor(enableRestart) {
        this.enableRestart = enableRestart;
    }
    getEnableRestart() {
        return this.enableRestart;
    }
}
