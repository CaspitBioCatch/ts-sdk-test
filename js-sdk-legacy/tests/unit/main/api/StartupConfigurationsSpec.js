import { assert } from 'chai';
import StartupConfigurations from '../../../../src/main/api/StartupConfigurations';
import CollectionSettings from "../../../../src/main/api/CollectionSettings";

describe('StartupConfigurations tests:', function () {
    describe('getWupServerURL tests:', function () {
        it('getWupServerURL returns the URL', function () {
            const expectedURL = 'wupURL';
            const configurations = new StartupConfigurations(expectedURL);

            assert.equal(configurations.getWupServerURL(), expectedURL);
        });

        it('getWupServerURL returns undefined when not available', function () {
            const configurations = new StartupConfigurations();

            assert.notExists(configurations.getWupServerURL());
        });
    });

    describe('getLogServerURL tests:', function () {
        it('getLogServerURL returns the URL', function () {
            const expectedURL = 'logUrL';
            const configurations = new StartupConfigurations('', expectedURL);

            assert.equal(configurations.getLogServerURL(), expectedURL);
        });

        it('getLogServerURL returns undefined when not available', function () {
            const configurations = new StartupConfigurations();

            assert.notExists(configurations.getLogServerURL());
        });
    });

    describe('getEnableFramesProcessing tests:', function () {
        it('getEnableFramesProcessing returns the value', function () {
            const expectedValue = true;
            const configurations = new StartupConfigurations('', '', expectedValue);

            assert.equal(configurations.getEnableFramesProcessing(), expectedValue);
        });

        it('getEnableFramesProcessing returns undefined when not available', function () {
            const configurations = new StartupConfigurations();

            assert.notExists(configurations.getEnableFramesProcessing());
        });
    });

    describe('getEnableCustomElementsProcessing tests:', function () {
        it('getEnableCustomElementsProcessing returns the value', function () {
            const expectedValue = true;
            const configurations = new StartupConfigurations('', '', false, expectedValue);

            assert.equal(configurations.getEnableCustomElementsProcessing(), expectedValue);
        });

        it('getEnableCustomElementsProcessing returns undefined when not available', function () {
            const configurations = new StartupConfigurations();

            assert.notExists(configurations.getEnableCustomElementsProcessing());
        });
    });

    describe('getEnableSameSiteNoneAndSecureCookies tests:', function () {
        it('getEnableSameSiteNoneAndSecureCookies returns the value', function () {
            const expectedValue = true;
            const configurations = new StartupConfigurations('', '', false, '', expectedValue);

            assert.equal(configurations.getEnableSameSiteNoneAndSecureCookies(), expectedValue);
        });

        it('getEnableSameSiteNoneAndSecureCookies returns undefined when not available', function () {
            const configurations = new StartupConfigurations();

            assert.notExists(configurations.getEnableSameSiteNoneAndSecureCookies());
        });
    });

    describe('getCustomElementAttribute tests:', function () {
        it('getCustomElementAttribute returns the value', function () {
            const expectedValue = 'bobby-bob';
            const configurations = new StartupConfigurations('', '', false, expectedValue);

            assert.equal(configurations.getEnableCustomElementsProcessing(), expectedValue);
        });

        it('getEnableCustomElementsProcessing returns undefined when not available', function () {
            const configurations = new StartupConfigurations();

            assert.notExists(configurations.getEnableCustomElementsProcessing());
        });
    });

    describe('getUseUrlWorker tests:', function () {
        it('getUseUrlWorker returns the value', function () {
            const expectedValue = true;
            const configurations = new StartupConfigurations('', '', true, false, false, expectedValue);

            assert.equal(configurations.getUseUrlWorker(), expectedValue);
        });

        it('getUseUrlWorker returns undefined when not available', function () {
            const configurations = new StartupConfigurations();

            assert.notExists(configurations.getUseUrlWorker());
        });
    });

    describe('getWorkerUrl tests:', function () {
        it('getWorkerUrl returns the value', function () {
            const expectedValue = 'worker.js';
            const configurations = new StartupConfigurations('', '', true, false, true, false, expectedValue);

            assert.equal(configurations.getWorkerUrl(), expectedValue);
        });

        it('getWorkerUrl returns undefined when not available', function () {
            const configurations = new StartupConfigurations();

            assert.notExists(configurations.getWorkerUrl());
        });
    });

    describe('getClientSettings tests:', function () {
        it('getClientSettings returns the value', function () {
            const expectedValue = { 'bob': 'sfog' };
            const configurations = new StartupConfigurations('', '', null, false, true, false, null, false, expectedValue);

            assert.equal(configurations.getClientSettings(), expectedValue);
        });

        it('getClientSettings returns undefined when not available', function () {
            const configurations = new StartupConfigurations();

            assert.notExists(configurations.getClientSettings());
        });
    });

    describe('Client configurations tests:', function () {
        it('should return agentType value', function () {
            const settings = { mode: { agentType: 'secondary' } };
            const expectedValue = 'secondary';
            const configurations = new StartupConfigurations
                (
                    '',
                    '',
                    null,
                    false,
                    true,
                    false,
                    null,
                    false,
                    null,
                    new CollectionSettings(settings)

                );
            assert.equal(configurations.getCollectionSettings().getAgentType(), expectedValue);
        });

        it('enableStartupCustomerSessionId should be undefined', function () {
            const settings = {};
            const configurations = new StartupConfigurations
                (
                    '',
                    '',
                    null,
                    false,
                    true,
                    false,
                    null,
                    false,
                    null,
                    new CollectionSettings(settings)

                );
            assert.isUndefined(configurations.getEnableStartupCustomerSessionId(), 'should be undefined');
        });

        it('enableStartupCustomerSessionId should be true', function () {
            const settings = {};
            const configurations = new StartupConfigurations
                (
                    '',
                    '',
                    null,
                    false,
                    true,
                    false,
                    null,
                    false,
                    null,
                    new CollectionSettings(settings),
                    true

                );
            assert.isTrue(configurations.getEnableStartupCustomerSessionId(), 'should be true');
        });
    });

    describe('getMutationMaxChunkSize tests:', function () {
        it('should returns the value', function () {
            const expectedValue = 50;
            const configurations = new StartupConfigurations(
                '',
                '',
                null,
                false,
                true,
                false,
                null,
                false,
                null,
                new CollectionSettings({}),
                null,
                expectedValue,
                null
            );

            assert.equal(configurations.getMutationMaxChunkSize(), expectedValue);
        });

        it('sholud returns default when not available', function () {
            const configurations = new StartupConfigurations();

            assert.equal(configurations.getMutationMaxChunkSize(), 0);
        });
    });

    describe('getMutationChunkDelayMs tests:', function () {
        it('should returns the value', function () {
            const expectedValue = 1000;
            const configurations = new StartupConfigurations(
                '',
                '',
                null,
                false,
                true,
                false,
                null,
                false,
                null,
                new CollectionSettings({}),
                null,
                null,
                expectedValue,
            );

            assert.equal(configurations.getMutationChunkDelayMs(), expectedValue);
        });

        it('sholud returns default when not available', function () {
            const configurations = new StartupConfigurations();

            assert.equal(configurations.getMutationChunkDelayMs(), 100);
        });
    });
});
