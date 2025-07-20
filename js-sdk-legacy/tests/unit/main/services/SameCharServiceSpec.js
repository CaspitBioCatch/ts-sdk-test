import SameCharService from '../../../../src/main/services/SameCharService';

describe('SameCharService Tests:', function () {
    before(function () {
        const inputElementA = document.createElement('input');
        inputElementA.setAttribute('id', 'txt1FORSAmeCharTests');
        inputElementA.type = 'text';
        inputElementA.value = 'Some input field text 1';
        inputElementA.className = 'input-text-class'; // set the CSS class
        document.body.appendChild(inputElementA); // put it into the DOM

        const inputElementB = document.createElement('input');
        inputElementB.setAttribute('id', 'txt2FORSAmeCharTests');
        inputElementB.type = 'text';
        inputElementB.value = 'Some input field text 2';
        inputElementB.className = 'input-text-class'; // set the CSS class
        document.body.appendChild(inputElementB); // put it into the DOM
    });

    beforeEach(function () {
        this.sameCharService = new SameCharService();
    });

    it('Two input element with different keys should return false', function () {
        const inputElement1 = document.getElementById('txt1FORSAmeCharTests');
        const inputElement2 = document.getElementById('txt2FORSAmeCharTests');
        this.sameCharService.update(inputElement1, 'a');
        this.sameCharService.update(inputElement2, 'c');
        const elementOne = this.sameCharService.compare(inputElement1, 'b');
        const elementTwo = this.sameCharService.compare(inputElement2, 'd');
        assert.equal(elementOne, false);
        assert.equal(elementTwo, false);
    });

    it('Two input element with same keys should return false', function () {
        const inputElement1 = document.getElementById('txt1FORSAmeCharTests');
        const inputElement2 = document.getElementById('txt2FORSAmeCharTests');
        this.sameCharService.update(inputElement1, 'a');
        this.sameCharService.update(inputElement2, 'c');
        const elementOne = this.sameCharService.compare(inputElement1, 'a');
        const elementTwo = this.sameCharService.compare(inputElement2, 'c');
        assert.equal(elementOne, true);
        assert.equal(elementTwo, true);
    });

    it('Two input element with random keys should return expected', function () {
        const inputElement1 = document.getElementById('txt1FORSAmeCharTests');
        const inputElement2 = document.getElementById('txt2FORSAmeCharTests');
        this.sameCharService.update(inputElement1, 'a');
        this.sameCharService.update(inputElement2, 'c');
        const elementOne = this.sameCharService.compare(inputElement1, 'a');
        const elementTwo = this.sameCharService.compare(inputElement2, 'b');
        assert.equal(elementOne, true);
        assert.equal(elementTwo, false);
    });
});
