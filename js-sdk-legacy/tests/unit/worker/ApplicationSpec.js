import Application from '../../../src/worker/Application'

describe('Application tests', function () {
    describe('construction', function () {
        it('create application object', function () {
            const application = new Application();

            assert.exists(application);
        });
    });
});