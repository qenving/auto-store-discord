const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let botProcess = null;
const API_URL = 'http://localhost:3001';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    backgroundColor: '#f3f4f6',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    },
    icon: path.join(__dirname, 'assets/icon.png'),
    title: 'Auto-Store Manager'
  });

  mainWindow.loadFile('renderer/index.html');

  // Create menu
  const menuTemplate = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Start Bot',
          click: () => mainWindow.webContents.send('menu-action', 'start-bot')
        },
        {
          label: 'Stop Bot',
          click: () => mainWindow.webContents.send('menu-action', 'stop-bot')
        },
        { type: 'separator' },
        {
          label: 'Exit',
          click: () => app.quit()
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Documentation',
          click: () => {
            require('electron').shell.openExternal('https://github.com/your-repo/docs');
          }
        },
        {
          label: 'About',
          click: () => {
            const { dialog } = require('electron');
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About Auto-Store Manager',
              message: 'Auto-Store Desktop Manager v1.0.0',
              detail: 'Manage your Discord auto-store bot with ease.',
              buttons: ['OK']
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ============================================
// BOT PROCESS MANAGEMENT
// ============================================

ipcMain.handle('start-bot', async () => {
  if (botProcess) {
    return { success: false, message: 'Bot is already running' };
  }

  try {
    const botPath = path.join(__dirname, '../bot/index.js');
    botProcess = spawn('node', [botPath], {
      cwd: path.join(__dirname, '..'),
      stdio: ['ignore', 'pipe', 'pipe']
    });

    botProcess.stdout.on('data', (data) => {
      mainWindow.webContents.send('bot-log', {
        type: 'info',
        message: data.toString()
      });
    });

    botProcess.stderr.on('data', (data) => {
      mainWindow.webContents.send('bot-log', {
        type: 'error',
        message: data.toString()
      });
    });

    botProcess.on('close', (code) => {
      botProcess = null;
      mainWindow.webContents.send('bot-status-changed', { running: false });
      mainWindow.webContents.send('bot-log', {
        type: 'warn',
        message: `Bot process exited with code ${code}`
      });
    });

    mainWindow.webContents.send('bot-status-changed', { running: true });

    return { success: true, message: 'Bot started successfully' };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('stop-bot', async () => {
  if (!botProcess) {
    return { success: false, message: 'Bot is not running' };
  }

  try {
    botProcess.kill();
    botProcess = null;
    mainWindow.webContents.send('bot-status-changed', { running: false });
    return { success: true, message: 'Bot stopped successfully' };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

ipcMain.handle('get-bot-status', async () => {
  return { running: botProcess !== null };
});

// ============================================
// APP LIFECYCLE
// ============================================

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (botProcess) {
    botProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('before-quit', () => {
  if (botProcess) {
    botProcess.kill();
  }
});
