import * as Events from './events';
import * as Static from './static';
import * as PerContext from './perContext';
import * as Misc from './misc';

import JqueryElementsHandler from './events/handlers/JqueryElementsHandler';
import CrossDomainMuidCollector, { CrossmuidEventType } from './identity/CrossDomainMuidCollector';
import InputEvents, { inputSelectors } from './events/InputEvents';
import CustomInputEvents from './events/CustomInputEvents';
import ClickEvents, { onClickSelectors } from './events/ClickEvents';
import SelectElementEvents, { onSelectSelectors } from './events/SelectElementEvents';
import FormEvents, { onFormSelectors } from './events/FormEvents';
import PrivateBrowsingDetector from './static/PrivateBrowsingDetector';
import PointerHoverDetector from './static/PointerHoverDetector';
import SiteMapper from '../technicalServices/SiteMapper';
import ScriptsRepository from './perContext/ScriptsRepository';
import DOMUtils from '../technicalServices/DOMUtils';
import CDUtils from '../technicalServices/CDUtils';
import MutationEmitter from '../services/MutationEmitter';
import StandardInputEventsEmitter from '../services/StandardInputEventsEmitter';
import EventAggregator from '../system/EventAggregator';
import StandardOnClickEventsEmitter from '../services/StandardOnClickEventsEmitter';
import StandardOnChangeEventsEmitter from '../services/StandardOnChangeEventsEmitter';
import StandardOnFormEventsEmitter from '../services/StandardOnFormEventsEmitter';
import SyntheticMaskInputEventsHandler from '../services/SyntheticMaskInputEventsHandler';
import SyntheticAutotabInputEventsHandler from '../services/SyntheticAutotabInputEventsHandler';
import FocusEventEmitter from '../emitters/FocusEventEmitter';
import BlurEventEmitter from '../emitters/BlurEventEmitter';
import ResizeEventEmitter from '../emitters/ResizeEventEmitter';
import DOMContentLoadedEventEmitter from '../emitters/DOMContentLoadedEventEmitter';
import VisibilityChangeEventEmitter from '../emitters/VisibilityChangeEventEmitter';
import ScrollEventEmitter from '../emitters/ScrollEventEmitter';
import WindowMessageEventEmitter from '../services/WindowMessageEventEmitter';
import DeviceOrientationEventEmitter from '../emitters/DeviceOrientationEventEmitter';
import BeforeInstallPromptEventEmitter from '../emitters/BeforeInstallPromptEventEmitter';
import CutEventEmitter from '../emitters/CutEventEmitter';
import CopyEventEmitter from '../emitters/CopyEventEmitter';
import PasteEventEmitter from '../emitters/PasteEventEmitter';
import ElementFocusEventEmitter from '../emitters/ElementFocusEventEmitter';
import ElementBlurEventEmitter from '../emitters/ElementBlurEventEmitter';
import StandardCustomInputEmitter from '../services/StandardCustomInputEmitter';

