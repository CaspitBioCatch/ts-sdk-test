import ConfigurationRepository from "../../../../../src/main/core/configuration/ConfigurationRepository";
import {ConfigurationFields} from "../../../../../src/main/core/configuration/ConfigurationFields";
import MaskingService from "../../../../../src/main/core/masking/MaskingService";
import sinon from "sinon";

import {assert} from "chai";

describe('Masking tests:', function () {
    let maskingService = null;

    describe('key code and charCode tests:', function () {
        describe('_maskKeyAndCode without specialChars configuration tests:', function () {
            before(function () {
                this.sandbox = sinon.createSandbox();
                const configurationRepository = this.sandbox.createStubInstance(ConfigurationRepository);
                configurationRepository.get.withArgs(ConfigurationFields.keyEventsMaskSpecialChars).returns(false);
                maskingService = new MaskingService(configurationRepository);
            });
            after(function () {
                this.sandbox.restore();
            });
            it('special key comma is not masked', function () {
                const keyCode = {key: ',', code: 'Comma'};
                const result = maskingService.maskKey(keyCode.key, keyCode.code);

                assert.equal(result.key, ',', 'not the right key');
                assert.equal(result.code, 'Comma', 'not the right code');
                assert.equal(result.charCode, 44, 'not the right charCode');
            });

            it('special key commercial at is not masked', function () {
                const keyCode = {key: '@', code: 'Digit2'};
                const result = maskingService.maskKey(keyCode.key, keyCode.code);

                assert.equal(result.key, '@', 'not the right key');
                assert.equal(result.code, 'Digit2', 'not the right code');
                assert.equal(result.charCode, 64, 'not the right charCode');
            });

            it('element ID from password list masked to a', function () {
                this.sandbox.stub(maskingService, '_isPasswordMaskedElementId').returns(true);

                const keyCode = {key: '1', code: 'Digit1'};
                const result = maskingService.maskKey(keyCode.key, keyCode.code);

                assert.equal(result.key, 'a', 'not the right key');
                assert.equal(result.code, 'Masked', 'need to be Masked');
                assert.equal(result.charCode, 'a'.charCodeAt(0), 'not the right charCode');
                this.sandbox.reset();
            });

            it('special key plus is not masked', function () {
                const keyCode = {key: '+', code: 'Equal'};
                const result = maskingService.maskKey(keyCode.key, keyCode.code);

                assert.equal(result.key, '+', 'not the right key');
                assert.equal(result.code, 'Equal', 'not the right code');
                assert.equal(result.charCode, 43, 'not the right charCode');
            });

            it('special key ss is masked', function () {
                const keyCode = {key: '§', code: 'IntlBackslash'};
                const result = maskingService.maskKey(keyCode.key, keyCode.code);

                assert.equal(result.key, '*', 'not the right key');
                assert.equal(result.code, 'SpecialChar', 'not the right code');
                assert.equal(result.charCode, 42, 'not the right charCode');
            });

            it('哩 masked to A ', function () {
                const keyCode = {key: '哩', code: 'KeyJ'};
                const result = maskingService.maskKey(keyCode.key, keyCode.code);

                assert.equal(result.key, 'A', 'not the right key');
                assert.equal(result.code, 'Key', 'not the right code');
                assert.equal(result.charCode, 65, 'not the right charCode');
            });

            it('大 masked to A ', function () {
                const keyCode = {key: '大', code: 'KeyK'};
                const result = maskingService.maskKey(keyCode.key, keyCode.code);

                assert.equal(result.key, 'A', 'not the right key');
                assert.equal(result.code, 'Key', 'not the right code');
                assert.equal(result.charCode, 65, 'not the right charCode');
            });

            it('CJK Unified A Letter masked to A ', function () {
                const keyCode = {key: '㐆', code: 'KeyK'};
                const keyCode2 = {key: '㔁', code: 'KeyK'};
                const result = maskingService.maskKey(keyCode.key, keyCode.code);
                const result2 = maskingService.maskKey(keyCode2.key, keyCode2.code);

                assert.equal(result.key, 'A', 'not the right key');
                assert.equal(result.code, 'Key', 'not the right code');
                assert.equal(result.charCode, 65, 'not the right charCode');
                assert.equal(result2.key, 'A', 'not the right key');
                assert.equal(result2.code, 'Key', 'not the right code');
                assert.equal(result2.charCode, 65, 'not the right charCode');
            });

            it('CJK Unified B Letter masked to A ', function () {
                const keyCode1 = {key: 'ゟ', code: 'KeyK'};
                const keyCode2 = {key: 'ぱ', code: 'KeyK'};
                const result1 = maskingService.maskKey(keyCode1.key, keyCode1.code);
                const result2 = maskingService.maskKey(keyCode2.key, keyCode2.code);

                assert.equal(result1.key, 'A', 'not the right key');
                assert.equal(result1.code, 'Key', 'not the right code');
                assert.equal(result1.charCode, 65, 'not the right charCode');
                assert.equal(result2.key, 'A', 'not the right key');
                assert.equal(result2.code, 'Key', 'not the right code');
                assert.equal(result2.charCode, 65, 'not the right charCode');
            });

            it('_isSmallKatakanaLetter return true', function () {
                const result = maskingService._isSmallKatakanaLetter('ァ')
                assert.isTrue(result, 'not true');
            });

            it('_isSmallKatakanaLetter return false', function () {
                const result = maskingService._isSmallKatakanaLetter('k')

                assert.isFalse(result, 'not false');
            });

            it('small Katakana Letter masked to A ', function () {
                const keyCode1 = {key: 'ァ', code: 'KeyK'};
                const keyCode2 = {key: 'ヿ', code: 'KeyK'};
                const result1 = maskingService.maskKey(keyCode1.key, keyCode1.code);
                const result2 = maskingService.maskKey(keyCode2.key, keyCode2.code);

                assert.equal(result1.key, 'A', 'not the right key');
                assert.equal(result1.code, 'Key', 'not the right code');
                assert.equal(result1.charCode, 65, 'not the right charCode');
                assert.equal(result2.key, 'A', 'not the right key');
                assert.equal(result2.code, 'Key', 'not the right code');
                assert.equal(result2.charCode, 65, 'not the right charCode');
            });

            it('kanjiNumbers masked to 1 ', function () {
                const keyCode = {key: '一', code: 'KeyM'};
                const result = maskingService.maskKey(keyCode.key, keyCode.code);

                assert.equal(result.key, '1', 'not the right key');
                assert.equal(result.code, 'Digit', 'not the right code');
                assert.equal(result.charCode, 49, 'not the right charCode');
            });

            it('chineseCapitalNumbers masked to 1 ', function () {
                const keyCode = {key: '萬', code: 'KeyA'};
                const result = maskingService.maskKey(keyCode.key, keyCode.code);

                assert.equal(result.key, '1', 'not the right key');
                assert.equal(result.code, 'Digit', 'not the right code');
                assert.equal(result.charCode, 49, 'not the right charCode');
            });

            it('suzhouNumbers masked to 1 ', function () {
                const keyCode = {key: '〨', code: 'KeyE'};
                const result = maskingService.maskKey(keyCode.key, keyCode.code);

                assert.equal(result.key, '1', 'not the right key');
                assert.equal(result.code, 'Digit', 'not the right code');
                assert.equal(result.charCode, 49, 'not the right charCode');
            });

            it('string of chars masked to B ', function () {
                const keyCode = {key: 'Proses', code: 'Digit6'};
                const result = maskingService.maskKey(keyCode.key, keyCode.code);

                assert.equal(result.key, 'B', 'not the right key');
                assert.equal(result.code, 'Other', 'not the right code');
                assert.equal(result.charCode, 66, 'not the right charCode');
            });

            it('string of chars masked to B ', function () {
                const keyCode = {key: 'pROSES', code: 'Digit6'};
                const result = maskingService.maskKey(keyCode.key, keyCode.code);

                assert.equal(result.key, 'B', 'not the right key');
                assert.equal(result.code, 'Other', 'not the right code');
                assert.equal(result.charCode, 66, 'not the right charCode');
            });

            it('maskText test without configuration', function () {
                const mixedMaskedText = maskingService.maskText("2#?五$bob ׆׆׆〥零:");
                const specialCharsMaskedText = maskingService.maskText("_!%^#&*()={}[]’|?<>~\"§±'/\\");
                const specialConfigurationCharsMaskedText = maskingService.maskText(" ,.@;:\\-+\$");
                const uppercaseMaskedText = maskingService.maskText("ABCDEFGHIJKLMNOPQRSTVUWXYZ");
                const lowercaseMaskedText = maskingService.maskText("abcdefghijklmnopqrstvuwxyz");
                const numbersMaskedText = maskingService.maskText("0123456789");
                const numbersCJK = maskingService.maskText("〇一二三四五六七八九十百千万零壹貳贰參叁肆伍陸陆柒捌玖拾佰仟萬〡〢〣〤〥〦〧〨〩〸〹〺");
                const hebrewLettersMaskedText = maskingService.maskText("אבגדהוזחטיכךלמנןסעפףצץקרשת");

                assert.equal(mixedMaskedText,"1**1$aaa BBB11:", "maskText didn't masked properly the text");
                assert.equal(specialCharsMaskedText,"**************************", "maskText didn't masked properly the specialChars Text text");
                assert.equal(specialConfigurationCharsMaskedText," ,.@;:*-+$", "maskText didn't masked properly the specialConfigurationChars Text\"");
                assert.equal(uppercaseMaskedText,"aaaaaaaaaaaaaaaaaaaaaaaaaa", "maskText didn't masked uppercase Text properly");
                assert.equal(lowercaseMaskedText ,"aaaaaaaaaaaaaaaaaaaaaaaaaa", "maskText didn't masked lowercase Text properly");
                assert.equal(numbersMaskedText,"1111111111","maskText didn't masked numbers properly");
                assert.equal(numbersCJK,"1111111111111111111111111111111111111111111","maskText didn't masked numbers CJK properly");
                assert.equal(hebrewLettersMaskedText ,"aaaaaaaaaaaaaaaaaaaaaaaaaa", "maskText didn't masked hebrew Text properly")
            })
        });

        describe('_maskKey with specialChars configuration tests', function () {
            before(function () {
                this.sandbox = sinon.createSandbox();
                const configurationRepository = this.sandbox.createStubInstance(ConfigurationRepository);
                configurationRepository.get.withArgs(ConfigurationFields.keyEventsMaskSpecialChars).returns(true);
                maskingService = new MaskingService(configurationRepository);
            });

            after(function () {
                this.sandbox.restore();
            });

            it('key values masked', function () {
                const keyCode = {key: 'q', code: 'KeyQ'};
                const result = maskingService.maskKey(keyCode.key, keyCode.code);

                assert.equal(result.key, 'A', 'not the right key');
                assert.equal(result.code, 'Key', 'not the right code');
                assert.equal(result.charCode, 65, 'not the right charCode');
            });

            it('key capital values masked', function () {
                const keyCode = {key: 'Q', code: 'KeyQ'};
                const result = maskingService.maskKey(keyCode.key, keyCode.code);

                assert.equal(result.key, 'A', 'not the right key');
                assert.equal(result.code, 'Key', 'not the right code');
                assert.equal(result.charCode, 65, 'not the right charCode');
            });

            it('keys hebrew values masked', function () {
                const keyCode = {key: 'ע', code: 'KeyG'};
                const result = maskingService.maskKey(keyCode.key, keyCode.code);

                assert.equal(result.key, 'A', 'not the right key');
                assert.equal(result.code, 'Key', 'not the right code');
                assert.equal(result.charCode, 65, 'not the right charCode');
            });

            it('keys not a-Z values masked', function () {
                const keyCode = {key: '׆', code: 'KeyG'};
                const result = maskingService.maskKey(keyCode.key, keyCode.code);

                assert.equal(result.key, 'B', 'not the right key');
                assert.equal(result.code, 'Other', 'not the right code');
                assert.equal(result.charCode, 66, 'not the right charCode');
            });

            it('numpad digits value masked', function () {
                const keyCode = {key: '7', code: 'Numpad7'};
                const result = maskingService.maskKey(keyCode.key, keyCode.code);

                assert.equal(result.key, '1', 'not the right key');
                assert.equal(result.code, 'Numpad', 'not the right code');
                assert.equal(result.charCode, 96, 'not the right charCode');
            });

            it('numpad special char value masked', function () {
                let keyCode = {key: '+', code: 'NumpadAdd'};
                let result = maskingService.maskKey(keyCode.key, keyCode.code);

                assert.equal(result.key, '*', 'not the right key');
                assert.equal(result.code, 'Numpad', 'not the right code');
                assert.equal(result.charCode, 96, 'not the right charCode');

                keyCode = {key: '/', code: 'NumpadDivide'};
                result = maskingService.maskKey(keyCode.key, keyCode.code);

                assert.equal(result.key, '*', 'not the right key');
                assert.equal(result.code, 'Numpad', 'not the right code');
                assert.equal(result.charCode, 96, 'not the right charCode');
            });

            it('keypad values masked', function () {
                const keyCode = {key: '3', code: 'Digit3'};
                const result = maskingService.maskKey(keyCode.key, keyCode.code);

                assert.equal(result.key, '1', 'not the right key');
                assert.equal(result.code, 'Digit', 'not the right code');
                assert.equal(result.charCode, 49, 'not the right charCode');
            });

            it('special key slash masked', function () {
                const keyCode = {key: '/', code: 'Slash'};
                const result = maskingService.maskKey(keyCode.key, keyCode.code);

                assert.equal(result.key, '*', 'not the right key');
                assert.equal(result.code, 'SpecialChar', 'not the right code');
                assert.equal(result.charCode, 42, 'not the right charCode');
            });

            it('special key astrix masked', function () {
                const keyCode = {key: '*', code: 'Digit8'};
                const result = maskingService.maskKey(keyCode.key, keyCode.code);

                assert.equal(result.key, '*', 'not the right key');
                assert.equal(result.code, 'SpecialChar', 'not the right code');
                assert.equal(result.charCode, 42, 'not the right charCode');
            });

            it('handles empty values', function () {
                const keyCode = {key: '', code: ''};
                const result = maskingService.maskKey(keyCode.key, keyCode.code);

                assert.equal(result.key, 'B', 'not the right key');
                assert.equal(result.code, 'Other', 'not the right code');
                assert.equal(result.charCode, 66, 'not the right charCode');
            });

            it('special key commercial at is masked', function () {
                const keyCode = {key: '@', code: 'Digit2'};
                const result = maskingService.maskKey(keyCode.key, keyCode.code);

                assert.equal(result.key, '*', 'not the right key');
                assert.equal(result.code, 'SpecialChar', 'not the right code');
                assert.equal(result.charCode, 42, 'not the right charCode');
            });

            it('special key plus is masked', function () {
                const keyCode = {key: '+', code: 'Equal'};
                const result = maskingService.maskKey(keyCode.key, keyCode.code);

                assert.equal(result.key, '*', 'not the right key');
                assert.equal(result.code, 'SpecialChar', 'not the right code');
                assert.equal(result.charCode, 42, 'not the right charCode');
            });

            it('Shift key is not masked', function () {
                const keyCode = {key: 'Shift', code: 'ShiftRight'};
                const result = maskingService.maskKey(keyCode.key, keyCode.code);

                assert.equal(result.key, 'Shift', 'not the right key');
                assert.equal(result.code, 'ShiftRight', 'not the right code');
                assert.equal(result.charCode, 16, 'not the right charCode');
            });
            it('Control key is not masked', function () {
                const keyCode = {key: 'Control', code: 'ControlLeft'};
                const result = maskingService.maskKey(keyCode.key, keyCode.code);

                assert.equal(result.key, 'Control', 'not the right key');
                assert.equal(result.code, 'ControlLeft', 'not the right code');
                assert.equal(result.charCode, 17, 'not the right charCode');
            });
            it('F4 key is not masked', function () {
                const keyCode = {key: 'F4', code: 'F4'};
                const result = maskingService.maskKey(keyCode.key, keyCode.code);

                assert.equal(result.key, 'F4', 'not the right key');
                assert.equal(result.code, 'F4', 'not the right code');
                assert.equal(result.charCode, 115, 'not the right charCode');
            });
            it('Space key is not masked', function () {
                const keyCode = {key: ' ', code: 'Space'};
                const result = maskingService.maskKey(keyCode.key, keyCode.code);

                assert.equal(result.key, ' ', 'not the right key');
                assert.equal(result.code, 'Space', 'not the right code');
                assert.equal(result.charCode, 32, 'not the right charCode');
            });
            it('NumLock key is not masked', function () {
                const keyCode = {key: 'Clear', code: 'NumLock'};
                const result = maskingService.maskKey(keyCode.key, keyCode.code);

                assert.equal(result.key, 'Clear', 'not the right key');
                assert.equal(result.code, 'NumLock', 'not the right code');
                assert.equal(result.charCode, 144, 'not the right charCode');
            });

            it('getKeyFromLegacyProperties Key d test', function () {
                const e = {keyCode: 100, which: 100};
                const result = maskingService.getKeyFromLegacyProperties(e);

                assert.equal(result, 'd', 'not the right key');
            });

            it('getKeyFromLegacyProperties Key 3 test', function () {
                const e = {keyCode: 51, which: undefined};
                const result = maskingService.getKeyFromLegacyProperties(e);

                assert.equal(result, '3', 'not the right key');
            });

            it('getKeyFromLegacyProperties Key D test', function () {
                const e = {keyCode: 68, which: 68};
                const result = maskingService.getKeyFromLegacyProperties(e);

                assert.equal(result, 'D', 'not the right key');
            });

            it('getKeyFromLegacyProperties Key @ test', function () {
                const e = {keyCode: undefined, which: 64};
                const result = maskingService.getKeyFromLegacyProperties(e);

                assert.equal(result, '@', 'not the right key');
            });

            it('getKeyFromLegacyProperties Key undefined test', function () {
                const e = {keyCode: undefined, which: undefined, charCode: undefined};
                const result = maskingService.getKeyFromLegacyProperties(e);

                assert.equal(result, '', 'not the right key');
            });

            it('getKeyFromLegacyProperties Key 0 test', function () {
                const e = {keyCode: 0, which: 0, charCode: undefined};
                const result = maskingService.getKeyFromLegacyProperties(e);

                assert.equal(result, '', 'not the right key');
            });

            it('maskText test with configuration', function () {
                const mixedMaskedText = maskingService.maskText("2#?五$bob ׆׆׆〥零:");
                const specialCharsMaskedText = maskingService.maskText("_!%^#&*()={}[]’|?<>~\"§±'/\\");
                const specialConfigurationCharsMaskedText = maskingService.maskText(" ,.@;:\\-+\$");
                const uppercaseMaskedText = maskingService.maskText("ABCDEFGHIJKLMNOPQRSTVUWXYZ");
                const lowercaseMaskedText = maskingService.maskText("abcdefghijklmnopqrstvuwxyz");
                const numbersMaskedText = maskingService.maskText("0123456789");
                const numbersCJK = maskingService.maskText("〇一二三四五六七八九十百千万零壹貳贰參叁肆伍陸陆柒捌玖拾佰仟萬〡〢〣〤〥〦〧〨〩〸〹〺");
                const hebrewLettersMaskedText = maskingService.maskText("אבגדהוזחטיכךלמנןסעפףצץקרשת");

                assert.equal(mixedMaskedText,"1**1*aaa*BBB11*", "maskText didn't masked properly the text")
                assert.equal(specialCharsMaskedText,"**************************", "maskText didn't masked properly the specialChars Text text")
                assert.equal(specialConfigurationCharsMaskedText,"**********", "maskText didn't masked properly the specialConfigurationChars Text")
                assert.equal(uppercaseMaskedText,"aaaaaaaaaaaaaaaaaaaaaaaaaa", "maskText didn't masked uppercase Text properly")
                assert.equal(lowercaseMaskedText ,"aaaaaaaaaaaaaaaaaaaaaaaaaa", "maskText didn't masked lowercase Text properly")
                assert.equal(numbersMaskedText,"1111111111","maskText didn't masked numbers properly")
                assert.equal(numbersCJK,"1111111111111111111111111111111111111111111","maskText didn't masked numbers CJK properly ")
                assert.equal(hebrewLettersMaskedText ,"aaaaaaaaaaaaaaaaaaaaaaaaaa", "maskText didn't masked hebrew Text properly")
            })

            it('maskText test undefined', function () {
                const text = undefined;
                const expectedMaskedText = '';
                const result = maskingService.maskText(text);

                assert.equal(result, expectedMaskedText, "maskText didn't masked properly the text")
            })

            it('maskText test null', function () {
                const text = null;
                const expectedMaskedText = '';
                const result = maskingService.maskText(text);

                assert.equal(result, expectedMaskedText, "maskText didn't masked properly the text")
            })

            it('maskText test with empty string ', function () {
                const text = "";
                const expectedMaskedText = "";
                const result = maskingService.maskText(text);

                assert.equal(result, expectedMaskedText, "result is not empty")
            })
        });
    });
});

