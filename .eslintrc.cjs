/** @type {import("eslint").Linter.Config} */

module.exports = {
  $schema: "https://json.schemastore.org/eslintrc",
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "prettier"],
  extends: [
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended"
  ],
  rules: {
    "import/no-anonymous-default-export": "off",
    "prettier/prettier": "error",
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
  overrides: [
    {
      extends: ["plugin:@typescript-eslint/disable-type-checked"],
      files: ["./**/*.mjs", "*.js"]
    }
  ],
  ignorePatterns: [
    "node_modules/",
    "dist/",
    "coverage/",
    "docs/",
    ".eslintrc.cjs",
    "package.json",
    "tsconfig.json"
  ]
}