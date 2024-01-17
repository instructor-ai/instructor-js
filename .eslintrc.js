module.exports = {
  $schema: "https://json.schemastore.org/eslintrc",
  root: true,
  parserOptions: {
    project: true,
    tsconfigRootDir: __dirname
  },
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "prettier"],
  extends: ["plugin:@typescript-eslint/recommended", "plugin:prettier/recommended"],
  rules: {
    "prettier/prettier": "error",
    "linebreak-style": "off",
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
  ignorePatterns: ["node_modules/", "dist/", "coverage/", "docs/", ".eslintrc.js", "package.json", "tsconfig.json"]
}
