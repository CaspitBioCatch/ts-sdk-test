import { expect } from 'chai';
import sinon from 'sinon';
import { DynamicCdApiLoader } from '../../../../src/main/core/DynamicCdApiLoader';

describe('DynamicCdApiLoader tests:', () => {
  let dynamicCdApiLoader;
  let windowMock;

  beforeEach(() => {
    dynamicCdApiLoader = new DynamicCdApiLoader();
    windowMock = {
      postMessage: sinon.spy(),
      addEventListener: sinon.spy(),
      attachEvent: sinon.spy(),
      location: { href: 'http://mockurl.com' }
    };
  });

  it('should attach cdApi to window and register event listeners', () => {
    dynamicCdApiLoader.attachCdApi(windowMock, 'mockSessionId');

    expect(windowMock.cdApi).to.exist;
    expect(windowMock.cdApi.listenToEvents).to.be.a('function');
    expect(windowMock.addEventListener.calledOnce).to.be.true;
    expect(windowMock.addEventListener.firstCall.args[0]).to.equal('message');
  });

  it('should call getCustomerSessionID and pass session ID to the callback', () => {
    dynamicCdApiLoader.attachCdApi(windowMock, 'mockSessionId');
    const callback = sinon.spy();

    windowMock.cdApi.getCustomerSessionID(callback);

    expect(callback.calledWith('mockSessionId')).to.be.true;
  });

  it('should call getCustomerSessionID with undefined if session ID is not provided', () => {
    dynamicCdApiLoader.attachCdApi(windowMock, null);
    const callback = sinon.spy();

    windowMock.cdApi.getCustomerSessionID(callback);

    expect(callback.calledWith(undefined)).to.be.true;
  });

  it('should add event listeners and handle onMessage', () => {
    dynamicCdApiLoader.attachCdApi(windowMock, 'mockSessionId');
    const listener = sinon.spy();
    windowMock.cdApi.addEventListener('TestEvent', listener);

    const event = { data: { type: 'TestEvent', event: 'testData' } };
    windowMock.cdApi.onMessage(event);

    expect(listener.calledWith('testData')).to.be.true;
  });

  it('should not call listeners if event type has no registered listeners', () => {
    dynamicCdApiLoader.attachCdApi(windowMock, 'mockSessionId');
    const listener = sinon.spy();
    windowMock.cdApi.addEventListener('AnotherEvent', listener);

    const event = { data: { type: 'UnregisteredEvent', event: 'data' } };
    windowMock.cdApi.onMessage(event);

    expect(listener.notCalled).to.be.true;
  });

  it('should remove specific event listener', () => {
    dynamicCdApiLoader.attachCdApi(windowMock, 'mockSessionId');
    const listener = sinon.spy();
    windowMock.cdApi.addEventListener('TestEvent', listener);

    windowMock.cdApi.removeEventListener('TestEvent', listener);

    const event = { data: { type: 'TestEvent', event: 'data' } };
    windowMock.cdApi.onMessage(event);

    expect(listener.notCalled).to.be.true;
  });

  it('should post messages for changeContext, startNewSession, and collection state changes', () => {
    dynamicCdApiLoader.attachCdApi(windowMock, 'mockSessionId');

    windowMock.cdApi.changeContext('newContext');
    expect(windowMock.postMessage.calledWith(
      { type: 'ContextChange', context: 'newContext' },
      'http://mockurl.com'
    )).to.be.true;

    windowMock.cdApi.startNewSession('newCsid');
    expect(windowMock.postMessage.calledWith(
      { type: 'ResetSession', resetReason: 'customerApi', csid: 'newCsid' },
      'http://mockurl.com'
    )).to.be.true;

    windowMock.cdApi.pauseCollection();
    expect(windowMock.postMessage.calledWith(
      { type: 'cdChangeState', toState: 'pause' },
      'http://mockurl.com'
    )).to.be.true;

    windowMock.cdApi.resumeCollection();
    expect(windowMock.postMessage.calledWith(
      { type: 'cdChangeState', toState: 'run' },
      'http://mockurl.com'
    )).to.be.true;
  });

  it('should post messages for metadata and session ID updates', () => {
    dynamicCdApiLoader.attachCdApi(windowMock, 'mockSessionId');

    windowMock.cdApi.sendMetadata({ key: 'value' });
    expect(windowMock.postMessage.calledWith(
      { type: 'cdCustomerMetadata', data: { key: 'value' } },
      'http://mockurl.com'
    )).to.be.true;

    windowMock.cdApi.setCustomerSessionId('newSessionId');
    expect(windowMock.postMessage.calledWith(
      { type: 'cdSetCsid', csid: 'newSessionId' },
      'http://mockurl.com'
    )).to.be.true;
  });

  it('should post message for setting customer brand', () => {
    dynamicCdApiLoader.attachCdApi(windowMock, 'mockSessionId');

    windowMock.cdApi.setCustomerBrand('brandName');
    expect(windowMock.postMessage.calledWith(
      { type: 'cdSetCustomerBrand', brand: 'brandName' },
      'http://mockurl.com'
    )).to.be.true;
  });

  it('should register a session number change listener and call the callback on valid event', (done) => {
    dynamicCdApiLoader.attachCdApi(window, 'mockSessionId');

    let isCalled = false;

    window.cdApi.registerSessionNumberChange(() => {
      isCalled = true;
    });

    window.postMessage({ type: 'SNumNotification', cdSNum: '12345' }, window.location.href);

    setTimeout(() => {
      try {
        expect(isCalled).to.be.true;
        done();
      } catch (error) {
        done(error);
      }
    }, 50); // Adjust the delay as needed
  });
});
