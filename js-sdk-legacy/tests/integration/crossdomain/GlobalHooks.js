import { assert } from 'chai';
import ConfigurationChanger from './ConfigurationChanger';
import Client from '../../../src/main/Client';
import { BioCatchClient } from '../../../src/main/BioCatchClient';
import { DynamicCdApiLoader } from '../../../src/main/core/DynamicCdApiLoader';
import { ConfigMapper } from '../../../src/main/core/ConfigMapper';
import { ServerUrlResolver } from '../../../src/main/core/ServerUrlResolver';

const sinon = require('sinon');

/**
 * Global before hook which will run before all the tests. This is possible due to the fact that Mocha has a root describe scope...
 */
before(function (done) {
    this.timeout(20000);
    const mochaOnError = window.onerror;
    window.onerror = (message, source, lineno, colno, error) => {
        if (source.indexOf('blob:http://localhost:9876') !== -1
            && message.indexOf(' mutating the [[Prototype]] of an object will cause your code to run very slowly') !== -1) {
            console.error("Unable to load localhost:9876");
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
    cdConfLocation.setAttribute('content', 'https://wup-client.bc2.customers.biocatch.com/client/v3.1/web/wup?cid=client');
    // cdConfLocation.setAttribute('content', 'https://rnd-bcdn.s3.amazonaws.com/clientDev/iosCustomerConfig.json');
    document.body.appendChild(cdConfLocation);

    const input = document.createElement('input');
    input.setAttribute('id', 'txt1');
    input.type = 'password';
    input.textContent = 'BOB password';
    input.className = 'css-class-name'; // set the CSS class
    document.body.appendChild(input); // put it

    const input5 = document.createElement('input');
    input5.setAttribute('id', 'testTrigger');
    input5.value = 'trigger input 2';
    input5.name = 'testTriggtrigger input er';
    document.body.appendChild(input5); // put it into the DOM

    document.addEventListener('submit', function (e) {
        // do this so the page will not reload
        e.preventDefault();
    });


    this.client = new Client();
    new BioCatchClient(
      this.client,
      new DynamicCdApiLoader(),
      new ConfigMapper(),
      new ServerUrlResolver(),
      (startResult) => {
          assert.isTrue(startResult, 'failed to load system');
          this.systemBootstrapper = this.client.systemBootstrapper;
          sinon.spy(this.systemBootstrapper.getServerWorkerCommunicator(), 'sendAsync');
          // since it complicates the tests, we change it to 0
          this.systemBootstrapper.getConfigurationRepository().loadConfigurations({
              dataQPassWorkerInterval: 0,
              logLevel: 30, // in order that the log level in the client env will not affect the tests,
              isTapEvents: false, // We enable it only in the relevant tests to reduce "noise"
              isPinchZoomEvents: false, // We enable it only in the relevant tests to reduce "noise"
          });
          // for the updateConfiguration to take place
          setTimeout(done, 500);
      }
    );
});

afterEach(function () {
    // Reset to default value
    ConfigurationChanger.change(this.systemBootstrapper, {
        resetSessionApiThreshold: 20000,
    });
});
