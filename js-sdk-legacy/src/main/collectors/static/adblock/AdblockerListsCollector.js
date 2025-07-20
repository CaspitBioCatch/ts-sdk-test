import DataCollector from '../../DataCollector';
import Log from '../../../technicalServices/log/Logger';
import { adblockSelectors } from './AdBlockSelectors';

const featureSettings = {
  configKey: 'isAdblockerListsFeature',
  isDefault: false,
  shouldRunPerContext: false,
  shouldRunPerSession: true,
  shouldRun: false,
  isFrameRelated: false,
  runInUns: false,
  runInSlave: false,
  runInLean: false,
  isRunning: false,
  instance: null,
};

export default class AdblockerListsCollector extends DataCollector {
  static getDefaultSettings() {
    return featureSettings;
  }

  constructor(dataQ, options = {}) {
    super();
    this._dataQueue = dataQ;
    this.debug = options.debug || false;
  }

  /**
   * Starts the ad blocker lists detection feature.
   * Waits for the page to fully load and then delays execution
   * to allow the ad blocker to hide/remove elements.
   */
  async startFeature() {
    Log.debug("Starting ad blocker lists detection");
    try {
      const activeLists = await this.detectActiveAdblockLists();
      this._sendData(activeLists);
    } catch (err) {
      Log.error("Error detecting ad blocker lists:", err);
    }
  }

  /**
   * Stops the feature.
   */
  stopFeature() {
    // No cleanup necessary in this version.
  }

  /**
   * Determines if detection can run.
   * @returns {boolean}
   */
  canRunDetection() {
    return true; // We assume the DOM is ready here.
  }

  _sendData(activeLists) {
    this._dataQueue.addToQueue('static_fields', ['adblock_lists', activeLists], false);
  }

  /**
   * Detects which ad blocker filter lists are active.
   * Each filter list is active if at least 50% of its selectors are blocked.
   *
   * @returns {Promise<string[]>} A promise that resolves to an array of active filter list names.
   */
  async detectActiveAdblockLists() {
    try {
      // Gather all selectors from all filter lists.
      const allSelectors = ([]).concat(...Object.values(adblockSelectors));

      // Get the set of blocked selectors inside an iframe.
      const blockedSelectors = await this.getBlockedSelectors(allSelectors);

      const activeLists = [];

      // Check each filter list.
      for (const [filterName, selectors] of Object.entries(adblockSelectors)) {
        let blockedCount = 0;
        for (const selector of selectors) {
          if (blockedSelectors.has(selector)) {
            blockedCount++;
            Log.trace(`Selector "${selector}" is blocked for filter "${filterName}".`);
          } else {
            Log.trace(`Selector "${selector}" is not blocked for filter "${filterName}".`);
          }
        }
        if (blockedCount >= 2) {
          activeLists.push(filterName);
          Log.trace(`Filter "${filterName}" is considered active.`);
        }
      }

      const finalList = activeLists.sort();
      Log.debug("Active ad blocker lists: " + finalList);
      return finalList;
    } catch (error) {
      Log.error("Error in detectActiveAdblockLists:", error);
      return [];
    }
  }

  /**
   * Creates a hidden iframe, runs the detection logic inside it,
   * and returns a set of selectors that have been blocked.
   *
   * @param {string[]} selectors - An array of CSS selectors.
   * @returns {Promise<Set<string>>} A promise that resolves to a set of blocked selectors.
   */
  async getBlockedSelectors(selectors) {
    // Create a hidden iframe.
    const iframe = document.createElement("iframe");
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.opacity = '0';
    document.body.appendChild(iframe);

    try {
      // Access the iframe's document.
      const d = iframe.contentDocument || iframe.contentWindow.document;
      // Ensure the iframe has a body.
      if (!d.body) {
        const body = d.createElement("body");
        d.documentElement.appendChild(body);
      }

      // Create a container for dummy elements.
      const root = d.createElement("div");
      const elements = new Array(selectors.length);
      const blockedSelectors = new Set();

      // Create dummy elements for each selector.
      for (let i = 0; i < selectors.length; i++) {
        const element = this.selectorToElement(selectors[i], d);
        const holder = d.createElement("div"); // Protects from effects of sibling selectors.
        holder.appendChild(element);
        root.appendChild(holder);
        elements[i] = element;
      }

      d.body.appendChild(root);

      // Wait 200ms to let the ad blocker hide/remove the elements.
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Check which elements are blocked (using offsetParent).
      for (let i = 0; i < selectors.length; i++) {
        if (!elements[i].offsetParent) {
          blockedSelectors.add(selectors[i]);
        }
      }

      return blockedSelectors;
    } catch (error) {
      Log.error("Error in getBlockedSelectors:", error);
      return new Set();
    } finally {
      // Clean up
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
    }
  }

  /**
   * Creates a DOM element that matches the given selector.
   * Only single element selectors are supported (without operators like space, +, >, etc).
   *
   * @param {string} selector - The CSS selector.
   * @param {Document} [d=document] - The document in which to create the element.
   * @returns {HTMLElement} The created element.
   */
  selectorToElement(selector, d = document) {
    const [tag, attributes] = this.parseSimpleCssSelector(selector);
    const element = d.createElement(tag || "div");
    for (const name in attributes) {
      if (attributes.hasOwnProperty(name)) {
        element.setAttribute(name, attributes[name].join(" "));
      }
    }
    return element;
  }

  /**
   * Parses a CSS selector into a tag name with HTML attributes.
   * Only single element selectors are supported (without operators like space, +, >, etc).
   *
   * Multiple values can be returned for each attribute.
   *
   * @param {string} selector - The CSS selector.
   * @returns {[string, Object]} An array where the first item is the tag name and the second is an attributes object.
   */
  parseSimpleCssSelector(selector) {
    const tagMatch = /^\s*([a-z-]*)(.*)$/i.exec(selector);
    if (!tagMatch) {
      const errorMessage = `Unexpected syntax '${selector}'`;
      throw new Error(errorMessage);
    }
    const tag = tagMatch[1] || undefined;
    const attributes = {};
    const partsRegex = /([.:#][\w-]+|\[.+?\])/gi;

    const addAttribute = (name, value) => {
      if (!attributes[name]) {
        attributes[name] = [];
      }
      attributes[name].push(value);
    };

    let match;
    while ((match = partsRegex.exec(tagMatch[2])) !== null) {
      const part = match[0];
      switch (part[0]) {
        case ".":
          addAttribute("class", part.slice(1));
          break;
        case "#":
          addAttribute("id", part.slice(1));
          break;
        case "[":
          {
            const attributeMatch = /^\[([\w-]+)([~|^$*]?=("(.*?)"|([\w-]+)))?(\s+[is])?\]$/.exec(part);
            if (attributeMatch) {
              addAttribute(attributeMatch[1], attributeMatch[4] || attributeMatch[5] || "");
            } else {
              throw new Error(errorMessage);
            }
          }
          break;
        default:
          throw new Error(errorMessage);
      }
    }
    return [tag, attributes];
  }
}