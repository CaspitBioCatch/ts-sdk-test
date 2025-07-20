import { expect } from 'chai';
import sinon from 'sinon';
import { ServerUrlResolver } from '../../../../src/main/core/ServerUrlResolver';
import { BCProtocolType } from '../../../../src/main/contract/BCProtocolType';

describe('ServerUrlResolver tests:', function () {
  let serverUrlResolver;
  let consoleWarnStub;

  beforeEach(function () {
    serverUrlResolver = new ServerUrlResolver();
    consoleWarnStub = sinon.stub(console, 'warn');
  });

  afterEach(function () {
    sinon.restore();
  });

  it('should set the V4 path when configuredProtocolType is V4 and the server URL does not include a protocol path', function () {
    const result = serverUrlResolver.resolve('https://example.com', 'customer123', BCProtocolType.V4);
    expect(result).to.equal('https://example.com/api/v4/wup?cid=customer123');
  });

  it('should set the V3 path when configuredProtocolType is V3 and the server URL does not include a protocol path', function () {
    const result = serverUrlResolver.resolve('https://example.com', 'customer123', BCProtocolType.V3);
    expect(result).to.equal('https://example.com/client/v3.1/web/wup?cid=customer123');
  });

  it('should replace an existing V3 path with a V4 path when configuredProtocolType is V4', function () {
    const result = serverUrlResolver.resolve('https://example.com/client/v3.1/web/wup', 'customer123', BCProtocolType.V4);
    expect(result).to.equal('https://example.com/api/v4/wup?cid=customer123');
  });

  it('should add `cid` when configuredCustomerID is provided and `cid` is missing', function () {
    const result = serverUrlResolver.resolve('https://example.com', 'customer123', BCProtocolType.V3);
    expect(result).to.include('cid=customer123');
  });

  it('should retain original `cid` if configuredCustomerID is not provided', function () {
    const result = serverUrlResolver.resolve('https://example.com?cid=original123', undefined, BCProtocolType.V3);
    expect(result).to.equal('https://example.com/client/v3.1/web/wup?cid=original123');
  });

  it('should log a warning when no `cid` is found and configuredCustomerID is undefined', function () {
    serverUrlResolver.resolve('https://example.com', undefined, BCProtocolType.V3);
    expect(consoleWarnStub.calledOnce).to.be.true;
    expect(consoleWarnStub.calledWith('No cid found, and configuredCustomerID is undefined.')).to.be.true;
  });
});
