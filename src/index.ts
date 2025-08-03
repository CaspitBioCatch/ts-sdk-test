// Auto-initialization entry point - exactly matching js-sdk-legacy main.js
import { DynamicCdApiLoader } from '../js-sdk-legacy/src/main/core/DynamicCdApiLoader';
import { ConfigMapper } from '../js-sdk-legacy/src/main/core/ConfigMapper';
import { ServerUrlResolver } from '../js-sdk-legacy/src/main/core/ServerUrlResolver';
import Client from '../js-sdk-legacy/src/main/Client';
import { createBioCatchClientFromJS } from './client/JSBridge';

export { BioCatchClient } from './client/BioCatchClient';
export { BioCatchClientMigrationBridge } from './client/BioCatchClientMigrationBridge';
export { BCProtocolType } from './types/BCProtocolType';

export function initializeBioCatchClient() {
  console.log("🚀 BioCatch SDK - initializeBioCatchClient called");
  // BioCatchClient constructor will auto-start the SDK if external cdApi is provided.
  // Otherwise - will attach a 'bcTracker' member object from type BioCatchClient to the window which can be used for "manual-start".
  const client = createBioCatchClientFromJS(
    new Client(),
    new DynamicCdApiLoader(),
    new ConfigMapper(),
    new ServerUrlResolver()
  );
  console.log("🚀 BioCatch SDK - BioCatch client created:", client);
  return client;
}

// Immediately call initialization - matching legacy pattern exactly
console.log("🚀 BioCatch SDK - Starting auto-initialization...");
initializeBioCatchClient();
console.log("🚀 BioCatch SDK - Auto-initialization completed");