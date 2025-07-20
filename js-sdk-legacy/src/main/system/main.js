import { BioCatchClient } from '../BioCatchClient';
import { DynamicCdApiLoader } from '../core/DynamicCdApiLoader';
import { ConfigMapper } from '../core/ConfigMapper';
import { ServerUrlResolver } from '../core/ServerUrlResolver';
import Client from '../Client';

export { BioCatchClient } from '../BioCatchClient';


export function initializeBioCatchClient() {
  // BioCatchClient constructor will auto-start the sdk if external cdApi is provided.
  // Otherwise - will attach a 'bcTracker' member object from type BioCatchClient to the window which can be used for "manual-start".
  return new BioCatchClient(
    new Client(),
    new DynamicCdApiLoader(),
    new ConfigMapper(),
    new ServerUrlResolver()
  );
}

initializeBioCatchClient();