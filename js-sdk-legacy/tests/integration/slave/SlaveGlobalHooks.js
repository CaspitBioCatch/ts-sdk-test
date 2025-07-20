/**
 *Global before hook which will run before all the tests. This is possible due to the fact that Mocha has a root describe scope...
 */
before(function (done) {
    this.timeout(20000);
    const mochaOnError = window.onerror;
    window.onerror = (message, source, lineno, colno, error) => {
        if (source.indexOf('blob:http://localhost:9876') !== -1
            && message.indexOf(' mutating the [[Prototype]] of an object will cause your code to run very slowly') !== -1) {
            return false;
        }
        // call the original mocha function
        mochaOnError(message, source, lineno, colno, error);
    };

    this._my_csid = document.createElement('meta');
    this._my_csid.setAttribute('name', 'bcsid');
    this._my_csid.setAttribute('content', 'customerSessionNumber2.2');
    document.body.appendChild(this._my_csid);

    const cdConfLocation = document.createElement('meta');
    cdConfLocation.setAttribute('name', 'cdConfLocation');
    cdConfLocation.setAttribute('content',
'https://wup-client.bc2.customers.biocatch.com/client/v3.1/web/wup?cid=client');
    // cdConfLocation.setAttribute('content', 'https://rnd-bcdn.s3.amazonaws.com/clientDev/iosCustomerConfig.json');
    document.body.appendChild(cdConfLocation);

    document.addEventListener('submit', function (e) {
        // do this so the page will not reload
        e.preventDefault();
    });

    const application = new cdwpb.default.Application();
    this.slaveLoader = application.start();
    const configurations = this.slaveLoader._configurationRepository.getAll();
    this.slaveLoader.getParentCommunicator().messageEventHandler._isHandshakeCompleted = true;
    configurations.isPinchZoomEvents = false;
    configurations.collectSelectElementBlurAndFocusEvents = true;

    window.postMessage({
        'msgType': 'updateSlaveConf',
        'data': configurations,
        'isNative': true,
    }, '*');

    done();
});
