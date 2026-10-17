import path from 'path';
import https from 'https';
import dns from 'dns';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import tailwindcss from '@tailwindcss/vite';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';

// Custom HTTPS agent that resolves Supabase to its reachable Cloudflare IPv4 edge (172.64.149.246)
// when the local mobile hotspot / ISP DNS64 returns unreachable IPv6 addresses.
const supabaseAgent = new https.Agent({
  keepAlive: true,
  lookup: (hostname, options, callback) => {
    if (hostname.endsWith('.supabase.co')) {
      const opts = typeof options === 'object' && options !== null ? options : {};
      if ((opts as any).all) {
        return callback(null, [{ address: '172.64.149.246', family: 4 }] as any);
      }
      return callback(null, '172.64.149.246', 4);
    }
    return dns.lookup(hostname, options as any, callback as any);
  }
});

// Guard against network disconnects/sleep killing the Vite dev server process
process.on('uncaughtException', (err: any) => {
  if (err?.code === 'ENETUNREACH' || err?.code === 'ETIMEDOUT' || err?.code === 'ECONNRESET' || err?.code === 'EADDRNOTAVAIL') {
    return;
  }
  console.error('Unhandled server exception:', err);
});

export default defineConfig(() => {
  const isElectron = process.env.ELECTRON === 'true' || process.env.npm_lifecycle_event?.includes('electron');
  const isCapacitor = process.env.CAPACITOR === 'true' || process.env.npm_lifecycle_event?.includes('android');

  return {
    base: isElectron ? './' : '/',
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/supabase-proxy': {
          target: 'https://zdgzpxvorwinugjufkvb.supabase.co',
          changeOrigin: true,
          secure: true,
          ws: true,
          agent: supabaseAgent,
          rewrite: (p) => p.replace(/^\/supabase-proxy/, ''),
          configure: (proxy) => {
            proxy.on('error', (err, _req, res) => {
              if (res && 'writeHead' in res && !(res as any).headersSent) {
                try {
                  res.writeHead(502, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: 'Proxy error', code: (err as any).code }));
                } catch {
                  // Ignore
                }
              }
            });
          },
        },
      },
      watch: {
        // Use polling to prevent rapid file change detection
        usePolling: true,
        interval: 5000, // Check every 5 seconds instead of instantly
        ignored: [
          '**/node_modules/**',
          '**/.git/**',
          '**/dist/**',
          '**/dist-electron/**',
          '**/scratch/**',
          '**/release/**',
          '**/build/**'
        ],
      },
      hmr: {
        overlay: true,
      },
    },
    plugins: [
      react(),
      tailwindcss(),
      ...(isElectron ? [
        electron([
          {
            entry: 'electron/main.ts',
            vite: {
              build: {
                outDir: 'dist-electron',
                rollupOptions: {
                  external: ['electron']
                }
              }
            }
          },
          {
            entry: 'electron/preload.ts',
            onstart(args) {
              args.reload();
            },
            vite: {
              build: {
                outDir: 'dist-electron',
                rollupOptions: {
                  external: ['electron']
                }
              }
            }
          }
        ]),
        renderer()
      ] : isCapacitor ? [] : [
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['favicon.svg', 'robots.txt'],
          manifest: {
            name: 'SiifMart Retail & Warehouse',
            short_name: 'SiifMart',
            description: 'SiifMart Retail & Warehouse Management System',
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
            maximumFileSizeToCacheInBytes: 6000000,
            cleanupOutdatedCaches: true,
            clientsClaim: true,
            skipWaiting: true,
            navigateFallback: '/index.html',
            runtimeCaching: [
              {
                urlPattern: ({ request }) => request.mode === 'navigate',
                handler: 'NetworkFirst',
                options: {
                  cacheName: 'html-cache',
                  networkTimeoutSeconds: 3,
                }
              }
            ]
          },
          devOptions: {
            enabled: false
          }
        })
      ])
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
