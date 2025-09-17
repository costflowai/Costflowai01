import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'src',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html'),
        calculators: resolve(__dirname, 'src/calculators/index.html'),
        'residential-rom-pro': resolve(__dirname, 'src/calculators/residential-rom-pro.html'),
        'commercial-ti-pro': resolve(__dirname, 'src/calculators/commercial-ti-pro.html'),
        'roi-maximizer': resolve(__dirname, 'src/calculators/roi-maximizer.html'),
        'ai-photo-estimator': resolve(__dirname, 'src/ai-photo-estimator.html'),
        'pricing': resolve(__dirname, 'src/pricing.html')
      },
      output: {
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    },
    // Optimization settings
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    // Code splitting
    chunkSizeWarningLimit: 500,
    cssCodeSplit: true,
    sourcemap: false
  },
  server: {
    port: 3000,
    host: true,
    open: true
  },
  preview: {
    port: 4173,
    host: true
  },
  // CSS preprocessing
  css: {
    devSourcemap: true,
    preprocessorOptions: {
      scss: {
        additionalData: `@import "./src/styles/variables.scss";`
      }
    }
  },
  // Plugins for optimization
  plugins: [
    // PWA plugin for service worker
    // Image optimization plugin
    // Bundle analyzer plugin (dev only)
  ],
  // Performance optimizations
  optimizeDeps: {
    include: [
      // Pre-bundle heavy dependencies
    ],
    exclude: [
      // Don't pre-bundle these
    ]
  },
  // Environment variables
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString())
  }
});
