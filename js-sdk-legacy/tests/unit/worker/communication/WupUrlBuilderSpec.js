import { buildServerUrl } from '../../../../src/worker/communication/WupUrlBuilder';
import { serverProtocolV3, serverProtocolV4 } from '../../../../src/main/const/communication';
import {assert} from 'chai';

describe('WupUrlBuilder tests:', function() {

  const mockBaseUrl = 'http://some.server.url';
  const mockCid = 'mock_cid';

  const escapedBaseUrl = mockBaseUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const v3MinifiedUrlPattern = new RegExp(`^${escapedBaseUrl}\\/v3\\.1\\/[^\\/\\?]+$`);
  const v4MinifiedUrlPattern = /^http:\/\/some\.server\.url\/v4\/[^\/\?]+$/;

  it('build not-minified v3 url path successfully', function() {

    let url = buildServerUrl(mockBaseUrl, serverProtocolV3, mockCid, false);

    let expectedUrl =  mockBaseUrl + '/client/v3.1/web/wup?cid=' + mockCid;

    assert.equal(url, expectedUrl);
  });

  it('build not-minified v4 url path successfully', function() {

    let url = buildServerUrl(mockBaseUrl, serverProtocolV4, mockCid, false);

    let expectedUrl =  mockBaseUrl + '/api/v4/wup?cid=' + mockCid;

    assert.equal(url, expectedUrl);
  });

  it('build minified v3 url path successfully', function() {

    let url = buildServerUrl(mockBaseUrl, serverProtocolV3, mockCid, true);

    assert.isTrue(v3MinifiedUrlPattern.test(url));
  });

  it('build minified v4 url path successfully', function() {

    let url = buildServerUrl(mockBaseUrl, serverProtocolV4, mockCid, true);

    assert.isTrue(v4MinifiedUrlPattern.test(url));
  });
});