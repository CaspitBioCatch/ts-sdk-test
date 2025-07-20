import FeaturesList from '../../../../src/main/collectors/FeaturesList';
import ConfigurationRepository from '../../../../src/main/core/configuration/ConfigurationRepository';
import MessageBus from '../../../../src/main/technicalServices/MessageBus';
import sinon from 'sinon';
import StartupConfigurations from '../../../../src/main/api/StartupConfigurations';

import * as Events from '../../../../src/main/collectors/events';

describe('FeaturesList tests:', function () {
    beforeEach(function () {
        FeaturesList.list = {};
    });

    describe('register', function () {
        it('register features successfully', function () {
            FeaturesList.register();

            assert.isNotEmpty(FeaturesList.list);
        });
    });

    describe('getDefaultFeatures', function () {
        it('default features list is empty prior to registration', function () {
            assert.isEmpty(FeaturesList.getDefaultFeatures());
        });

        it('get default features successfully', function () {
            FeaturesList.register();

            assert.isNotEmpty(FeaturesList.getDefaultFeatures());
        });
    });

    describe('getPerContextFeatures', function () {
        it('per context features list is empty prior to registration', function () {
            assert.isEmpty(FeaturesList.getPerContextFeatures());
        });

        it('get per context features successfully', function () {
            FeaturesList.register();

            assert.isNotEmpty(FeaturesList.getPerContextFeatures());
        });
    });

    describe('getPerSessionFeatures', function () {
        it('per session features list is empty prior to registration', function () {
            assert.isEmpty(FeaturesList.getPerSessionFeatures());
        });

        it('get per session features successfully', function () {
            FeaturesList.register();

            assert.isNotEmpty(FeaturesList.getPerSessionFeatures());
        });
    });

    describe('getNonDefaultFeatures', function () {
        it('per non default features list is empty prior to registration', function () {
            assert.isEmpty(FeaturesList.getNonDefaultFeatures());
        });

        it('get non default features successfully', function () {
            FeaturesList.register();

            assert.isNotEmpty(FeaturesList.getNonDefaultFeatures());
        });
    });

    describe('create features', function () {
        beforeEach(function () {
            this.sandbox = sinon.createSandbox();

            FeaturesList.register();
            this._features = { list: FeaturesList.list };
            this._utils = { StorageUtils: {}, dateNow: this.sandbox.stub(), generateUUID: this.sandbox.stub() };
            this._utils.generateUUID.returns('TADADA');

            this._dataQ = this.sandbox.stub()

            this._configurationRepository = this.sandbox.createStubInstance(ConfigurationRepository);
            this._msgBus = this.sandbox.createStubInstance(MessageBus);
            this._configurations = sinon.createStubInstance(StartupConfigurations);
            this._configurations.isFlutterApp.returns(false);
        });

        afterEach(function () {
            this.sandbox.restore();
        });

        describe('create default features:', () => {
            it('create mouse events collector when isFlutter is false', function () {
                this._configurations.isFlutterApp.returns(false);

                FeaturesList.getDefaultFeatures().MouseEvents.init.bind(this)();

                assert.exists(FeaturesList.list.MouseEvents.instance);
                expect(FeaturesList.list.MouseEvents.instance instanceof Events.MouseEventCollector).to.equal(true);
            });

            it('create mouse events collector when isFlutter is true', function () {
                this._configurations.isFlutterApp.returns(true);

                FeaturesList.getDefaultFeatures().MouseEvents.init.bind(this)();

                assert.exists(FeaturesList.list.MouseEvents.instance);
                expect(FeaturesList.list.MouseEvents.instance instanceof Events.FlutterMouseEventCollector).to.equal(true);
            });

            it('create key events collector when isFlutterApp is false', function () {
                this._configurations.isFlutterApp.returns(false);

                FeaturesList.getDefaultFeatures().KeyEvents.init.bind(this)();

                assert.exists(FeaturesList.list.KeyEvents.instance);
                expect(FeaturesList.list.KeyEvents.instance  instanceof Events.KeyEventCollector).to.equal(true);
            });

            it('create key events collector when isFlutterApp is true', function () {
                this._configurations.isFlutterApp.returns(true);

                FeaturesList.getDefaultFeatures().KeyEvents.init.bind(this)();

                assert.exists(FeaturesList.list.KeyEvents.instance);
                expect(FeaturesList.list.KeyEvents.instance instanceof Events.FlutterKeyEventCollector).to.equal(true);
            });

            it('create touch events collector when isFlutterApp is false', function () {
                this._configurations.isFlutterApp.returns(false);

                FeaturesList.getDefaultFeatures().TouchEvents.init.bind(this)();

                assert.exists(FeaturesList.list.TouchEvents.instance);
                expect(FeaturesList.list.TouchEvents.instance instanceof Events.TouchEventCollector).to.equal(true);
            });

            it('create touch events collector when isFlutterApp is true', function () {
                this._configurations.isFlutterApp.returns(true);

                FeaturesList.getDefaultFeatures().TouchEvents.init.bind(this)();

                assert.exists(FeaturesList.list.TouchEvents.instance);
                expect(FeaturesList.list.TouchEvents.instance instanceof Events.FlutterTouchEventCollector).to.equal(true);
            });

            it('create clipboard events collector', function () {
                FeaturesList.getDefaultFeatures().ClipboardEvents.init.bind(this)();

                assert.exists(FeaturesList.list.ClipboardEvents.instance);
            });

            it('create element events collector when isFlutterApp is false', function () {
                this._configurations.isFlutterApp.returns(false);

                FeaturesList.getDefaultFeatures().ElementEvents.init.bind(this)();

                assert.exists(FeaturesList.list.ElementEvents.instance);
                expect(FeaturesList.list.ElementEvents.instance instanceof Events.ElementEventCollector).to.equal(true);
            });

            it('create element events collector when isFlutterApp is true', function () {
                this._configurations.isFlutterApp.returns(true);

                FeaturesList.getDefaultFeatures().ElementEvents.init.bind(this)();

                assert.exists(FeaturesList.list.ElementEvents.instance);
                expect(FeaturesList.list.ElementEvents.instance instanceof Events.FlutterElementEventsCollector).to.equal(true);
            });

            it('create window events collector', function () {
                FeaturesList.getDefaultFeatures().WindowEvents.init.bind(this)();

                assert.exists(FeaturesList.list.WindowEvents.instance);
            });

            it('create metadata collector', function () {
                FeaturesList.getDefaultFeatures().MetadataCollector.init.bind(this)();

                assert.exists(FeaturesList.list.MetadataCollector.instance);
            });

            it('create tab events collector', function () {
                FeaturesList.getDefaultFeatures().TabsEvents.init.bind(this)();

                assert.exists(FeaturesList.list.TabsEvents.instance);
            });
        });

        describe('create per context features:', () => {
            it('create context properties collector', function () {
                FeaturesList.getPerContextFeatures().ContextPropsFeature.init.bind(this)();

                assert.exists(FeaturesList.list.ContextPropsFeature.instance);
            });

            it('create scripts collector', function () {
                FeaturesList.getPerContextFeatures().ScriptsFeature.init.bind(this)();

                assert.exists(FeaturesList.list.ScriptsFeature.instance);
            });
        });

        describe('create per session features:', () => {
            it('create DoNotTrack collector', function () {
                FeaturesList.getPerSessionFeatures().DoNotTrack.init.bind(this)();

                assert.exists(FeaturesList.list.DoNotTrack.instance);
            });

            it('create browser properties collector', function () {
                FeaturesList.getPerSessionFeatures().BrowserProps.init.bind(this)();

                assert.exists(FeaturesList.list.BrowserProps.instance);
            });

            it('create private browsing collector', function () {
                FeaturesList.getPerSessionFeatures().IsPrivateBrowsing.init.bind(this)();

                assert.exists(FeaturesList.list.IsPrivateBrowsing.instance);
            });

            it('create fonts detector collector', function () {
                FeaturesList.getPerSessionFeatures().FontsDetectionFeature.init.bind(this)();

                assert.exists(FeaturesList.list.FontsDetectionFeature.instance);
            });

            it('create graphic card detector collector', function () {
                FeaturesList.getPerSessionFeatures().GraphicDetectFeature.init.bind(this)();

                assert.exists(FeaturesList.list.GraphicDetectFeature.instance);
            });

            it('create browser detector collector', function () {
                FeaturesList.getPerSessionFeatures().BrowserDetect.init.bind(this)();

                assert.exists(FeaturesList.list.BrowserDetect.instance);
            });

            it('create files collector', function () {
                FeaturesList.getPerSessionFeatures().FilesFeature.init.bind(this)();

                assert.exists(FeaturesList.list.FilesFeature.instance);
            });

            it('create user permissions collector', function () {
                FeaturesList.getPerSessionFeatures().UserPermissions.init.bind(this)();

                assert.exists(FeaturesList.list.UserPermissions.instance);
            });

            it('create media devices collector', function () {
                FeaturesList.getPerSessionFeatures().MediaDevicesFeature.init.bind(this)();

                assert.exists(FeaturesList.list.MediaDevicesFeature.instance);
            });

            it('create location events collector', function () {
                FeaturesList.getPerSessionFeatures().LocationEvents.init.bind(this)();

                assert.exists(FeaturesList.list.LocationEvents.instance);
            });

            it('create keyboard layout collector', function () {
                FeaturesList.getPerSessionFeatures().KeyboardLayoutFeature.init.bind(this)();

                assert.exists(FeaturesList.list.KeyboardLayoutFeature.instance);
            });

            it('create storage feature', function () {
                FeaturesList.getPerSessionFeatures().StorageFeature.init.bind(this)();

                assert.exists(FeaturesList.list.StorageFeature.instance);
            });

            it('create screen high res collector', function () {
                FeaturesList.getPerSessionFeatures().ScreenHighResFeature.init.bind(this)();

                assert.exists(FeaturesList.list.ScreenHighResFeature.instance);
            });
        });

        describe('create non default features:', () => {
            it('create accelerometer events collector', function () {
                FeaturesList.getNonDefaultFeatures().AccelerometerEvents.init.bind(this)();

                assert.exists(FeaturesList.list.AccelerometerEvents.instance);
            });

            it('create pinch zoom events collector', function () {
                FeaturesList.getNonDefaultFeatures().PinchZoomEvents.init.bind(this)();

                assert.exists(FeaturesList.list.PinchZoomEvents.instance);
            });

            it('create script events collector', function () {
                FeaturesList.getNonDefaultFeatures().ScriptEvents.init.bind(this)();

                assert.exists(FeaturesList.list.ScriptEvents.instance);
            });

            it('create net info events collector', function () {
                FeaturesList.getNonDefaultFeatures().NetInfoEvents.init.bind(this)();

                assert.exists(FeaturesList.list.NetInfoEvents.instance);
            });

            it('create screen orientation events collector', function () {
                FeaturesList.getNonDefaultFeatures().DeviceOrientationCollector.init.bind(this)();

                assert.exists(FeaturesList.list.DeviceOrientationCollector.instance);
            });

            it('create tap events collector', function () {
                FeaturesList.getNonDefaultFeatures().TapEvents.init.bind(this)();

                assert.exists(FeaturesList.list.TapEvents.instance);
            });

            it('create storage events collector', function () {
                FeaturesList.getNonDefaultFeatures().StorageEvents.init.bind(this)();

                assert.exists(FeaturesList.list.StorageEvents.instance);
            });

            it('create print events collector', function () {
                FeaturesList.getNonDefaultFeatures().PrintEvents.init.bind(this)();

                assert.exists(FeaturesList.list.PrintEvents.instance);
            });

            it('create light sensor events collector', function () {
                FeaturesList.getNonDefaultFeatures().LightSensorEvents.init.bind(this)();

                assert.exists(FeaturesList.list.LightSensorEvents.instance);
            });

            it('create cross domain muid events collector', function () {
                FeaturesList.getNonDefaultFeatures().CrossDomain.init.bind(this)();

                assert.exists(FeaturesList.list.CrossDomain.instance);
            });

            it('create orientation events collector', function () {
                FeaturesList.getNonDefaultFeatures().OrientationEvents.init.bind(this)();

                assert.exists(FeaturesList.list.OrientationEvents.instance);
            });

            it('create before install prompt events collector', function () {
                FeaturesList.getNonDefaultFeatures().BeforeInstallPromptEvents.init.bind(this)();

                assert.exists(FeaturesList.list.BeforeInstallPromptEvents.instance);
            });

            it('create battery status events collector', function () {
                FeaturesList.getNonDefaultFeatures().BatteryStatusCollector.init.bind(this)();

                assert.exists(FeaturesList.list.BatteryStatusCollector.instance);
            });
        });
    });

    describe('Register lean features:', function () {

        it('register lean features', function () {
            FeaturesList.registerLeanFeatures();
            assert.exists(FeaturesList.list.ClipboardEvents, 'ClipboardEvents should be registered');
            assert.exists(FeaturesList.list.ElementEvents, 'ElementEvents should be registered');
            assert.exists(FeaturesList.list.KeyEvents, 'KeyEvents should be registered');
            assert.exists(FeaturesList.list.MetadataCollector, 'MetadataCollector should be registered');
            assert.exists(FeaturesList.list.MouseEvents, 'MouseEvents should be registered');
            assert.exists(FeaturesList.list.PinchZoomEvents, 'PinchZoomEvents should be registered');
            assert.exists(FeaturesList.list.TapEvents, 'TapEvents should be registered');
            assert.exists(FeaturesList.list.TouchEvents, 'TouchEvents should be registered');

            assert.notExists(FeaturesList.list.AccelerometerEvents, 'AccelerometerEvents should not be registered');
            assert.notExists(FeaturesList.list.BeforeInstallPromptEvents, 'BeforeInstallPromptEvents should not be registered');
            assert.notExists(FeaturesList.list.BrowserDetect, 'BrowserDetect should not be registered');
            assert.notExists(FeaturesList.list.BrowserProps, 'BrowserProps should not be registered');
            assert.notExists(FeaturesList.list.ContextPropsFeature, 'ContextPropsFeature should not be registered');
            assert.notExists(FeaturesList.list.CrossDomain, 'CrossDomain should not be registered');
            assert.notExists(FeaturesList.list.DeviceOrientationCollector, 'DeviceOrientationCollector should not be registered');
            assert.notExists(FeaturesList.list.DoNotTrack, 'DoNotTrack should not be registered');
            assert.notExists(FeaturesList.list.FilesFeature, 'FilesFeature should not be registered');
            assert.notExists(FeaturesList.list.FontsDetectionFeature, 'FontsDetectionFeature should not be registered');
            assert.notExists(FeaturesList.list.GraphicDetectFeature, 'GraphicDetectFeature should not be registered');
            assert.notExists(FeaturesList.list.IsPrivateBrowsing, 'IsPrivateBrowsing should not be registered');
            assert.notExists(FeaturesList.list.LocationEvents, 'LocationEvents should not be registered');
            assert.notExists(FeaturesList.list.MediaDevicesFeature, 'MediaDevicesFeature should not be registered');
            assert.notExists(FeaturesList.list.NetInfoEvents, 'NetInfoEvents should not be registered');
            assert.notExists(FeaturesList.list.OrientationEvents, 'OrientationEvents should not be registered');
            assert.notExists(FeaturesList.list.PrintEvents, 'PrintEvents should not be registered');
            assert.notExists(FeaturesList.list.ScriptEvents, 'ScriptEvents should not be registered');
            assert.notExists(FeaturesList.list.ScriptsFeature, 'ScriptsFeature should not be registered');
            assert.notExists(FeaturesList.list.TabsEvents, 'TabsEvents should not be registered');
            assert.notExists(FeaturesList.list.UserPermissions, 'UserPermissions should not be registered');
            assert.notExists(FeaturesList.list.WindowEvents, 'WindowEvents should not be registered');
            assert.notExists(FeaturesList.list.StorageEvents, 'StorageEvents should not be registered');
        });
    });
});
