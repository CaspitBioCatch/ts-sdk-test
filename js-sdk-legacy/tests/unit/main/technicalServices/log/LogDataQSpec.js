import WorkerCommunicator from "../../../../../src/main/technicalServices/WorkerCommunicator";
import ContextMgr from "../../../../../src/main/core/context/ContextMgr";
import LogDataQ from "../../../../../src/main/technicalServices/log/LogDataQ";
import DOMUtils from "../../../../../src/main/technicalServices/DOMUtils";
import {WorkerCommand} from "../../../../../src/main/events/WorkerCommand";
import {LogLevel} from "../../../../../src/main/technicalServices/log/LogLevel";
import sinon from "sinon";

describe('filterQueue by filter tests: ', function () {

    before(function () {
        this.workerCommunicator = sinon.createStubInstance(WorkerCommunicator);
        this.contextMgr = sinon.createStubInstance(ContextMgr);
        this.contextMgr.contextId = 123456;

        this.logDataQ = new LogDataQ(DOMUtils, this.workerCommunicator, this.contextMgr, 'a', WorkerCommand.sendDataCommand);

        const logDataQQ = this.logDataQ;
        sinon.stub(this.logDataQ, "add").callsFake(function fakeFn(data) {
            logDataQQ._Q.push({
                eventName: 'log',
                data,
                shouldFlush: false
            });
        });

    });

    beforeEach(function () {

        const dataInfo = {
            msg: 'info-test',
            url: 'url',
            level: LogLevel.INFO,
            sn: 1 };

        const dataWarn = {
            msg: 'warn-test',
            url: 'url',
            level: LogLevel.WARN,
            sn: 2 };

        const dataError = {
            msg: 'warn-test',
            url: 'url',
            level: LogLevel.ERROR,
            sn: 3 };

        const dataDebug = {
            msg: 'debug-test',
            url: 'url',
            level: LogLevel.DEBUG,
            sn: 4 };

        this.logDataQ.add(dataInfo);
        this.logDataQ.add(dataWarn);
        this.logDataQ.add(dataError);
        this.logDataQ.add(dataDebug);
    });

     afterEach(function () {
         this.logDataQ._Q = [];
     });

    it('filter out log queue by DEBUGֹ level', function () {
        assert.equal(this.logDataQ._Q.length, 4);

        this.logDataQ.filterOutByLogLevel(LogLevel.DEBUG);

        assert.equal(this.logDataQ._Q.length, 4);
        assert.equal(this.logDataQ._Q[0].data.level, LogLevel.INFO);
        assert.equal(this.logDataQ._Q[1].data.level, LogLevel.WARN);
        assert.equal(this.logDataQ._Q[2].data.level, LogLevel.ERROR);
        assert.equal(this.logDataQ._Q[3].data.level, LogLevel.DEBUG);

    });

    it('filter out log queue by INFO level', function () {
        assert.equal(this.logDataQ._Q.length, 4);

        this.logDataQ.filterOutByLogLevel(LogLevel.INFO);

        assert.equal(this.logDataQ._Q.length, 3);
        assert.equal(this.logDataQ._Q[0].data.level, LogLevel.INFO);
        assert.equal(this.logDataQ._Q[1].data.level, LogLevel.WARN);
        assert.equal(this.logDataQ._Q[2].data.level, LogLevel.ERROR);

    });

    it('filter out log queue by WARN level', function () {
        assert.equal(this.logDataQ._Q.length, 4);

        this.logDataQ.filterOutByLogLevel(LogLevel.WARN);

        assert.equal(this.logDataQ._Q.length, 2);
        assert.equal(this.logDataQ._Q[0].data.level, LogLevel.WARN);
        assert.equal(this.logDataQ._Q[1].data.level, LogLevel.ERROR);

    });

    it('filter out log queue by ERROR level', function () {
        assert.equal(this.logDataQ._Q.length, 4);

        this.logDataQ.filterOutByLogLevel(LogLevel.ERROR);
        assert.equal(this.logDataQ._Q.length, 1);

        assert.equal(this.logDataQ._Q[0].data.level, LogLevel.ERROR);

    });

    it('filter out log queue by CRITICAL level, log queue remains empty', function () {
        assert.equal(this.logDataQ._Q.length, 4);

        this.logDataQ.filterOutByLogLevel(LogLevel.CRITICAL);
        assert.equal(this.logDataQ._Q.length, 0);

    });

    it('multiple messages of same level are filtered out', function () {
        const dataDebug2 = {
            msg: 'debug2-test',
            url: 'url',
            level: LogLevel.DEBUG,
            sn: 5 };
        const dataInfo2 = {
            msg: 'info2-test',
            url: 'url',
            level: LogLevel.INFO,
            sn: 5 };

        this.logDataQ.add(dataDebug2);
        this.logDataQ.add(dataInfo2);

        assert.equal(this.logDataQ._Q.length, 6);

        this.logDataQ.filterOutByLogLevel(LogLevel.INFO);
        assert.equal(this.logDataQ._Q.length, 4);
        assert.equal(this.logDataQ._Q[0].data.level, LogLevel.INFO);
        assert.equal(this.logDataQ._Q[1].data.level, LogLevel.WARN);
        assert.equal(this.logDataQ._Q[2].data.level, LogLevel.ERROR);
        assert.equal(this.logDataQ._Q[3].data.level, LogLevel.INFO);

    });
});
