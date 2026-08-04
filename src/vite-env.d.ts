/// <reference types="vite/client" />

// Vite's ambient client types. Without this, `import "./styles/index.css"` in
// main.tsx has no module declaration and fails to typecheck even though Vite
// resolves it at build time. Also covers asset imports (svg/csv, per
// `assetsInclude` in vite.config.ts) and `import.meta.env`.
