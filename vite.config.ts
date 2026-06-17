import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  // NOTE: the original spec suggested `assetsInclude: ['**/*.json']`, but that
  // tells Vite to treat .json as a static asset (URL), which breaks importing
  // levels.json as a data module. Vite already handles JSON imports natively
  // via resolveJsonModule, so we leave it out and import the config directly.
  build: {
    target: 'es2020',
    outDir: 'dist',
    base: "/calm-down-the-teacher/"
  },
});