const dataCollectors = [
    {
        name: 'MouseEvents',
        className: Events.MouseEventCollector,
        init() {
            return function () {
                if (this._configurations.isFlutterApp()) {
                    this._features.list.MouseEvents.instance = new Events.FlutterMouseEventCollector(
                        this._msgBus,
                        this._dataQ,
                        this._utils,
                        this._maskingService,
                        DOMUtils,
                        this._configurations
                    );
                } else {
                    this._features.list.MouseEvents.instance = new Events.MouseEventCollector(
                        this._utils,
                        DOMUtils,
                        this._elements,
                        this._dataQ,
                        this._maskingService,
                        this._configurations
                    );
                }
            };
        },
    },
    {
        name: 'KeyEvents',
        className: Events.KeyEventCollector,
        init() {
            return function () {
                if (this._configurations.isFlutterApp()) {
                    this._features.list.KeyEvents.instance = new Events.FlutterKeyEventCollector(
                        this._msgBus,
                        this._dataQ,
                        this._utils,
                        this._maskingService
                    );
                } else {
                    this._features.list.KeyEvents.instance = new Events.KeyEventCollector(
                        this._configurationRepository,
                        this._utils,
                        this._elements,
                        this._dataQ,
                        this._msgBus,
                        this._sameCharService,
                        this._maskingService,
                        this._configurations
                    );
                }
            };
        },
    },
    {
        name: 'TouchEvents',
        className: Events.TouchEventCollector,
        init() {
            return function () {
                if (this._configurations.isFlutterApp()) {
                    this._features.list.TouchEvents.instance = new Events.FlutterTouchEventCollector(
                        this._msgBus,
                        this._dataQ,
                        this._utils,
                        this._maskingService
                    );
                } else {
                    this._features.list.TouchEvents.instance = new Events.TouchEventCollector(
                        this._utils,
                        this._elements,
                        this._dataQ,
                        this._msgBus,
                        this._maskingService,
                        this._configurations
                    );
                }
            };
        },
    },
    {
        name: 'ClipboardEvents',
        className: Events.ClipboardEventCollector,
        init() {
            return function () {
                const clipboardEventsBuilder = new Events.ClipboardEventCollector.Builder(
                    this._utils,
                    this._elements,
                    this._dataQ,
                    this._configurations
                );

                const cutEventEmitter = new CutEventEmitter(this._msgBus, EventAggregator);
                const copyEventEmitter = new CopyEventEmitter(this._msgBus, EventAggregator);
                const pasteEventEmitter = new PasteEventEmitter(this._msgBus, EventAggregator);

                clipboardEventsBuilder.withMessageBus(this._msgBus)
                    .withCutEventEmitter(cutEventEmitter)
                    .withCopyEventEmitter(copyEventEmitter)
                    .withPasteEventEmitter(pasteEventEmitter);
                this._features.list.ClipboardEvents.instance = clipboardEventsBuilder.build();
            };
        },
    },
    {
        name: 'ElementEvents',
        className: Events.ElementEventCollector,
        init() {
            return function () {
                if (this._configurations.isFlutterApp()) {
                    this._features.list.ElementEvents.instance = new Events.FlutterElementEventsCollector(
                        this._msgBus,
                        this._dataQ,
                        this._utils,
                        this._contextMgr,
                        this._maskingService
                    );
                } else {
                    const standardInputEventsEmitter = new StandardInputEventsEmitter(this._msgBus, EventAggregator, this._utils);
                    const standardOnClickEventsEmitter = new StandardOnClickEventsEmitter(this._msgBus, EventAggregator, this._utils);
                    const standardOnChangeEventsEmitter = new StandardOnChangeEventsEmitter(this._msgBus, EventAggregator, this._utils);
                    const elementFocusEventEmitter = new ElementFocusEventEmitter(this._msgBus, EventAggregator, this._utils);
                    const elementBlurEventEmitter = new ElementBlurEventEmitter(this._msgBus, EventAggregator, this._utils);
                    const standardOnFormEventsEmitter = new StandardOnFormEventsEmitter(this._msgBus, EventAggregator, this._utils);
                    const standardCustomInputEmitter = new StandardCustomInputEmitter(this._msgBus, EventAggregator, this._utils);

                    const jQueryElementListenerSiteMapper = new SiteMapper(MutationObserver,
                        this._utils, DOMUtils, 'jQueryElementListenerConfig', null, false);
                    const jqueryElementsHandler = JqueryElementsHandler(
                        standardInputEventsEmitter,
                        standardOnClickEventsEmitter,
                        standardOnChangeEventsEmitter,
                        standardOnFormEventsEmitter,
                    );
                    const elementEventsBuilder = new Events.ElementEventCollector.Builder(
                        this._configurationRepository,
                        this._utils,
                        DOMUtils,
                        this._elements,
                        this._dataQ,
                        this._configurations
                    );

                    const mutationEmitter = new MutationEmitter(this._msgBus);
                    const syntheticMaskInputEventsHandler = new SyntheticMaskInputEventsHandler(this._msgBus, EventAggregator, this._utils);
                    const syntheticAutotabInputEventsHandler = new SyntheticAutotabInputEventsHandler(this._msgBus, EventAggregator, this._utils);

                    elementEventsBuilder.withjQueryElementListenerSiteMapper(jQueryElementListenerSiteMapper);
                    elementEventsBuilder.withMessageBus(this._msgBus);
                    elementEventsBuilder.withMutationEmitter(mutationEmitter);
                    elementEventsBuilder.withjQueryElementsHandler(jqueryElementsHandler);
                    elementEventsBuilder.withInputEvents(InputEvents, inputSelectors, this._maskingService);
                    elementEventsBuilder.withStandardInputEventsEmitter(standardInputEventsEmitter);
                    elementEventsBuilder.withSyntheticMaskInputEventsHandler(syntheticMaskInputEventsHandler);
                    elementEventsBuilder.withSyntheticAutotabInputEventsHandler(syntheticAutotabInputEventsHandler);
                    elementEventsBuilder.withClickEvents(ClickEvents, onClickSelectors);
                    elementEventsBuilder.withStandardOnClickEventsEmitter(standardOnClickEventsEmitter);
                    elementEventsBuilder.withSelectElementEvents(SelectElementEvents, onSelectSelectors);
                    elementEventsBuilder.withElementFocusEventsEmitter(elementFocusEventEmitter);
                    elementEventsBuilder.withElementBlurEventsEmitter(elementBlurEventEmitter);
                    elementEventsBuilder.withStandardOnChangeEventsEmitter(standardOnChangeEventsEmitter);
                    elementEventsBuilder.withFormEvents(FormEvents, onFormSelectors);
                    elementEventsBuilder.withStandardOnFormEventsEmitter(standardOnFormEventsEmitter);
                    elementEventsBuilder.withCustomInputEventEmitter(CustomInputEvents, standardCustomInputEmitter);

                    this._features.list.ElementEvents.instance = elementEventsBuilder.build();
                }
            };
        },
    },
    {
        name: 'WindowEvents',
        className: Events.WindowEventCollector,
        init() {
            return function () {
                const windowEventCollectorBuilder = new Events.WindowEventCollector.Builder(
                    this._configurationRepository,
                    CDUtils,
                    this._dataQ,
                );

                const focusEventEmitter = new FocusEventEmitter(this._msgBus, EventAggregator);
                const blurEventEmitter = new BlurEventEmitter(this._msgBus, EventAggregator);
                const resizeEventEmitter = new ResizeEventEmitter(this._msgBus, EventAggregator);
                const domContentLoadedEventEmitter = new DOMContentLoadedEventEmitter(this._msgBus, EventAggregator);
                const visibilityChangeEventEmitter = new VisibilityChangeEventEmitter(this._msgBus, EventAggregator);
                const scrollEventEmitter = new ScrollEventEmitter(this._msgBus, EventAggregator);

                windowEventCollectorBuilder.withMessageBus(this._msgBus);
                windowEventCollectorBuilder.withFocusEventEmitter(focusEventEmitter);
                windowEventCollectorBuilder.withBlurEventEmitter(blurEventEmitter);
                windowEventCollectorBuilder.withResizeEventEmitter(resizeEventEmitter);
                windowEventCollectorBuilder.withDOMContentLoadedEventEmitter(domContentLoadedEventEmitter);
                windowEventCollectorBuilder.withVisibilityChangeEventEmitter(visibilityChangeEventEmitter);
                windowEventCollectorBuilder.withScrollEventEmitter(scrollEventEmitter);

                this._features.list.WindowEvents.instance = windowEventCollectorBuilder.build();
            };
        },
    },
    {
        name: 'MetadataCollector',
        className: Misc.MetadataCollector,
        init() {
            return function () {
                const metadataSiteMapper = new SiteMapper(MutationObserver, this._utils, DOMUtils, 'metadataConfig', null, false);
                this._features.list.MetadataCollector.instance = new Misc.MetadataCollector(this._configurationRepository, this._dataQ, metadataSiteMapper, this._utils);
            };
        },
    },
    {
        name: 'TabsEvents',
        className: Events.TabEventCollector,
        init() {
            return function () {
                this._features.list.TabsEvents.instance = new Events.TabEventCollector(this._utils, this._dataQ);
            };
        },
    },
    {
        name: 'DoNotTrack',
        className: Static.DoNotTrackFeature,
        init() {
            return function () {
                this._features.list.DoNotTrack.instance = new Static.DoNotTrackFeature(this._dataQ);
            };
        },
    },
    {
        name: 'BrowserProps',
        className: Static.BrowserPropsFeature,
        init() {
            return function () {
                this._features.list.BrowserProps.instance = new Static.BrowserPropsFeature(this._dataQ, PointerHoverDetector, this._utils, this._configurationRepository, this._configurations);
            };
        },
    },
    {
        name: 'IsPrivateBrowsing',
        className: Static.IsPrivateBrowsingFeature,
        init() {
            return function () {
                const privateBrowsingDetector = new PrivateBrowsingDetector();
                this._features.list.IsPrivateBrowsing.instance = new Static.IsPrivateBrowsingFeature(this._dataQ, privateBrowsingDetector);
            };
        },
    },
    {
        name: 'FontsDetectionFeature',
        className: Static.FontCollectionFeature,
        init() {
            return function () {
                this._features.list.FontsDetectionFeature.instance = new Static.FontCollectionFeature(this._utils, DOMUtils,
                    this._dataQ, this._configurationRepository,);
            };
        },
    },
    {
        name: 'GraphicDetectFeature',
        className: Static.GraphicDetectFeature,
        init() {
            return function () {
                this._features.list.GraphicDetectFeature.instance = new Static.GraphicDetectFeature(this._dataQ, this._configurations);
            };
        },
    },
    {
        name: 'BrowserDetect',
        className: Static.BrowserDetect,
        init() {
            return function () {
                this._features.list.BrowserDetect.instance = new Static.BrowserDetect(this._dataQ);
            };
        },
    },
    {
        name: 'FilesFeature',
        className: Misc.FilesFeature,
        init() {
            return function () {
                this._features.list.FilesFeature.instance = new Misc.FilesFeature(this._configurationRepository,
                    this._utils, this._sessionService, this._muidService, this._cidCache);
            };
        },
    },
    {
        name: 'UserPermissions',
        className: Static.UserPermissions,
        init() {
            return function () {
                this._features.list.UserPermissions.instance = new Static.UserPermissions(this._dataQ);
            };
        },
    },
    {
        name: 'MediaDevicesFeature',
        className: Static.MediaDevicesFeature,
        init() {
            return function () {
                this._features.list.MediaDevicesFeature.instance = new Static.MediaDevicesFeature(this._dataQ);
            };
        },
    },
    {
        name: 'ContextPropsFeature',
        className: PerContext.ContextPropsFeature,
        init() {
            return function () {
                this._features.list.ContextPropsFeature.instance =
                    new PerContext.ContextPropsFeature(this._dataQ, DOMUtils, this._perfMonitor, this._configurationRepository);
            };
        },
    },
    {
        name: 'GfxRenderingFeature',
        className: Static.GfxRenderingFeature,
        init() {
            return function () {
                this._features.list.GfxRenderingFeature.instance = new Static.GfxRenderingFeature(this._dataQ, CDUtils);
            };
        },
    },
    {
        name: 'AudioDetectFeature',
        className: Static.AudioDetectFeature,
        init() {
            return function () {
                this._features.list.AudioDetectFeature.instance = new Static.AudioDetectFeature(this._dataQ, CDUtils);
            };
        },
    },
    {
        name: 'EncryptedMuidFeature',
        className: Static.EncryptedMuidFeature,
        init() {
            return function () {
                this._features.list.EncryptedMuidFeature.instance = new Static.EncryptedMuidFeature(this._devDebugDataQueue, this._muidEncryptedService);
            };
        },
    },
    {
        name: 'ScriptsFeature',
        className: PerContext.ScriptsFeature,
        init() {
            return function () {
                const scriptsRepository = new ScriptsRepository(this._utils);
                this._features.list.ScriptsFeature.instance = new PerContext.ScriptsFeature(this._dataQ, scriptsRepository);
            };
        },
    },
    {
        name: 'AccelerometerEvents',
        className: Events.AccelerometerEventCollector,
        init() {
            return function () {
                this._features.list.AccelerometerEvents.instance = new Events.AccelerometerEventCollector(this._configurationRepository,
                    this._utils, this._sensorDataQ);
            };
        },
    },
    {
        name: 'PinchZoomEvents',
        className: Events.PinchZoomEventCollector,
        init() {
            return function () {
                this._features.list.PinchZoomEvents.instance = new Events.PinchZoomEventCollector(
                    this._utils,
                    this._elements,
                    this._dataQ,
                    this._msgBus,
                    this._configurations
                );
            };
        },
    },
    {
        name: 'ScriptEvents',
        className: Events.ScriptEventCollector,
        init() {
            return function () {
                this._features.list.ScriptEvents.instance = new Events.ScriptEventCollector(this._utils, this._dataQ);
            };
        },
    },
    {
        name: 'NetInfoEvents',
        className: Events.NetInfoEventCollector,
        init() {
            return function () {
                this._features.list.NetInfoEvents.instance = new Events.NetInfoEventCollector(this._utils, this._dataQ);
            };
        },
    },
    {
        name: 'DeviceOrientationCollector',
        className: Events.DeviceOrientationCollector,
        init() {
            return function () {
                this._features.list.DeviceOrientationCollector.instance = new Events.DeviceOrientationCollector(this._utils, this._dataQ);
            };
        },
    },
    {
        name: 'TapEvents',
        className: Events.TapEventCollector,
        init() {
            return function () {
                this._features.list.TapEvents.instance = new Events.TapEventCollector(
                    this._configurationRepository,
                    this._utils,
                    this._elements,
                    this._dataQ,
                    this._maskingService,
                    this._configurations
                );
            };
        },
    },
    {
        name: 'LocationEvents',
        className: Events.LocationCollector,
        init() {
            return function () {
                this._features.list.LocationEvents.instance = new Events.LocationCollector(this._dataQ, this._utils, this._configurationRepository);
            };
        },
    },
    {
        name: 'StorageEvents',
        className: Events.StorageEventCollector,
        init() {
            return function () {
                this._features.list.StorageEvents.instance = new Events.StorageEventCollector(this._utils, this._elements, this._dataQ, this._msgBus);
            };
        },
    },
    {
        name: 'PrintEvents',
        className: Events.PrintEventCollector,
        init() {
            return function () {
                this._features.list.PrintEvents.instance = new Events.PrintEventCollector(this._utils, this._dataQ);
            };
        },
    },
    {
        name: 'LightSensorEvents',
        className: Events.LightSensorEventCollector,
        init() {
            return function () {
                this._features.list.LightSensorEvents.instance = new Events.LightSensorEventCollector(this._dataQ, this._utils, this._configurationRepository);
            };
        },
    },
    {
        name: 'CrossDomain',
        className: CrossDomainMuidCollector,
        init() {
            return function () {
                const crossDomainBuilder = new CrossDomainMuidCollector.Builder(
                    this._configurationRepository,
                    this._dataQ,
                    this._utils,
                    DOMUtils,
                    CrossmuidEventType,
                );

                const windowMessageEventEmitter = new WindowMessageEventEmitter(this._msgBus, EventAggregator);

                crossDomainBuilder.withMessageBus(this._msgBus);
                crossDomainBuilder.withWindowMessageEventEmitter(windowMessageEventEmitter);
                this._features.list.CrossDomain.instance = crossDomainBuilder.build();
            };
        },
    },
    {
        name: 'OrientationEvents',
        className: Events.OrientationEventCollector,
        init() {
            return function () {
                const deviceOrientationEventEmitter = new DeviceOrientationEventEmitter(this._msgBus, EventAggregator);

                this._features.list.OrientationEvents.instance = new Events.OrientationEventCollector(
                    this._configurationRepository,
                    this._utils,
                    this._sensorDataQ,
                    this._msgBus,
                    deviceOrientationEventEmitter,
                );
            };
        },
    },
    {
        name: 'BeforeInstallPromptEvents',
        className: Events.BeforeInstallPromptEventCollector,
        init() {
            return function () {
                const beforeInstallPromptEventEmitter = new BeforeInstallPromptEventEmitter(this._msgBus, EventAggregator);

                this._features.list.BeforeInstallPromptEvents.instance = new Events.BeforeInstallPromptEventCollector(
                    this._dataQ,
                    this._utils,
                    this._msgBus,
                    beforeInstallPromptEventEmitter,
                );
            };
        },
    },
    {
        name: 'Navigator',
        className: Static.NavigatorFeature,
        init() {
            return function () {
                this._features.list.Navigator.instance = new Static.NavigatorFeature(this._devDebugDataQueue);
            };
        },
    },
    {
        name: 'KeyboardLayoutFeature',
        className: Static.KeyboardLayoutFeature,
        init() {
            return function () {
                this._features.list.KeyboardLayoutFeature.instance = new Static.KeyboardLayoutFeature(this._dataQ);
            };
        },
    },
    {
        name: 'StorageFeature',
        className: Static.StorageFeature,
        init() {
            return function () {
                this._features.list.StorageFeature.instance = new Static.StorageFeature(this._dataQ, this._devDebugDataQueue);
            };
        },
    },
    {
        name: 'BatteryStatusCollector',
        className: Events.BatteryStatusCollector,
        init() {
            return function () {
                this._features.list.BatteryStatusCollector.instance = new Events.BatteryStatusCollector(
                    this._dataQ,
                    this._utils
                );
            };
        }
    },
    {
        name: 'FontEmojiFeature',
        className: Static.FontEmojiFeature,
        init() {
            return function () {
                this._features.list.FontEmojiFeature.instance = new Static.FontEmojiFeature(this._devDebugDataQueue);
            };
        },
    },
    {
        name: 'FontMathFeature',
        className: Static.FontMathFeature,
        init() {
            return function () {
                this._features.list.FontMathFeature.instance = new Static.FontMathFeature(this._devDebugDataQueue);
            };
        },
    },
    {
        name: 'FontWidthFeature',
        className: Static.FontWidthFeature,
        init() {
            return function () {
                this._features.list.FontWidthFeature.instance = new Static.FontWidthFeature(this._devDebugDataQueue);
            };
        },
    },
    {
        name: 'ScreenHighResFeature',
        className: Static.ScreenHighResFeature,
        init() {
            return function () {
                this._features.list.ScreenHighResFeature.instance = new Static.ScreenHighResFeature(this._devDebugDataQueue);
            };
        },
    },
    {
        name: 'BrowserExtensionEvents',
        className: Static.BrowserExtensionsCollector,
        init() {
            return function () {
                this._features.list.BrowserExtensionEvents.instance = new Static.BrowserExtensionsCollector(this._configurationRepository,
                    this._utils, DOMUtils, this._dataQ);
            };
        },
    },
    {
        name: 'AdblockerListsCollector',
        className: Static.AdblockerListsCollector,
        init() {
            return function () {
                this._features.list.AdblockerListsCollector.instance = new Static.AdblockerListsCollector(this._devDebugDataQueue);
            };
        },
    },
    {
        name: 'WebglCollector',
        className: Static.WebglCollector,
        init() {
            return function () {
                this._features.list.WebglCollector.instance = new Static.WebglCollector(this._devDebugDataQueue);
            };
        },
    },
    {
        name: 'DRMDataCollector',
        className: Static.DRMDataCollector,
        init() {
            return function () {
                this._features.list.DRMDataCollector.instance = new Static.DRMDataCollector(this._devDebugDataQueue);
            };
        },
    },
    {
        name: 'WebRTCDataCollector',
        className: Static.WebRTCDataCollector,
        init() {
            return function () {
                this._features.list.WebRTCDataCollector.instance = new Static.WebRTCDataCollector(this._dataQ);
            };
        },
    },
    {
        name: 'SpeechVoiceCollector',
        className: Static.SpeechVoiceCollector,
        init() {
            return function () {
                this._features.list.SpeechVoiceCollector.instance = new Static.SpeechVoiceCollector(this._devDebugDataQueue);
            };
        },
    },
];

