import { MasterSlaveMessage } from '../../../src/slave/MasterSlaveMessage';

export class SlaveTestUtils {
    static isDataFromSlave(message) {
        return message.msgType === MasterSlaveMessage.dataFromSlave;
    }
}
