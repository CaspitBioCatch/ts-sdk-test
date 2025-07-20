import BlobFactory from '../../../../src/main/technicalServices/BlobFactory';
import BlobUrlFactory from '../../../../src/main/technicalServices/BlobUrlFactory';

describe('BlobUrlFactory tests:', function () {
    const assert = chai.assert;

    describe('create tests:', function () {
        it('should create a blob url using window.URL', function () {
            const blobFactory = new BlobFactory();
            const blob = blobFactory.create('function(){}');

            const blobUrlFactory = new BlobUrlFactory();
            const blobUrl = blobUrlFactory.create(blob);

            assert.exists(blobUrl);
        });

        it('should create a blob url using window.webkitURL', function () {
            // If there is no webkitURL support we abort
            if (!window.webkitURL) {
                this.skip();
            }

            const originalUrlConstructor = window.URL;
            window.URL = null;

            const blobFactory = new BlobFactory();
            const blob = blobFactory.create('function(){}');

            const blobUrlFactory = new BlobUrlFactory();
            const blobUrl = blobUrlFactory.create(blob);

            assert.exists(blobUrl);

            window.URL = originalUrlConstructor;
        });

        it('should throw an exception if browser does not support blob url creation', function () {
            const originalUrlConstructor = window.URL;
            const originalWebkitUrlConstructor = window.webkitURL;

            window.URL = null;
            window.webkitURL = null;

            const blobFactory = new BlobFactory();
            const blob = blobFactory.create('function(){}');

            const blobUrlFactory = new BlobUrlFactory();
            assert.throws(() => { return blobUrlFactory.create(blob); }, 'Unable to create BlobUrl. Neither Url nor webkitUrl are supported by the browser');

            window.URL = originalUrlConstructor;
            window.webkitURL = originalWebkitUrlConstructor;
        });
    });
});
