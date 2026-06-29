import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

const eslintConfig = [
  {
    ignores: [".next/**", "node_modules/**", "out/**", "build/**"]
  },
  ...compat.config({
    extends: ["next/core-web-vitals"],
  }),
  {
    rules: {
      "react/no-unescaped-entities": "warn",
      "react-hooks/rules-of-hooks": "warn",
      "@next/next/no-html-link-for-pages": "warn"
    }
  }
];

export default eslintConfig;
