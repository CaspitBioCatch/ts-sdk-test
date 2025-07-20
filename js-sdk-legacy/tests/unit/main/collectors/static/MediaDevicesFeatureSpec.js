import { assert } from 'chai';
import MediaDevicesFeature from '../../../../../src/main/collectors/static/MediaDevicesFeature';
import DataQ from '../../../../../src/main/technicalServices/DataQ';

describe('MediaDevicesFeature tests:', function () {
    beforeEach(function () {
        if (!window.Promise) {
            this.skip();
            return;
        }

        this._dataQ = sinon.createStubInstance(DataQ);
        const navMock = {
            mediaDevices: {
                enumerateDevices: sinon.stub(),
            },
        };
        this._devicesMock = [
            {
kind: 'audioinput', label: '', deviceId: 'aa', groupId: 'gg',
},
            {
 kind: 'videoinput', label: 'great video', deviceId: 'bb', groupId: 'hh',
},
        ];

        this._navigator = navMock;
    });

    describe('startFeature', function () {
        it('should report media_devices', function () {
            const md = new MediaDevicesFeature(this._dataQ, this._navigator);

            this._navigator.mediaDevices.enumerateDevices.resolves(this._devicesMock);

            md.startFeature();

            this._navigator.mediaDevices.enumerateDevices().then(() => {
                assert.isTrue(this._dataQ.addToQueue.calledOnce, 'dataQ was not called or called more than once');
                const args = this._dataQ.addToQueue.getCall(0).args;
                assert.equal(args[0], 'static_fields', 'expected static_fields');
                const reportedDevices = args[1];
                assert.equal(reportedDevices[0], 'media_devices', 'expected media_devices');
                const verifyDevice = (expectedIdx) => {
                    assert.equal(reportedDevices[1][expectedIdx][0], this._devicesMock[expectedIdx].kind, 'device kind not expected');
                    assert.equal(reportedDevices[1][expectedIdx][1], this._devicesMock[expectedIdx].label, 'device label not expected');
                    assert.equal(reportedDevices[1][expectedIdx][2], this._devicesMock[expectedIdx].deviceId, 'device deviceId not expected');
                    assert.equal(reportedDevices[1][expectedIdx][3], this._devicesMock[expectedIdx].groupId, 'device groupId not expected');
                };
                verifyDevice(0);
                verifyDevice(1);
            });
        });
    });
});
