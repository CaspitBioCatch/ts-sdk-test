import Log from '../technicalServices/log/Logger';
class ElementStrengthen {
    constructor() {
        this._weights = { input: 5, fieldset: 4, form: 3, textarea: 3, label: 2 };
        this._interactiveElementsTag = ['input', 'fieldset', 'textarea', 'label'];
        this._classlist = ['container', 'wrapper', 'section', 'content', 'main-content', 'main_content'];
        this._containerTagName = ['main', 'article', 'aside', 'div'];
    }

    isElementVisible(el) {
        if (!(el instanceof HTMLElement)) return false;
        if (el.hasAttribute('hidden')) return false;

        const style = window.getComputedStyle(el);
        if (
            style.display === 'none' ||
            style.visibility === 'hidden' ||
            parseFloat(style.opacity) === 0
        ) {
            return false;
        }

        // if it has no offset size AND no client rects, it's not visible
        const hasSize = el.offsetWidth > 0 || el.offsetHeight > 0;
        const hasClientRect = el.getClientRects().length > 0;
        if (!hasSize && !hasClientRect) {
            return false;
        }

        // ensure none of its ancestors hide it
        let parent = el.parentElement;
        while (parent) {
            const pStyle = window.getComputedStyle(parent);
            if (
                pStyle.display === 'none' ||
                pStyle.visibility === 'hidden' ||
                parent.hasAttribute('hidden')
            ) {
                return false;
            }
            parent = parent.parentElement;
        }

        return true;
    }

    isInExcludedArea(element) {
        let currentElement = element;

        while (currentElement) {
            if (currentElement.tagName) {
                const tagName = currentElement.tagName.toLowerCase();

                if (tagName === 'footer' || tagName === 'header' || tagName === 'nav') {
                    return true;
                }
            }

            currentElement = currentElement.parentElement;
        }

        return false;
    }

    isContainer(element) {
        const tagName = element.tagName.toLowerCase();
        const classList = element.className.split(' ');
        const ariaLabel = element.getAttribute('aria-label') ? `_${element.getAttribute('aria-label')}` : '';
        const dataAttributes = Array.from(element.attributes)
            .filter((attr) => {
                return attr.name.startsWith('data-');
            })
            .map((attr) => {
                return `_${attr.name}`;
            });

        if (this._containerTagName.includes(tagName)) {
            return true;
        }

        return (
            classList.some((cls) => {
                return this._classlist.includes(cls);
            }) ||
            (element.hasAttribute('role') && element.getAttribute('role') === 'region') ||
            ariaLabel.length > 0 ||
            dataAttributes.length > 0
        );
    }

    isCustomElement(element) {
        if (typeof element.localName === 'string') {
            return element.localName.indexOf('-') > 0;
        }
        return false;
    }

    calculateScore(element) {
        const weights = this._weights;
        let bonus = 0;
        if (element.id && element.id.includes('username')) {
            bonus = 20;
        } else if (element.name && element.name.includes('username')) {
            bonus = 10;
        }
        return weights[element.tagName.toLowerCase()] + bonus + (element.type === 'text' ? 10 : 0);
    }

    findInteractiveArea(document) {
        const interactiveElements = document.querySelectorAll(this._interactiveElementsTag);
        const areas = {};
        interactiveElements.forEach((element) => {
            if (!this.isElementVisible(element) || this.isInExcludedArea(element)) return;

            const parent = element.parentElement;
            const parentKey = `${parent.tagName}.${parent.className?.split(' ')[0] || ''}`;

            if (!areas[parentKey]) {
                areas[parentKey] = { score: 0, parent, types: new Set() };
            }

            areas[parentKey].types.add(element.tagName.toLowerCase());
            areas[parentKey].score += this.calculateScore(element);
            areas[parentKey].score += element.id?.includes('maincontent') ? 20 : 0;
            areas[parentKey].score -= element.disabled ? 20 : 0;
        });

        const maxArea = Object.values(areas).reduce(
            (max, area) => {
                return area.score + area.types.size * 2 > max.score ? area : max;
            },
            { score: 0 }
        );
        return maxArea.parent;
    }

    findPotentialContainer(interactiveArea) {
        let currentElement = interactiveArea;
        let potentialContainer = null;

        while (currentElement && currentElement.tagName.toLowerCase() !== 'body') {
            if (this.isContainer(currentElement)) {
                potentialContainer = currentElement;
                const tagName = currentElement?.tagName?.toLowerCase();
                const classList = currentElement.className.split(' ');

                if (tagName === 'div' && (classList.includes('containerWrapper') || classList.includes('container'))) {
                    return currentElement;
                }

                if (this._containerTagName.includes(tagName) && tagName !== 'div') {
                    return currentElement;
                }
            }
            currentElement = currentElement.parentElement;
        }
        return potentialContainer;
    }

