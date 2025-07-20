import { assert } from 'chai';
import PrintEventCollector, { PrintEventType } from '../../../../../src/main/collectors/events/PrintEventCollector';
import CDUtils from '../../../../../src/main/technicalServices/CDUtils';
import { EventStructure as PrintEventStructure } from '../../../../../src/main/collectors/events/PrintEventCollector';
import DataQ from '../../../../../src/main/technicalServices/DataQ';

describe('PrintEventCollector tests:', function () {
    describe('Should detect print dialog state changes:', function () {
        beforeEach(function () {
            this.dataQ = sinon.createStubInstance(DataQ);
        });

        it('Should detect opening and closing of the print dialog', function () {
            const PrintEventsFeature = new PrintEventCollector(CDUtils, this.dataQ);
            PrintEventsFeature.startFeature(self);

            // Create event that dispatches the "opening print dialog" action
            const onBeforePrintEvent = document.createEvent('HTMLEvents');
            onBeforePrintEvent.initEvent('beforeprint', true, true);
            window.dispatchEvent(onBeforePrintEvent);

            assert.isTrue(this.dataQ.addToQueue.calledOnce, 'addToQueue called more than once, or not at all');

            let data = this.dataQ.addToQueue.getCall(0).args[1];
            assert.equal(
                data[PrintEventStructure.indexOf('printDialogState') + 1],
                PrintEventType.printDialogOpened, // 1 = print dialog OPENED state
                'Print dialog state should be "opened"',
            );

            // Create event that dispatches the "closing print dialog" action
            const onAfterPrintEvent = document.createEvent('HTMLEvents');
            onAfterPrintEvent.initEvent('focus', true, true);
            window.dispatchEvent(onAfterPrintEvent);

            assert.isTrue(this.dataQ.addToQueue.calledTwice, 'should have been called twice until now');
            data = this.dataQ.addToQueue.getCall(1).args[1];
            assert.equal(
                data[PrintEventStructure.indexOf('printDialogState') + 1],
                PrintEventType.printDialogClosed, // -1 = print dialog CLOSED state
                'Print dialog state should be "closed"',
            );

            PrintEventsFeature.stopFeature(self);
        });
    });
});
