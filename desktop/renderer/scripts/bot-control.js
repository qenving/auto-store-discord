const { ipcRenderer } = require('electron');

class BotControl {
  constructor() {
    this.isRunning = false;
    this.setupEventListeners();
    this.checkStatus();
  }

  setupEventListeners() {
    // Listen for bot status changes
    ipcRenderer.on('bot-status-changed', (event, data) => {
      this.isRunning = data.running;
      this.updateUI();
    });

    // Listen for bot logs
    ipcRenderer.on('bot-log', (event, log) => {
      this.appendLog(log);
    });

    // Listen for menu actions
    ipcRenderer.on('menu-action', (event, action) => {
      if (action === 'start-bot') {
        this.startBot();
      } else if (action === 'stop-bot') {
        this.stopBot();
      }
    });

    // Button click handler
    const toggleBtn = document.getElementById('btn-toggle-bot');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        if (this.isRunning) {
          this.stopBot();
        } else {
          this.startBot();
        }
      });
    }
  }

  async checkStatus() {
    try {
      const status = await ipcRenderer.invoke('get-bot-status');
      this.isRunning = status.running;
      this.updateUI();
    } catch (error) {
      console.error('Error checking bot status:', error);
    }
  }

  async startBot() {
    try {
      const toggleBtn = document.getElementById('btn-toggle-bot');
      const btnText = document.getElementById('btn-bot-text');

      if (toggleBtn) {
        toggleBtn.disabled = true;
        btnText.textContent = 'Starting...';
      }

      const result = await ipcRenderer.invoke('start-bot');

      if (result.success) {
        this.showNotification('success', result.message);
        this.isRunning = true;
        this.updateUI();
      } else {
        this.showNotification('error', result.message);
        if (toggleBtn) {
          toggleBtn.disabled = false;
          btnText.textContent = 'Start Bot';
        }
      }
    } catch (error) {
      console.error('Error starting bot:', error);
      this.showNotification('error', 'Failed to start bot');
    }
  }

  async stopBot() {
    try {
      const toggleBtn = document.getElementById('btn-toggle-bot');
      const btnText = document.getElementById('btn-bot-text');

      if (toggleBtn) {
        toggleBtn.disabled = true;
        btnText.textContent = 'Stopping...';
      }

      const result = await ipcRenderer.invoke('stop-bot');

      if (result.success) {
        this.showNotification('success', result.message);
        this.isRunning = false;
        this.updateUI();
      } else {
        this.showNotification('error', result.message);
        if (toggleBtn) {
          toggleBtn.disabled = false;
          btnText.textContent = 'Stop Bot';
        }
      }
    } catch (error) {
      console.error('Error stopping bot:', error);
      this.showNotification('error', 'Failed to stop bot');
    }
  }

  updateUI() {
    const indicator = document.getElementById('bot-status-indicator');
    const statusText = document.getElementById('bot-status-text');
    const toggleBtn = document.getElementById('btn-toggle-bot');
    const btnText = document.getElementById('btn-bot-text');

    if (indicator) {
      if (this.isRunning) {
        indicator.classList.add('online');
      } else {
        indicator.classList.remove('online');
      }
    }

    if (statusText) {
      statusText.textContent = this.isRunning ? 'Bot Online' : 'Bot Offline';
    }

    if (toggleBtn && btnText) {
      toggleBtn.disabled = false;
      if (this.isRunning) {
        toggleBtn.className = 'btn btn-danger btn-block';
        btnText.textContent = 'Stop Bot';
      } else {
        toggleBtn.className = 'btn btn-primary btn-block';
        btnText.textContent = 'Start Bot';
      }
    }
  }

  appendLog(log) {
    // Dispatch event for logs page to handle
    window.dispatchEvent(new CustomEvent('bot-log', { detail: log }));
  }

  showNotification(type, message) {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = `alert alert-${type === 'success' ? 'success' : 'error'}`;
    toast.style.position = 'fixed';
    toast.style.top = '20px';
    toast.style.right = '20px';
    toast.style.zIndex = '9999';
    toast.style.minWidth = '300px';
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'opacity 0.3s';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  window.botControl = new BotControl();
});