describe('MaskingService ', () => {
    let maskingService;

    beforeEach(() => {
        // Create a new instance of your class before each test
        const configurationRepository = sinon.createStubInstance(ConfigurationRepository);
        maskingService = new MaskingService(configurationRepository);
    });

    afterEach(() => {
        // Clean up any stubs or resources after each test
        sinon.restore();
    });

    describe('maskAbsoluteIfRequired', () => {
        it('should return empty string when elementValue is empty', () => {
            const result = maskingService.maskAbsoluteIfRequired('');
            assert.strictEqual(result, '');
        });

        it('should return masked value when _shouldMask is true', () => {
            // Stub the _shouldMask method to return true
            sinon.stub(maskingService, '_shouldMask').returns(true);
            // Stub the maskText method to return a masked value
            sinon.stub(maskingService, 'maskText').returns('maskedValue');

            const result = maskingService.maskAbsoluteIfRequired('elementValue');
            assert.strictEqual(result, 'maskedValue');
        });

        it('should return elementValue when _shouldMask is false', () => {
            // Stub the _shouldMask method to return false
            sinon.stub(maskingService, '_shouldMask').returns(false);

            const result = maskingService.maskAbsoluteIfRequired('elementValue');
            assert.strictEqual(result, 'elementValue');
        });
    });

    describe('shouldMaskCoordinates', () => {
        it('should mask coordinates when configuration enabled', () => {
            const configurationRepository = sinon.createStubInstance(ConfigurationRepository);
            configurationRepository.get.withArgs(ConfigurationFields.enableCoordinatesMasking).returns(true);

            maskingService = new MaskingService(configurationRepository);

            const result = maskingService.shouldMaskCoordinates();
            assert.strictEqual(result, true);
        });

        it('should not mask coordinates when configuration disabled', () => {
            const configurationRepository = sinon.createStubInstance(ConfigurationRepository);
            configurationRepository.get.withArgs(ConfigurationFields.enableCoordinatesMasking).returns(false);

            maskingService = new MaskingService(configurationRepository);

            const result = maskingService.shouldMaskCoordinates();
            assert.strictEqual(result, false);
        });
    });

    describe('_shouldMask', () => {
        it('should return false when _attributesToMask is undefined', () => {
            const result = maskingService._shouldMask('elementValue');
            assert.isFalse(result);
        });

        it('should return true when _attributesToMask contains matching element', () => {
            // Stub _attributesToMask to contain a matching element
            sinon.stub(maskingService, '_attributesToMask').value([{ regexPattern: 'pattern', name: 'Name' }]);

            const result = maskingService._shouldMask('Name');
            assert.isTrue(result);
        });

        it('should return false when _attributesToMask does not contain matching element', () => {
            // Stub _attributesToMask to not contain a matching element
            sinon.stub(maskingService, '_attributesToMask').value([{ regexPattern: 'pattern', name: 'Name' }]);

            const result = maskingService._shouldMask('OtherName');
            assert.isFalse(result);
        });
    });

    describe('_isConformsRegex', () => {
        it('should return true when string matches regex pattern', () => {
            const result = maskingService._isConformsRegex('^payee_id_for_', 'payee_id_for_customer_name');
            assert.isTrue(result);
        });

        it('should return false when string does not match regex pattern', () => {
            const result = maskingService._isConformsRegex('pattern', 'nonMatchingString');
            assert.isFalse(result);
        });

        it('should return false when regex pattern is invalid', () => {
            const result = maskingService._isConformsRegex('invalid[regex', 'stringToCheck');
            assert.isFalse(result);
        });
    });
});

