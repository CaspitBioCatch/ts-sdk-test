
// eslint-disable-next-line no-unused-vars
function startSession(csid, agentType, collectionMode, sessionHistory, csidSource) {
    const session = {
        csid: csid,
        agentType: agentType,
        collectionMode: collectionMode,
        sessionHistory: sessionHistory,
        csidSource: csidSource
    };

    console.log('session configurations: ', session);

    if(sessionHistory === 'yes') {
        clearSessionInfo(() => {
            initSession(session);
        })
    }
    else{
        initSession(session);
    }

}

function clearSessionInfo(callback) {
    clearSessionStorageKeys();
    clearSessionCookies();
    callback();
}

function clearSessionStorageKeys() {
    try {
        window.localStorage.clear();

    } catch (e) {
        console.log(e);
    }
}

function clearSessionCookies() {
    try {
        const cookies = document.cookie.split(";");

        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i];
            const eqPos = cookie.indexOf("=");
            const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
            document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
        }

    } catch (e) {
        console.log(e);
    }
}

function initSession(session) {
    //setting the metatags
    addMetaTag('cdCsid', session.csid);
    addMetaTag('cdAgentType', session.agentType);
    addMetaTag('cdCollectionMode', session.collectionMode);

    //load the cdApi object
    loadScript('HybridDefaultCdApi.js', () => {
        console.log('cdApi loaded successfully');
        loadScript('../customerJs/slothDebug_DevVersion.js', () => {
            console.log('slothDebug loaded successfully');
            window.cdApi.setCustomerSessionId(session.csid);
        });
    });
}

function addMetaTag(name, content) {
    const meta = document.createElement('meta');
    meta.name = name;
    meta.content = content;
    meta.type = 'hidden'
    document.getElementsByTagName('head')[0].appendChild(meta);
}

function loadScript(url, callback) {
    const script = document.createElement("script");
    script.type = "text/javascript";

    if (script.readyState) {  // For old versions of IE
        script.onreadystatechange = function() {
            if (script.readyState === "loaded" || script.readyState === "complete") {
                script.onreadystatechange = null;
                callback();
            }
        };
    } else {  // For modern browsers
        script.onload = function() {
            callback();
        };
    }

    script.src = url;
    document.getElementsByTagName("head")[0].appendChild(script);
}