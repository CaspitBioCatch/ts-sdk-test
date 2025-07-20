import { assert } from 'chai';
import ElementSettings from "../../../../src/main/api/ElementSettings";

describe('ElementSettings tests:', function () {
    it('getCustomElementAttribute as expected', function () {
        const settings = {'customElementAttribute': 'bob'};
        const elementSettings = new ElementSettings(settings);

        assert.equal(elementSettings.getCustomElementAttribute(), 'bob');
    });
});