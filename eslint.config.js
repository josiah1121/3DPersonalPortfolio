// eslint.config.js
import globals from "globals";

export default [
    {
        languageOptions: {
            // This adds 'window', 'document', and other browser globals
            globals: {
                ...globals.browser
            }
        },
        rules: {
            "no-unused-vars": "warn",
            "no-undef": "error",
            "semi": ["error", "always"]
        }
    }
];