    interactiveContainer() {
        const interactiveArea = this.findInteractiveArea(document);
        if (interactiveArea) {
            const container = this.findPotentialContainer(interactiveArea);
            if (container) {
                return container;
            }
        } else {
            return Log.info(`No significant interactive area.`);
        }
    }

    getUniqueElementId(element, uniqueIDConfiguration, numToLimit = 30) {
        if (!element || !uniqueIDConfiguration) return '';

        const { componentsFormat, hierarchyFormat } = uniqueIDConfiguration;

        if (!uniqueIDConfiguration.isTagEnabled(element.tagName)) {
            return '-1';
        }

        const interactiveArea = this.findInteractiveArea(document);
        const potentialContainer = interactiveArea ? this.findPotentialContainer(interactiveArea) : null;
        const containerInfo = potentialContainer ? `${potentialContainer.tagName.toLowerCase()}_${potentialContainer.className || ''}` : '';
        const hierarchyPath = this._buildFullHierarchyPath(element, hierarchyFormat, numToLimit);

        const valuesMap = {
            "{tagName}": element.tagName.toLowerCase(),
            "{index}": `[${this._getSiblingIndex(element)}]`,
            "{id}": element.id || '',
            "{className}": element.className || '',
            "{ariaLabel}": element.getAttribute('aria-label') || '',
            "{hierarchyPath}": hierarchyPath,
            "{containerInfo}": containerInfo
        };

        let uniqueID = componentsFormat;

        // Replace placeholders in the components format
        for (const [key, value] of Object.entries(valuesMap)) {
            uniqueID = uniqueID.replace(key, value);
        }

        uniqueID = uniqueID
            // strip any “{…}” placeholders
            .replace(/\{[^}]+\}/g, '')
            // collapse runs of “_” or “:” into a single “_”
            .replace(/[_:]+/g, '_')
            // trim any leading OR trailing underscore (grouped alternation)
            .replace(/(^_|_$)/g, '');

        return uniqueID;
    }

    _getSiblingIndex(element) {
        return String(Array.from(element.parentNode?.children || []).indexOf(element));
    }

    _buildFullHierarchyPath(element, hierarchyFormat, numToLimit) {
        const pathComponents = [];
        let currentElement = element.parentNode; // Start from parentNode
        let depth = 0;

        while (currentElement && currentElement.tagName?.toLowerCase() !== 'body' && depth < numToLimit) {
            const tagName = currentElement.tagName?.toLowerCase();
            const index = this._getSiblingIndex(currentElement);

            // Replace placeholders in the hierarchy format
            let hierarchy = hierarchyFormat
                .replace("{tagName}", tagName ? tagName : '')
                .replace("{index}", index >= 0 ? `[${index}]` : '');

            // Add additional attributes for uniqueness
            const attributes = [];
            if (currentElement.id) attributes.push(currentElement.id);
            if (currentElement.name) attributes.push(currentElement.name);
            if (currentElement.className) attributes.push(currentElement.className);

            if (attributes.length > 0) {
                hierarchy += `${attributes.join('')}`;
            }

            pathComponents.unshift(hierarchy);
            currentElement = currentElement.parentNode instanceof ShadowRoot ? currentElement.parentNode.host : currentElement.parentElement;
            depth++;
        }
        return pathComponents.join('');
    }

    getUniqueElementXpath(element, numToLimit = Infinity) {
        if (!element) return '';

        let path = [];
        let depth = 0;

        // Loop instead of recursion for better performance
        while (element && depth < numToLimit) {
            let tagName = element.tagName ? element.tagName.toLowerCase() : element.nodeName.toLowerCase();

            // If the element has an ID, use it, otherwise calculate sibling index
            if (element.id) {
                path.unshift(`${tagName}#${element.id}`);
            } else {
                let siblingIndex = 1;
                let sibling = element;

                // Find the position of this element among its siblings
                while (sibling.previousElementSibling) {
                    sibling = sibling.previousElementSibling;
                    siblingIndex++;
                }

                path.unshift(`${tagName}:${siblingIndex}`);
            }

            // Traverse through the shadow DOM host if the element is in a shadow root
            if (element.assignedSlot) {
                element = element.assignedSlot;
            } else if (element.parentNode instanceof ShadowRoot) {
                element = element.parentNode.host;
            } else {
                element = element.parentElement;
            }

            depth++;
        }

        return path.join('/');
    }
}

const ElementStrengthenInstance = Object.freeze(new ElementStrengthen());
export { ElementStrengthenInstance, ElementStrengthen };