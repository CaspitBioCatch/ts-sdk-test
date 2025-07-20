import BlobFactory from '../../../../src/main/technicalServices/BlobFactory';

describe('BlobFactory tests:', function () {
    const assert = chai.assert;

    describe('create tests:', function () {
        it('should create a blob using blob constructor', function () {
            const blobFactory = new BlobFactory();
            const blob = blobFactory.create('function(){}');

            assert.exists(blob);
        });

        it('should create a blob using MSBlobBuilder', function () {
            // If there is no MSBlobBuilder support we abort
            if (!window.MSBlobBuilder) {
                this.skip();
            }

            const originalBlobConstructor = window.Blob;
            window.Blob = null;

            const blobFactory = new BlobFactory();
            const blob = blobFactory.create('function(){}');

            assert.exists(blob);

            window.Blob = originalBlobConstructor;
        });

        it('should throw an exception if browser does not support blob creation', function () {
            const originalBlobConstructor = window.Blob;
            const originalMSBlobBuilder = window.MSBlobBuilder;

            window.Blob = null;
            window.MSBlobBuilder = null;

            const blobFactory = new BlobFactory();
            assert.throws(() => { return blobFactory.create('function(){}'); }, 'Unable to create Blob. Neither Blob nor BlobBuilder are supported by the browser.');

            window.Blob = originalBlobConstructor;
            window.MSBlobBuilder = originalMSBlobBuilder;
        });
    });
});