describe('getDropDownListValues', () => {
    let selectElemMock;
    let maskingService;

    beforeEach(() => {
        // Setup MaskingService with a stubbed maskText method
        const configurationRepository = sinon.createStubInstance(ConfigurationRepository);
        maskingService = new MaskingService(configurationRepository);
        sinon.stub(maskingService, 'maskText').callsFake((text) => {return `masked-${text}`});

        // Mock select element with options
        selectElemMock = {
            options: [
                { text: 'Option 1', value: '1' },
                { value: '2' }, // No text
                { text: 'Option 3' }, // No value, relying on text
                {} // Neither text nor value
            ],
            length: 4
        };
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should mask all option texts or values', () => {
        const expected = ['masked-Option 1', 'masked-2', 'masked-Option 3', 'masked-'];
        const result = maskingService.getDropDownListValues(selectElemMock);
        assert.deepStrictEqual(result, expected, 'Should return an array of masked option texts or values');
    });

    it('should return an empty array for an empty select element', () => {
        selectElemMock = { options: [], length: 0 };
        const expected = [];
        const result = maskingService.getDropDownListValues(selectElemMock);
        assert.deepStrictEqual(result, expected, 'Should return an empty array for an empty select element');
    });

    it('should call maskText for each option', () => {
        maskingService.getDropDownListValues(selectElemMock);
        assert.strictEqual(maskingService.maskText.callCount, 4, 'maskText should be called once for each option');
    });
});

