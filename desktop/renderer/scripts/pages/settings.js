function renderSettings() {
  const container = document.getElementById('content-container');

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">Settings</h1>
      <p class="page-subtitle">Configure your Auto-Store system</p>
    </div>

    <div id="settings-alert"></div>

    <form id="settings-form">
      <!-- MODE -->
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">📍 Operation Mode</h2>
        </div>
        <div class="form-group">
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <label style="display: flex; align-items: center; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; cursor: pointer;">
              <input type="radio" name="mode" value="DiscordBotOnly" style="margin-right: 12px;">
              <div>
                <div style="font-weight: 600;">🤖 Discord Bot Only</div>
                <div style="font-size: 13px; color: #6b7280;">Recommended - Only run Discord bot (easiest)</div>
              </div>
            </label>

            <label style="display: flex; align-items: center; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; cursor: pointer;">
              <input type="radio" name="mode" value="WebOnly" style="margin-right: 12px;">
              <div>
                <div style="font-weight: 600;">🌐 Web Only</div>
                <div style="font-size: 13px; color: #6b7280;">Only run website (without bot)</div>
              </div>
            </label>

            <label style="display: flex; align-items: center; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; cursor: pointer;">
              <input type="radio" name="mode" value="IntegratedMode" style="margin-right: 12px;">
              <div>
                <div style="font-weight: 600;">🔗 Integrated Mode</div>
                <div style="font-size: 13px; color: #6b7280;">Bot + Website fully integrated (all features)</div>
              </div>
            </label>
          </div>
        </div>
      </div>

      <!-- DATABASE -->
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">🗄️ Database Configuration</h2>
        </div>

        <div class="form-group">
          <label class="form-label">Database Type</label>
          <select id="db-type" class="form-select">
            <option value="mysql">MySQL / MariaDB</option>
            <option value="mongodb">MongoDB</option>
          </select>
        </div>

        <div id="mysql-config">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Host</label>
              <input type="text" class="form-input" name="mysql.host" placeholder="localhost">
            </div>
            <div class="form-group">
              <label class="form-label">Port</label>
              <input type="number" class="form-input" name="mysql.port" placeholder="3306">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Username</label>
              <input type="text" class="form-input" name="mysql.user" placeholder="root">
            </div>
            <div class="form-group">
              <label class="form-label">Password</label>
              <input type="password" class="form-input" name="mysql.password">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Database Name</label>
            <input type="text" class="form-input" name="mysql.database" placeholder="autostore">
          </div>

          <button type="button" class="btn btn-outline btn-sm" onclick="testDatabaseConnection()">
            Test Connection
          </button>
        </div>

        <div id="mongodb-config" style="display: none;">
          <div class="form-group">
            <label class="form-label">MongoDB URI</label>
            <input type="text" class="form-input" name="mongodb.uri" placeholder="mongodb://localhost:27017/autostore">
          </div>

          <button type="button" class="btn btn-outline btn-sm" onclick="testDatabaseConnection()">
            Test Connection
          </button>
        </div>
      </div>

      <!-- DISCORD -->
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">🤖 Discord Bot Settings</h2>
        </div>

        <div class="form-group">
          <label class="form-label">Bot Token</label>
          <input type="password" class="form-input" name="discord.token" placeholder="Paste your bot token here">
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Application/Client ID</label>
            <input type="text" class="form-input" name="discord.clientId" placeholder="123456789012345678">
          </div>
          <div class="form-group">
            <label class="form-label">Server/Guild ID</label>
            <input type="text" class="form-input" name="discord.guildId" placeholder="123456789012345678">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Owner User ID</label>
          <input type="text" class="form-input" name="discord.ownerId" placeholder="123456789012345678">
        </div>
      </div>

      <!-- PAYMENT -->
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">💳 Payment Gateway</h2>
        </div>

        <div class="form-group">
          <label class="form-label">Payment Provider</label>
          <select id="payment-provider" class="form-select">
            <option value="midtrans">Midtrans (Recommended)</option>
            <option value="duitku">Duitku</option>
            <option value="tripay">Tripay</option>
          </select>
        </div>

        <div id="midtrans-config">
          <div class="form-group">
            <label class="form-label">Server Key</label>
            <input type="password" class="form-input" name="midtrans.serverKey" placeholder="SB-Mid-server-...">
          </div>
          <div class="form-group">
            <label class="form-label">Client Key</label>
            <input type="text" class="form-input" name="midtrans.clientKey" placeholder="SB-Mid-client-...">
          </div>
          <div class="form-group">
            <label style="display: flex; align-items: center;">
              <input type="checkbox" name="midtrans.isProduction" style="margin-right: 8px;">
              <span>Production Mode (uncheck for sandbox/testing)</span>
            </label>
          </div>
        </div>
      </div>

      <!-- FEATURES -->
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">✨ Features</h2>
        </div>

        <div style="display: flex; flex-direction: column; gap: 12px;">
          <label style="display: flex; align-items: center; justify-content: space-between; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px;">
            <div>
              <div style="font-weight: 600;">Auto Delivery</div>
              <div style="font-size: 13px; color: #6b7280;">Automatically send products via DM after purchase</div>
            </div>
            <input type="checkbox" name="features.autoDelivery">
          </label>

          <label style="display: flex; align-items: center; justify-content: space-between; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px;">
            <div>
              <div style="font-weight: 600;">Auto Expire Invoice</div>
              <div style="font-size: 13px; color: #6b7280;">Automatically cancel unpaid invoices</div>
            </div>
            <input type="checkbox" name="features.autoExpireInvoice">
          </label>

          <label style="display: flex; align-items: center; justify-content: space-between; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px;">
            <div>
              <div style="font-weight: 600;">Maintenance Mode</div>
              <div style="font-size: 13px; color: #6b7280;">Users cannot use the bot when enabled</div>
            </div>
            <input type="checkbox" name="features.maintenance">
          </label>
        </div>
      </div>

      <!-- LIMITS -->
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">📊 Transaction Limits</h2>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Max Pending Orders (per user)</label>
            <input type="number" class="form-input" name="limits.maxPendingOrders" min="1" max="50" value="5">
          </div>
          <div class="form-group">
            <label class="form-label">Min Deposit (IDR)</label>
            <input type="number" class="form-input" name="limits.minDeposit" min="1000" value="10000">
          </div>
          <div class="form-group">
            <label class="form-label">Max Deposit (IDR)</label>
            <input type="number" class="form-input" name="limits.maxDeposit" min="10000" value="10000000">
          </div>
        </div>
      </div>

      <!-- ACTIONS -->
      <div class="card">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; gap: 12px;">
            <button type="button" class="btn btn-outline" onclick="exportConfig()">
              📤 Export Config
            </button>
            <button type="button" class="btn btn-outline" onclick="importConfig()">
              📥 Import Config
            </button>
          </div>

          <div style="display: flex; gap: 12px;">
            <button type="button" class="btn btn-secondary" onclick="navigation.refresh()">
              Reset Changes
            </button>
            <button type="submit" class="btn btn-primary">
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </form>
  `;

  // Load current config
  loadCurrentConfig();

  // Setup form handler
  document.getElementById('settings-form').addEventListener('submit', saveSettings);

  // Database type switch
  document.getElementById('db-type').addEventListener('change', (e) => {
    document.getElementById('mysql-config').style.display = e.target.value === 'mysql' ? 'block' : 'none';
    document.getElementById('mongodb-config').style.display = e.target.value === 'mongodb' ? 'block' : 'none';
  });
}

async function loadCurrentConfig() {
  try {
    const config = await API.getConfig();

    // Mode
    document.querySelector(`input[name="mode"][value="${config.mode}"]`).checked = true;

    // Database
    document.getElementById('db-type').value = config.database?.type || 'mysql';
    document.getElementById('db-type').dispatchEvent(new Event('change'));

    // Fill all form fields
    fillFormFields(config);

  } catch (error) {
    showAlert('error', 'Failed to load configuration: ' + error.message);
  }
}

function fillFormFields(config) {
  const form = document.getElementById('settings-form');

  // Iterate through all inputs
  form.querySelectorAll('[name]').forEach(input => {
    const path = input.name.split('.');
    let value = config;

    // Navigate through nested object
    for (const key of path) {
      value = value?.[key];
    }

    if (value !== undefined) {
      if (input.type === 'checkbox') {
        input.checked = value;
      } else {
        input.value = value;
      }
    }
  });
}

async function saveSettings(e) {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData(form);
  const config = {};

  // Build config object from form
  form.querySelectorAll('[name]').forEach(input => {
    const path = input.name.split('.');
    let current = config;

    for (let i = 0; i < path.length - 1; i++) {
      if (!current[path[i]]) current[path[i]] = {};
      current = current[path[i]];
    }

    const finalKey = path[path.length - 1];

    if (input.type === 'checkbox') {
      current[finalKey] = input.checked;
    } else if (input.type === 'number') {
      current[finalKey] = parseInt(input.value) || 0;
    } else {
      current[finalKey] = input.value;
    }
  });

  // Add database type
  config.database = config.database || {};
  config.database.type = document.getElementById('db-type').value;

  // Add payment provider
  config.payment = config.payment || {};
  config.payment.provider = document.getElementById('payment-provider').value;

  try {
    const result = await API.updateConfig(config);
    showAlert('success', 'Configuration saved successfully! Please restart the bot for changes to take effect.');
  } catch (error) {
    showAlert('error', 'Failed to save configuration: ' + error.message);
  }
}

async function testDatabaseConnection() {
  const dbType = document.getElementById('db-type').value;
  const config = {};

  if (dbType === 'mysql') {
    config.host = document.querySelector('[name="mysql.host"]').value;
    config.port = parseInt(document.querySelector('[name="mysql.port"]').value);
    config.user = document.querySelector('[name="mysql.user"]').value;
    config.password = document.querySelector('[name="mysql.password"]').value;
    config.database = document.querySelector('[name="mysql.database"]').value;
  } else {
    config.uri = document.querySelector('[name="mongodb.uri"]').value;
  }

  try {
    const result = await API.testDatabase(dbType, config);
    showAlert('success', result.message);
  } catch (error) {
    showAlert('error', 'Connection failed: ' + error.message);
  }
}

async function exportConfig() {
  try {
    const blob = await API.exportConfig();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `config-backup-${Date.now()}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
    showAlert('success', 'Configuration exported successfully!');
  } catch (error) {
    showAlert('error', 'Export failed: ' + error.message);
  }
}

function importConfig() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const config = JSON.parse(text);
      await API.importConfig(config);
      showAlert('success', 'Configuration imported successfully! Reloading...');
      setTimeout(() => navigation.refresh(), 1500);
    } catch (error) {
      showAlert('error', 'Import failed: ' + error.message);
    }
  };
  input.click();
}

function showAlert(type, message) {
  const alert = document.getElementById('settings-alert');
  alert.innerHTML = `
    <div class="alert alert-${type}">
      ${message}
    </div>
  `;

  setTimeout(() => {
    alert.innerHTML = '';
  }, 5000);
}

// Register page
document.addEventListener('DOMContentLoaded', () => {
  window.navigation.registerPage('settings', renderSettings);
});
