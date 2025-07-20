/* eslint-disable no-new */
import TestBrowserUtils from "./TestBrowserUtils";

export default class TestFeatureSupport {
    static isUserPermissionsSupported() {
        return window.navigator.permissions && window.navigator.permissions.query;
    }

    static isWorkerSupported() {
        return !!window.Worker && typeof window.Worker === 'function';
    }

    static isSharedWorkerSupported() {
        return !!window.SharedWorker;
    }

    static isMutationObserverSupported() {
        return !!window.MutationObserver;
    }

    static isTouchEventsSupported() {
        return !!window.TouchEvent;
    }

    static isPointerEventsSupported() {
        return !!window.PointerEvent;
    }

    static isDoNotTrackSupported() {
        if (navigator.doNotTrack === undefined && window.doNotTrack === undefined && navigator.msDoNotTrack === undefined) {
            return false;
        }

        return true;
    }

    static isXMLHttpRequestTimeoutSupported() {
        const xmlHttpRequest = new XMLHttpRequest();

        return !!xmlHttpRequest.ontimeout;
    }

    static isClipboardEventsSupported() {
        let isSupported = !!window.ClipboardEvent;

        // Make sure we can create the event since some browsers throw an illegal constructor at this point
        try {
            new ClipboardEvent('copy', {});
        } catch (error) {
            isSupported = false;
        }

        return isSupported;
    }

    static isCustomElementsSupported() {
        return typeof window.customElements === 'object';
    }

    static isShadowAttachSupported() {
        return document.head.attachShadow;
    }

    // Safari 9 doesn't support spy on window.parent so tests fail
    static isSpyNotSupported() {
        if (TestBrowserUtils.isIE11(window.navigator.userAgent.toLowerCase())
            || TestBrowserUtils.isSafari(navigator.userAgent, 9))
            return true;

        return false;
    }
        
    static isPerformanceNavigationTimingSupported(){
        const performanceNavigationTiming = "PerformanceNavigationTiming" in window;
        const performanceObserver = "PerformanceObserver" in window;
        return performanceObserver && performanceNavigationTiming;
    }

    static isObserverSupportsTypeAttribute(){
        const observerSupport = TestFeatureSupport.isPerformanceNavigationTimingSupported();
        if(!observerSupport){
            return false
        }
        try {
            new PerformanceObserver(function (){}).observe({type:'navigation', buffered:true});
        }catch (e){
            return false;
        }
        return true;

    }
}
/* eslint-enable no-new */
