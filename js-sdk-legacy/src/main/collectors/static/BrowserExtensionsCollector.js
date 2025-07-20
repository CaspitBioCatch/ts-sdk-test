import DataCollector from '../DataCollector';
import Log from '../../technicalServices/log/Logger';

const featureSettings = {
  configKey: 'isBrowserExtensionsFeature',
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

/**
 * Extension category types for better organization
 */
const ExtensionCategory = {
  AD_BLOCKER: 'ad_blocker',
  PASSWORD_MANAGER: 'password_manager',
  CRYPTO_WALLET: 'crypto_wallet',
  DEVELOPER_TOOL: 'developer_tool',
  GRAMMAR_WRITING: 'grammar_writing',
  DARK_MODE: 'dark_mode',
  OTHER: 'other'
};

/**
 * Extension definition with improved structure
 */
class ExtensionDefinition {
  constructor(name, detection, category = ExtensionCategory.OTHER, reliability = 0.8) {
    this.name = name;
    this.detection = detection;
    this.category = category;
    this.reliability = reliability; // 0-1 scale of detection reliability
  }
}

/**
 * Improved extension scanner with better organization and error handling
 */
export class RegularExtensionsScanner {
  constructor(window, document) {
    this._window = window;
    this._document = document;
    this.extensions = this._initializeExtensions();
    this._detectionCache = new Map();
  }

  /**
   * Initialize all extension definitions
   * @returns {ExtensionDefinition[]} List of extension definitions
   */
  _initializeExtensions() {
    return [
      // 🛡️ Ad Blockers
      new ExtensionDefinition(
        "Ad Blocker",
        this._detectAdBlocker.bind(this),
        ExtensionCategory.AD_BLOCKER,
        0.9
      ),

      // 🔐 Password Managers
      new ExtensionDefinition(
        "LastPass",
        this._detectLastPass.bind(this),
        ExtensionCategory.PASSWORD_MANAGER,
        0.85
      ),
      new ExtensionDefinition(
        "1Password",
        this._detect1Password.bind(this),
        ExtensionCategory.PASSWORD_MANAGER,
        0.85
      ),

      // 💰 Crypto Wallet Extensions
      new ExtensionDefinition(
        "MetaMask",
        this._detectMetaMask.bind(this),
        ExtensionCategory.CRYPTO_WALLET,
        0.95
      ),
      new ExtensionDefinition(
        "Coinbase Wallet",
        this._detectCoinbaseWallet.bind(this),
        ExtensionCategory.CRYPTO_WALLET,
        0.95
      ),
      new ExtensionDefinition(
        "WalletConnect Wallet",
        this._detectWalletConnect.bind(this),
        ExtensionCategory.CRYPTO_WALLET,
        0.95
      ),
      new ExtensionDefinition(
        "Trust Wallet",
        this._detectTrustWallet.bind(this),
        ExtensionCategory.CRYPTO_WALLET,
        0.95
      ),
      new ExtensionDefinition(
        "Phantom Wallet",
        this._detectPhantomWallet.bind(this),
        ExtensionCategory.CRYPTO_WALLET,
        0.95
      ),
      new ExtensionDefinition(
        "Binance Wallet",
        this._detectBinanceWallet.bind(this),
        ExtensionCategory.CRYPTO_WALLET,
        0.95
      ),
      new ExtensionDefinition(
        "Brave Wallet",
        this._detectBraveWallet.bind(this),
        ExtensionCategory.CRYPTO_WALLET,
        0.9
      ),
      new ExtensionDefinition(
        "Apple Pay",
        this._detectApplePay.bind(this),
        ExtensionCategory.CRYPTO_WALLET,
        0.9
      ),
      new ExtensionDefinition(
        "Google Pay",
        this._detectGooglePay.bind(this),
        ExtensionCategory.CRYPTO_WALLET,
        0.9
      ),

      // 🛠️ Developer Tools
      new ExtensionDefinition(
        "React Developer Tools",
        this._detectReactDevTools.bind(this),
        ExtensionCategory.DEVELOPER_TOOL,
        0.95
      ),
      new ExtensionDefinition(
        "Vue.js DevTools",
        this._detectVueDevTools.bind(this),
        ExtensionCategory.DEVELOPER_TOOL,
        0.95
      ),
      new ExtensionDefinition(
        "Redux DevTools",
        this._detectReduxDevTools.bind(this),
        ExtensionCategory.DEVELOPER_TOOL,
        0.95
      ),
      new ExtensionDefinition(
        "Angular DevTools",
        this._detectAngularDevTools.bind(this),
        ExtensionCategory.DEVELOPER_TOOL,
        0.95
      ),
      new ExtensionDefinition(
        "Svelte DevTools",
        this._detectSvelteDevTools.bind(this),
        ExtensionCategory.DEVELOPER_TOOL,
        0.95
      ),

      // 📖 Grammar & Writing Extensions
      new ExtensionDefinition(
        "Grammarly",
        this._detectGrammarly.bind(this),
        ExtensionCategory.GRAMMAR_WRITING,
        0.9
      ),

      // 🌙 Dark Mode Extensions
      new ExtensionDefinition(
        "Dark Reader",
        this._detectDarkReader.bind(this),
        ExtensionCategory.DARK_MODE,
        0.85
      ),
      new ExtensionDefinition(
        "Super Dark Mode",
        this._detectSuperDarkMode.bind(this),
        ExtensionCategory.DARK_MODE,
        0.85
      ),
      new ExtensionDefinition(
        "Adobe Acrobat",
        this._detectAdobeAcrobat.bind(this),
        ExtensionCategory.OTHER,
        0.8
      ),
    ];
  }

  /**
   * Helper method to safely detect an extension with caching
   * @param {ExtensionDefinition} extension - The extension to detect
   * @returns {Promise<boolean>} - Whether the extension was detected
   */
  async detectExtension(extension) {
    // Check cache first
    if (this._detectionCache.has(extension.name)) {
      return this._detectionCache.get(extension.name);
    }

    try {
      const result = await extension.detection();
      // Cache the result
      this._detectionCache.set(extension.name, result);
      return result;
    } catch (error) {
      Log.debug(`Error detecting ${extension.name}: ${error.message}`);
      return false;
    }
  }

  /**
   * Scan for all extensions with improved performance
   * @returns {Promise<Array>} - List of detected extension names
   */
  async scan() {
    // Wait for extensions to initialize
    // await new Promise(resolve => setTimeout(resolve, 3000));

    // Run detections in parallel with improved error handling
    const detectionPromises = this.extensions.map(async ext => {
      try {
        const detected = await this.detectExtension(ext);
        return { name: ext.name, detected, category: ext.category, reliability: ext.reliability };
      } catch (error) {
        Log.debug(`Failed to detect ${ext.name}: ${error.message}`);
        return { name: ext.name, detected: false, category: ext.category, reliability: ext.reliability };
      }
    });

    const results = await Promise.all(detectionPromises);
    
    // Filter and sort by reliability
    return results
      .filter(ext => ext.detected)
      .sort((a, b) => b.reliability - a.reliability)
      .map(ext => ext.name);
  }

  // Individual detection methods with improved reliability
  async _detectAdBlocker() {
    try {
      // Create a bait element with common ad-related class names
      const bait = this._document.createElement("div");
      bait.className = "pub_300x250 ad_unit adsbox";
      bait.style.cssText = "height:50px;width:50px;position:absolute;left:-9999px;top:0;display:block;";
      this._document.body.appendChild(bait);

      // Get computed styles and dimensions
      const computedStyle = this._window.getComputedStyle(bait);
      const isBlocked =
        computedStyle.display === "none" ||
        computedStyle.visibility === "hidden" ||
        bait.offsetHeight === 0 ||
        bait.offsetWidth === 0;

      this._document.body.removeChild(bait);
      return isBlocked;
    } catch (error) {
      Log.debug(`Ad blocker detection error: ${error.message}`);
      return false;
    }
  }

  async _detectLastPass() {
    return this._document.querySelectorAll('[data-lastpass-icon-root]').length > 0;
  }

  async _detect1Password() {
    return JSON.stringify(this._window._sentryDebugIds)?.includes("aeblfdkhhhdcdjpifhhbdiojplfjncoa") ||
      !!this._document.querySelector(".onepassword-fill-button");
  }

  async _detectMetaMask() {
    return !!this._window.ethereum && this._window.ethereum.isMetaMask;
  }

  async _detectCoinbaseWallet() {
    return !!this._window.ethereum && this._window.ethereum.isCoinbaseWallet;
  }

  async _detectWalletConnect() {
    return !!this._window.ethereum && this._window.ethereum.isWalletConnect;
  }

  async _detectTrustWallet() {
    return !!this._window.ethereum && this._window.ethereum.isTrust;
  }

  async _detectPhantomWallet() {
    return !!this._window.solana && this._window.solana.isPhantom;
  }

  async _detectBinanceWallet() {
    return !!this._window.BinanceChain && this._window.BinanceChain.isBinanceChain === true;
  }

  async _detectBraveWallet() {
    return !!(this._window.navigator.brave && this._window.navigator.brave.isBrave);
  }

  async _detectApplePay() {
    return !!this._window.ApplePaySession &&
      typeof this._window.ApplePaySession.canMakePayments === "function" &&
      await this._window.ApplePaySession.canMakePayments();
  }

  async _detectGooglePay() {
    return !!(this._window.google && this._window.google.payments && this._window.google.payments.api);
  }

  async _detectReactDevTools() {
    return !!this._window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  }

  async _detectVueDevTools() {
    return !!this._window.__VUE_DEVTOOLS_GLOBAL_HOOK__;
  }

  async _detectReduxDevTools() {
    return !!this._window.__REDUX_DEVTOOLS_EXTENSION__;
  }

  async _detectAngularDevTools() {
    return !!this._window.ng;
  }

  async _detectSvelteDevTools() {
    return !!this._window.__SVELTE_DEVTOOLS_GLOBAL_HOOK__;
  }

  async _detectGrammarly() {
    const grammarlySelectors = [
      "grammarly-extension",
      "grammarly-desktop-integration",
      "grammarly-mirror",
      "grammarly-popups",
      "grammarly-extension-vbars",
      "grammarly-extension-vbar-cad",
      "grammarly-extension-vbars-feedback-form"
    ];

    return grammarlySelectors.some(selector => this._document.querySelector(selector) !== null);
  }

  async _detectDarkReader() {
    return this._detectDarkModeExtension(50);
  }

  async _detectSuperDarkMode() {
    return this._detectDarkModeExtension(5);
  }

  async _detectDarkModeExtension(brightnessThreshold) {
    try {
      // Create a widget with a white background
      const widget = this._document.createElement("div");
      widget.style.cssText = "background-color:#ffffff;width:100px;height:100px;position:absolute;top:0;left:0;z-index:9999;";
      this._document.body.appendChild(widget);

      // Wait for dark mode extensions to apply their styles
      await new Promise(resolve => setTimeout(resolve, 500));

      // Check the computed background color
      const computedStyle = this._window.getComputedStyle(widget);
      const bgColor = computedStyle.backgroundColor;

      // Clean up the widget
      this._document.body.removeChild(widget);

      // Determine if the background has been changed to a dark color
      const isDark = bgColor === "rgb(0, 0, 0)" ||
        (() => {
          const match = bgColor.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
          if (match) {
            const r = parseInt(match[1], 10);
            const g = parseInt(match[2], 10);
            const b = parseInt(match[3], 10);
            // Calculate average brightness (0 = dark, 255 = bright)
            const brightness = (r + g + b) / 3;
            return brightness < brightnessThreshold;
          }
          return false;
        })();
      return isDark;
    } catch (error) {
      Log.debug(`Dark mode detection error: ${error.message}`);
      return false;
    }
  }

  async _detectAdobeAcrobat() {
    return this._window?.sessionStorage?.getItem("adobeCleanFontAdded") === "true";
  }
}

/**
 * Improved BrowserExtensionsCollector with better error handling and performance
 */
export default class BrowserExtensionsCollector extends DataCollector {
  static getDefaultSettings() {
    return featureSettings;
  }

  constructor(configurationRepository, utils, domUtils, dataQueue, regularExtensionsScanner = null) {
    super();

    this._configurationRepository = configurationRepository;
    this._domUtils = domUtils;
    this._utils = utils;
    this._dataQueue = dataQueue;
    this._regularExtensionsScanner = regularExtensionsScanner || new RegularExtensionsScanner(window, document);
  }

  /**
   * Start the extension detection feature
   */
  async startFeature() {
    try {
      const regularExtensions = await this._regularExtensionsScanner.scan();
      
      if (regularExtensions.length > 0) {
        Log.info(`Detected browser extensions: ${regularExtensions.join(', ')}`);
        this._sendData(regularExtensions);
      } else {
        Log.info('No browser extensions detected');
        this._sendData([]);
      }
    } catch (error) {
      Log.error(`Failed to detect browser extensions: ${error.message}`);
      this._sendData([]);
    }
  }

  /**
   * Send the detected extensions data to the queue
   * @param {Array} extensionsList - List of detected extension names
   */
  _sendData(extensionsList) {
    this._dataQueue.addToQueue('static_fields', ['browser_extensions', ["v1", extensionsList]], false);
  }
}