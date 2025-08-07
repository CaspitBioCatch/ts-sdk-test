// Auto-initialization entry point - exactly matching js-sdk-legacy main.js
import {DynamicCdApiLoader} from "../js-sdk-legacy/src/main/core/DynamicCdApiLoader.js";
import {ConfigMapper} from "../js-sdk-legacy/src/main/core/ConfigMapper.js";
import {ServerUrlResolver} from "../js-sdk-legacy/src/main/core/ServerUrlResolver.js";
import Client from "../js-sdk-legacy/src/main/Client.js";
import {createBioCatchClientFromJS} from "./client/JSBridge";

export function initializeBioCatchClient() {
	return createBioCatchClientFromJS(
		new Client(),
		new DynamicCdApiLoader(),
		new ConfigMapper(),
		new ServerUrlResolver(),
	);
}

initializeBioCatchClient();
