export default class LogRequestBodyBuilder {
    build(logMessage) {
        return logMessage.getInternalMessage();
    }
}
