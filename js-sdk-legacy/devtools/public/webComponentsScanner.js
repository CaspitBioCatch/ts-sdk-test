/**
 * Web Components Scanner
 * 
 * A utility script that scans the DOM for web components and shadow DOM elements.
 * It traverses the entire document tree, including nested shadow DOMs, to find
 * all custom elements and their shadow roots.
 * 
 * Usage:
 * 1. Include this script in your page
 * 2. Call WebComponentsScanner.scan() to get a report of all web components
 * 
 * @example
 * <script src="webComponentsScanner.js"></script>
 * <script>
 *   // Scan and log all web components
 *   const results = WebComponentsScanner.scan();
 *   console.log(results);
 * 
 *   // Or use the helper method to scan and log to console
 *   WebComponentsScanner.scanAndLog();
 * 
 *   // Export results to JSON file
 *   WebComponentsScanner.exportResults(results, 'my-web-components.json');
 * </script>
 * 
 * The results object includes:
 * - components: Array of all custom elements found
 * - shadowRoots: Array of all shadow roots (both open and closed when possible)
 * - stats: Statistics about the scan (component count, max depth, etc.)
 */
(function(window) {
    'use strict';

    /**
     * Main scanner class for discovering web components in the DOM
     */
    class WebComponentsScanner {
        constructor() {
            // Cache to prevent re-processing elements
            this.processedElements = new WeakSet();
            // Track component statistics
            this.stats = {
                totalComponents: 0,
                maxDepth: 0,
                openShadowRoots: 0,
                closedShadowRoots: 0
            };
            this.results = {
                components: [],
                shadowRoots: [],
                stats: this.stats
            };
        }

        /**
         * Check if an element is a custom element (has a dash in its name)
         * @param {Element} element - DOM element to check
         * @return {boolean} True if element is a custom element
         */
        isCustomElement(element) {
            if (!element || typeof element.localName !== 'string') {
                return false;
            }
            return element.localName.includes('-');
        }

        /**
         * Generate a path string for the element
         * @param {Element} element - DOM element to generate path for
         * @return {string} Path string representing the element's position in DOM
         */
        getElementPath(element) {
            if (!element) return '';
            
            const path = [];
            let currentElement = element;
            let depth = 0;
            const maxPathDepth = 10; // Limit path depth to avoid excessive paths
            
            while (currentElement && depth < maxPathDepth) {
                let tagName = currentElement.tagName ? 
                    currentElement.tagName.toLowerCase() : 
                    currentElement.nodeName.toLowerCase();
                
                // Add id if available for better identification
                if (currentElement.id) {
                    path.unshift(`${tagName}#${currentElement.id}`);
                } else {
                    // Calculate position among siblings
                    let position = 1;
                    let sibling = currentElement;
                    
                    while (sibling.previousElementSibling) {
                        sibling = sibling.previousElementSibling;
                        position++;
                    }
                    
                    path.unshift(`${tagName}:nth-child(${position})`);
                }
                
                // Handle shadow DOM boundaries
                if (currentElement.assignedSlot) {
                    currentElement = currentElement.assignedSlot;
                } else if (currentElement.parentNode instanceof ShadowRoot) {
                    // Cross shadow boundary and continue with the host
                    path.unshift('>>> shadow-root');
                    currentElement = currentElement.parentNode.host;
                } else {
                    currentElement = currentElement.parentElement;
                }
                
                depth++;
            }
            
            return path.join(' > ');
        }

        /**
         * Extract useful information about an element
         * @param {Element} element - DOM element to extract info from
         * @param {number} depth - Current depth in the component tree
         * @return {Object} Object containing element information
         */
        getElementInfo(element, depth) {
            const info = {
                tagName: element.tagName.toLowerCase(),
                path: this.getElementPath(element),
                depth: depth,
                hasShadowRoot: !!element.shadowRoot,
                shadowRootMode: element.shadowRoot ? 'open' : 'closed'
            };
            
            // Add attributes if there are any
            if (element.attributes.length > 0) {
                info.attributes = {};
                for (let i = 0; i < element.attributes.length; i++) {
                    const attr = element.attributes[i];
                    info.attributes[attr.name] = attr.value;
                }
            }
            
            // Check for slot elements
            if (element.shadowRoot) {
                const slots = element.shadowRoot.querySelectorAll('slot');
                if (slots.length > 0) {
                    info.slots = [];
                    for (let i = 0; i < slots.length; i++) {
                        const slot = slots[i];
                        const slotName = slot.getAttribute('name') || 'default';
                        const assignedNodes = slot.assignedNodes ? slot.assignedNodes() : [];
                        
                        info.slots.push({
                            name: slotName,
                            nodeCount: assignedNodes.length
                        });
                    }
                }
            }
            
            return info;
        }

        /**
         * Scan document or shadow root for custom elements and shadow DOM
         * @param {Document|ShadowRoot} root - Root element to start scanning from
         * @param {number} depth - Current depth in the tree
         */
        async scanForComponents(root, depth = 0) {
            if (!root || !root.querySelectorAll) return;
            
            // Update max depth statistic
            this.stats.maxDepth = Math.max(this.stats.maxDepth, depth);
            
            // Get all elements in this root
            const allElements = root.querySelectorAll('*');
            
            // Track promises for processing shadow DOM
            const shadowPromises = [];
            
            // Process each element
            for (let i = 0; i < allElements.length; i++) {
                const element = allElements[i];
                
                // Skip if already processed
                if (this.processedElements.has(element)) continue;
                this.processedElements.add(element);
                
                // Track custom elements
                if (this.isCustomElement(element)) {
                    this.stats.totalComponents++;
                    this.results.components.push(this.getElementInfo(element, depth));
                }
                
                // Track and process shadow roots
                if (element.shadowRoot) {
                    this.stats.openShadowRoots++;
                    this.results.shadowRoots.push({
                        hostElement: this.getElementInfo(element, depth),
                        mode: 'open'
                    });
                    
                    // Process the shadow DOM tree if maxDepth not reached
                    if (depth < 10) {
                        const promise = this.scanForComponents(element.shadowRoot, depth + 1);
                        shadowPromises.push(promise);
                    }
                } else if (this.isCustomElement(element)) {
                    // Possible closed shadow root - we can't access it directly
                    this.stats.closedShadowRoots++;
                    this.results.shadowRoots.push({
                        hostElement: this.getElementInfo(element, depth),
                        mode: 'closed'
                    });
                }
            }
            
            // Wait for all shadow DOM processing to complete
            await Promise.all(shadowPromises);
        }

        /**
         * Scan the entire document for web components
         * @return {Object} Results of the scan
         */
        async performScan() {
            // Reset results
            this.processedElements = new WeakSet();
            this.stats = {
                totalComponents: 0,
                maxDepth: 0,
                openShadowRoots: 0,
                closedShadowRoots: 0
            };
            this.results = {
                components: [],
                shadowRoots: [],
                stats: this.stats,
                timestamp: new Date().toISOString()
            };
            
            // Start the scan from the document root
            await this.scanForComponents(document);
            
            return this.results;
        }
    }

    /**
     * Global scanner interface
     */
    window.WebComponentsScanner = {
        /**
         * Scan the document for web components and return results
         * @return {Promise<Object>} Promise that resolves to scan results
         */
        scan: async function() {
            const scanner = new WebComponentsScanner();
            return await scanner.performScan();
        },
        
        /**
         * Scan the document and output results to the console
         * @return {Promise<Object>} Promise that resolves to scan results
         */
        scanAndLog: async function() {
            const results = await this.scan();
            console.group('Web Components Scanner Results');
            console.log('Components found:', results.stats.totalComponents);
            console.log('Maximum depth:', results.stats.maxDepth);
            console.log('Shadow roots (open):', results.stats.openShadowRoots);
            console.log('Shadow roots (closed):', results.stats.closedShadowRoots);
            console.log('Full results:', results);
            console.groupEnd();
            return results;
        },
        
        /**
         * Export scan results to a JSON file
         * @param {Object} results - Scanner results to export
         * @param {string} [filename] - Optional filename for the export
         */
        exportResults: function(results, filename) {
            if (!results) {
                console.error('No results to export');
                return;
            }
            
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(results, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", filename || "web-components-scan-" + new Date().toISOString() + ".json");
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        }
    };

})(window);