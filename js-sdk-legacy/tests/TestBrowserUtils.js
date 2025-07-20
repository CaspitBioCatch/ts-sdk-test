export default class TestBrowserUtils {
    static isMobileSafari(userAgent) {
        const iOS = !!userAgent.match(/iPad/i) || !!userAgent.match(/iPhone/i);
        const webkit = !!userAgent.match(/WebKit/i);
        const iOSSafari = iOS && webkit && !userAgent.match(/CriOS/i);

        return iOSSafari;
    }

    static isDesktopSafari(userAgent) {
        return !!userAgent.match(/Macintosh/i) && !!userAgent.match(/^((?!chrome|android|mobile).)*safari/i);
    }

    static isEdge(userAgent) {
        return /edge/.test(userAgent.toLowerCase());
    }

    static isIE11(userAgent) {
        return /trident\/7\./.test(userAgent.toLowerCase());
    }

    static isAnyChrome(userAgent) {
        return new RegExp('chrom(e|ium)\/[.0-9]').test(userAgent.toLowerCase());
    }

    static isChrome(userAgent, browserVersion) {
        return new RegExp(`chrom(e|ium)\/${browserVersion}`).test(userAgent.toLowerCase());
    }

    static isOpera(userAgent, browserVersion) {
        return new RegExp(`/opera|opr\/${browserVersion}`).test(userAgent.toLowerCase());
    }

    static isChromeMobile() {
        return !!window.chrome && !window.chrome.webStore;
    }

    static isFirefox(userAgent, browserVersion) {
        return new RegExp(`firefox\/${browserVersion}`).test(userAgent.toLowerCase());
    }

    static isIE() {
        return !!document.documentMode;
    }

    static isSafari(userAgent) {
        const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
        return isSafari;
    }

    static isSafariBrowser() {
        return typeof window.safari !== "undefined" && typeof window.safari.pushNotification !== "undefined";
    }

    static browserVersion(userAgent, appName, appVersion) {
        var ua = userAgent.toLowerCase(), tem,
            M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
        if(/trident/i.test(M[1]))
        {
            tem=  /\brv[ :]+(\d+)/g.exec(ua) || [];
            return 'IE '+(tem[1] || '');
        }
        if(M[1]=== 'Chrome')
        {
            tem= ua.match(/\b(OPR|Edge)\/(\d+)/);
            if(tem!= null) return tem.slice(1).join(' ').replace('OPR', 'Opera');
        }
        M = M[2]? [M[1], M[2]]: [appName, appVersion || userAgent, '-?'];
        if((tem= ua.match(/version\/(\d+)/i))!= null)
            M.splice(1, 1, tem[1]);
        return (M.join(' ')).split(" ");
    }

}
