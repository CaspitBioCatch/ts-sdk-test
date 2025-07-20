import assert from 'assert';
import ClientSettings from "../../../../src/main/api/ClientSettings";

describe('ClientSettings', () => {
    describe('constructor', () => {
        it('should set enableRestart property', () => {
            const enableRestartValue = true;
            const clientSettings = new ClientSettings(enableRestartValue);
            assert.strictEqual(clientSettings.enableRestart, enableRestartValue);
        });
    });

    describe('getEnableRestart', () => {
        it('should return the current value of enableRestart', () => {
            const enableRestartValue = false;
            const clientSettings = new ClientSettings(enableRestartValue);
            assert.strictEqual(clientSettings.getEnableRestart(), enableRestartValue);
        });
    });
});
