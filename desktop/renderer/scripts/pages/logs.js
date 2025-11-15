function renderLogs() {
  const container = document.getElementById('content-container');

  container.innerHTML = `
    <div class="page-header">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="page-title">Bot Logs</h1>
          <p class="page-subtitle">Real-time bot activity logs</p>
        </div>
        <button class="btn btn-outline btn-sm" onclick="clearLogs()">Clear Logs</button>
      </div>
    </div>

    <div class="card">
      <div class="log-container" id="log-container">
        <div class="log-entry info">Waiting for bot logs...</div>
      </div>
    </div>
  `;

  // Listen for bot logs
  window.addEventListener('bot-log', (event) => {
    appendLogEntry(event.detail);
  });
}

function appendLogEntry(log) {
  const container = document.getElementById('log-container');
  if (!container) return;

  const entry = document.createElement('div');
  entry.className = `log-entry ${log.type}`;
  entry.textContent = `[${new Date().toLocaleTimeString()}] ${log.message}`;

  container.appendChild(entry);

  // Auto-scroll to bottom
  container.scrollTop = container.scrollHeight;

  // Keep only last 500 entries
  while (container.children.length > 500) {
    container.removeChild(container.firstChild);
  }
}

function clearLogs() {
  const container = document.getElementById('log-container');
  if (!container) return;

  container.innerHTML = '<div class="log-entry info">Logs cleared.</div>';
}

document.addEventListener('DOMContentLoaded', () => {
  window.navigation.registerPage('logs', renderLogs);
});
