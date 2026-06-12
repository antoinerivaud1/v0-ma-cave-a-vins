import nextVitals from "eslint-config-next/core-web-vitals"

const eslintConfig = [
  ...nextVitals,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    rules: {
      "react/no-unescaped-entities": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "quotes": ["error", "double", { "avoidEscape": true, "allowTemplateLiterals": false }],
    },
  },
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "docs/**",
    ],
  },
]

export default eslintConfig
