// Main application initialization

console.log('Auto-Store Desktop Manager - Initializing...');

// Check API connectivity on startup
async function checkAPIConnection() {
  try {
    const response = await fetch('http://localhost:3001/api/health');
    const data = await response.json();

    if (data.status === 'ok') {
      console.log('✅ API Server connected');
      return true;
    }
  } catch (error) {
    console.error('❌ API Server not reachable:', error.message);
    return false;
  }
}

// Show connection warning if API is not available
setTimeout(async () => {
  const isConnected = await checkAPIConnection();

  if (!isConnected) {
    const container = document.getElementById('content-container');
    const warning = document.createElement('div');
    warning.innerHTML = `
      <div class="alert alert-warning">
        ⚠️ <strong>API Server Not Running</strong><br>
        The API server is not reachable. Please make sure:<br>
        1. The bot is running (click "Start Bot" in the sidebar)<br>
        2. API server is configured to run on port 3001<br>
        3. No firewall is blocking localhost connections
      </div>
    `;
    container.insertBefore(warning, container.firstChild);
  }
}, 1000);

// Global error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

// Global unhandled rejection handler
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

console.log('✅ Desktop App initialized');
