module.exports = {
  $schema: "https://json.schemastore.org/eslintrc",
  root: true,
  parserOptions: {
    project: true,
    tsconfigRootDir: __dirname
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier",
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    "linebreak-style": "off",
    "no-prototype-builtins": "off",
    "semi": "off",
    "indent": "off",
    "@typescript-eslint/semi": "off",
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": [
      "warn",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_"
      }
    ]
  },
  ignorePatterns: [
    "node_modules/",
    "dist/",
    "coverage/",
    "docs/",
    ".eslintrc.js",
    "package.json",
    "tsconfig.json"
  ]
}
