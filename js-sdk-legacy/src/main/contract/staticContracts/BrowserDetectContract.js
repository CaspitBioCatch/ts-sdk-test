import Log from "../../technicalServices/log/Logger";
import StaticContract from "./StaticContract";

export default class BrowserDetectContract extends StaticContract{
    /**
     * @param  {boolean} isChrome
     * @param  {boolean} isFirefox
     * @param  {boolean} isEdge
     * @param  {boolean} isIE
     * @param  {boolean} isSafari
     * @param  {boolean} isOpera
     * @param  {boolean} isBlink
     */
    constructor(isChrome, isFirefox, isEdge, isIE, isSafari, isOpera, isBlink){
        super();
        this.validateParams(isChrome, isFirefox, isEdge, isIE, isSafari, isOpera, isBlink);
        this.isChrome = isChrome;
        this.isFirefox = isFirefox;
        this.isEdge = isEdge;
        this.isIE = isIE;
        this.isSafari = isSafari;
        this.isOpera = isOpera;
        this.isBlink = isBlink;
    }

    validateParams(isChrome, isFirefox, isEdge, isIE, isSafari, isOpera, isBlink){
        let isValid =  (
            typeof isChrome === 'boolean' &&
            typeof isFirefox === 'boolean' &&
            typeof isEdge === 'boolean' &&
            typeof isIE === 'boolean' &&
            typeof isSafari === 'boolean' &&
            typeof isOpera === 'boolean' &&
            typeof isBlink === 'boolean')
        if (!isValid){
            Log.warn(`wrong type in Per, BrowserDetectContract, parameters. isChrome : {expected: boolean, received: ${ typeof isChrome}},
            isFirefox : {expected: boolean, received: ${ typeof isFirefox}},isEdge : {expected: boolean, received: ${ typeof isEdge}},isIE : {expected: boolean, received: ${ typeof isIE}},
            isSafari : {expected: boolean, received: ${ typeof isSafari}},isOpera : {expected: boolean, received: ${ typeof isOpera}} ,isBlink : {expected: boolean, received: ${ typeof isBlink}}`)
        }
    }

    /**
     * @return  {[string,[...boolean]]} for example: ['browser_spoofing', [true, false, false, false,  false,  false,  false]]
     */
    buildQueueMessage(){
        let name = this.getName();
        let message =  [
            name,[
            this.isChrome,
            this.isFirefox,
            this.isEdge,
            this.isIE,
            this.isSafari,
            this.isOpera,
            this.isBlink,
    ]];
        this.validateMessage(message);
        return message;
    }

    validateMessage(message){
        let isValid =  (
            typeof message[0] === 'string' &&
            Array.isArray(message[1]) &&
            message[1].length === 7)
        if (!isValid){
            Log.warn('BrowserDetect - Contract verification failed')
        }
    }

    getName() {
        return 'browser_spoofing';
    }
}
