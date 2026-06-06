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
    // 代码分割优化
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('tslib')) return 'vendors';
          }
          if (id.includes('src/main.js')) return 'core';
          if (id.includes('src/utils/api-handler')) return 'api';
          if (id.includes('src/modules/template-manager')) return 'template';
          if (id.includes('src/modules/history-manager')) return 'history';
        }
      }
    },
    // Terser 压缩优化
    terserOptions: {
      compress: {
        drop_debugger: true,
        drop_console: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug']
      }
    },
    // 启用 CSS 代码分割
    cssCodeSplit: true
  },
  server: {
    host: true,
    port: 5173,
    compress: true
  },
  // 生产环境优化
  esbuild: {
    drop: ['console', 'debugger']
  }
})