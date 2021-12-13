import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteCommonjs } from '@originjs/vite-plugin-commonjs';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    target: 'es2020',
  },
  resolve: {
    alias: {
      stream: 'stream-browserify',
    }
  },
  define: {
    'process.env': {},
  },
  plugins: [react(), viteCommonjs()],
});
