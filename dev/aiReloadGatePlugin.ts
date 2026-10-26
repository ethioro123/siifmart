import fs from 'node:fs';
import path from 'node:path';
import type { Plugin, ViteDevServer } from 'vite';

interface AiStatusPayload {
  isWorking: boolean;
  pendingReload: boolean;
  changedCount: number;
  justFinished?: boolean;
}

const LOCK_EXPIRATION_MS = 120_000; // 2 minutes auto-expiration

export function aiReloadGatePlugin(): Plugin {
  const rootDir = process.cwd();
  const lockFilePath = path.resolve(rootDir, '.ai-working.lock');

  let serverInstance: ViteDevServer | null = null;
  let checkInterval: NodeJS.Timeout | null = null;
  let lastWorkingState = false;
  let pendingReload = false;
  const changedFiles = new Set<string>();

  function isAiWorking(): boolean {
    try {
      if (!fs.existsSync(lockFilePath)) {
        return false;
      }
      const stat = fs.statSync(lockFilePath);
      if (Date.now() - stat.mtimeMs > LOCK_EXPIRATION_MS) {
        // Stale lock file expired
        try {
          fs.unlinkSync(lockFilePath);
        } catch {
          // Ignore unlink race
        }
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  function broadcastStatus(server: ViteDevServer, payload: AiStatusPayload) {
    try {
      server.ws.send({
        type: 'custom',
        event: 'siifmart:ai-status',
        data: payload
      });
    } catch {
      // Ignore websocket errors if server is shutting down
    }
  }

  function triggerReload(server: ViteDevServer) {
    pendingReload = false;
    changedFiles.clear();
    try {
      server.ws.send({
        type: 'full-reload',
        path: '*'
      });
    } catch {
      // Ignore
    }
  }

  return {
    name: 'siifmart-ai-reload-gate',
    apply: 'serve',

    configureServer(server) {
      serverInstance = server;

      // Check lock state every 300ms
      checkInterval = setInterval(() => {
        const currentlyWorking = isAiWorking();

        if (lastWorkingState && !currentlyWorking) {
          // AI just transitioned from working to finished!
          lastWorkingState = false;
          const count = changedFiles.size;

          broadcastStatus(server, {
            isWorking: false,
            pendingReload: false,
            changedCount: count,
            justFinished: true
          });

          if (pendingReload) {
            // Wait 250ms for git auto-commits or file system flush to finish
            setTimeout(() => {
              triggerReload(server);
            }, 250);
          }
        } else if (!lastWorkingState && currentlyWorking) {
          // AI started working
          lastWorkingState = true;
          broadcastStatus(server, {
            isWorking: true,
            pendingReload,
            changedCount: changedFiles.size
          });
        }
      }, 300);

      // Dev API endpoints for manual control or client inspection
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/__siifmart_ai')) {
          return next();
        }

        const url = new URL(req.url, 'http://localhost');
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store');

        if (url.pathname === '/__siifmart_ai/status') {
          return res.end(JSON.stringify({
            isWorking: isAiWorking(),
            pendingReload,
            changedCount: changedFiles.size
          }));
        }

        if (url.pathname === '/__siifmart_ai/reload' && req.method === 'POST') {
          triggerReload(server);
          return res.end(JSON.stringify({ reloaded: true }));
        }

        if (url.pathname === '/__siifmart_ai/unlock' && req.method === 'POST') {
          try {
            if (fs.existsSync(lockFilePath)) {
              fs.unlinkSync(lockFilePath);
            }
          } catch {
            // Ignore
          }
          if (pendingReload) {
            triggerReload(server);
          }
          return res.end(JSON.stringify({ unlocked: true }));
        }

        if (url.pathname === '/__siifmart_ai/lock' && req.method === 'POST') {
          try {
            fs.writeFileSync(lockFilePath, JSON.stringify({ manual: true, time: Date.now() }));
          } catch {
            // Ignore
          }
          return res.end(JSON.stringify({ locked: true }));
        }

        next();
      });
    },

    handleHotUpdate(ctx) {
      if (isAiWorking()) {
        pendingReload = true;
        changedFiles.add(ctx.file);

        if (serverInstance) {
          broadcastStatus(serverInstance, {
            isWorking: true,
            pendingReload: true,
            changedCount: changedFiles.size
          });
        }

        // Return empty array to suppress HMR and browser reloads while AI is working
        return [];
      }

      return ctx.modules;
    },

    closeBundle() {
      if (checkInterval) {
        clearInterval(checkInterval);
        checkInterval = null;
      }
    }
  };
}
