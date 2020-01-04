module.exports = {
    "parser": "@typescript-eslint/parser",
    "env": {
        "browser": true,
        "commonjs": true,
        "es6": true,
        "jest": true
    },
    "globals": {
        "__DEV__": false,
        "__TEST__": false,
        "__PROD__": false,
        "__COVERAGE__": false,
        "__dirname": false,
        "Buffer": true,
        "process": true
  },
	extends: ["airbnb"],
    "parserOptions": {
        "ecmaFeatures": {
            "experimentalObjectRestSpread": true,
            "jsx": true
        },
        "ecmaVersion": 8,
        "sourceType": "module"
    },
    "plugins": [ "react" ],
    "rules": {
        "no-console":  "off",
        "no-unused-vars": "warn",
        "no-unreachable": "warn",
        "no-case-declarations": "warn",
        "key-spacing": "warn",
        "jsx-quotes": [ 2, "prefer-single" ],
		"object-curly-spacing": [ "warn", "always" ],
        "comma-dangle": "off",
        "no-mixed-spaces-and-tabs": "off",
        "eqeqeq": "warn",
        "block-scoped-var": "error",
        "import/extensions": [ // import ts files
            "error",
            "ignorePackages",
            {
              "js": "never",
              "jsx": "never",
              "ts": "never",
              "tsx": "never"
            }
         ]
    },
    "settings": {
        "import/resolver": {
          "node": {
            "extensions": [".js", ".jsx", ".ts", ".tsx"]
          }
        }
      },
};