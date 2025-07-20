import DOMUtils from '../../../../src/main/technicalServices/DOMUtils';

describe('Test name:', function () {
    const assert = chai.assert;

    describe('DomUtilSpec tests:', function () {
        describe('onWindowDocumentReady', function () {
            it('should execute action once window is ready', function (done) {
                DOMUtils.onWindowDocumentReady(window, () => {
                    done();
                });
            });

            it('should execute action once frame is ready', function (done) {
                this.iframe1 = document.createElement('iframe');
                this.iframe1.setAttribute('id', 'iframe1Test');
                document.body.appendChild(this.iframe1);

                DOMUtils.onWindowDocumentReady(this.iframe1.contentWindow, () => {
                    done();
                });
            });
        });

        describe('matches', function () {
            it('should match element', function () {
                const frameSelector = 'frame, iframe';

                this.iframe1 = document.createElement('iframe');
                this.iframe1.setAttribute('id', 'iframe1Test');
                document.body.appendChild(this.iframe1);

                assert.isTrue(DOMUtils.matches(this.iframe1, frameSelector));
            });

            it('should return false when element document is unavailable', function () {
                const frameSelector = 'frame, iframe';
                assert.isFalse(DOMUtils.matches({ nodeType: 1 }, frameSelector));
            });

            it('should return false when there are no matched nodes', function () {
                const frameSelector = 'frame, iframe';
                const h = document.createElement('H1');
                const t = document.createTextNode('Hello World');
                h.appendChild(t);
                document.body.appendChild(h);

                assert.isFalse(DOMUtils.matches(t, frameSelector));
            });

            it('matches polyfill fallback matches using item property when available', function () {
                const frameSelector = 'frame, iframe';

                this.iframe1 = document.createElement('iframe');
                this.iframe1.setAttribute('id', 'iframe1Test');
                this.iframe1.matches = undefined;
                this.iframe1.matchesSelector = undefined;
                this.iframe1.mozMatchesSelector = undefined;
                this.iframe1.msMatchesSelector = undefined;
                this.iframe1.oMatchesSelector = undefined;
                this.iframe1.webkitMatchesSelector = undefined;

                document.body.appendChild(this.iframe1);

                assert.isTrue(DOMUtils.matches(this.iframe1, frameSelector));
            });

            it('matches polyfill fallback to index access when item property is unavailable', function () {
                const frameSelector = 'frame, iframe';

                this.iframe1 = document.createElement('iframe');
                this.iframe1.setAttribute('id', 'iframe1Test');
                this.iframe1.matches = undefined;
                this.iframe1.matchesSelector = undefined;
                this.iframe1.mozMatchesSelector = undefined;
                this.iframe1.msMatchesSelector = undefined;
                this.iframe1.oMatchesSelector = undefined;
                this.iframe1.webkitMatchesSelector = undefined;
                this.iframe1.document = {
                    querySelectorAll: () => {
                        // We return an array with no item access support so the matches should fallback to index accessing
                        return ['a', this.iframe1, 'c'];
                    },
                };

                document.body.appendChild(this.iframe1);

                assert.isTrue(DOMUtils.matches(this.iframe1, frameSelector));
            });
        });
    });

    describe("waitUntilDocumentIsReady with invalid contentWindow", () => {
        it("should reject when contentWindow is invalid", async () => {
            try {
                await DOMUtils.waitUntilDocumentIsReady(null);
                assert.fail("Expected promise to be rejected");
            } catch (error) {
                assert.instanceOf(error, Error);
            }
        });
    });
});
