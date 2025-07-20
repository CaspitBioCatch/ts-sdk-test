import {ConfigurationFields} from '../../core/configuration/ConfigurationFields';
import DataCollector from '../DataCollector';
import Log from '../../technicalServices/log/Logger';
import {ElementStrengthenInstance} from '../../technicalServices/ElementStrengthen';
import { UniqueIDConfiguration } from '../../technicalServices/UniqueIDConfiguration';

export const EventStructure = [
    'elementHash',
    'tagName',
    'id',
    'name',
    'type',
    'leftPosition',
    'topPosition',
    'width',
    'height',
    'className',
    'href',
    'title',
    'alt',
    'selectValues',
    'elementValue',
    'checked',
    'timestamp',
    'customElementAttribute',
    'unmaskedElementValue',
    'elementMappingId',
    'category'
];

export default class ElementsCollector extends DataCollector {

    constructor(configurationRepository, utils, dataQueue, contextMgr, maskingService, categoryService) {
        super();
        this._configurationRepository = configurationRepository;
        this._utils = utils;
        this._dataQueue = dataQueue;
        this._contextMgr = contextMgr;
        this._maskingService = maskingService;
        this._categoryService = categoryService;
        this._elementHashWMap = new WeakMap();
        // by default we collect unless the server will order otherwise
        this._collectPosition = true;
        this._collectClassName = true;
        this._collectTitle = true;
        this._collectHref = true;
        this._collectCustomElementAttribute = true;
        this._customElementAttribute = this._configurationRepository.get(ConfigurationFields.customElementAttribute);
        this._maxElemValLength = 30;
        this._allowedUnmaskedValuesList = this._configurationRepository.get(ConfigurationFields.allowedUnmaskedValuesList);
        this._enableUnmaskedValues = this._configurationRepository.get(ConfigurationFields.enableUnmaskedValues);
        this._enableElementHierarchy = this._configurationRepository.get(ConfigurationFields.enableElementHierarchy);
        this._enableElementCategory = this._configurationRepository.get(ConfigurationFields.enableElementCategory);

        this._uniqueIDConfiguration = UniqueIDConfiguration.parse(this._configurationRepository.get(ConfigurationFields.elementUniqueIDConfiguration));
    }

    /**
     * Getting the Element hash
     * @param elem - dom element
     * @returns {*} - hash value for the element
     */
    getElement(elem) {
        if (this._utils.isUndefinedNull(elem) || elem === document || elem === document.body) {
            return -1; // on mouse events we may get the document object
            // we sometimes get null element - iframes etc
        }

        let hash = -1;
        if (this._elementHashWMap.has(elem)) {
            hash = this._elementHashWMap.get(elem).hash;
        } else {
            const xpath = ElementStrengthenInstance.getUniqueElementXpath(elem);
            hash = xpath ? this._utils.getHash(xpath) : -1;
            this._elementHashWMap.set(elem, {hash, contextList: [this._contextMgr.contextName]});
            this._sendElementToServer(elem, hash);
        }
        return hash;
    }

    getElementHashFromEvent(event) {
        const elementTarget = this.getRealEventTarget(event);
        return this.getElement(elementTarget);
    }

    getRealEventTarget(event) {
        // Try to get the first element from the composedPath (Shadow DOM safe)
        const path = event.composedPath ? event.composedPath() : null;

        // If path exists and has elements, use the first element, otherwise fall back to e.target
        const realTarget = (path && path.length > 0) ? path[0] : event.target;

        return realTarget;
    }

    /**
     * for existing elements, check if was sent for the current context
     * @param elem
     */
    resendElementPerContext(elem) {
        if (!this._elementHashWMap.has(elem)) {
            Log.error(`received for resendElementPerContext bad element, not in hash map. id=${elem.id}`);
            return;
        }
        const elemData = this._elementHashWMap.get(elem);
        const hash = elemData.hash;
        if (elemData.contextList.indexOf(this._contextMgr.contextName) < 0) {
            // the element was already sent for this context, we do not want the server and DB
            // to be swamped with data so we don't sent it in this case
            elemData.contextList.push(this._contextMgr.contextName);
            this._elementHashWMap.set(elem, {hash: elemData.hash, contextList: elemData.contextList});
            this._sendElementToServer(elem, hash);
        }
    }

