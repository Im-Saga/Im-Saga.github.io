import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // This repository is the Im-Saga.github.io user site, which GitHub Pages serves at the domain root.
  base: '/',
  plugins: [react()],
});