describe('passwordIdMaskingList feature tests', function () {
    let maskingService;

    before(function () {
        this.sandbox = sinon.createSandbox();
        const configurationRepository = this.sandbox.createStubInstance(ConfigurationRepository);
        // Mock the passwordIdMaskingList configuration
        configurationRepository.get.withArgs(ConfigurationFields.passwordIdMaskingList).returns(["password", "confirm_password"]);
        maskingService = new MaskingService(configurationRepository);
    });

    after(function () {
        this.sandbox.restore();
    });

    it('should mask IDs that are in passwordIdMaskingList', function () {
        const elementID = "password";
        const result = maskingService.maskText("somePassword123!", elementID)

        assert.equal(result, "aaaaaaaaaaaaaaaa", "The password ID should be masked");
    });

    it('should mask confirm_password ID in passwordIdMaskingList', function () {
        const elementID = "confirm_password";
        const result = maskingService.maskText("anotherPassword123!", elementID);

        assert.equal(result, "aaaaaaaaaaaaaaaaaaa", "The confirm_password ID should be masked");
    });

    it('should not mask IDs that are not in passwordIdMaskingList', function () {
        const elementID = "elementID";
        const result = maskingService.maskText("12345asdef", elementID);

        assert.equal(result, "11111aaaaa", "The email ID should not be masked");
    });

    it('should return the same value if ID is undefined or not in the list', function () {
        const elementID = undefined;
        const result = maskingService.maskText("randomValue", elementID);

        assert.equal(result, "aaaaaaaaaaa", "If the ID is undefined or not in the list, the value should not be masked");
    });
});
