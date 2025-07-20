import { expect } from 'chai';
import sinon from 'sinon';
import CategoryService from "../../../../src/main/technicalServices/categories/CategoryService";


describe('CategoryService Tests', function () {
    beforeEach(function () {
        this.sandbox = sinon.createSandbox();

        this.customCategories = {
            email: 'Email',
            password: 'Password',
            otp: 'OTP',
            ssn: 'SSN',
            phone: 'Phone'
        };

        this.customAttributes = {
            attributes: ['placeholder', 'id', 'name']
        };

        this.service = new CategoryService(this.customCategories, this.customAttributes);
    });

    afterEach(function () {
        this.sandbox.restore();
    });

    it('should initialize with custom CATEGORY_RULES and ATTRIBUTE_NAMES', function () {
        expect(this.service.CATEGORY_RULES.get('email')).to.equal('Email');
        expect(this.service.ATTRIBUTE_NAMES.attributes).to.include('placeholder');
    });

    it('should fallback to defaults if empty inputs are given', function () {
        const service = new CategoryService({}, {});
        expect(service.CATEGORY_RULES.size).to.be.greaterThan(0);
        expect(service.ATTRIBUTE_NAMES.attributes.length).to.be.greaterThan(0);
    });

    it('should return "0" for hidden input', function () {
        const element = document.createElement('input');
        element.type = 'hidden';
        expect(this.service.categoryField(element)).to.equal('0');
    });

    it('should categorize based on matching placeholder', function () {
        const element = document.createElement('input');
        element.setAttribute('placeholder', 'Email');
        expect(this.service.categoryField(element)).to.equal('Email');
    });

    it('should categorize based on matching attribute other than placeholder', function () {
        const element = document.createElement('input');
        element.setAttribute('name', 'password');
        expect(this.service.categoryField(element)).to.equal('Password');
    });

    it('should categorize based on label text', function () {
        const element = document.createElement('input');
        element.setAttribute('id', 'testField');

        const label = document.createElement('label');
        label.setAttribute('for', 'testField');
        label.innerText = 'Phone';
        document.body.appendChild(label);

        expect(this.service.categoryField(element)).to.equal('Phone');

        document.body.removeChild(label);
    });

    it('should return "0" if no attributes match', function () {
        const element = document.createElement('input');
        element.setAttribute('placeholder', 'Some unrelated text');
        expect(this.service.categoryField(element)).to.equal('0');
    });

    it('should return most frequent category if multiple matches', function () {
        const element = document.createElement('input');
        element.setAttribute('placeholder', 'email email phone');
        expect(this.service.categoryField(element)).to.equal('Email');
    });

    it('should handle mixed case keywords', function () {
        const element = document.createElement('input');
        element.setAttribute('placeholder', 'eMaIl');
        expect(this.service.categoryField(element)).to.equal('Email');
    });

    it('should not fail if label has no match', function () {
        const element = document.createElement('input');
        element.setAttribute('id', 'someId');

        const label = document.createElement('label');
        label.setAttribute('for', 'someId');
        label.innerText = 'NotInCategoryMap';
        document.body.appendChild(label);

        expect(this.service.categoryField(element)).to.equal('0');

        document.body.removeChild(label);
    });

    it('should not throw if attributes array is empty', function () {
        const service = new CategoryService(this.customCategories, { attributes: [] });
        const element = document.createElement('input');
        expect(() => service.categoryField(element)).to.not.throw();
        expect(service.categoryField(element)).to.equal('0');
    });

    it('should handle null or undefined inputs gracefully', function () {
        const service = new CategoryService();
        expect(() => service.categoryField(null)).to.not.throw();
        expect(() => service.categoryField(undefined)).to.not.throw();
        expect(service.categoryField(null)).to.equal('0');
    });
});
