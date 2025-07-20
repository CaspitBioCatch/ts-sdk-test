/**
 * CategoryService
 *
 * This class is used to semantically categorize HTML form fields (like inputs)
 * based on their attribute values and associated <label> text, using configurable
 * keyword-to-category mapping rules.
 *
 * Purpose:
 * - Automatically assign a "category" (like Email, Password, SSN, etc.) to a form field.
 * - Useful for ds.
 *
 * Uses two configuration JSONs:
 *
 * 1. `elementAttributes.json`:
 *    - Specifies which HTML attributes to extract and analyze from input elements.
 *    - Structure:
 *      {
 *        "attributes": [
 *          "name", "id", "placeholder", "aria-label", "title", ...
 *        ]
 *      }
 *    - These attributes are scanned for keywords.
 *
 * 2. `elementCategories.json`:
 *    - Maps known keywords/phrases to numeric category IDs.
 *    - Structure:
 *      {
 *        "email": 18,
 *        "password": 7,
 *        "social security number": 10,
 *        "change address": 3,
 *        ...
 *      }
 *    - Keywords can be in multiple languages and formats.
 *    - The number is a category ID that your system defines meaning for (e.g., 7 = password).
 *
 * How it works:
 * - The constructor loads category rules and attribute names (custom or default).
 * - The `categoryField()` method:
 *    1. Collects all configured attribute values and associated label text.
 *    2. Splits all strings into words.
 *    3. Matches each word against the category map.
 *    4. Counts matches per category.
 *    5. Returns the most frequently matched category ID (or "0" if nothing matches).
 *
 * Configurable:
 * - You can pass custom `elementCategories` and `elementAttributes` as objects.
 * - If omitted or invalid, it falls back to the local JSON files.
 *
 * Safe and Efficient:
 * - Ignores hidden inputs.
 * - Gracefully handles missing or empty configs.
 * - Uses Map for fast lookups.
 *
 * Example Use Case:
 * Categorize a field like:
 *   <input placeholder="Enter your email" />
 * It would return "18" if "email" is mapped to category 18.
 */

export default class CategoryService {

    constructor(elementCategories = null, elementAttributes = null) {
        const defaultElementCategories = require("./elementCategories.json");
        const defaultElementAttributes = require("./elementAttributes.json");

        const categories = (elementCategories && Object.keys(elementCategories).length)
            ? elementCategories
            : defaultElementCategories;

        const hasValidAttributes = elementAttributes?.attributes?.length > 0;
        const attributes = hasValidAttributes ? elementAttributes : defaultElementAttributes;

        this.CATEGORY_RULES = new Map(Object.entries(categories));
        this.ATTRIBUTE_NAMES = attributes;
    }

    /**
     * Identifies the category of an input element based on attributes and value patterns.
     * @param {HTMLElement} element - The input element to categorize.
     * @returns {string} - The determined category.
     */
    categoryField(element) {
        if (!(element instanceof HTMLElement) || element.type === "hidden") return "0";

        const attrs = this.ATTRIBUTE_NAMES.attributes
            .map(attr => element.getAttribute(attr)?.toLowerCase())
            .filter(Boolean);

        const label = document.querySelector(`label[for="${element.id}"]`)?.innerText?.toLowerCase();
        if (label) attrs.push(label);

        const categoryCount = new Map();

        attrs.flatMap(attr => attr.split(/\s+/)).forEach(word => {
            const category = this.CATEGORY_RULES.get(word);
            if (category) {
                categoryCount.set(category, (categoryCount.get(category) || 0) + 1);
            }
        });

        if (!categoryCount.size) return "0";

        return [...categoryCount.entries()].reduce(
            (max, entry) => (entry[1] > max[1] ? entry : max),
            ["0", 0]
        )[0]?.toString();
    }

}
