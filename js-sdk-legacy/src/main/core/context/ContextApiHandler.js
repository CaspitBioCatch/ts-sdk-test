/**
 * This class is for handling api call from the CustomerApiBridge.
 * It is not handled in the ContextMgr since handling it there will require the context mgr to know
 * the DataQ which will cause circular reference
 */
export default class ContextApiHandler {
    constructor(contextMgr, dataQ) {
        this._contextMgr = contextMgr;
        this._dataQ = dataQ;
        // subscribe to context changes
        this._contextMgr.onContextChange.subscribe(this.sendContextToServer.bind(this));
        // generate a report of context change when the page first reloads in order to report the url
        this.handleContextChange({ context: 'cd_auto' });
    }

    handleContextChange(apiMsg) {
        // activityType is for backward compatibility with 1.4 api
        this._contextMgr.changeContext(apiMsg.context || apiMsg.activityType);
    }

    sendContextToServer(newContext) {
        if (newContext) {
            this._dataQ.addToQueue('contextChange',
                [null, newContext.url,
                    newContext.name,
                    newContext.timestamp,
                    newContext.referrer,
                    newContext.hLength,
                ]);
        }
    }
}

// Better to do it with static (ES6) but Babel is unable to handle it in IE8, so for now...
ContextApiHandler.apiName = 'ContextChange';
