import { assert } from 'chai';
import UserPermissions from '../../../../../src/main/collectors/static/UserPermissions';
import TestFeatureSupport from '../../../../TestFeatureSupport';
import DataQ from '../../../../../src/main/technicalServices/DataQ';

describe('UserPermissions tests:', function () {
    beforeEach(function () {
        if (!TestFeatureSupport.isUserPermissionsSupported()) {
            this.skip();
        }
    });

    describe('_reportQueryPremission', function () {
        beforeEach(function () {
            this._dataQ = sinon.createStubInstance(DataQ);
            const navMock = {
                permissions: {
                    query: sinon.stub(),
                },
            };
            this._navigator = navMock;
        });

        context('when query results state is known', function () {
            it('should report the right state', function () {
                const up = new UserPermissions(this._dataQ, this._navigator);

                const expectedPerms = [{ name: 'geolocation', state: 'granted' },
                    { name: 'midi', state: 'granted' },
                    { name: 'notifications', state: 'prompt' },
                    { name: 'push', state: 'denied' },
                ];
                expectedPerms.forEach((testArgs) => {
                    this._navigator.permissions.query.withArgs({ name: testArgs.name }).resolves({ state: testArgs.state });
                });

                up._reportQueryPermissions();

                this._navigator.permissions.query.withArgs('final').resolves();

                return this._navigator.permissions.query('final').then(() => {
                    expectedPerms.forEach((perm) => {
                        assert.isTrue(this._dataQ.addToQueue.calledWith('static_fields', [`per_${perm.name}`, up._permDefs[perm.state]]),
                            `expected a call with ${perm.name} and ${perm.state} but did not receive it`);
                    });
                });
            });
        });

        context('when query results state is unknown', function () {
            it('should report -1 as state', function () {
                const up = new UserPermissions(this._dataQ, this._navigator);

                const expectedPerms = [{ name: 'geolocation', state: 'bob' },
                    { name: 'midi', state: 'sabag' },
                    { name: 'notifications', state: 'boring' },
                    { name: 'push', state: 'test' },
                ];
                expectedPerms.forEach((testArgs) => {
                    this._navigator.permissions.query.withArgs({ name: testArgs.name }).resolves({ state: testArgs.state });
                });

                up._reportQueryPermissions();

                this._navigator.permissions.query.withArgs('final').resolves();

                return this._navigator.permissions.query('final').then(() => {
                    expectedPerms.forEach((perm) => {
                        assert.isTrue(this._dataQ.addToQueue.calledWith('static_fields', [`per_${perm.name}`, -1]),
                            `expected a call with ${perm.name} and -1 but did not receive it`);
                    });
                });
            });
        });

        context('when query call fails for one of the names', function () {
            it('should not report this name', function () {
                const up = new UserPermissions(this._dataQ, this._navigator);

                const expectedPerms = [{ name: 'geolocation', state: 'granted' },
                    { name: 'midi', state: 'granted' },
                    { name: 'notifications', state: 'prompt' },
                ];
                expectedPerms.forEach((testArgs) => {
                    this._navigator.permissions.query.withArgs({ name: testArgs.name }).resolves({ state: testArgs.state });
                });

                this._navigator.permissions.query.withArgs({ name: 'push' }).rejects({ message: 'Dummy rejection' });

                up._reportQueryPermissions();

                this._navigator.permissions.query.withArgs('final').resolves();

                return this._navigator.permissions.query('final').then(() => {
                    expectedPerms.forEach((perm) => {
                        assert.isTrue(this._dataQ.addToQueue.calledWith('static_fields', [`per_${perm.name}`, up._permDefs[perm.state]]),
                            `expected a call with ${perm.name} and ${perm.state} but did not receive it`);
                    });

                    assert.isTrue(this._dataQ.addToQueue.neverCalledWith('static_fields', ['per_push', sinon.match.any]),
                        'per_push was called although it should not');
                });
            });
        });
    });

    describe('_reportStoragePermission', function () {
        beforeEach(function () {
            this._dataQ = sinon.createStubInstance(DataQ);
            const navMock = {
                storage: {
                    persisted: sinon.stub(),
                },
            };
            this._navigator = navMock;
        });

        context('when navigator storage persisted call resolves', function () {
            [true, false].forEach((state) => {
                it(`should report the persisted state ${state}`, function () {
                    const up = new UserPermissions(this._dataQ, this._navigator);
                    this._navigator.storage.persisted.resolves(state);

                    up._reportStoragePermission();

                    return this._navigator.storage.persisted().then(() => {
                        assert.isTrue(this._dataQ.addToQueue.calledWith('static_fields', ['per_storage', up._permDefs[state]]),
                            'addToQueue called with unexpected persistent state');
                    });
                });
            });
        });

        context('when navigator storage persisted call rejected', function () {
            it('should not report persisted state', function () {
                const up = new UserPermissions(this._dataQ, this._navigator);
                this._navigator.storage.persisted.withArgs().rejects({ message: 'Dummy rejection' });
                this._navigator.storage.persisted.withArgs('final').resolves();

                up._reportStoragePermission();

                return this._navigator.storage.persisted('final').then(() => {
                    assert.isTrue(this._dataQ.addToQueue.notCalled, 'Unexpected call to addToQueue');
                });
            });
        });
    });

    describe('_reportMicCameraPermissions', function () {
        beforeEach(function () {
            this._dataQ = sinon.createStubInstance(DataQ);
            const navMock = {
                mediaDevices: {
                    enumerateDevices: sinon.stub(),
                },
            };
            this._devicesMock = [
                { kind: 'audioinput', label: '' },
                { kind: 'videoinput', label: 'great video' },
            ];

            this._navigator = navMock;
        });

        context('when navigator.mediaDevices.enumerateDevices resolves', function () {
            context('and device is not already reported', function () {
                it('should report the device', function () {
                    const up = new UserPermissions(this._dataQ, this._navigator);

                    this._navigator.mediaDevices.enumerateDevices.resolves(this._devicesMock);

                    up._reportMicCameraPermissions();

                    return this._navigator.mediaDevices.enumerateDevices().then(() => {
                        assert.isTrue(this._dataQ.addToQueue.calledWith('static_fields', ['per_audio', up._permDefs.denied]),
                            'audio not reported as denied');
                        assert.isTrue(this._dataQ.addToQueue.calledWith('static_fields', ['per_video', up._permDefs.granted]),
                            'video not reported as granted');
                    });
                });
            });

            context('and device is already reported', function () {
                it('should NOT report the device', function () {
                    const up = new UserPermissions(this._dataQ, this._navigator);

                    this._devicesMock.push({ kind: 'videoinput', label: 'another great video' });
                    this._devicesMock.push({ kind: 'audioinput', label: 'great audio' });
                    this._navigator.mediaDevices.enumerateDevices.resolves(this._devicesMock);

                    up._reportMicCameraPermissions();

                    return this._navigator.mediaDevices.enumerateDevices().then(() => {
                        assert.isTrue(this._dataQ.addToQueue.calledWith('static_fields', ['per_audio', up._permDefs.denied]),
                            'audio not reported as denied');
                        assert.isTrue(this._dataQ.addToQueue.calledWith('static_fields', ['per_video', up._permDefs.granted]),
                            'video not reported as granted');
                        assert.isTrue(this._dataQ.addToQueue.calledTwice, 'addToQueue was called more than twice');
                    });
                });
            });
        });

        context('when navigator.mediaDevices.enumerateDevices rejects', function () {
            it('should not report anything to Q', function () {
                const up = new UserPermissions(this._dataQ, this._navigator);

                this._navigator.mediaDevices.enumerateDevices.withArgs().rejects({ message: 'Dummy rejection' });
                this._navigator.mediaDevices.enumerateDevices.withArgs('final').resolves();

                up._reportMicCameraPermissions();

                return this._navigator.mediaDevices.enumerateDevices('final').then(() => {
                    assert.isTrue(this._dataQ.addToQueue.notCalled, 'addToQueue was called while it should not');
                });
            });
        });
    });
});
