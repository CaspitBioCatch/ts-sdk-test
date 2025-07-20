export class DynamicCdApiLoader {
  attachCdApi(window, customerSessionId) {
    const cdApi = this.createCdApi(window, customerSessionId);
    window.cdApi = cdApi;
    window.cdApi.listenToEvents();
  }

  createCdApi(window, customerSessionId) {
    // Create the "cdApi" object in the browser:
    return {
      // Map of events and their subscribed listeners
      _eventListeners: {},

      /**
       * Handle messages arriving from the SDK library
       * @param e - The message event
       */
      onMessage: function(e) {
        const eventListeners = this._eventListeners[e.data.type];

        // If there are no listeners, abort at this point
        if (!eventListeners) {
          return;
        }

        for (let i = 0; i < eventListeners.length; i++) {
          eventListeners[i](e.data.event);
        }
      },

      listenToEvents: function() {
        if (window.addEventListener) {
          window.addEventListener('message', this.onMessage.bind(this), true);
        } else {
          window.attachEvent('onmessage', this.onMessage.bind(this));
        }
      },

      getCustomerSessionID: function(callback) {
        if (customerSessionId) {
          callback(customerSessionId);
        } else {
          callback(undefined);
        }
      },

      registerSessionNumberChange: function(callback) {
        function onNotification(e) {
          const msg = e.data;
          if (msg.type === 'SNumNotification') {
            callback(msg.cdSNum);
          }
        }

        if (window.addEventListener) {
          window.addEventListener('message', onNotification, true);
        } else {
          window.attachEvent('onmessage', onNotification);
        }
      },

      addEventListener: function(eventType, listenerFunction) {
        let listenersList = this._eventListeners[eventType];

        if (!listenersList) {
          listenersList = [];
          this._eventListeners[eventType] = listenersList;
        }

        listenersList.push(listenerFunction);
      },

      removeEventListener: function(eventType, listenerFunction) {
        const listenersList = this._eventListeners[eventType];

        // If nothing is subscribed for this event, return
        if (!listenersList) {
          return;
        }

        for (let i = 0; i < listenersList.length; i++) {
          if (listenersList[i] === listenerFunction) {
            listenersList.splice(i, 1); // Corrected to remove only the specific function
            break; // Exit loop after removing the listener
          }
        }
      },

      changeContext: function(contextName) {
        window.postMessage({ type: 'ContextChange', context: contextName }, window.location.href);
      },

      startNewSession: function(csid) {
        window.postMessage({ type: 'ResetSession', resetReason: 'customerApi', csid }, window.location.href);
      },

      pauseCollection: function() {
        window.postMessage({ type: 'cdChangeState', toState: 'pause' }, window.location.href);
      },

      resumeCollection: function() {
        window.postMessage({ type: 'cdChangeState', toState: 'run' }, window.location.href);
      },

      sendMetadata: function(data) {
        window.postMessage({ type: 'cdCustomerMetadata', data }, window.location.href);
      },

      setCustomerSessionId: function(csid) {
        window.postMessage({ type: 'cdSetCsid', csid: csid }, window.location.href);
      },

      setCustomerBrand: function(brand) {
        window.postMessage({ type: 'cdSetCustomerBrand', brand: brand }, window.location.href);
      }
    };
  }
}