    isListed(elem) {
        return this._elementHashWMap.has(elem);
    }

    /**
     * return block of saved data (context and hash)
     * @param elem
     * @returns {object}
     */
    getElementData(elem) {
        return this._elementHashWMap.get(elem);
    }

    /**
     * return contextList
     * @param elem
     * @returns {[]}
     */
    getElementContextList(elem) {
        return this._elementHashWMap.get(elem).contextList;
    }

    _sendElementToServer(elem, hash) {
        // offset/width/height are sometimes float values
        const position = this._collectPosition ? (elem.getBoundingClientRect && elem.getBoundingClientRect()) : null;
        let left = -1;
        let top = -1;
        let width = -1;
        let height = -1;

        if (position) {
            left = Math.round(position.left);
            top = Math.round(position.top);
            width = Math.round(position.right - position.left);
            height = Math.round(position.bottom - position.top);
        }

        // the following attributes are always a string, even when not exist they are ""
        const elemId = this._maskingService.maskAbsoluteIfRequired(elem.id, elem.id);
        const elemName = this._maskingService.maskAbsoluteIfRequired(elem.name, elem.id);
        // we are using getAttribute and not class since it is working also on none HTML elements such as SVG.
        // Without it in SVG it returns an object
        const elemClass = this._collectClassName ? ((elem.getAttribute && this._verifyNoPrivateData(elem.getAttribute('class'))) || '') : '';
        const elemTitle = this._collectTitle ? (this._verifyNoPrivateData(elem.title) || '') : ''; // title is the tooltip
        const elemTagName = this._verifyNoPrivateData(elem.nodeName) || '';
        let elemHref = this._collectHref ? (this._verifyNoPrivateData(elem.href) || '') : '';// href returns undefined when not exist
        if (elemHref.length > 0) {
            elemHref = this._utils.clearTextFromNumbers(elemHref);
        }

        const elemCustomElementAttribute = this._collectCustomElementAttribute ? ((elem.getAttribute && this._verifyNoPrivateData(elem.getAttribute(this._customElementAttribute))) || '') : '';

        //we also check if there are customAttributes that need to be masked by checking its name against the masking list
         const maskedElemCustomElementAttribute = this._maskingService.maskAbsoluteIfRequired(elemCustomElementAttribute, elem.id);

        let selectValues = '';
        if (elem.nodeName === 'SELECT') {
            selectValues = this._utils.getDropDownListValues(elem, this._maskingService).join(';');
        }

        // element value should be taken first because that's whats important
        // when the field is loaded if already contains data,
        // other fields not input are less important
        let elemValue = elem.value || elem.textContent || elem.innerHTML || '';
        let unmaskedString = '';
        if (this._enableUnmaskedValues && Array.isArray(this._allowedUnmaskedValuesList) && this._allowedUnmaskedValuesList.length > 0) {
            this._allowedUnmaskedValuesList.forEach((listValue) => {
                if (typeof listValue !== 'string') {
                    Log.error(`Unsupported allowedUnmaksedValuesList value was provided: ${listValue.toString()}`);
                }
                else if (listValue.toLowerCase() === elemValue.trim().toLowerCase()) {
                    unmaskedString = listValue;
                }
            });
        }

        if (elemValue.length > this._maxElemValLength) {
            // This is probably the innerHTML of some DIV / FORM / other element that was
            // clicked in the screen and has no meaning (empty area) and we do not want to collect this data
            elemValue = '';
        } else {
            elemValue = this._maskingService.maskText(elemValue, elem.id);
        }

        const checked = this._utils.isUndefinedNull(elem.checked) ? -1 : (elem.checked ? 1 : 0);
        const time = this.getEventTimestamp();
        const elementHierarchyAndIndex = this.enableElementHierarchy ? ElementStrengthenInstance.getUniqueElementId(elem, this._uniqueIDConfiguration) : '';
        const category = this._enableElementCategory ? this._categoryService.categoryField(elem) : '';
        this._dataQueue.addToQueue(
            'elements',
            [
                this._contextMgr.contextHash,
                hash,
                elemTagName || '',
                elemId || '',
                elemName || '',
                elem.type || '',
                left || 0,
                top || 0,
                width || 0,
                height || 0,
                elemClass || '',
                elemHref || '',
                elemTitle || '',
                elem.alt || '', // elements that have no support in alt will return undefined
                selectValues || '',
                elemValue || '',
                checked,
                time,
                maskedElemCustomElementAttribute || elemCustomElementAttribute,
                unmaskedString,
                elementHierarchyAndIndex,
                category
            ],
            false
        );

        Log.isDebug() && Log.debug('adding element id:' + elemId + ', name:' + elemName + ', type:' + elem.type
            + ', width:' + width + ', height:' + height + ', left:' + left
            + ', top:' + top + ', hash: ' + hash);
    }

