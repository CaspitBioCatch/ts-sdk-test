import { assert } from 'chai';
import URLFieldsExtractor from '../../../../src/main/technicalServices/URLFieldsExtractor';

describe('URLFieldsExtractor tests:', function () {
    const message1 = 'Not the same Host';
    const message2 = 'Not the same cid';

    it('successfully extract fields Test', function () {
        const urlString = 'wupserver.com/client/v9/v10/wup/cid/web/wupwup?cid=mycid';
        const urlParams = URLFieldsExtractor.extract(urlString);
        const extractedAddress = urlParams.serverURL;
        const extractedCID = urlParams.cid;
        assert.equal('wupserver.com', extractedAddress, message1);
        assert.equal('mycid', extractedCID);
    });

    it('extract host http fields successfully', function () {
        const urlString = 'http://wupserver.com/client/v9/v10/wup/cid/web/wupwup?cid=mycid';
        const urlParams = URLFieldsExtractor.extract(urlString);
        const extractedAddress = urlParams.serverURL;
        const extractedCID = urlParams.cid;
        assert.equal('http://wupserver.com', extractedAddress, message1);
        assert.equal('mycid', extractedCID);
    });

    it('successfully extract host authority Test', function () {
        const urlString = 'http://wupserver.com:8080/client/v9/v10/wup/cid/web/wupwup?cid=mycid';
        const urlParams = URLFieldsExtractor.extract(urlString);
        const extractedAddress = urlParams.serverURL;
        assert.equal('http://wupserver.com:8080', extractedAddress, message1);
    });

    it('extract host or cid fields bad URL throws an exception Test', function () {
        const urlString = '#$%^^@';
        assert.throws(() => {
                return URLFieldsExtractor.extract(urlString);
            },
            Error, `Invalid field. Failed extracting the address parameter: ${urlString}`);
    });

    it('empty URL throws an exception', function () {
        const urlString = '';
        assert.throws(() => {
                return URLFieldsExtractor.extract(urlString);
            },
            Error, 'Invalid wupServerURL. Parameter is empty');
    });

    it('extracting an Bad serverURL throws an exception', function () {
        const urlString = 'https:///?cid=ci123d';
            assert.throws(() => {
                    return URLFieldsExtractor.extract(urlString);
                },
                Error, `Invalid field. Failed extracting the address parameter: ${urlString}`);
    });

    it('extracting an empty CID parameter throws an exception', function () {
        const urlString = 'http://www.wupserver.com/client/v9/v10/wup/cid/web/wupwup?cid=';
        assert.throws(() => {
                return URLFieldsExtractor.extract(urlString);
            },
            Error, `Invalid field. Failed extracting the cid parameter: ${urlString}`);
    });

    it('missing route fields throws an exception', function () {
        const urlString = 'http://www.wupserver.com/v10/wup/cid/web/wupwup';
        assert.throws(() => {
                return URLFieldsExtractor.extract(urlString);
            },
            Error, `Invalid field. Failed extracting the address parameter: ${urlString}`);
    });

    it('missing query fields throws an exception', function () {
        const urlString = 'http://www.wupserver.com/client/v9/v10/wup/cid/web/wupwup';
        assert.throws(() => {
                return URLFieldsExtractor.extract(urlString);
            },
            Error, `Invalid field. Failed extracting the cid parameter: ${urlString}`);
    });

    it('invalid CID query parameter structure throws an exception', function () {
        const urlString = 'http://www.wupserver.com/client/v9/v10/wup/cid/web/wupwup?cid';
        assert.throws(() => {
                return URLFieldsExtractor.extract(urlString);
            },
            Error, `Invalid field. Failed extracting the cid parameter: ${urlString}`);
    });

    it('build URL with more than one cid Test', function () {
        let urlString = 'http://wupserver.com:8080/client/v9/web/wupwup?rapidView=33&projectKey=BC&selectedIssue=BC-14680&assignee=5bbb201405166a4324708f1b&cid=mycid';
        let urlParams = URLFieldsExtractor.extract(urlString);
        let cid = urlParams.cid;
        let extractedAddress = urlParams.serverURL;
        let extractedCID = 'mycid';
        assert.equal(cid, extractedCID, message2);
        assert.equal('http://wupserver.com:8080', extractedAddress);

        urlString = 'wupserver.com:8080/client/v9/web/wupwup?rapidView=33&projectKey=BC&cid=mycid&selectedIssue=BC-14680&assignee=5bbb201405166a4324708f1b&cid=1234';
        urlParams = URLFieldsExtractor.extract(urlString);
        cid = urlParams.cid;
        extractedCID = 'mycid';
        extractedAddress = urlParams.serverURL;
        assert.equal(cid, extractedCID, message2);
        assert.equal('wupserver.com:8080', extractedAddress);

        urlString = 'wupserver.com/client/v9/web/wupwup?cid=1234&rapidView=33&projectKey=BC&selectedIssue=BC-14680&assignee=5bbb201405166a4324708f1b';
        urlParams = URLFieldsExtractor.extract(urlString);
        cid = urlParams.cid;
        extractedCID = '1234';
        extractedAddress = urlParams.serverURL;
        assert.equal(cid, extractedCID, message2);
        assert.equal('wupserver.com', extractedAddress);
    });
});
