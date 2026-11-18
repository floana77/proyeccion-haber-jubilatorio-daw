// @ts-check
const eslint = require("@eslint/js");
const { defineConfig } = require("eslint/config");
const tseslint = require("typescript-eslint");
const angular = require("angular-eslint");

module.exports = defineConfig([
  {
    files: ["**/*.ts"],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      "@angular-eslint/directive-selector": [
        "error",
        {
          type: "attribute",
          prefix: "app",
          style: "camelCase",
        },
      ],
      "@angular-eslint/component-selector": [
        "error",
        {
          type: "element",
          prefix: "app",
          style: "kebab-case",
        },
      ],
    },
  },
  {
    files: ["src/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/en-memoria", "**/en-memoria/**"],
              message: "El gateway en memoria solo se importa desde environment.ts, environment.qa.ts y los *.spec.ts (ADR-001).",
            },
          ],
        },
      ],
    },
  },
  {
    // Únicos lugares donde se puede importar en-memoria/ (ADR-001, ADR-004).
    files: [
      "src/environments/environment.ts",
      "src/environments/environment.qa.ts",
      "src/**/*.spec.ts",
      "src/app/proyeccion/data/en-memoria/**",
    ],
    rules: {
      "no-restricted-imports": "off",
    },
  },
  {
    files: ["**/*.html"],
    extends: [angular.configs.templateRecommended],
  },
]);
