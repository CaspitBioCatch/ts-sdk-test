import TestBrowserUtils from '../../../../TestBrowserUtils';
import SupportedBrowserVersions from '../../../../SupportedBrowserVersions';
import { assert } from 'chai';
import {
    EventStructure as KeyEventStructure,
    KeyEventType
} from '../../../../../src/main/collectors/events/KeyEventCollector';
import ConfigurationChanger from '../../ConfigurationChanger';
import { TestUtils } from '../../../../TestUtils';
import TestEvents from '../../../../TestEvents';

describe('Key Masking tests:', function () {
    let serverWorkerSendAsync = null
    let updateFeatureConfigSpy = null;
    beforeEach(async function () {
        if (TestBrowserUtils.isFirefox(window.navigator.userAgent, SupportedBrowserVersions.FirefoxOldestSupportedVersion)
            || TestBrowserUtils.isIE()
            || TestBrowserUtils.isMobileSafari(window.navigator.userAgent)) {
            this.skip();
            return
        }

        const keyEvents = this.systemBootstrapper.getFeatureBuilder()._features.list.KeyEvents.instance;
        serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;

        this.sandbox = sinon.createSandbox();
        updateFeatureConfigSpy = this.sandbox.spy(keyEvents, 'updateFeatureConfig');
    });

    afterEach(function () {
        if (this.sandbox) {
            this.sandbox.restore();
        }

        if(serverWorkerSendAsync) {
            serverWorkerSendAsync.resetHistory();
        }
    });

    const _assertData = (event, expectedEvent) => {
        assert.isNotNull(event, 'Did not find a key_events event');
        assert.equal('key_events', event.eventName, 'eventName is not key_events');
        assert.equal(event.data.length, KeyEventStructure.length + 1, 'key wrong data length');
        assert.equal(event.data[KeyEventStructure.indexOf('eventType') + 1],
            expectedEvent.eventType, 'event type is not correct');
        if (!TestBrowserUtils.isEdge(window.navigator.userAgent)
            && !TestBrowserUtils.isChrome(window.navigator.userAgent, 49)
            && !TestBrowserUtils.isChrome(window.navigator.userAgent, SupportedBrowserVersions.ChromeOldestSupportedVersion)
            && !TestBrowserUtils.isSafari(window.navigator.userAgent, SupportedBrowserVersions.SafariOldestSupportedVersion)) {
            assert.equal(event.data[KeyEventStructure.indexOf('key') + 1],
                expectedEvent.key, 'key is not correct');
            assert.equal(event.data[KeyEventStructure.indexOf('code') + 1],
                expectedEvent.code, 'code is not correct');
            assert.equal(event.data[KeyEventStructure.indexOf('charCode') + 1],
                expectedEvent.charCode, 'charCode is not correct');
            assert.equal(event.data[KeyEventStructure.indexOf('keyRegion') + 1],
                expectedEvent.keyRegion, 'keyRegion is not correct');
            assert.equal(event.data[KeyEventStructure.indexOf('character') + 1],
                expectedEvent.character, 'character is not correct');
            assert.equal(event.data[KeyEventStructure.indexOf('keyComboType') + 1],
                expectedEvent.keyComboType, 'keyComboType is collected');
        }
    };

    async function changeConfiguration(systemBootstrapper, configuration) {

        /**
         * @type {boolean}
         * The testing infra-structure is setting-up configurations via the configurationRepository.loadConfigurations.
         * Until the introduction of ConfigurationRepository.configOverrideBlackList this was 'reliable enough' way,
         * but since then - for setting up local configurations requires the additional forceOverride flag.
         * - force override also configurations which shouldn't be
         */
        let forceOverride = true

        ConfigurationChanger.change(systemBootstrapper, configuration, forceOverride);

        // Wait for the configuration update to apply on the feature
        await TestUtils.waitForNoAssertion(() => {
            assert.isTrue(updateFeatureConfigSpy.called, 'Key Events updateFeatureConfig function was not called');
        });
    }

    describe('KeyEvents masking tests with keyEventsMaskSpecialChars', function () {
        beforeEach(async function () {
            await changeConfiguration(this.systemBootstrapper, {
                isKeyEvents: true,
                keyEventsMaskSpecialChars: true,
                collectKeyRegionValue: false,
                isMotionAroundTouchEnabled: false,
            });
        });

        it('Special char @ is masked', async function () {
            const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;

            const expectedEvent = {
                eventType: KeyEventType.keydown,
                key: '*',
                code: 'SpecialChar',
                charCode: 42,
                keyRegion: '-1',
                keyComboType: -1,
                character: '*',
            };
            TestEvents.publishKeyboardEvent('keydown', '@', '@', 50, '0', true, false, false, 'Digit2', '50');

            await TestUtils.waitForNoAssertion(() => {
                const event = TestUtils.findLatestEventByName(serverWorkerSendAsync, 'key_events');
                _assertData(event, expectedEvent);
            });
            serverWorkerSendAsync.resetHistory();
        });

        it('Special chars numpad is masked', async function () {
            const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;

            const expectedEvent = {
                eventType: KeyEventType.keypress,
                key: '*',
                code: 'Numpad',
                charCode: 96,
                keyRegion: '-1',
                keyComboType: -1,
                character: '*',
            };

            TestEvents.publishKeyboardEvent('keypress', '.', '.', 46, 'NUMPAD', false, false, false, 'NumpadPeriod', 46);
            await TestUtils.waitForNoAssertion(() => {
                const event = TestUtils.findLatestEventByName(serverWorkerSendAsync, 'key_events');
                _assertData(event, expectedEvent);
            });
            serverWorkerSendAsync.resetHistory();
        });

        it('Japanese Hiragana letter ひ is masked ', async function () {
            const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;
            const expectedEvent = {
                eventType: KeyEventType.keydown,
                key: 'A',
                code: 'Key',
                charCode: 65,
                keyRegion: '-1',
                keyComboType: -1,
                character: 'A',
            };
            TestEvents.publishKeyboardEvent('keydown', 'ひ', 'ひ', 191, '0', false, false, false, 'KeyV', '0');

            await TestUtils.waitForNoAssertion(() => {
                const event = TestUtils.findLatestEventByName(serverWorkerSendAsync, 'key_events');
                _assertData(event, expectedEvent);
            }).finally(() => {
                serverWorkerSendAsync.resetHistory();
            });
        });

        it('Japanese Katakana letter サ is masked ', async function () {
            const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;
            const expectedEvent = {
                eventType: KeyEventType.keydown,
                key: 'A',
                code: 'Key',
                charCode: 65,
                keyRegion: '-1',
                keyComboType: -1,
                character: 'A',
            };
            TestEvents.publishKeyboardEvent('keydown', 'サ', 'サ', 191, '0', false, false, false, 'KeyV', '0');

            await TestUtils.waitForNoAssertion(() => {
                const event = TestUtils.findLatestEventByName(serverWorkerSendAsync, 'key_events');
                _assertData(event, expectedEvent);
            }).finally(() => {
                serverWorkerSendAsync.resetHistory();
            });
        });

        it('Hanzi letter 丁 is masked ', async function () {
            const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;
            const expectedEvent = {
                eventType: KeyEventType.keydown,
                key: 'A',
                code: 'Key',
                charCode: 65,
                keyRegion: '-1',
                keyComboType: -1,
                character: 'A',
            };
            TestEvents.publishKeyboardEvent('keydown', '丁', '丁', 191, '0', false, false, false, 'KeyV', '0');

            await TestUtils.waitForNoAssertion(() => {
                const event = TestUtils.findLatestEventByName(serverWorkerSendAsync, 'key_events');
                _assertData(event, expectedEvent);
            }).finally(() => {
                serverWorkerSendAsync.resetHistory();
            });
        });

        it('Japanese Kanji number 二 is masked ', async function () {
            const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;
            const expectedEvent = {
                eventType: KeyEventType.keydown,
                key: '1',
                code: 'Digit',
                charCode: 49,
                keyRegion: '-1',
                keyComboType: -1,
                character: '1',
            };
            TestEvents.publishKeyboardEvent('keydown', '二', '二', 191, '0', false, false, false, 'KeyV', '0');

            await TestUtils.waitForNoAssertion(() => {
                const event = TestUtils.findLatestEventByName(serverWorkerSendAsync, 'key_events');
                _assertData(event, expectedEvent);
            });
            serverWorkerSendAsync.resetHistory();
        });

        it('Japanese suzhou number 〤 is masked ', async function () {
            const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;
            const expectedEvent = {
                eventType: KeyEventType.keydown,
                key: '1',
                code: 'Digit',
                charCode: 49,
                keyRegion: '-1',
                keyComboType: -1,
                character: '1',
            };
            TestEvents.publishKeyboardEvent('keydown', '〤', '〤', 191, '0', false, false, false, 'KeyV', '0');

            await TestUtils.waitForNoAssertion(() => {
                const event = TestUtils.findLatestEventByName(serverWorkerSendAsync, 'key_events');
                _assertData(event, expectedEvent);
            });
            serverWorkerSendAsync.resetHistory();
        });

        it('Chinese Capital number 捌 is masked ', async function () {
            const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;
            const expectedEvent = {
                eventType: KeyEventType.keydown,
                key: '1',
                code: 'Digit',
                charCode: 49,
                keyRegion: '-1',
                keyComboType: -1,
                character: '1',
            };
            TestEvents.publishKeyboardEvent('keydown', '捌', '捌', 191, '0', false, false, false, 'KeyV', '0');

            await TestUtils.waitForNoAssertion(() => {
                const event = TestUtils.findLatestEventByName(serverWorkerSendAsync, 'key_events');
                _assertData(event, expectedEvent);
            });
            serverWorkerSendAsync.resetHistory();
        });

        it('Hebrew letter נ is masked ', async function () {
            const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;
            const expectedEvent = {
                eventType: KeyEventType.keydown,
                key: 'A',
                code: 'Key',
                charCode: 65,
                keyRegion: '-1',
                keyComboType: -1,
                character: 'A',
            };
            TestEvents.publishKeyboardEvent('keydown', 'נ', 'נ', 1504, '0', false, false, false, 'KeyB', '0');

            await TestUtils.waitForNoAssertion(() => {
                const event = TestUtils.findLatestEventByName(serverWorkerSendAsync, 'key_events');
                _assertData(event, expectedEvent);
            }).finally(() => {
                serverWorkerSendAsync.resetHistory();
            });
        });

        it('Proses key is masked to B ', async function () {
            const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;
            const expectedEvent = {
                eventType: KeyEventType.keydown,
                key: 'B',
                code: 'Other',
                charCode: 66,
                keyRegion: '-1',
                keyComboType: -1,
                character: 'B',
            };
            TestEvents.publishKeyboardEvent('keydown', ' ', 'Proses', 0, '0', false, false, false, 'Digit6', '0');

            await TestUtils.waitForNoAssertion(() => {
                const event = TestUtils.findLatestEventByName(serverWorkerSendAsync, 'key_events');
                _assertData(event, expectedEvent);
            });
            serverWorkerSendAsync.resetHistory();
        });
    });

    describe('Align keyup keydown and keypress', function () {
        beforeEach(async function () {
            if (TestBrowserUtils.isChrome(window.navigator.userAgent, SupportedBrowserVersions.ChromeOldestSupportedVersion
                || TestBrowserUtils.isOpera(window.navigator.userAgent, SupportedBrowserVersions.OperaOldestSupportedVersion))) {
                this.skip();
                return;
            }

            await changeConfiguration(this.systemBootstrapper, {
                isKeyEvents: true,
                keyEventsMaskSpecialChars: false,
                collectKeyRegionValue: false,
                isMotionAroundTouchEnabled: false,
            });
        });

        it('KeyEvent Semicolon not masked same in all types', async function () {
            if (TestBrowserUtils.isSafari(window.navigator.userAgent, SupportedBrowserVersions.SafariOldestSupportedVersion)) {
                this.skip();
            }
            const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;
            const expectedEvent = {
                eventType: KeyEventType.keypress,
                key: ':',
                code: 'Semicolon',
                charCode: 58,
                keyRegion: '-1',
                keyComboType: -1,
                character: ':',
            };

            TestEvents.publishKeyboardEvent('keypress', ':', ':', 58, '0', true, false, false, 'Semicolon', '58');
            await TestUtils.waitForNoAssertion(() => {
                const event3 = TestUtils.findLatestEventByName(serverWorkerSendAsync, 'key_events');
                assert.isNotNull(event3, 'Did not find a key_events event');
                assert.equal('key_events', event3.eventName, 'eventName is not key_events');
                assert.equal(event3.data.length, KeyEventStructure.length + 1, 'key wrong data length');
                assert.equal(event3.data[KeyEventStructure.indexOf('eventType') + 1],
                    expectedEvent.eventType, 'event type is not correct');
                assert.equal(event3.data[KeyEventStructure.indexOf('key') + 1],
                    expectedEvent.key, 'keypress key is not correct');
                assert.equal(event3.data[KeyEventStructure.indexOf('code') + 1],
                    expectedEvent.code, 'keypress code is not correct');
                assert.equal(event3.data[KeyEventStructure.indexOf('charCode') + 1],
                    expectedEvent.charCode, 'keypress charCode is not correct');
                assert.equal(event3.data[KeyEventStructure.indexOf('character') + 1],
                    expectedEvent.character, 'keypress character is not correct');
            });

            TestEvents.publishKeyboardEvent('keydown', ':', ':', 186, '0', true, false, false, 'Semicolon', '0');
            expectedEvent.eventType = KeyEventType.keydown;

            await TestUtils.waitForNoAssertion(() => {
                const event = TestUtils.findLatestEventByName(serverWorkerSendAsync, 'key_events');
                assert.isNotNull(event, 'Did not find a key_events event');
                assert.equal('key_events', event.eventName, 'eventName is not key_events');
                assert.equal(event.data.length, KeyEventStructure.length + 1, 'key wrong data length');
                assert.equal(event.data[KeyEventStructure.indexOf('eventType') + 1],
                    expectedEvent.eventType, 'event type is not correct');
                assert.equal(event.data[KeyEventStructure.indexOf('key') + 1],
                    expectedEvent.key, 'keydown key is not correct');
                assert.equal(event.data[KeyEventStructure.indexOf('code') + 1],
                    expectedEvent.code, 'keydown code is not correct');
                assert.equal(event.data[KeyEventStructure.indexOf('charCode') + 1],
                    expectedEvent.charCode, 'keydown charCode is not correct');
                assert.equal(event.data[KeyEventStructure.indexOf('character') + 1],
                    expectedEvent.character, 'keydown character is not correct');
            });

            TestEvents.publishKeyboardEvent('keyup', ':', ':', 186, '0', true, false, false, 'Semicolon', '0');
            expectedEvent.eventType = KeyEventType.keyup;
            await TestUtils.waitForNoAssertion(() => {
                const event2 = TestUtils.findLatestEventByName(serverWorkerSendAsync, 'key_events');
                assert.isNotNull(event2, 'Did not find a key_events event');
                assert.equal('key_events', event2.eventName, 'eventName is not key_events');
                assert.equal(event2.data.length, KeyEventStructure.length + 1, 'key wrong data length');
                assert.equal(event2.data[KeyEventStructure.indexOf('eventType') + 1],
                    expectedEvent.eventType, 'event type is not correct');
                assert.equal(event2.data[KeyEventStructure.indexOf('key') + 1],
                    expectedEvent.key, 'keyup key is not correct');
                assert.equal(event2.data[KeyEventStructure.indexOf('code') + 1],
                    expectedEvent.code, 'keyup code is not correct');
                assert.equal(event2.data[KeyEventStructure.indexOf('charCode') + 1],
                    expectedEvent.charCode, 'keyup charCode is not correct');
                assert.equal(event2.data[KeyEventStructure.indexOf('character') + 1],
                    expectedEvent.character, 'keyup character is not correct');
            });
            serverWorkerSendAsync.resetHistory();
        });
    });

    describe('Controls collected tests', function () {
        beforeEach(async function () {
            await changeConfiguration(this.systemBootstrapper, {
                isKeyEvents: true,
                keyEventsMaskSpecialChars: true,
                collectKeyRegionValue: false,
                isMotionAroundTouchEnabled: false,
            });
        });

        it('F1 collected', async function () {
            const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;
            const expectedEvent = {
                eventType: KeyEventType.keydown,
                key: 'F1',
                code: 'F1',
                charCode: 112,
                keyRegion: '-1',
                keyComboType: -1,
                character: '',
            };
            TestEvents.publishKeyboardEvent('keydown', '', 'F1', 13, '0', false, false, false, 'F1', '');

            await TestUtils.waitForNoAssertion(() => {
                const event = TestUtils.findLatestEventByName(serverWorkerSendAsync, 'key_events');
                _assertData(event, expectedEvent);
            }).finally(() => {
                serverWorkerSendAsync.resetHistory();
            });
        });

        it('Tab collected', async function () {
            const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;
            const expectedEvent = {
                eventType: KeyEventType.keydown,
                key: 'Tab',
                code: 'Tab',
                charCode: 9,
                keyRegion: '-1',
                keyComboType: -1,
                character: '',
            };
            TestEvents.publishKeyboardEvent('keydown', '', 'Tab', 9, '0', false, false, false, 'Tab', '0');

            await TestUtils.waitForNoAssertion(() => {
                const event = TestUtils.findLatestEventByName(serverWorkerSendAsync, 'key_events');
                _assertData(event, expectedEvent);
            }).finally(() => {
                serverWorkerSendAsync.resetHistory();
            });
        });

        it('NumLock collected', async function () {
            const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;
            const expectedEvent = {
                eventType: KeyEventType.keyup,
                key: 'Clear',
                code: 'NumLock',
                charCode: 144,
                keyRegion: '-1',
                keyComboType: -1,
                character: '',
            };
            TestEvents.publishKeyboardEvent('keyup', '', 'Clear', 88, '0', false, false, false, 'NumLock', '0');

            await TestUtils.waitForNoAssertion(() => {
                const event = TestUtils.findLatestEventByName(serverWorkerSendAsync, 'key_events');
                _assertData(event, expectedEvent);
            }).finally(() => {
                serverWorkerSendAsync.resetHistory();
            });
        });

        it('Space collected', async function () {
            const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;
            const expectedEvent = {
                eventType: KeyEventType.keyup,
                key: ' ',
                code: 'Space',
                charCode: 32,
                keyRegion: '-1',
                keyComboType: -1,
                character: ' ',
            };
            TestEvents.publishKeyboardEvent('keyup', ' ', ' ', 32, '0', false, false, false, 'Space', '0');

            await TestUtils.waitForNoAssertion(() => {
                const event = TestUtils.findLatestEventByName(serverWorkerSendAsync, 'key_events');
                _assertData(event, expectedEvent);
            }).finally(() => {
                serverWorkerSendAsync.resetHistory();
            });
        });
    });
});
