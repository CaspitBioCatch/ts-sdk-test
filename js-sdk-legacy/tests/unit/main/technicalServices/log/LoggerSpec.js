import { Logger } from '../../../../../src/main/technicalServices/log/Logger';
import { LogLevel } from '../../../../../src/main/technicalServices/log/LogLevel';
import ConfigurationRepository from '../../../../../src/main/core/configuration/ConfigurationRepository';
import { ConfigurationFields } from '../../../../../src/main/core/configuration/ConfigurationFields';
import LogBridge from "../../../../../src/main/technicalServices/log/LogBridge";

describe('Logger tests:', function () {
    const assert = chai.assert;

    beforeEach(function () {
        this.logBridge = sinon.createStubInstance(LogBridge);
    });

    afterEach(function () {
        this.logBridge = null;
    });

    describe('Logger levels tests:', function () {
        it('Logger Ctor default level should be info', function () {
            const logger = new Logger(this.logBridge);
            logger.debug('a');
            logger.trace('a');
            assert.isTrue(this.logBridge.log.notCalled, 'log was passed to bridge although it should not');
            logger.info('a');
            logger.warn('c');
            logger.error('c');
            assert.isTrue(this.logBridge.log.calledThrice, 'log was not passed to bridge it should');
        });

        it('Logger Ctor with level should set the level correctly', function () {
            const logger = new Logger(this.logBridge, LogLevel.ERROR);
            logger.info('a');
            logger.debug('a');
            logger.trace('a');
            logger.warn('c');
            assert.isTrue(this.logBridge.log.notCalled, 'log was passed to bridge although it should not');
            logger.error('c');
            assert.isTrue(this.logBridge.log.calledOnce, 'log was not passed to bridge although it should');
        });

        it('Logger should not send logs with level of OFF', function () {
            const logger = new Logger(this.logBridge, LogLevel.OFF);
            logger.info('a');
            logger.debug('a');
            logger.trace('a');
            logger.warn('c');
            logger.error('c');
            assert.isTrue(this.logBridge.log.notCalled, 'log was passed to bridge although it should not');
        });
    });

    describe('warn and error tests: ', function () {
        it('should not add stack to message when no exception is given: ', function () {
            const logger = new Logger(this.logBridge);
            logger.warn('log1');
            assert.isTrue(this.logBridge.log.calledOnce, 'log bridge was not called');
            assert.isTrue(this.logBridge.log.calledWith('log1', LogLevel.WARN),
                'log bridge was called with wrong level or msg');

            logger.error('log2');
            assert.isTrue(this.logBridge.log.calledTwice, 'log bridge was not called');
            assert.isTrue(this.logBridge.log.calledWith('log2', LogLevel.ERROR),
                'log bridge was called with wrong level or msg');
        });

        it('should add stack to message when exception is given: ', function () {
            const logger = new Logger(this.logBridge);
            const ex = { stack: null };
            ex.stack = 'sss';
            logger.warn('log1', ex);
            assert.isTrue(this.logBridge.log.calledOnce, 'log bridge was not called');
            assert.equal('log1 ;stack: sss', this.logBridge.log.getCall(0).args[0], 'log bridge was called with wrong msg');
            assert.equal(LogLevel.WARN, this.logBridge.log.getCall(0).args[1],
                'log bridge was called with wrong level');

            ex.stack = 'ddd';
            logger.error('log2', ex);
            assert.isTrue(this.logBridge.log.calledTwice, 'log bridge was not called');
            assert.equal('log2 ;stack: ddd', this.logBridge.log.getCall(1).args[0], 'log bridge was called with wrong msg');
            assert.equal(LogLevel.ERROR, this.logBridge.log.getCall(1).args[1],
                'log bridge was called with wrong level');
        });
    });

    describe('trace debug and info tests: ', function () {
        it('should call the bridge with the msg passed', function () {
            const logger = new Logger(this.logBridge, LogLevel.DEBUG);
            logger.trace('t');
            logger.debug('d');
            logger.info('i');
            assert.isTrue(this.logBridge.log.calledThrice, 'log bridge was not called 3 times');
            assert.isTrue(this.logBridge.log.calledWith('t'), 'log bridge was not called with t');
            assert.isTrue(this.logBridge.log.calledWith('d'), 'log bridge was not called with d');
            assert.isTrue(this.logBridge.log.calledWith('i'), 'log bridge was not called with i');
        });
    });

    describe('updateLogConfig tests: ', function () {
        it('should update the log level: ', function () {
            const logger = new Logger(this.logBridge, LogLevel.DEBUG);
            logger.trace('t');
            logger.debug('d');
            logger.info('i');
            assert.isTrue(this.logBridge.log.calledThrice, 'log bridge was not called 3 times');
            this.logBridge.log.reset();

            const confMgr = sinon.stub(new ConfigurationRepository());
            confMgr.get.withArgs(ConfigurationFields.logLevel).returns(LogLevel.ERROR);
            logger.updateLogConfig(confMgr);

            assert.isTrue(this.logBridge.setLogLevel.calledOnce, 'logBridge.setLogLevel was not called');
            assert.isTrue(this.logBridge.clearLogEntriesByLogLevel.calledOnce, 'logBridge.clearLogEntriesByLogLevel was not called');

            confMgr.get.withArgs(ConfigurationFields.logLevel).returns(null);
            logger.updateLogConfig(confMgr);
            logger.trace('t');
            logger.debug('d');
            logger.info('i');
            assert.isTrue(this.logBridge.log.notCalled, 'log bridge was called although is should not');

            logger.error('e');
            assert.isTrue(this.logBridge.log.calledOnce, 'log bridge was not called once');
        });
    });

    describe('attachSessionIdentifiers tests: ', function() {
        it('should send to log bridge the provided sessionIdentifiers: ', function() {
            const logger = new Logger(this.logBridge, LogLevel.DEBUG);

            let identifiers = {
                identifier1: 'identifier1_value',
                identifier2: 'identifier2_value',
                identifier3: 'identifier3_value',
            };

            logger.attachSessionIdentifiers(identifiers);

            logger.debug('some message');

            assert.isTrue(this.logBridge.log.calledWith('some message', LogLevel.DEBUG, identifiers));
        });

        it('should override existing sessionIdentifier keys: ', function() {
            const logger = new Logger(this.logBridge, LogLevel.DEBUG);

            let identifiers = {
                identifier1: 'identifier1_value',
                identifier2: 'identifier2_value',
                identifier3: 'identifier3_value',
            };

            logger.attachSessionIdentifiers(identifiers);

            logger.attachSessionIdentifiers({
                identifier2: 'identifier2_value_override',
                identifier4: 'identifier4_value',
            });

            // expected identifier4 to be added, and identifier2 to override value.
            let expectedIdentifiers =  {
                identifier1: 'identifier1_value',
                identifier2: 'identifier2_value_override',
                identifier3: 'identifier3_value',
                identifier4: 'identifier4_value',
            };

            logger.debug('some message');

            assert.isTrue(this.logBridge.log.calledWith('some message', LogLevel.DEBUG, expectedIdentifiers));
        });

        it('should send to log bridge empty sessionIdentifiers: if not provided ', function() {
            const logger = new Logger(this.logBridge, LogLevel.DEBUG);

            // Intentionally don't call  logger.attachSessionIdentifiers()

            logger.debug('some message');

            assert.isTrue(this.logBridge.log.calledWith('some message', LogLevel.DEBUG, {}));
        });
    });
});
