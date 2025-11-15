const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to renderer process
contextBridge.exposeInMainWorld('electron', {
  // Get backend status
  getBackendStatus: () => ipcRenderer.invoke('get-backend-status'),

  // Listen to backend logs
  onBackendLog: (callback) => {
    ipcRenderer.on('backend-log', (event, log) => callback(log));
  }
});
