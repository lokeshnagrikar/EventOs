import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

const eslintConfig = [
  ...compat.config({
    extends: ["next/core-web-vitals"],
  }),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "react/no-unescaped-entities": "warn",
      "react-hooks/rules-of-hooks": "warn",
      "@typescript-eslint/no-unused-vars": "warn"
    }
  }
];

export default eslintConfig;
