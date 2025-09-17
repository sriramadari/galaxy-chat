// eslint.config.js
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import nextPlugin from "@next/eslint-plugin-next";
import prettier from "eslint-config-prettier";

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      ...nextPlugin.configs["core-web-vitals"].rules,
    },
  },
  prettier,
  {
    rules: {
      "no-unused-vars": "warn",
      semi: ["error", "always"],
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];
