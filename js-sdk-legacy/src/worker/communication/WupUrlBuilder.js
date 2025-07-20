import {
  minifiedUrlV3Path, minifiedUrlV4Path,
  serverProtocolV3,
  wupUrlV3Path,
  wupUrlV4Path
} from '../../main/const/communication';

/**
 *
 * @param baseUrl for example: https://wup-dtrackers.bc2.customers.biocatch.com
 * @param protocolType 3 for v3 and 4 for v4.
 * @param cid
 * @param minify true if should apply sub-path removal and random segment addition to make-it harder for add-blocks to black-list our server's path pattern.
 * @returns example outputs:
 * in case protocolType === 3 , and minify === false , and cid === dtrackers:
 * the result is: https://wup-dtrackers.bc2.customers.biocatch.com/client/v3.1/web/wup?cid=dtrackers
 *
 * in case protocolType === 4 , and minify === true , and cid === dtrackers:
 * the result is: https://wup-dtrackers.bc2.customers.biocatch.com/v4/random-string  (without cid when minify is true)
 */
export function buildServerUrl(baseUrl, protocolType, cid, minify) {
  let path;

  if (minify) {
    if (protocolType === serverProtocolV3) {
      path = minifiedUrlV3Path;
    } else {
      path = minifiedUrlV4Path;
    }
    path += '/' + _generateRandomUrlSafeString();
  } else {
    if (protocolType === serverProtocolV3) {
      path = wupUrlV3Path;
    } else {
      path = wupUrlV4Path;
    }

    path += '?cid=' + cid;
  }

  return baseUrl + '/' + path;
}

function _generateRandomUrlSafeString() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const length = Math.floor(Math.random() * (20 - 10 + 1)) + 10;  // Random length between 10 and 20
  let randomString = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    randomString += chars[randomIndex];
  }

  return randomString;
}
