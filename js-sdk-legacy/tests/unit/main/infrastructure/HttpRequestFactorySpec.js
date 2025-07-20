import { assert } from 'chai';
import HttpRequestFactory from '../../../../src/main/infrastructure/HttpRequestFactory';

/* eslint-disable no-extend-native */
describe('HttpRequestFactory tests:', function () {
    describe('create tests:', function () {
        it('should create an XmlHttpRequest', function () {
            if (!self.XMLHttpRequest) {
                this.skip();
                return;
            }

            const xmlHttpRequest = HttpRequestFactory.create();

            assert.exists(xmlHttpRequest);
            assert.isTrue(xmlHttpRequest instanceof XMLHttpRequest);
        });

        it('should create an XDomainRequest if available and CORS is unavailable in XmlHttpRequest', function () {
            if (!self.XMLHttpRequest || Object.prototype.hasOwnProperty.call(XMLHttpRequest.prototype, 'withCredentials') || !self.XDomainRequest) {
                this.skip();
                return;
            }

            const xmlHttpRequest = HttpRequestFactory.create();

            assert.exists(xmlHttpRequest);
            assert.isTrue(xmlHttpRequest instanceof XDomainRequest);
        });

        it('should create an XDomainRequest if available and XmlHttpRequest is unavailable', function () {
            if (!self.XDomainRequest) {
                this.skip();
                return;
            }

            const originalXmlHttpRequest = self.XMLHttpRequest;
            self.XMLHttpRequest = null;

            const xmlHttpRequest = HttpRequestFactory.create();

            assert.exists(xmlHttpRequest);
            assert.isTrue(xmlHttpRequest instanceof XDomainRequest);

            self.XMLHttpRequest = originalXmlHttpRequest;
        });

        it('should create an XDomainRequest if XmlHttpRequest does not support CORS and XDomainRequest exists', function () {
            if (!self.XDomainRequest) {
                this.skip();
                return;
            }

            const originalHasOwnProperty = Object.prototype.hasOwnProperty;
            Object.prototype.hasOwnProperty = () => {
                return false;
            };

            const xDomainRequest = HttpRequestFactory.create();

            assert.exists(xDomainRequest);
            assert.isTrue(xDomainRequest instanceof self.XDomainRequest);

            Object.prototype.hasOwnProperty = originalHasOwnProperty;
        });

        it('should create an XmlHttpRequest if XmlHttpRequest does not support CORS and XDomainRequest is unavailable', function () {
            if (self.XDomainRequest) {
                this.skip();
                return;
            }

            const originalHasOwnProperty = Object.prototype.hasOwnProperty;
            Object.prototype.hasOwnProperty = () => {
                return false;
            };

            const xmlHttpRequest = HttpRequestFactory.create();

            assert.exists(xmlHttpRequest);
            assert.isTrue(xmlHttpRequest instanceof self.XMLHttpRequest);

            Object.prototype.hasOwnProperty = originalHasOwnProperty;
        });

        it('should throw an exception when XmlHttpRequest and XDomainRequest are both unavailable', function () {
            const originalXmlHttpRequest = self.XMLHttpRequest;
            self.XMLHttpRequest = null;

            const originalXDomainRequest = self.XDomainRequest;
            self.XDomainRequest = null;

            assert.throws(() => { return HttpRequestFactory.create(); }, 'There is no supported http request object');

            self.XMLHttpRequest = originalXmlHttpRequest;
            self.XDomainRequest = originalXDomainRequest;
        });
    });
});
/* eslint-enable no-extend-native */
