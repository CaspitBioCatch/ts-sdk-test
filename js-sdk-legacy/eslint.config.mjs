/**
 * ESLint Configuration File
 *
 * This configuration is designed to lint JavaScript files with modern standards
 * and also includes the basic setup for ES6+ syntax and commonly used globals.
 */

export default [
    {
        files: ['src/**/*.js', 'tests/**/*.js'],  // Lint all JavaScript files in src and tests folders
        ignores: [
          "**/DefaultCustomerApi.js",
            "**/HeartBeatSample.js",
            "src/worker/libs/**"],
        languageOptions: {
            ecmaVersion: 'latest',  // Enable the latest ECMAScript features
            sourceType: 'module',  // Support ES6 module syntax
            globals: {
                // Add global variables and APIs you might use
                AudioWorkletGlobalScope: 'readonly',  // Example global
                window: 'readonly',
                document: 'readonly',
            }
        },
        rules: {
            "import/no-named-as-default": "off",
            "import/prefer-default-export": "off",
            "import/no-duplicates": "off",
            indent: "off",
            "no-tabs": "off",
            "no-nested-ternary": "off",
            "class-methods-use-this": "off",
            "no-underscore-dangle": "off",
            "no-prototype-builtins": "off",

            "max-len": ["error", {
                code: 200,
            }],

            "getter-return": "off",
            "no-unused-expressions": "off",
            "consistent-return": "off",
            "no-param-reassign": "off",
            "no-plusplus": "off",
            "no-undef": "off",
            "no-restricted-globals": "off",
            "array-callback-return": "off",
            "no-useless-escape": "off",
            "func-names": "off",
            "prefer-template": "off",
            "func-style": "off",
            "prefer-spread": "off",
            "prefer-arrow-callback": "off",
            "quote-props": "off",
            "linebreak-style": "off",
            "no-continue": "off",
            radix: "off",
            "prefer-destructuring": "off",
            "no-loss-of-precision": "off",
        },
    }
];
