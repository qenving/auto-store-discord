const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow = null;
let backendProcess = null;

// Create the main window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    backgroundColor: '#667eea',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'electron-preload.js')
    },
    icon: path.join(__dirname, 'gui/assets/icon.png'),
    title: 'Auto-Store Manager',
    autoHideMenuBar: true
  });

  // Load the GUI
  mainWindow.loadFile(path.join(__dirname, 'gui/public/index.html'));

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Start backend server
  startBackend();
}

// Start the backend Node.js server
function startBackend() {
  console.log('Starting backend server...');

  backendProcess = spawn('node', ['index.js'], {
    cwd: __dirname,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  backendProcess.stdout.on('data', (data) => {
    console.log(`[Backend] ${data.toString().trim()}`);

    // Send logs to frontend
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('backend-log', {
        type: 'info',
        message: data.toString()
      });
    }
  });

  backendProcess.stderr.on('data', (data) => {
    console.error(`[Backend Error] ${data.toString().trim()}`);

    // Send errors to frontend
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('backend-log', {
        type: 'error',
        message: data.toString()
      });
    }
  });

  backendProcess.on('close', (code) => {
    console.log(`Backend process exited with code ${code}`);
    backendProcess = null;
  });

  backendProcess.on('error', (error) => {
    console.error('Failed to start backend:', error);
  });
}

// App lifecycle
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Kill backend process
  if (backendProcess) {
    backendProcess.kill();
  }

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  // Cleanup
  if (backendProcess) {
    backendProcess.kill();
  }
});

// IPC Handlers
ipcMain.handle('get-backend-status', async () => {
  return {
    running: backendProcess !== null,
    pid: backendProcess ? backendProcess.pid : null
  };
});
