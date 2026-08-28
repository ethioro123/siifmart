import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { setupAppMenu } from './menu';
import { getSystemPrinters, printHtmlDirect, openCashDrawer, ElectronPrintOptions } from './printer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly set Application Name for macOS Menu Bar & Task Manager
app.setName('SIIFMART');
if (process.platform === 'win32') {
    app.setAppUserModelId('com.siifmart.app');
}

// Disable GPU acceleration if needed for low-power POS terminals, or keep hardware acceleration enabled by default
app.commandLine.appendSwitch('disable-color-correct-rendering');

let mainWindow: BrowserWindow | null = null;

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', () => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
    });

    app.whenReady().then(createWindow);
}

function createWindow(): void {
    const isDev = process.env.NODE_ENV === 'development' || !!process.env.VITE_DEV_SERVER_URL;

    mainWindow = new BrowserWindow({
        width: 1440,
        height: 900,
        minWidth: 1024,
        minHeight: 700,
        backgroundColor: '#151D18',
        title: 'SIIFMART',
        show: false, // Wait until ready-to-show to prevent white flash
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false,
            spellcheck: false
        }
    });

    // Native App Menu
    setupAppMenu(mainWindow);

    // Show when ready
    mainWindow.once('ready-to-show', () => {
        mainWindow?.show();
        mainWindow?.focus();
        if (app.dock) app.dock.show();
    });

    // Fallback: force show within 1.5s if ready-to-show is delayed
    setTimeout(() => {
        if (mainWindow && !mainWindow.isVisible()) {
            mainWindow.show();
            mainWindow.focus();
            if (app.dock) app.dock.show();
        }
    }, 1500);

    // Load dev server or production dist
    if (process.env.VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
        if (isDev) {
            mainWindow.webContents.openDevTools({ mode: 'detach' });
        }
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    // Open external links in default browser
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('https:') || url.startsWith('http:')) {
            shell.openExternal(url);
        }
        return { action: 'deny' };
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// --- IPC HANDLERS ---

ipcMain.handle('app:get-version', () => {
    return app.getVersion();
});

ipcMain.handle('printer:get-list', async () => {
    if (!mainWindow) return [];
    return getSystemPrinters(mainWindow);
});

ipcMain.handle('printer:print-direct', async (_event, { html, options }: { html: string; options?: ElectronPrintOptions }) => {
    return printHtmlDirect(html, options);
});

ipcMain.handle('printer:open-cash-drawer', async (_event, printerName?: string) => {
    return openCashDrawer(printerName);
});

ipcMain.on('app:beep', () => {
    shell.beep();
});

ipcMain.handle('window:toggle-fullscreen', () => {
    if (!mainWindow) return false;
    const isFullScreen = !mainWindow.isFullScreen();
    mainWindow.setFullScreen(isFullScreen);
    return isFullScreen;
});

ipcMain.on('window:minimize', () => {
    mainWindow?.minimize();
});

ipcMain.on('window:maximize', () => {
    if (mainWindow) {
        if (mainWindow.isMaximized()) {
            mainWindow.unmaximize();
        } else {
            mainWindow.maximize();
        }
    }
});

ipcMain.on('window:close', () => {
    mainWindow?.close();
});

// App Lifecycle
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
