import { assert } from 'chai';
import URLBuilder from '../../../../src/main/technicalServices/URLBuilder';

describe('URLBuilder tests:', function () {
    const message1 = 'New Url should be with new path and same host & cid';
    it('successfully Build URL Test', function () {
        const expectedNewUrl = 'https://wupserver1.com/client/v3.1/web/wup?cid=mycid';
        const newUrl = URLBuilder.build('https://wupserver1.com', 'mycid');

        assert.equal(expectedNewUrl, newUrl, message1);
    });

    it('build Url With No Protocol Test', function () {
        const expectedNewUrl = 'https://wupserver.com/client/v3.1/web/wup?cid=mycid';
        const newUrl = URLBuilder.build('wupserver.com', 'mycid');

        assert.equal(expectedNewUrl, newUrl, message1);
    });

    it('build Url With HTTP Protocol Test', function () {
        const cid = 'mycid';
        const serverURL = 'http://wupserver.com';
        const expectedNewUrl = 'http://wupserver.com/client/v3.1/web/wup?cid=mycid';
        const newUrl = URLBuilder.build(serverURL, cid);

        assert.equal(expectedNewUrl, newUrl, message1);
    });

    it('build Url With HTTPS Protocol Test', function () {
        const cid = 'mycid';
        const serverURL = 'https://wupserver.com';
        const expectedNewUrl = 'https://wupserver.com/client/v3.1/web/wup?cid=mycid';
        const newUrl = URLBuilder.build(serverURL, cid);

        assert.equal(expectedNewUrl, newUrl, message1);
    });

    it('host Name Start With Http Test', function () {
        const expectedNewUrl = 'https://httpwupserver.com:8080/client/v3.1/web/wup?cid=mycid';
        const newUrl = URLBuilder.build('httpwupserver.com:8080', 'mycid');

        assert.equal(expectedNewUrl, newUrl, message1);
    });

    it('Build With Empty ServerURL', function () {
        assert.throws(() => {
                return URLBuilder.build('', 'mycid');
            },
            Error, 'Invalid server URL. Parameter is empty');
    });

    describe('buildCustomUrl function', function(){
        it('should throw an error when wupUrl is empty', function(){
            const wupUrl = '';
            assert.throws(()=>{
                return URLBuilder.buildCustomServerUrl(wupUrl);
            },
                Error, 'Invalid server URL. Parameter is empty');
        });

        it('should append protocol when does not exist in url',function(){
            const wupUrl = 'httpwupserver.com:8080/client/v3.1/web/wup?cid=mycid';
            const expectedUrl = 'https://httpwupserver.com:8080/client/v3.1/web/wup?cid=mycid';

            const newUrl=  URLBuilder.buildCustomServerUrl(wupUrl);

            assert.equal(newUrl,expectedUrl, 'expected both urls to be equal');
        });

        it('should not fix the given url', function(){
            const wupUrl = 'http://httpwupserver.com:8080/client/v3.1/web/wup?cid=mycid';
            const expectedUrl = wupUrl;
            const newUrl = URLBuilder.buildCustomServerUrl(wupUrl);

            assert.equal(newUrl,expectedUrl, 'expected both urls to be equal');
        })
    })
});
