/**
 * Factory for creating an http request object. If XmlHttpRequest with cors support is available it is used. Otherwise if XDomainRequest is supported it is used.
 * If both are not supported we use XmlHttpRequest...
 */
export default class HttpRequestFactory {
    static create() {
        // Notice that the order of the conditions is important!
        // Best option is if we have XMLHttpRequest with CORS support
        if (self.XMLHttpRequest && Object.prototype.hasOwnProperty.call(XMLHttpRequest.prototype, 'withCredentials')) {
            return new XMLHttpRequest();
        }

        if (self.XDomainRequest) { // Second option is if we have XDomainRequest which also supports CORS (God bless Microsoft)
            return new XDomainRequest();
        }

        if (!self.XMLHttpRequest) {
            throw new Error('There is no supported http request object');
        }

        // If non of the above is available and the XmlHttpRequest is available we use it without the CORS support
        return new XMLHttpRequest();
    }
}
