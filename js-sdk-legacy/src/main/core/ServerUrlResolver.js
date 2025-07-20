import { BCProtocolType } from '../contract/BCProtocolType';
import {wupUrlV3Path, wupUrlV4Path} from '../const/communication'

export class ServerUrlResolver {
  resolve(serverUrl, configuredCustomerID, configuredProtocolType) {
    const url = new URL(serverUrl);

    // Determine the path based on the configured protocol type
    let newPath = '';
    if (configuredProtocolType === BCProtocolType.V4) {
      newPath = `/${wupUrlV4Path}`;
    } else if (configuredProtocolType === BCProtocolType.V3) {
      newPath = `/${wupUrlV3Path}`;
    }

    // Check if the serverUrl already has a protocol path (V3 or V4)
    if (!serverUrl.includes(wupUrlV3Path) && !serverUrl.includes(wupUrlV4Path)) {
      url.pathname = newPath;
    } else if (configuredProtocolType === BCProtocolType.V4 && serverUrl.includes(wupUrlV3Path)) {
      // Replace existing V3 path with V4 if protocol type is V4
      url.pathname = newPath;
    }

    // Handle `cid`: use configuredCustomerID if provided, otherwise keep the original `cid`
    if (configuredCustomerID) {
      url.searchParams.set('cid', configuredCustomerID);
    } else if (!url.searchParams.has('cid')) {
      // If no `cid` is present and `configuredCustomerID` is undefined, log a warning or handle as needed
      console.warn('No cid found, and configuredCustomerID is undefined.');
    }

    return url.toString();
  }
}