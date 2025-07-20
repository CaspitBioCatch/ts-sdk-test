import CDUtils from '../../../../src/main/technicalServices/CDUtils';
import ConfigurationRepository from '../../../../src/main/core/configuration/ConfigurationRepository';
import SiteMapper from '../../../../src/main/technicalServices/SiteMapper';
import DOMUtils from '../../../../src/main/technicalServices/DOMUtils';
import TestDomUtils from '../../../TestDomUtils';
import { TestUtils } from '../../../TestUtils';
import TestFeatureSupport from '../../../TestFeatureSupport';

describe('SiteMapper tests:', function () {
    const assert = chai.assert;

    const siteMappingKey = 'mapKey';

    const siteMappingContextConfigKey = 'contextConfiguration';

    const ctxCfg = {
        triggers: [{
            selector: 'body',
            url: 'https://aaa.bbb.ddd/',
        }],
        mappings: [{
            selector: 'input[id=payment22]',
            contextName: 'PAYMENT',
        }, {
            url: 'https://aaa.bbb.eee/',
            selector: 'input[id=payment]',
            contextName: 'PAYMENT1',
        }, {
            url: 'https://aaa.bbb.ccc111/',
            contextName: 'PAYMENT2',
        }],

    };

    const ctxCfg1 = {
        triggers: [{
            selector: 'body',
        }],
        mappings: [{
            selector: 'input[id=payment22]',
            contextName: 'PAYMENT',
        }, {
            url: 'https://aaa.bbb.eee/',
            selector: 'input[id=payment]',
            contextName: 'PAYMENT1',
        }, {
            url: 'https://aaa.bbb.ccc333/',
            contextName: 'PAYMENT2',
        }, {
            url: 'localhost',
            contextName: 'PAYMENT3',
        },
        {
            url: 'http://bs-local.com',
            contextName: 'PAYMENT3',
        }],

    };

    describe('SiteMapper mapping tests:', function () {
        beforeEach(function () {
            if (!TestFeatureSupport.isMutationObserverSupported()) {
                this.skip();
                return;
            }

            this.getDocUrl = sinon.stub(CDUtils, 'getDocUrl');
            this.getStorage = sinon.stub(CDUtils.StorageUtils, 'getFromSessionStorage');
            this.matchCallback = sinon.spy();
        });

        afterEach(function () {
            TestDomUtils.clearChildElements(document.body);
            CDUtils.StorageUtils.removeFromSessionStorage('mapKey_isUrlNonMasked');
            this.getDocUrl.restore();
            this.getStorage.restore();
        });

        it('initTracking should call observer on match', function () {
            const confMgr = sinon.stub(new ConfigurationRepository());
            confMgr.get.withArgs(siteMappingKey).returns(JSON.stringify(ctxCfg));
            this.getStorage.withArgs(siteMappingKey).returns(ctxCfg);
            this.getDocUrl.returns('https://aaa.bbb.eee/');

            const siteMapper = new SiteMapper(MutationObserver, CDUtils, DOMUtils, siteMappingKey, this.matchCallback);

            const i = document.createElement('input'); // input element, text
            i.setAttribute('id', 'payment');
            i.setAttribute('type', 'text');
            i.setAttribute('value', 'Shirley54');
            document.body.appendChild(i);

            siteMapper.initTracking();

            assert.isTrue(this.matchCallback.calledOnce, 'match callback was not called');
            assert.isTrue(this.matchCallback.calledWith(ctxCfg.mappings[1]), 'the expected mapping was not passed to match callback');
            assert.equal(this.matchCallback.getCall(0).args[0].contextName, ctxCfg.mappings[1].contextName, 'contextName not equal');

            siteMapper.stopTracking();
        });

        it('siteMapper should call observer for match after when configuration arrived', function () {
            this.getDocUrl.returns('https://aaa.bbb.eee/');
            const confMgr = sinon.stub(new ConfigurationRepository());
            confMgr.get.withArgs(siteMappingKey).returns(JSON.stringify(ctxCfg));

            const siteMapper = new SiteMapper(MutationObserver, CDUtils, DOMUtils, siteMappingKey, this.matchCallback);

            siteMapper.initTracking();

            const i = document.createElement('input'); // input element, text
            i.setAttribute('id', 'payment');
            i.setAttribute('type', 'text');
            i.setAttribute('value', 'Shirley54');
            document.body.appendChild(i);

            siteMapper.onConfigUpdate(confMgr);

            assert.isTrue(this.matchCallback.calledOnce, 'match callback was not called');
            assert.isTrue(this.matchCallback.calledWith(ctxCfg.mappings[1]), 'the expected mapping was not passed to match callback');
            assert.equal(this.matchCallback.getCall(0).args[0].contextName, ctxCfg.mappings[1].contextName, 'contextName not equal');

            siteMapper.stopTracking();
        });

        it('siteMapper should call observer after an update by url mapping masked', function () {
            this.getDocUrl.returns('https://aaa.bbb.ccc111/');
            const confMgr = sinon.stub(new ConfigurationRepository());
            confMgr.get.withArgs(siteMappingKey).returns(JSON.stringify(ctxCfg));

            const siteMapper = new SiteMapper(MutationObserver, CDUtils, DOMUtils, siteMappingKey, this.matchCallback);
            siteMapper.initTracking();

            siteMapper.onConfigUpdate(confMgr);

            assert.isTrue(this.matchCallback.calledOnce, 'match callback was not called');
            assert.isTrue(this.matchCallback.calledWith(ctxCfg.mappings[2]), 'the expected mapping was not passed to match callback');
            assert.equal(this.matchCallback.getCall(0).args[0].contextName, ctxCfg.mappings[2].contextName, 'contextName not equal');

            siteMapper.stopTracking();
        });

        it('siteMapper should call observer after an update by url mapping not masked', function () {
            this.getDocUrl.returns('https://not.in.conf/');
            const confMgr = sinon.stub(new ConfigurationRepository());
            confMgr.get.withArgs(siteMappingKey).returns(JSON.stringify(ctxCfg1));
            confMgr.get.withArgs('useNonMaskedUrlInMappings').returns(true);

            const siteMapper = new SiteMapper(MutationObserver, CDUtils, DOMUtils, siteMappingKey, this.matchCallback);
            siteMapper.initTracking();

            siteMapper.onConfigUpdate(confMgr);

            // To support ios device tests which run on real devices, we need to decide which mapping is expected based on the url.
            // ios devices don't allow for localhost address so they use the bs-local.com url of browserstack
            const expectedUrl = window.document.location.href;
            const expectedMapping = expectedUrl.indexOf(ctxCfg1.mappings[4].url) > -1 ? ctxCfg1.mappings[4] : ctxCfg1.mappings[3];

            assert.isTrue(this.matchCallback.calledOnce, 'match callback was not called');
            assert.isTrue(this.matchCallback.calledWith(expectedMapping), 'the expected mapping was not passed to match callback');
            assert.equal(this.matchCallback.getCall(0).args[0].contextName, expectedMapping.contextName, 'contextName not equal');
            assert.equal(window.sessionStorage.getItem('mapKey_isUrlNonMasked'), 'true', 'url flag not as expected');

            siteMapper.stopTracking();
        });

        it('siteMapper by url mapping not masked flag from storage', function () {
            this.getDocUrl.returns('https://not.in.conf/');
            const confMgr = sinon.stub(new ConfigurationRepository());
            confMgr.get.withArgs(siteMappingKey).returns(JSON.stringify(ctxCfg1));
            this.getStorage.withArgs(siteMappingKey).returns(ctxCfg1);
            this.getStorage.withArgs('mapKey_isUrlNonMasked').returns(true);

            const siteMapper = new SiteMapper(MutationObserver, CDUtils, DOMUtils, siteMappingKey, this.matchCallback);
            siteMapper.initTracking();

            // To support ios device tests which run on real devices, we need to decide which mapping is expected based on the url.
            // ios devices don't allow for localhost address so they use the bs-local.com url of browserstack
            const expectedUrl = window.document.location.href;
            const expectedMapping = expectedUrl.indexOf(ctxCfg1.mappings[4].url) > -1 ? ctxCfg1.mappings[4] : ctxCfg1.mappings[3];

            assert.isTrue(this.matchCallback.calledOnce, 'match callback was not called');
            assert.isTrue(this.matchCallback.calledWith(expectedMapping), 'the expected mapping was not passed to match callback');
            assert.equal(this.matchCallback.getCall(0).args[0].contextName, expectedMapping.contextName, 'contextName not equal');

            siteMapper.stopTracking();
        });

        it('siteMapper should call observer by trigger definition specific url', async function () {
            this.getStorage.withArgs(siteMappingKey).returns(ctxCfg);
            this.getDocUrl.returns('https://aaa.bbb.ddd/');

            const siteMapper = new SiteMapper(MutationObserver, CDUtils, DOMUtils, siteMappingKey, this.matchCallback);
            siteMapper.initTracking();

            const i = document.createElement('input'); // input element, text
            i.setAttribute('id', 'payment22');
            i.setAttribute('type', 'text');
            i.setAttribute('value', 'Shirley54');
            document.body.appendChild(i);

            await TestUtils.waitForNoAssertion(() => {
                assert.isTrue(this.matchCallback.calledOnce, 'match callback was not called');
                assert.isTrue(this.matchCallback.calledWith(ctxCfg.mappings[0]), 'the expected mapping was not passed to match callback');
                assert.equal(this.matchCallback.getCall(0).args[0].contextName, ctxCfg.mappings[0].contextName, 'contextName not equal');
            }).finally(() => {
                siteMapper.stopTracking();
            });
        });

        it('siteMapper should call observer by trigger definition no url-all urls', async function () {
            this.getDocUrl.returns('https://aaa.bbb.fff/');
            this.getStorage.withArgs(siteMappingKey).returns(ctxCfg1);

            const siteMapper = new SiteMapper(MutationObserver, CDUtils, DOMUtils, siteMappingKey, this.matchCallback);
            siteMapper.initTracking();

            const i = document.createElement('input'); // input element, text
            i.setAttribute('id', 'payment22');
            i.setAttribute('type', 'text');
            i.setAttribute('value', 'Shirley54');
            document.body.appendChild(i);

            await TestUtils.waitForNoAssertion(() => {
                assert.isTrue(this.matchCallback.calledOnce, 'match callback was not called');
                assert.isTrue(this.matchCallback.calledWith(ctxCfg1.mappings[0]), 'the expected mapping was not passed to match callback');
                assert.equal(this.matchCallback.getCall(0).args[0].contextName, ctxCfg1.mappings[0].contextName, 'contextName not equal');
            }).finally(() => {
                siteMapper.stopTracking();
            });
        });

        it('SiteMapper trigger should fire only for the subtree of the trigger', async function () {
            const subTreeTriggerConf = {
                triggers: [
                    {
                        selector: '#myDiv1Trigger',
                    },
                ],
                mappings: [
                    {
                        selector: '#myDiv1Input',
                        contextName: 'div1',
                    },
                    {
                        selector: '#myDiv2Input',
                        contextName: 'div2',
                    },
                ],
            };

            this.getStorage.returns(subTreeTriggerConf);

            const siteMapper = new SiteMapper(MutationObserver, CDUtils, DOMUtils, siteMappingKey, this.matchCallback);

            const div1 = document.createElement('div');
            div1.setAttribute('id', 'myDiv1Trigger');
            document.body.appendChild(div1);

            const div2 = document.createElement('div');
            div2.setAttribute('id', 'myDiv2Trigger');
            document.body.appendChild(div2);

            siteMapper.initTracking();

            const myDiv2Input = document.createElement('input'); // input element, text
            myDiv2Input.setAttribute('id', 'myDiv2Input');
            myDiv2Input.setAttribute('type', 'text');
            myDiv2Input.setAttribute('value', 'Should not trigger');
            div2.appendChild(myDiv2Input); // should not trigger mapping since it is not under div1

            await TestUtils.wait(10);

            assert.isTrue(this.matchCallback.notCalled, 'match callback was called');

            const myDiv1Input = document.createElement('input'); // input element, text
            myDiv1Input.setAttribute('id', 'myDiv1Input');
            myDiv1Input.setAttribute('type', 'text');
            myDiv1Input.setAttribute('value', 'Should trigger');
            div1.appendChild(myDiv1Input); // should trigger since under div1

            await TestUtils.waitForNoAssertion(() => {
                assert.isTrue(this.matchCallback.calledOnce, 'match callback was not called');
                assert.isTrue(this.matchCallback.calledWith(subTreeTriggerConf.mappings[0]), 'the expected mapping was not passed to match callback');
                assert.equal(this.matchCallback.getCall(0).args[0].contextName, subTreeTriggerConf.mappings[0].contextName, 'contextName not equal');
            }).finally(() => {
                siteMapper.stopTracking();
            });
        });

        it('SiteMapper trigger should fire according to the byText text node', async function () {
            const subTreeTriggerConf = {
                triggers: [
                    {
                        selector: '#myDiv1Trigger',
                    },
                ],
                mappings: [
                    {
                        selector: '#myDiv1Trigger',
                        contextName: 'text1',
                        byText: 'shouldMapToText1',
                    },
                    {
                        selector: '#myDiv1Trigger',
                        contextName: 'text2',
                        byText: 'shouldMapToText2',
                    },
                ],
            };

            this.getStorage.returns(subTreeTriggerConf);

            const siteMapper = new SiteMapper(MutationObserver, CDUtils, DOMUtils, siteMappingKey, this.matchCallback);

            const div1 = document.createElement('div');
            div1.setAttribute('id', 'myDiv1Trigger');
            document.body.appendChild(div1);

            siteMapper.initTracking();

            const myTextNode = document.createTextNode('shouldMapToText1'); // input element, text
            div1.appendChild(myTextNode); // should trigger since under div1

            await TestUtils.waitForNoAssertion(() => {
                assert.isTrue(this.matchCallback.calledOnce, 'match callback was not called');
                assert.isTrue(this.matchCallback.calledWith(subTreeTriggerConf.mappings[0]), 'the expected mapping was not passed to match callback');
                assert.equal(this.matchCallback.getCall(0).args[0].contextName, subTreeTriggerConf.mappings[0].contextName, 'contextName not equal');
            });

            this.matchCallback.resetHistory();

            myTextNode.nodeValue = 'shouldMapToText2';

            await TestUtils.waitForNoAssertion(() => {
                assert.isTrue(this.matchCallback.calledOnce, 'match callback was not called');
                assert.isTrue(this.matchCallback.calledWith(subTreeTriggerConf.mappings[1]), 'the expected mapping was not passed to match callback');
                assert.equal(this.matchCallback.getCall(0).args[0].contextName, subTreeTriggerConf.mappings[1].contextName, 'contextName not equal');
            }).finally(() => {
                siteMapper.stopTracking();
            });
        });

        it('SiteMapper trigger should fire according to the byText in value field', async function () {
            const subTreeTriggerConf = {
                triggers: [
                    {
                        selector: '#myInputTrigger',
                    },
                ],
                mappings: [
                    {
                        selector: '#myInputTrigger',
                        contextName: 'text1',
                        byText: 'shouldMapToText1',
                    },
                    {
                        selector: '#myInputTrigger',
                        contextName: 'text2',
                        byText: 'shouldMapToText2',
                    },
                ],
            };

            this.getStorage.returns(subTreeTriggerConf);

            const siteMapper = new SiteMapper(MutationObserver, CDUtils, DOMUtils, siteMappingKey, this.matchCallback);

            const input = document.createElement('input');
            input.setAttribute('id', 'myInputTrigger');
            input.setAttribute('type', 'text');
            document.body.appendChild(input);

            siteMapper.initTracking();

            input.value = 'shouldMapToText1';
            input.setAttribute('class', 'class1TRiggerChange');

            await TestUtils.waitForNoAssertion(() => {
                assert.isTrue(this.matchCallback.calledOnce, 'match callback was not called');
                assert.isTrue(this.matchCallback.calledWith(subTreeTriggerConf.mappings[0]), 'the expected mapping was not passed to match callback');
                assert.equal(this.matchCallback.getCall(0).args[0].contextName, subTreeTriggerConf.mappings[0].contextName, 'contextName not equal');
            });

            this.matchCallback.resetHistory();

            input.value = 'shouldMapToText2';
            input.setAttribute('class', 'class2TRiggerChange');

            await TestUtils.waitForNoAssertion(() => {
                assert.isTrue(this.matchCallback.calledOnce, 'match callback was not called');
                assert.isTrue(this.matchCallback.calledWith(subTreeTriggerConf.mappings[1]), 'the expected mapping was not passed to match callback');
                assert.equal(this.matchCallback.getCall(0).args[0].contextName, subTreeTriggerConf.mappings[1].contextName, 'contextName not equal');
            }).finally(() => {
                siteMapper.stopTracking();
            });
        });

        it('SiteMapper should ignore the configuration if there are more then 10 triggers', function () {
            const trigger = {
                selector: '#myDiv1Trigger',
            };
            const mapping = {
                selector: '#myDiv1Trigger',
                contextName: 'text1',
                byText: 'shouldMapToText1',
            };

            const illegalConfig = {
                triggers: [], mappings: [],
            };

            for (let i = 0; i < 11; i++) {
                illegalConfig.triggers.push(trigger);
            }

            for (let i = 0; i < 2; i++) {
                illegalConfig.mappings.push(mapping);
            }

            this.getStorage.returns(null);

            const siteMapper = new SiteMapper(MutationObserver, CDUtils, DOMUtils, siteMappingKey, this.matchCallback);
            siteMapper.initTracking();

            const confMgr = sinon.stub(new ConfigurationRepository());
            confMgr.get.withArgs(siteMappingKey).returns(JSON.stringify(illegalConfig));
            siteMapper.onConfigUpdate(confMgr);

            assert.isNull(siteMapper._siteMap, '_siteMap is not null');
        });

        it('SiteMapper should ignore the configuration if there are more then 200 mappings', function () {
            const trigger = {
                selector: '#myDiv1Trigger',
            };
            const mapping = {
                selector: '#myDiv1Trigger',
                contextName: 'text1',
                byText: 'shouldMapToText1',
            };

            const illegalConfig = {
                triggers: [], mappings: [],
            };

            for (let i = 0; i < 2; i++) {
                illegalConfig.triggers.push(trigger);
            }

            for (let i = 0; i < 201; i++) {
                illegalConfig.mappings.push(mapping);
            }

            this.getStorage.returns(null);

            const siteMapper = new SiteMapper(MutationObserver, CDUtils, DOMUtils, siteMappingKey, this.matchCallback);
            siteMapper.initTracking();

            const confMgr = sinon.stub(new ConfigurationRepository());
            confMgr.get.withArgs(siteMappingKey).returns(JSON.stringify(illegalConfig));
            siteMapper.onConfigUpdate(confMgr);

            assert.isNull(siteMapper._siteMap, '_siteMap is not null');
        });

        it('SiteMapper should ignore the contextConfiguration if there are more then 400 mappings', function () {
            const trigger = {
                selector: '#myDiv1Trigger',
            };
            const mapping = {
                selector: '#myDiv1Trigger',
                contextName: 'text1',
                byText: 'shouldMapToText1',
            };

            const illegalConfig = {
                triggers: [], mappings: [],
            };

            for (let i = 0; i < 2; i++) {
                illegalConfig.triggers.push(trigger);
            }

            for (let i = 0; i < 401; i++) {
                illegalConfig.mappings.push(mapping);
            }

            this.getStorage.returns(null);

            const siteMapper = new SiteMapper(MutationObserver, CDUtils, DOMUtils, siteMappingContextConfigKey, this.matchCallback, true, 400);
            siteMapper.initTracking();

            const confMgr = sinon.stub(new ConfigurationRepository());
            confMgr.get.withArgs(siteMappingKey).returns(JSON.stringify(illegalConfig));
            siteMapper.onConfigUpdate(confMgr);

            assert.isNull(siteMapper._siteMap, '_siteMap is not null');
        });

        it('SiteMapper should ignore the storage site map if there are more then 10 triggers', function () {
            const trigger = {
                selector: '#myDiv1Trigger',
            };
            const mapping = {
                selector: '#myDiv1Trigger',
                contextName: 'text1',
                byText: 'shouldMapToText1',
            };

            const illegalConfig = {
                triggers: [], mappings: [],
            };

            for (let i = 0; i < 11; i++) {
                illegalConfig.triggers.push(trigger);
            }

            for (let i = 0; i < 2; i++) {
                illegalConfig.mappings.push(mapping);
            }

            this.getStorage.returns(illegalConfig);

            const siteMapper = new SiteMapper(MutationObserver, CDUtils, DOMUtils, siteMappingKey, this.matchCallback);
            siteMapper.initTracking();

            assert.isNull(siteMapper._siteMap, '_siteMap is not null');
        });

        it('SiteMapper should ignore the storage site map if there are more then 200 mappings', function () {
            const trigger = {
                selector: '#myDiv1Trigger',
            };
            const mapping = {
                selector: '#myDiv1Trigger',
                contextName: 'text1',
                byText: 'shouldMapToText1',
            };

            const illegalConfig = {
                triggers: [], mappings: [],
            };

            for (let i = 0; i < 2; i++) {
                illegalConfig.triggers.push(trigger);
            }

            for (let i = 0; i < 201; i++) {
                illegalConfig.mappings.push(mapping);
            }

            this.getStorage.returns(illegalConfig);

            const siteMapper = new SiteMapper(MutationObserver, CDUtils, DOMUtils, siteMappingKey, this.matchCallback);
            siteMapper.initTracking();

            assert.isNull(siteMapper._siteMap, '_siteMap is not null');
        });

        it('SiteMapper should ignore the contextConfiguration storage site map if there are more then 400 mappings', function () {
            const trigger = {
                selector: '#myDiv1Trigger',
            };
            const mapping = {
                selector: '#myDiv1Trigger',
                contextName: 'text1',
                byText: 'shouldMapToText1',
            };

            const illegalConfig = {
                triggers: [], mappings: [],
            };

            for (let i = 0; i < 2; i++) {
                illegalConfig.triggers.push(trigger);
            }

            for (let i = 0; i < 401; i++) {
                illegalConfig.mappings.push(mapping);
            }

            this.getStorage.returns(illegalConfig);

            const siteMapper = new SiteMapper(MutationObserver, CDUtils, DOMUtils, siteMappingContextConfigKey, this.matchCallback, true, 400);
            siteMapper.initTracking();

            assert.isNull(siteMapper._siteMap, '_siteMap is not null');
        });

        it('siteMapper should call observer for match on every matched mapping when configuration arrived', function () {
            this.getDocUrl.returns('https://aaa.bbb.eee/');
            const confMgr = sinon.stub(new ConfigurationRepository());
            confMgr.get.withArgs(siteMappingKey).returns(JSON.stringify(ctxCfg));

            const siteMapper = new SiteMapper(MutationObserver, CDUtils, DOMUtils, siteMappingKey, this.matchCallback, false);

            siteMapper.initTracking();

            const input1 = document.createElement('input'); // input element, text
            input1.setAttribute('id', 'payment22');
            input1.setAttribute('type', 'text');
            input1.setAttribute('value', '123123');
            document.body.appendChild(input1);

            const input2 = document.createElement('input'); // input element, text
            input2.setAttribute('id', 'payment');
            input2.setAttribute('type', 'text');
            input2.setAttribute('value', '456456');
            document.body.appendChild(input2);

            siteMapper.onConfigUpdate(confMgr);

            assert.isTrue(this.matchCallback.calledTwice, 'match callback was not called');
            assert.isTrue(this.matchCallback.getCall(0).calledWith(ctxCfg.mappings[0]), 'the expected mapping was not passed to match callback');
            assert.equal(this.matchCallback.getCall(0).args[0].contextName, ctxCfg.mappings[0].contextName, 'contextName not equal');
            assert.isTrue(this.matchCallback.getCall(1).calledWith(ctxCfg.mappings[1]), 'the expected mapping was not passed to match callback');
            assert.equal(this.matchCallback.getCall(1).args[0].contextName, ctxCfg.mappings[1].contextName, 'contextName not equal');

            siteMapper.stopTracking();
        });
    });
});
