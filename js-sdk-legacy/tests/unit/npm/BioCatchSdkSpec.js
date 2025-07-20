import sinon from 'sinon';
import { expect } from 'chai';
import { BioCatchSDK } from '../../../src/npm/BioCatchSDK';

describe('BioCatchSDK', () => {
  let clientApiMock;

  beforeEach(() => {
    // Mock the clientApi that BioCatchSDK expects
    clientApiMock = {
      start: sinon.stub(),
      stop: sinon.stub(),
      pause: sinon.stub(),
      resume: sinon.stub(),
      updateCustomerSessionID: sinon.stub(),
      changeContext: sinon.stub(),
      startNewSession: sinon.stub(),
      setCoordinatesMasking: sinon.stub(),
      setCustomerBrand: sinon.stub(),
    };

    // Reset the singleton for each test
    BioCatchSDK._instance = null;
  });

  function getFreshSDK() {
    return BioCatchSDK.getInstance(clientApiMock);
  }

  it('should create a singleton instance', () => {
    const sdk1 = getFreshSDK();
    const sdk2 = BioCatchSDK.getInstance();
    expect(sdk1).to.equal(sdk2);
  });

  it('should call client.start with correct arguments', () => {
    const sdk = getFreshSDK();
    sdk.start("https://test.com", "dummy", "1234", {}, 4);
    expect(clientApiMock.start.calledWith("https://test.com", "dummy", "1234", {}, 4)).to.be.true;
  });

  it('should call client.stop', () => {
    const sdk = getFreshSDK();
    sdk.stop();
    expect(clientApiMock.stop.calledOnce).to.be.true;
  });

  it('should call client.pause', () => {
    const sdk = getFreshSDK();
    sdk.pause();
    expect(clientApiMock.pause.calledOnce).to.be.true;
  });

  it('should call client.resume', () => {
    const sdk = getFreshSDK();
    sdk.resume();
    expect(clientApiMock.resume.calledOnce).to.be.true;
  });

  it('should call client.updateCustomerSessionID', () => {
    const sdk = getFreshSDK();
    sdk.updateCustomerSessionID('newSessionId');
    expect(clientApiMock.updateCustomerSessionID.calledWith('newSessionId')).to.be.true;
  });

  it('should call client.changeContext', () => {
    const sdk = getFreshSDK();
    sdk.changeContext('newContext');
    expect(clientApiMock.changeContext.calledWith('newContext')).to.be.true;
  });

  it('should call client.startNewSession', () => {
    const sdk = getFreshSDK();
    sdk.startNewSession('newSessionId');
    expect(clientApiMock.startNewSession.calledWith('newSessionId')).to.be.true;
  });

  it('should call client.setCoordinatesMasking', () => {
    const sdk = getFreshSDK();
    sdk.setCoordinatesMasking(true);
    expect(clientApiMock.setCoordinatesMasking.calledWith(true)).to.be.true;
  });

  it('should call client.setCustomerBrand', () => {
    const sdk = getFreshSDK();
    sdk.setCustomerBrand('testBrand');
    expect(clientApiMock.setCustomerBrand.calledWith('testBrand')).to.be.true;
  });
});