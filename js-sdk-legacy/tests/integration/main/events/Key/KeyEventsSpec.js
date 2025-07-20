import { assert } from 'chai';
import ConfigurationChanger from '../../ConfigurationChanger';
import {
    EventStructure as KeyEventStructure,
    KeyEventType,
} from '../../../../../src/main/collectors/events/KeyEventCollector';
import { TestUtils } from '../../../../TestUtils';
import TestEvents from '../../../../TestEvents';
import TestBrowserUtils from '../../../../TestBrowserUtils';
import { SameCharType } from '../../../../../src/main/services/SameCharService';
import SupportedBrowserVersions from '../../../../SupportedBrowserVersions';

describe('KeyEvents tests:', function () {
    beforeEach(function () {
        if (TestBrowserUtils.isIE()) {
            this.skip();
            return;
        }
        const keyEvents = this.systemBootstrapper.getFeatureBuilder()._features.list.KeyEvents.instance;
        this.sandbox = sinon.createSandbox();
        this._updateFeatureConfigSpy = this.sandbox.spy(keyEvents, 'updateFeatureConfig');
    });

    afterEach(function () {
        if (this.sandbox) {
            this.sandbox.restore();
        }
    });

    it('KeyEvents are sent to the worker', async function () {
        ConfigurationChanger.change(this.systemBootstrapper, {
            isKeyEvents: true,
        });

        // Wait for the configuration update to apply on the feature
        await TestUtils.waitForNoAssertion(() => {
            assert.isTrue(this._updateFeatureConfigSpy.called, 'Key events updateFeatureConfig function was not called');
        });

        const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;

        TestEvents.publishKeyboardEvent('keydown', 'Q', 'q', 81, '0', false, false, true, '81', '81');

        await TestUtils.waitForNoAssertion(() => {
            const event = TestUtils.findLatestEventByName(serverWorkerSendAsync, 'key_events');
            assert.isNotNull(event, 'Did not find a key_events event');
            assert.equal('key_events', event.eventName, 'eventName is not key_events');
            assert.equal(event.data.length, KeyEventStructure.length + 1, 'key wrong data length');
            assert.equal(event.data[KeyEventStructure.indexOf('eventType') + 1],
                KeyEventType.keydown, 'event type is not keydown');
        });

        TestEvents.publishKeyboardEvent('keypress', 'z', 'z', 81, '1', false, true, false, '81', '81');

        await TestUtils.waitForNoAssertion(() => {
            const event = TestUtils.findLatestEventByName(serverWorkerSendAsync, 'key_events');
            assert.isNotNull(event, 'Did not find a key_events event');
            assert.equal('key_events', event.eventName, 'eventName is not key_events');
            assert.equal(event.data[KeyEventStructure.indexOf('eventType') + 1],
                KeyEventType.keypress, 'event type is not keypress');
        });

        TestEvents.publishKeyboardEvent('keyup', 'Q', 'q', 81, '1', true, false, false, '81', '81');

        await TestUtils.waitForNoAssertion(() => {
            const event = TestUtils.findLatestEventByName(serverWorkerSendAsync, 'key_events');
            assert.isNotNull(event, 'Did not find a key_events event');
            assert.equal('key_events', event.eventName, 'eventName is not key_events');
            assert.equal(event.data[KeyEventStructure.indexOf('eventType') + 1],
                KeyEventType.keyup, 'event type is not keyup');
        });

        serverWorkerSendAsync.resetHistory(); // For cleaning the state of the spy
    });

    it('KeyEvents with capture are sent to the worker', async function () {
        ConfigurationChanger.change(this.systemBootstrapper, {
            isKeyEvents: true,
            isCaptureKeyEvents: true,
        });

        const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;

        // Wait for the configuration update to apply on the feature
        await TestUtils.waitForNoAssertion(() => {
            assert.isTrue(this._updateFeatureConfigSpy.called, 'key events updateFeatureConfig function was not called');
        });

        TestEvents.publishKeyboardEvent('keydown', 'Q', 'q', 81, '1', false, false, true, '81');

        await TestUtils.waitForNoAssertion(() => {
            const event = TestUtils.findLatestEventByName(serverWorkerSendAsync, 'key_events');
            assert.isNotNull(event, 'Did not find a key_events event');
            assert.equal('key_events', event.eventName, 'eventName is not key_events');
            assert.equal(event.data[KeyEventStructure.indexOf('eventType') + 1],
                KeyEventType.keydown, 'event type is not keydown');
        });

        TestEvents.publishKeyboardEvent('keypress', 'z', 'z', 81, '1', false, true, false, '81');

        await TestUtils.waitForNoAssertion(() => {
            const event = TestUtils.findLatestEventByName(serverWorkerSendAsync, 'key_events');
            assert.isNotNull(event, 'Did not find a key_events event');
            assert.equal('key_events', event.eventName, 'eventName is not key_events');
            assert.equal(event.data[KeyEventStructure.indexOf('eventType') + 1],
                KeyEventType.keypress, 'event type is not keypress');
        });

        TestEvents.publishKeyboardEvent('keyup', 'Q', 'q', 81, '1', true, false, false, '81');

        await TestUtils.waitForNoAssertion(() => {
            const event = TestUtils.findLatestEventByName(serverWorkerSendAsync, 'key_events');
            assert.isNotNull(event, 'Did not find a key_events event');
            assert.equal('key_events', event.eventName, 'eventName is not key_events');
            assert.equal(event.data[KeyEventStructure.indexOf('eventType') + 1],
                KeyEventType.keyup, 'event type is not keyup');
        });

        serverWorkerSendAsync.resetHistory(); // For cleaning the state of the spy
    });

    if (!TestBrowserUtils.isSafari(window.navigator.userAgent, SupportedBrowserVersions.SafariOldestSupportedVersion)) {
        it('KeyEvents Same Char Detected when same keys send on 2 keypress', async function () {
            ConfigurationChanger.change(this.systemBootstrapper, {
                isKeyEvents: true,
                isCaptureKeyEvents: true,
            });

            const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;

            // Wait for the configuration update to apply on the feature
            await TestUtils.waitForNoAssertion(() => {
                assert.isTrue(this._updateFeatureConfigSpy.called, 'key events updateFeatureConfig function was not called');
            });

            TestEvents.publishKeyboardEvent('keydown', 'Q', 'q', 81, '1', false, false, true, '81');

            await TestUtils.waitForNoAssertion(() => {
                const event = TestUtils.findLatestEventByName(serverWorkerSendAsync, 'key_events');
                assert.isNotNull(event, 'Did not find a key_events event');
                assert.equal('key_events', event.eventName, 'eventName is not key_events');
                assert.equal(event.data[KeyEventStructure.indexOf('isSameKey') + 1],
                    SameCharType.undefined, 'key down should be undefined');
            });

            TestEvents.publishKeyboardEvent('keypress', 'a', 'a', 81, '1', false, true, false, '81');

            await TestUtils.waitForNoAssertion(() => {
                const event = TestUtils.findLatestEventByName(serverWorkerSendAsync, 'key_events');
                assert.isNotNull(event, 'Did not find a key_events event');
                assert.equal('key_events', event.eventName, 'eventName is not key_events');
                assert.equal(event.data[KeyEventStructure.indexOf('isSameKey') + 1],
                    SameCharType.false, 'first key collected on keypress should be false');
            });

            TestEvents.publishKeyboardEvent('keyup', 'Q', 'q', 81, '1', true, false, false, '81');

            await TestUtils.waitForNoAssertion(() => {
                const event = TestUtils.findLatestEventByName(serverWorkerSendAsync, 'key_events');
                assert.isNotNull(event, 'Did not find a key_events event');
                assert.equal('key_events', event.eventName, 'eventName is not key_events');
                assert.equal(event.data[KeyEventStructure.indexOf('isSameKey') + 1],
                    SameCharType.undefined, 'key up should be undefined');
            });

            TestEvents.publishKeyboardEvent('keypress', 'a', 'a', 81, '1', false, true, false, '81');

            await TestUtils.waitForNoAssertion(() => {
                const event = TestUtils.findLatestEventByName(serverWorkerSendAsync, 'key_events');
                assert.isNotNull(event, 'Did not find a key_events event');
                assert.equal('key_events', event.eventName, 'eventName is not key_events');
                assert.equal(event.data[KeyEventStructure.indexOf('isSameKey') + 1],
                    SameCharType.true, 'second key collected equal to first event on keypress should be true');
            });

            serverWorkerSendAsync.resetHistory(); // For cleaning the state of the spy
        });

        it('KeyEvents Same Char Detected when different keys send on 2 keypress', async function () {
            ConfigurationChanger.change(this.systemBootstrapper, {
                isKeyEvents: true,
                isCaptureKeyEvents: true,
            });

            const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;

            // Wait for the configuration update to apply on the feature
            await TestUtils.waitForNoAssertion(() => {
                assert.isTrue(this._updateFeatureConfigSpy.called, 'key events updateFeatureConfig function was not called');
            });

            TestEvents.publishKeyboardEvent('keydown', 'Q', 'q', 81, '1', false, false, true, '81');

            await TestUtils.waitForNoAssertion(() => {
                const event = TestUtils.findLatestEventByName(serverWorkerSendAsync, 'key_events');
                assert.isNotNull(event, 'Did not find a key_events event');
                assert.equal('key_events', event.eventName, 'eventName is not key_events');
                assert.equal(event.data[KeyEventStructure.indexOf('isSameKey') + 1],
                    SameCharType.undefined, 'key down should result undefined');
            });

            TestEvents.publishKeyboardEvent('keypress', 'b', 'b', 81, '1', false, true, false, '81');

            await TestUtils.waitForNoAssertion(() => {
                const event = TestUtils.findLatestEventByName(serverWorkerSendAsync, 'key_events');
                assert.isNotNull(event, 'Did not find a key_events event');
                assert.equal('key_events', event.eventName, 'eventName is not key_events');
                assert.equal(event.data[KeyEventStructure.indexOf('isSameKey') + 1],
                    SameCharType.false, 'first key collected on keypress should result false');
            });

            TestEvents.publishKeyboardEvent('keyup', 'Q', 'q', 81, '1', true, false, false, '81');

            await TestUtils.waitForNoAssertion(() => {
                const event = TestUtils.findLatestEventByName(serverWorkerSendAsync, 'key_events');
                assert.isNotNull(event, 'Did not find a key_events event');
                assert.equal('key_events', event.eventName, 'eventName is not key_events');
                assert.equal(event.data[KeyEventStructure.indexOf('isSameKey') + 1],
                    SameCharType.undefined, 'key up should result undefined');
            });

            TestEvents.publishKeyboardEvent('keypress', 'c', 'c', 81, '1', false, true, false, '81');

            await TestUtils.waitForNoAssertion(() => {
                const event = TestUtils.findLatestEventByName(serverWorkerSendAsync, 'key_events');
                assert.isNotNull(event, 'Did not find a key_events event');
                assert.equal('key_events', event.eventName, 'eventName is not key_events');
                assert.equal(event.data[KeyEventStructure.indexOf('isSameKey') + 1],
                    SameCharType.false, 'second key collected not equal to first event on keypress should result false');
            });

            serverWorkerSendAsync.resetHistory(); // For cleaning the state of the spy
        });

        it('KeyCombo tests ', async function () {
            ConfigurationChanger.change(this.systemBootstrapper, {
                isKeyEvents: true,
                isCaptureKeyEvents: true,
            });

            const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;

            // Wait for the configuration update to apply on the feature
            await TestUtils.waitForNoAssertion(() => {
                assert.isTrue(this._updateFeatureConfigSpy.called, 'key events updateFeatureConfig function was not called');
            });

            TestEvents.publishKeyboardEvent('keydown', 'v', 'v', 86, '0', false, false, true, 'keyV', '0');

            await TestUtils.waitForNoAssertion(() => {
                const event = TestUtils.findLatestEventByName(serverWorkerSendAsync, 'key_events');
                assert.isNotNull(event, 'Did not find a key_events event');
                assert.equal('key_events', event.eventName, 'eventName is not key_events');
                assert.equal(event.data[KeyEventStructure.indexOf('keyComboType') + 1],
                    1, 'keyCombo is not ctrl-v');
            });

            TestEvents.publishKeyboardEvent('keydown', 'a', 'a', 65, '0', false, true, false, 'keyA', '0');

            await TestUtils.waitForNoAssertion(() => {
                const event = TestUtils.findLatestEventByName(serverWorkerSendAsync, 'key_events');
                assert.isNotNull(event, 'Did not find a key_events event');
                assert.equal('key_events', event.eventName, 'eventName is not key_events');
                assert.equal(event.data[KeyEventStructure.indexOf('keyComboType') + 1],
                    2, 'keyCombo is not ctrl-a');
            });

            TestEvents.publishKeyboardEvent('keydown', 'x', 'x', 88, '0', false, false, true, 'keyX', '0');

            await TestUtils.waitForNoAssertion(() => {
                const event = TestUtils.findLatestEventByName(serverWorkerSendAsync, 'key_events');
                assert.isNotNull(event, 'Did not find a key_events event');
                assert.equal('key_events', event.eventName, 'eventName is not key_events');
                assert.equal(event.data[KeyEventStructure.indexOf('keyComboType') + 1],
                    3, 'keyCombo is not ctrl-x');
            });

            TestEvents.publishKeyboardEvent('keydown', 's', 's', 83, '0', false, true, false, 'KeyS', '0');

            await TestUtils.waitForNoAssertion(() => {
                const event = TestUtils.findLatestEventByName(serverWorkerSendAsync, 'key_events');
                assert.isNotNull(event, 'Did not find a key_events event');
                assert.equal('key_events', event.eventName, 'eventName is not key_events');
                assert.equal(event.data[KeyEventStructure.indexOf('keyComboType') + 1],
                    6, 'keyCombo is not ctrl-s');
            });

            serverWorkerSendAsync.resetHistory(); // For cleaning the state of the spy
        });

        if(!TestBrowserUtils.isMobileSafari(window.navigator.userAgent)) {
            it('Key region tests', async function () {
                ConfigurationChanger.change(this.systemBootstrapper, {
                    isKeyEvents: true,
                    isCaptureKeyEvents: true,
                    collectKeyRegionValue: true,
                });

                const serverWorkerSendAsync = this.systemBootstrapper.getServerWorkerCommunicator().sendAsync;

                // Wait for the configuration update to apply on the feature
                await TestUtils.waitForNoAssertion(() => {
                    assert.isTrue(this._updateFeatureConfigSpy.called, 'key events updateFeatureConfig function was not called');
                });

                TestEvents.publishKeyboardEvent('keydown', '@', '@', 50, '0', true, false, false, 'Digit2', '0');

                await TestUtils.waitForNoAssertion(() => {
                    const event = TestUtils.findLatestEventByName(serverWorkerSendAsync, 'key_events');
                    assert.isNotNull(event, 'Did not find a key_events event');
                    assert.equal('key_events', event.eventName, 'eventName is not key_events');
                    assert.equal(event.data[KeyEventStructure.indexOf('keyRegion') + 1],
                        '0', 'keyRegion is not 0');
                });

                TestEvents.publishKeyboardEvent('keyup', '/', '/', 191, '0', false, false, false, 'Slash', '0');
                await TestUtils.waitForNoAssertion(() => {
                    const event = TestUtils.findLatestEventByName(serverWorkerSendAsync, 'key_events');
                    assert.isNotNull(event, 'Did not find a key_events event');
                    assert.equal('key_events', event.eventName, 'eventName is not key_events');
                    assert.equal(event.data[KeyEventStructure.indexOf('keyRegion') + 1],
                        '7', 'keyRegion is not 7');
                });

                TestEvents.publishKeyboardEvent('keypress', '.', '.', 46, 'NUMPAD', false, false, false, 'NumpadDecimal', 46);
                await TestUtils.waitForNoAssertion(() => {
                    const event = TestUtils.findLatestEventByName(serverWorkerSendAsync, 'key_events');
                    assert.isNotNull(event, 'Did not find a key_events event');
                    assert.equal('key_events', event.eventName, 'eventName is not key_events');
                    assert.equal(event.data[KeyEventStructure.indexOf('keyRegion') + 1],
                        '8', 'keyRegion is not 8');
                });

                serverWorkerSendAsync.resetHistory(); // For cleaning the state of the spy
            });
        }
    }
});
