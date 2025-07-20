import sinon from "sinon";
import LogBridge from "../../../../../src/main/technicalServices/log/LogBridge";
import LogAggregator from "../../../../../src/worker/LogAggregator";
import {LogLevel} from "../../../../../src/main/technicalServices/log/LogLevel";

describe('LogBridge tests: ', function () {

    it('logLevel is updated in LogAggregator', function () {
        this.logAggregator = new LogAggregator();
        this.logBridge = new LogBridge(this.logAggregator, '');

        this.logBridge.setLogLevel(LogLevel.DEBUG);

        assert.equal(this.logAggregator._logLevel, LogLevel.DEBUG, 'logLevel; was not set as expected');
    });

    it('filterOutByLogLevel is called on LogAggregator', function () {

        this.logAggregator = sinon.createStubInstance(LogAggregator);
        this.logBridge = new LogBridge(this.logAggregator, '');
        this.logBridge.clearLogEntriesByLogLevel(LogLevel.DEBUG);

        assert.isTrue(this.logAggregator.filterOutByLogLevel.calledOnce, ' LogAggregator.filterOut by logLevel not called as expected');
    });

    it('send to logAggregator successfully', function() {

        this.logAggregator = sinon.createStubInstance(LogAggregator);
        this.logBridge = new LogBridge(this.logAggregator, 'mock_url', 'mock_prefix');

        const sessionIdentifiers = { identifier1: 'identifier1_value', identifier2: 'identifier2_value' };

        this.logBridge.log('mock_message', LogLevel.DEBUG, sessionIdentifiers);

        assert.isTrue(this.logAggregator.add.calledWith({
            eventName: 'log',
            data: {
                msg: 'mock_prefix' + 'mock_message',
                ...sessionIdentifiers,
                url: 'mock_url',
                level: LogLevel.DEBUG,
                sn: 0
            }
        }));
    });
});