import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteCommonjs } from '@originjs/vite-plugin-commonjs';
import optionalDeps from './plugins/optional-deps';
import enabledPackages from './coin.config.json';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    target: 'es2020',
  },
  resolve: {
    preserveSymlinks: true,
    alias: {
      https: require.resolve('agent-base'),
      process: require.resolve('process/browser'),
      path: "path-browserify",
      'safer-buffer': require.resolve('safe-buffer')
    },
  },
  plugins: [optionalDeps({ enabledPackages }), react(), viteCommonjs({ skipPreBuild: true })],
});
