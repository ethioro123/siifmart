import path from 'path';
import https from 'https';
import dns from 'dns';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import tailwindcss from '@tailwindcss/vite';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import { stagingQuickLoginPlugin } from './dev/stagingQuickLoginPlugin';

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

export default defineConfig(({ mode }) => {
  const modeEnv = loadEnv(mode, process.cwd(), 'VITE_');
  const privateStagingEnv = loadEnv(mode, process.cwd(), 'SIIFMART_');
  const supabaseUrl = modeEnv.VITE_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error(`VITE_SUPABASE_URL must be set for the ${mode} environment.`);
  }

  const targetUrl = new URL(supabaseUrl);
  if (targetUrl.protocol !== 'https:' || !targetUrl.hostname.endsWith('.supabase.co')) {
    throw new Error('VITE_SUPABASE_URL must be an HTTPS Supabase project URL.');
  }

  // Refuse to run staging against the same project configured for normal local development.
  if (mode === 'staging') {
    const developmentUrl = loadEnv('development', process.cwd(), 'VITE_').VITE_SUPABASE_URL;
    if (developmentUrl && new URL(developmentUrl).hostname === targetUrl.hostname) {
      throw new Error('Staging cannot use the same Supabase project as local development.');
    }
  }

  const isElectron = process.env.ELECTRON === 'true' || process.env.npm_lifecycle_event?.includes('electron');
  const isCapacitor = process.env.CAPACITOR === 'true' || process.env.npm_lifecycle_event?.includes('android');

  return {
    base: isElectron ? './' : '/',
    server: {
      port: mode === 'staging' ? 3000 : 3001,
      strictPort: true,
      host: '0.0.0.0',
      proxy: {
        '/supabase-proxy': {
          target: targetUrl.origin,
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
      stagingQuickLoginPlugin({
        url: supabaseUrl, publicKey: modeEnv.VITE_SUPABASE_ANON_KEY,
        email: privateStagingEnv.SIIFMART_STAGING_ADMIN_EMAIL,
        password: privateStagingEnv.SIIFMART_STAGING_ADMIN_PASSWORD
      }),
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
            name: 'SIIFMART Retail & Warehouse',
            short_name: 'SIIFMART',
            description: 'SIIFMART Retail & Warehouse Management System',
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
      rollupOptions: {
        input: {
          app: path.resolve(__dirname, 'index.html'),
        },
      },
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
