import { defineConfig } from 'vite';

export default defineConfig({
  base: '/bgrem/',
  build: {
    outDir: 'dist/bgrem',
    rollupOptions: {
      output: {
        manualChunks: {
          ort: ['@huggingface/transformers'],
        },
        assetFileNames: (info) => {
          if (info.name?.endsWith('.wasm')) {
            return 'assets/[name][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
  },
  optimizeDeps: {
    exclude: ['@huggingface/transformers'],
  },
});