export default class FeaturesList {
    static list;

    static register() {
        FeaturesList.list = {};

        dataCollectors.forEach((feature) => {
            this._addFeature(feature);
        });
    }

    static registerLeanFeatures() {
        FeaturesList.list = {};
        dataCollectors.forEach((feature) => {
            if (feature.className.getDefaultSettings().runInLean) {
                this._addFeature(feature);
            }
        });
    }

    static getDefaultFeatures() {
        return this.getFeaturesByCondition((feature) => {
            return feature.isDefault;
        });
    }

    static getPerContextFeatures() {
        return this.getFeaturesByCondition((feature) => {
            return feature.shouldRunPerContext;
        });
    }

    static getPerSessionFeatures() {
        return this.getFeaturesByCondition((feature) => {
            return feature.shouldRunPerSession;
        });
    }

    static getNonDefaultFeatures() {
        return this.getFeaturesByCondition((feature) => {
            return !feature.isDefault && !feature.shouldRunPerContext && !feature.shouldRunPerSession;
        });
    }

    static getFeaturesByCondition(condition) {
        const features = {};
        Object.keys(FeaturesList.list).forEach((featureKey) => {
            const feature = FeaturesList.list[featureKey];
            if (condition(feature)) {
                features[featureKey] = feature;
            }
        });

        return features;
    }

    static _addFeature(feature) {
        const collectorStaticSetup = feature.className.getDefaultSettings();

        // Creating a new object reference to ensure that multiple instances of the same class do not share or modify each other's data.
        const collectorSetup = { ...collectorStaticSetup };

        const { name } = feature;
        collectorSetup.init = feature.init();
        FeaturesList.list[name] = collectorSetup;
    }
}
