import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    cssCodeSplit: true,
    reportCompressedSize: true,
    chunkSizeWarningLimit: 500,
    assetsInlineLimit: 4096,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('tslib')) return 'vendors';
          }
          if (id.includes('src/main.js') || id.includes('src/App.vue')) return 'core';
          if (id.includes('src/components/ui')) return 'ui';
          if (id.includes('src/services/api')) return 'api';
          if (id.includes('src/services/chat')) return 'chat';
        }
      }
    },
    terserOptions: {
      compress: {
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info']
      }
    }
  },
  server: {
    host: true,
    port: 5173,
    compress: true
  }
})
