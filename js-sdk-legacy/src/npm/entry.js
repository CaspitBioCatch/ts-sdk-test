import { BioCatchSDK } from './BioCatchSDK';
import { BioCatchApi } from "./BioCatchApi";
import { DynamicCdApiLoader } from "../main/core/DynamicCdApiLoader";
import { ConfigMapper } from "../main/core/ConfigMapper";
import { ServerUrlResolver } from "../main/core/ServerUrlResolver";
import Client from "../main/Client";

// Pre-initialize the singleton with default dependencies
const clientApi = new BioCatchApi(
    new Client(),
    new DynamicCdApiLoader(),
    new ConfigMapper(),
    new ServerUrlResolver()
);

BioCatchSDK.getInstance(clientApi);

// Export BioCatchSDK as default so clients can use BioCatchSDK.getInstance()
export default BioCatchSDK;

// Also export as named export for flexibility
export { BioCatchSDK };