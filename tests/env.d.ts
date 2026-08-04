/// <reference types="vite/client" />

// Vite's client types, for the test suites only. They provide `import.meta.glob`
// and the `?raw` module declarations, which is how the invariant layer reads
// committed content/*.json and the CMS collection config WITHOUT node:fs — the
// root tsconfig.json deliberately omits @types/node (see the note there).
//
// A triple-slash reference is used rather than a "types" entry in tsconfig.json
// so it stays scoped to tests/ and does not narrow global type inclusion for src/.
