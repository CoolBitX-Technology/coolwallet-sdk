module.exports = {
    "parser": "@typescript-eslint/parser",
    "env": {
        "browser": true,
        "commonjs": true,
        "es6": true,
        "jest": true
    },
    "globals": {
        "Buffer": true,
    },    
    "parserOptions": {
        "ecmaFeatures": {
            "experimentalObjectRestSpread": true,
            "jsx": true
        },
        "ecmaVersion": 8,
        "sourceType": "module"
    },
    "plugins": [
        "react"
    ],
    "rules": {
        "no-console":  "warn",
        "no-unused-vars": "warn",
        "no-extra-boolean-cast": "off",
        "no-unreachable": "warn",
        "no-case-declarations": "warn",
        "key-spacing": "warn",
        "jsx-quotes": [ 2, "prefer-single" ],
        "max-len": [ "error", { "code": 130,"ignoreUrls": true, "ignoreStrings": true, "ignoreTrailingComments": true } ],
		"object-curly-spacing": [ "warn", "always" ],
        "comma-dangle": "warn",
        "no-mixed-spaces-and-tabs": "off",
        "eqeqeq": "warn",
        "block-scoped-var": "error"
    }
};
