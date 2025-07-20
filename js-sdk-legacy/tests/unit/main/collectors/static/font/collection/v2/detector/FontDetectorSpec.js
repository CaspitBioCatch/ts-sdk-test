import { assert } from 'chai';
import FontDetector from '../../../../../../../../../src/main/collectors/static/font/collection/v2/detector/FontDetector';

describe('FontDetector Abstract Class Tests', function () {
    let fontDetector;

    beforeEach(() => {
        // Create an instance of the abstract class
        fontDetector = new FontDetector();
    });

    describe('Method: detect', function () {
        it('should throw an error when detect is not implemented', async function () {
            try {
                await fontDetector.detect(['Arial'], 'sans-serif');
                assert.fail('Expected an error to be thrown');
            } catch (error) {
                assert.equal(error.message, 'Method "checkFontList" must be implemented.');
            }
        });

        it('should handle empty fontName array gracefully', async function () {
            try {
                await fontDetector.detect([], 'sans-serif');
                assert.fail('Expected an error to be thrown');
            } catch (error) {
                assert.equal(error.message, 'Method "checkFontList" must be implemented.');
            }
        });

        it('should handle null input gracefully', async function () {
            try {
                await fontDetector.detect(null, 'sans-serif');
                assert.fail('Expected an error to be thrown');
            } catch (error) {
                assert.equal(error.message, 'Method "checkFontList" must be implemented.');
            }
        });
    });

    describe('Method: release', function () {
        it('should throw an error when release is not implemented', function () {
            try {
                fontDetector.release();
                assert.fail('Expected an error to be thrown');
            } catch (error) {
                assert.equal(error.message, 'Method "release" must be implemented.');
            }
        });

        it('should handle multiple calls to release gracefully', function () {
            try {
                fontDetector.release();
            } catch (error) {
                assert.equal(error.message, 'Method "release" must be implemented.');
            }

            try {
                fontDetector.release();
            } catch (error) {
                assert.equal(error.message, 'Method "release" must be implemented.');
            }
        });
    });

    describe('Method: isSupported', function () {
        it('should throw an error when isSupported is not implemented', function () {
            try {
                fontDetector.isSupported();
                assert.fail('Expected an error to be thrown');
            } catch (error) {
                assert.equal(error.message, 'Method "isSupported" must be implemented.');
            }
        });

        it('should handle unexpected behavior gracefully', function () {
            try {
                fontDetector.isSupported();
                assert.fail('Expected an error to be thrown');
            } catch (error) {
                assert.equal(error.message, 'Method "isSupported" must be implemented.');
            }
        });
    });
});