describe('DefaultCustomerApi tests:', function () {
    describe('performInit tests: ', function () {
        beforeEach(function () {
            this.xhr = sinon.useFakeXMLHttpRequest();
            this.requests = [];
            const me = this;
            this.xhr.onCreate = function (xhr) {
                me.requests.push(xhr);
                xhr.autoRespondAfter = 1;
                xhr.autoRespond = true;
            };
            // So we identify that XHR with cors support is available
            this.xhr.prototype.withCredentials = true;

            this.getCustomerSidOrig = cdApi.getCustomerSessionID;
            cdApi.getCustomerSessionID = sinon.stub();

            this.getCustomerConfLocationOrig = cdApi.getCustomerConfigLocation;
            cdApi.getCustomerConfigLocation = sinon.stub();

            localStorage.removeItem('cdInitData');
        });

        afterEach(function () {
            this.xhr.restore();
            this.requests = [];

            cdApi.getCustomerSessionID = this.getCustomerSidOrig;
            cdApi.getCustomerConfigLocation = this.getCustomerConfLocationOrig;
        });
    });
});
