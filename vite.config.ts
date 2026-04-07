import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(() => {
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      watch: {
        // Use polling to prevent rapid file change detection
        usePolling: true,
        interval: 5000, // Check every 5 seconds instead of instantly
        ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**'],
      },
      hmr: {
        overlay: true,
      },
    },
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'robots.txt'],
        manifest: {
          name: 'SiifMart WMS',
          short_name: 'SiifMart',
          description: 'Warehouse Management System',
          theme_color: '#000000',
          background_color: '#000000',
          display: 'standalone',
          orientation: 'portrait',
          icons: [
            {
              src: 'favicon.svg',
              sizes: '192x192',
              type: 'image/svg+xml'
            },
            {
              src: 'favicon.svg',
              sizes: '512x512',
              type: 'image/svg+xml'
            },
            {
              src: 'favicon.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 6000000 // Increase limit for larger assets if needed
        },
        devOptions: {
          enabled: true,
          type: 'module'
        }
      })
    ],
    // SECURITY: API keys must NEVER be injected into the client bundle.
    // Route AI requests through Supabase Edge Functions instead.
    // define: { ... } — removed for security
    build: {
      sourcemap: false, // Never expose source maps in production
    },
    optimizeDeps: {
      exclude: ['lucide-react'],
      include: ['konva', 'react-konva', 'use-image'],
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './tests/setup.ts',
      exclude: ['**/node_modules/**', '**/tests/e2e/**'],
    }
  };
});
