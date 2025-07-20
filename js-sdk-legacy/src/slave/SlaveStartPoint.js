import SlaveSystemLoader from './SlaveSystemLoader';
import Log from '../main/technicalServices/log/Logger';
import FeaturesList from '../main/collectors/FeaturesList';
import SupportedBrowserChecker from '../main/technicalServices/SupportedBrowserChecker';
import SlaveCdApiFacade from "./api/SlaveCdApiFacade";

export default class SlaveStartPoint {
    start() {
        // Unsupported browsers are aborted.
        if (!SupportedBrowserChecker.isSupported()) {
            return;
        }

        const slaveCdApiFacade = new SlaveCdApiFacade();
        const configurations = slaveCdApiFacade.getConfigurations();

        // start the system
        const slaveLoader = new SlaveSystemLoader();

        FeaturesList.register();
        slaveLoader.loadSystem(FeaturesList,configurations);

        slaveLoader.getFeatureService().buildFrameRelatedLists();
        slaveLoader.getFeatureBuilder().buildFeatures();
        slaveLoader.getFeatureService().runDefault();
        slaveLoader.getContextMgr().initContextHandling();
        Log.info('Started default features collection');
        slaveLoader.getSlaveBrowserProps().startFeature();
        slaveLoader.getParentCommunicator().registerToParent();

        return slaveLoader;
    }
}
