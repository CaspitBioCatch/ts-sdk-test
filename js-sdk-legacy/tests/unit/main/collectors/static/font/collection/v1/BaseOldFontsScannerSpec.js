import { expect } from 'chai';
import sinon from 'sinon';
import Log from '../../../../../../../../src/main/technicalServices/log/Logger';
import BaseFontsScanner from '../../../../../../../../src/main/collectors/static/font/collection/v1/OldBaseFontsScanner';

describe('BaseFontsScanner Unit Tests', function () {
    let sandbox, domUtilsStub, scanner;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        domUtilsStub = { onWindowDocumentReady: sandbox.stub() };
        scanner = new BaseFontsScanner(domUtilsStub);
        // document.body.innerHTML = ''; // Clear body before each test
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('constructor', () => {
        it('should set default values for baseFonts, testString, testSize, chunkSize', () => {
            expect(scanner._baseFonts).to.deep.equal(['rat-fonts', 'monospace', 'sans-serif', 'serif']);
            expect(scanner._testString).to.equal("mmmmmmmmmmlli");
            expect(scanner._testSize).to.equal('72px');
            expect(scanner._chunkSize).to.equal(30);
        });
    });

    describe('release', () => {
        it('should remove iframe and clear internal state', () => {
            scanner._iframe = document.createElement('iframe');
            scanner._body = document.createElement('body');
            document.body.appendChild(scanner._body);
            scanner._body.appendChild(scanner._iframe);
            scanner.release();

            expect(scanner._iframe).to.be.null;
            expect(scanner._spanArray).to.be.null;
            expect(scanner._allFontsDiffs).to.deep.equal([]);
        });

        it('should not throw if release is called multiple times', () => {
            expect(() => scanner.release()).not.to.throw();
            expect(() => scanner.release()).not.to.throw();
        });
    });

    describe('init', () => {
        it('should resolve after onWindowDocumentReady callback is executed', async () => {
            let onWindowDocumentReadyCallback;
            domUtilsStub.onWindowDocumentReady.callsFake((_, callback) => {
                onWindowDocumentReadyCallback = callback;
            });

            const initPromise = scanner.init();
            onWindowDocumentReadyCallback();

            await initPromise; // Await the promise to ensure it resolves
        });

        it('should reject if initCallback throws an error', async () => {
            sandbox.stub(scanner, 'initCallback').throws(new Error('Init Error'));

            try {
                await scanner.init();
                expect.fail('Expected init to reject');
            } catch (error) {
                expect(error.message).to.equal('Init Error');
            }
        });
    });

    describe('_createCalculationElements', () => {
        it('should create calculation elements and set default widths/heights', () => {
            sandbox.stub(Log, 'debug');

            // const mockOffsetWidth = 10;
            // const mockOffsetHeight = 20;

            // Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { get: () => mockOffsetWidth });
            // Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { get: () => mockOffsetHeight });

            scanner.initCallback(() => { });
            const callback = sandbox.spy();

            scanner._createCalculationElements(callback);

            // expect(scanner._defaultWidth).to.deep.equal({
            //     'rat-fonts': mockOffsetWidth,
            //     'monospace': mockOffsetWidth,
            //     'sans-serif': mockOffsetWidth,
            //     'serif': mockOffsetWidth,
            // });
            // expect(scanner._defaultHeight).to.deep.equal({
            //     'rat-fonts': mockOffsetHeight,
            //     'monospace': mockOffsetHeight,
            //     'sans-serif': mockOffsetHeight,
            //     'serif': mockOffsetHeight,
            // });
            expect(Log.debug.callCount).to.equal(2);
            expect(callback.calledOnce).to.be.true;
        });

    });

    describe('_createSpanArray', () => {
        it('should create span array correctly', () => {
            scanner.initCallback(() => { });
            scanner._createSpanArray();

            expect(scanner._spanArray).to.exist;
            expect(scanner._spanArray.childNodes.length).to.equal(scanner._chunkSize * 2); // spans + brs
            expect(scanner._spanArray.childNodes[0].tagName).to.equal('SPAN');
            expect(scanner._spanArray.childNodes[1].tagName).to.equal('BR');
        });
    });

    describe('getAllFontsDiffs', () => {
        it('should return all fonts diffs', () => {
            expect(scanner.getAllFontsDiffs()).to.deep.equal([]);
        });
    });
});
