module.exports = {
  root: true,
  env: {
    browser: true,
    es2023: true,
    node: true
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module"
  },
  plugins: ["@typescript-eslint", "react-refresh"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended", "prettier"],
  rules: {
    "react-refresh/only-export-components": [
      "warn",
      {
        allowConstantExport: true
      }
    ]
  ],
  ignorePatterns: ["dist", "node_modules"]
};