    _verifyNoPrivateData(data) {
        if (/\d\d\d/.test(data)) {
            return this._utils.clearTextFromNumbers(data);
        }
        return data;
    }
    updateFeatureConfig() {
        this._collectPosition = typeof this._configurationRepository.get('isElementsPosition') === 'boolean'
            ? this._configurationRepository.get('isElementsPosition') : this._collectPosition;
        this._collectClassName = typeof this._configurationRepository.get('isElementsClassName') === 'boolean'
            ? this._configurationRepository.get('isElementsClassName') : this._collectClassName;
        this._collectTitle = typeof this._configurationRepository.get('isElementsTitle') === 'boolean'
            ? this._configurationRepository.get('isElementsTitle') : this._collectTitle;
        this._collectHref = typeof this._configurationRepository.get('isElementsHref') === 'boolean'
            ? this._configurationRepository.get('isElementsHref') : this._collectHref;
        this._collectCustomElementAttribute = typeof this._configurationRepository.get(ConfigurationFields.collectCustomElementAttribute) === 'boolean'
            ? this._configurationRepository.get(ConfigurationFields.collectCustomElementAttribute) : this._collectCustomElementAttribute;
        this._customElementAttribute = typeof this._configurationRepository.get(ConfigurationFields.customElementAttribute) === 'string'
            ? this._configurationRepository.get(ConfigurationFields.customElementAttribute) : this._customElementAttribute;
        this._maxElemValLength = this._configurationRepository.get('maxElValLen')
            ? this._configurationRepository.get('maxElValLen') : this._maxElemValLength;
        this._allowedUnmaskedValuesList = this._configurationRepository.get('allowedUnmaskedValuesList')
            ? this._configurationRepository.get('allowedUnmaskedValuesList') : this._allowedUnmaskedValuesList;
        this._enableUnmaskedValues = this._configurationRepository.get('enableUnmaskedValues')
            ? this._configurationRepository.get('enableUnmaskedValues') : this._enableUnmaskedValues;
        this._enableElementHierarchy = typeof this._configurationRepository.get(ConfigurationFields.enableElementHierarchy) === 'boolean'
            ? this._configurationRepository.get(ConfigurationFields.enableElementHierarchy) : this._enableElementHierarchy;
            this._enableElementCategory = typeof this._configurationRepository.get(ConfigurationFields.enableElementCategory) === 'boolean'
            ? this._configurationRepository.get(ConfigurationFields.enableElementCategory) : this._enableElementCategory;
        this._uniqueIDConfiguration = typeof this._configurationRepository.get(ConfigurationFields.elementUniqueIDConfiguration) === 'string'
            ? UniqueIDConfiguration.parse(this._configurationRepository.get(ConfigurationFields.elementUniqueIDConfiguration)): this._uniqueIDConfiguration;
    }
}
