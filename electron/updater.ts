import { app, autoUpdater, BrowserWindow } from 'electron';
import https from 'https';
import http from 'http';

export type DesktopUpdateState = {
    status: 'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'up-to-date' | 'error';
    currentVersion: string;
    availableVersion?: string;
    lastCheckedAt?: string;
    message?: string;
};

let currentState: DesktopUpdateState = {
    status: 'idle',
    currentVersion: app.getVersion()
};

let nativeUpdateReady = false;
let webUpdateReadyUrl: string | null = null;
let checkInterval: NodeJS.Timeout | null = null;

function broadcastState(mainWindow: BrowserWindow | null, patch: Partial<DesktopUpdateState>): DesktopUpdateState {
    currentState = {
        ...currentState,
        ...patch,
        currentVersion: app.getVersion()
    };
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('updater:status', currentState);
    }
    return currentState;
}

function fetchJson(url: string, timeoutMs = 4000): Promise<any> {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https:') ? https : http;
        const req = client.get(url, { timeout: timeoutMs, headers: { 'Cache-Control': 'no-cache' } }, (res) => {
            if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
                res.resume();
                return reject(new Error(`HTTP ${res.statusCode}`));
            }
            let raw = '';
            res.setEncoding('utf8');
            res.on('data', chunk => { raw += chunk; });
            res.on('end', () => {
                try {
                    resolve(JSON.parse(raw));
                } catch (err) {
                    reject(err);
                }
            });
        });
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Update check timed out'));
        });
        req.on('error', reject);
    });
}

export function isUrlReachable(url: string, timeoutMs = 2500): Promise<boolean> {
    return new Promise((resolve) => {
        try {
            const client = url.startsWith('https:') ? https : http;
            const req = client.request(url, { method: 'HEAD', timeout: timeoutMs }, (res) => {
                res.resume();
                resolve(Boolean(res.statusCode && res.statusCode >= 200 && res.statusCode < 500));
            });
            req.on('timeout', () => {
                req.destroy();
                resolve(false);
            });
            req.on('error', () => resolve(false));
            req.end();
        } catch {
            resolve(false);
        }
    });
}

export async function checkForDesktopUpdates(mainWindow: BrowserWindow | null): Promise<DesktopUpdateState> {
    const nowIso = new Date().toISOString();
    broadcastState(mainWindow, { status: 'checking', lastCheckedAt: nowIso, message: undefined });

    const feedUrl = process.env.SIIFMART_UPDATE_FEED_URL;
    const hostedAppUrl = process.env.SIIFMART_DESKTOP_URL || process.env.VITE_DESKTOP_APP_URL;

    // 1. If a native Electron squirrel/release feed is configured and packaged, trigger native autoUpdater
    if (feedUrl && app.isPackaged) {
        try {
            autoUpdater.checkForUpdates();
            return currentState;
        } catch (err: any) {
            return broadcastState(mainWindow, {
                status: 'error',
                lastCheckedAt: nowIso,
                message: err?.message || 'Native update check failed'
            });
        }
    }

    // 2. Check remote web manifest (/version.json) if a hosted URL is configured
    if (hostedAppUrl) {
        try {
            const cleanBase = hostedAppUrl.replace(/\/+$/, '');
            const manifest = await fetchJson(`${cleanBase}/version.json?t=${Date.now()}`);
            const remoteVersion = String(manifest?.version || manifest?.buildId || '').trim();
            if (remoteVersion && remoteVersion !== app.getVersion()) {
                webUpdateReadyUrl = cleanBase;
                return broadcastState(mainWindow, {
                    status: 'downloaded',
                    availableVersion: remoteVersion,
                    lastCheckedAt: nowIso,
                    message: `Update ${remoteVersion} is ready to apply.`
                });
            }
        } catch {
            // Silently ignore when offline
        }
    }

    return broadcastState(mainWindow, {
        status: 'up-to-date',
        lastCheckedAt: nowIso,
        message: 'SIIFMART is up to date.'
    });
}

export function applyDesktopUpdate(mainWindow: BrowserWindow | null): { applied: boolean } {
    if (nativeUpdateReady) {
        autoUpdater.quitAndInstall();
        return { applied: true };
    }
    if (mainWindow && !mainWindow.isDestroyed()) {
        if (webUpdateReadyUrl) {
            mainWindow.loadURL(webUpdateReadyUrl);
        } else {
            mainWindow.webContents.reloadIgnoringCache();
        }
        broadcastState(mainWindow, { status: 'up-to-date', availableVersion: undefined });
        return { applied: true };
    }
    return { applied: false };
}

export function getDesktopUpdateState(): DesktopUpdateState {
    return currentState;
}

export function setupAutoUpdater(mainWindow: BrowserWindow): void {
    const feedUrl = process.env.SIIFMART_UPDATE_FEED_URL;

    if (feedUrl && app.isPackaged) {
        try {
            autoUpdater.setFeedURL({ url: feedUrl });

            autoUpdater.on('checking-for-update', () => {
                broadcastState(mainWindow, { status: 'checking', lastCheckedAt: new Date().toISOString() });
            });

            autoUpdater.on('update-available', () => {
                broadcastState(mainWindow, { status: 'downloading', message: 'Downloading update in background...' });
            });

            autoUpdater.on('update-not-available', () => {
                broadcastState(mainWindow, { status: 'up-to-date', lastCheckedAt: new Date().toISOString() });
            });

            autoUpdater.on('update-downloaded', (_event, _releaseNotes, releaseName) => {
                nativeUpdateReady = true;
                broadcastState(mainWindow, {
                    status: 'downloaded',
                    availableVersion: releaseName || undefined,
                    lastCheckedAt: new Date().toISOString(),
                    message: 'Update downloaded and ready to install.'
                });
            });

            autoUpdater.on('error', (err) => {
                broadcastState(mainWindow, {
                    status: 'error',
                    lastCheckedAt: new Date().toISOString(),
                    message: err?.message || 'Auto-update error'
                });
            });
        } catch (err) {
            console.warn('[Electron:Updater] Failed to initialize native feed:', err);
        }
    }

    // Background check 8s after launch, then every 15 minutes
    setTimeout(() => {
        void checkForDesktopUpdates(mainWindow);
    }, 8000);

    if (checkInterval) clearInterval(checkInterval);
    checkInterval = setInterval(() => {
        void checkForDesktopUpdates(mainWindow);
    }, 15 * 60 * 1000);
}
