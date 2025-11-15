function renderDashboard() {
  const container = document.getElementById('content-container');

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">Dashboard</h1>
      <p class="page-subtitle">Welcome to Auto-Store Manager</p>
    </div>

    <div class="stats-grid" id="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">📊</div>
        <div class="stat-label">Loading...</div>
        <div class="stat-value">-</div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h2 class="card-title">Recent Orders</h2>
      </div>
      <div id="recent-orders">
        <p class="text-center" style="padding: 20px;">Loading recent orders...</p>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h2 class="card-title">Quick Actions</h2>
      </div>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
        <button class="btn btn-primary" onclick="navigation.navigateTo('products')">
          📦 Manage Products
        </button>
        <button class="btn btn-success" onclick="navigation.navigateTo('stock')">
          📋 Manage Stock
        </button>
        <button class="btn btn-secondary" onclick="navigation.navigateTo('orders')">
          🛒 View Orders
        </button>
        <button class="btn btn-outline" onclick="navigation.navigateTo('settings')">
          ⚙️ Settings
        </button>
      </div>
    </div>
  `;

  // Load stats
  loadDashboardStats();
}

async function loadDashboardStats() {
  try {
    const stats = await API.getDashboardStats();

    const statsGrid = document.getElementById('stats-grid');
    statsGrid.innerHTML = `
      <div class="stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-label">Total Users</div>
        <div class="stat-value">${stats.totalUsers || 0}</div>
      </div>

      <div class="stat-card success">
        <div class="stat-icon">📦</div>
        <div class="stat-label">Products</div>
        <div class="stat-value">${stats.totalProducts || 0}</div>
      </div>

      <div class="stat-card warning">
        <div class="stat-icon">🛒</div>
        <div class="stat-label">Total Orders</div>
        <div class="stat-value">${stats.totalOrders || 0}</div>
      </div>

      <div class="stat-card danger">
        <div class="stat-icon">💰</div>
        <div class="stat-label">Revenue (7d)</div>
        <div class="stat-value">Rp ${(stats.revenue || 0).toLocaleString()}</div>
      </div>
    `;

    // Load recent orders
    if (stats.recentOrders && stats.recentOrders.length > 0) {
      const ordersHtml = `
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>User</th>
                <th>Product</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              ${stats.recentOrders.map(order => `
                <tr>
                  <td><code>${order.id}</code></td>
                  <td>${order.discordId}</td>
                  <td>${order.productName || 'N/A'}</td>
                  <td>Rp ${(order.amount || 0).toLocaleString()}</td>
                  <td><span class="badge badge-${getStatusClass(order.status)}">${order.status}</span></td>
                  <td>${new Date(order.createdAt).toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
      document.getElementById('recent-orders').innerHTML = ordersHtml;
    } else {
      document.getElementById('recent-orders').innerHTML = `
        <p class="text-center" style="padding: 40px; color: #6b7280;">
          No orders yet. They will appear here once users start purchasing.
        </p>
      `;
    }

  } catch (error) {
    console.error('Error loading dashboard stats:', error);
    document.getElementById('stats-grid').innerHTML = `
      <div class="alert alert-error">
        Failed to load dashboard statistics. Make sure the API server is running.
      </div>
    `;
  }
}

function getStatusClass(status) {
  const map = {
    'success': 'success',
    'completed': 'success',
    'pending': 'warning',
    'failed': 'danger',
    'cancelled': 'danger'
  };
  return map[status] || 'info';
}

// Register page
document.addEventListener('DOMContentLoaded', () => {
  window.navigation.registerPage('dashboard', renderDashboard);

  // Load dashboard by default
  setTimeout(() => renderDashboard(), 100);
});
