function renderOrders() {
  const container = document.getElementById('content-container');

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">Orders</h1>
      <p class="page-subtitle">View and manage all orders</p>
    </div>

    <div class="card">
      <div class="card-header flex items-center justify-between">
        <h2 class="card-title">Filter Orders</h2>
        <select id="order-status-filter" class="form-select" style="width: 200px;">
          <option value="">All Orders</option>
          <option value="pending">Pending</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
    </div>

    <div class="card">
      <div class="table-container" id="orders-table">
        <p class="text-center" style="padding: 40px;">Loading orders...</p>
      </div>
    </div>
  `;

  document.getElementById('order-status-filter').addEventListener('change', (e) => {
    loadOrders(e.target.value);
  });

  loadOrders();
}

async function loadOrders(status = null) {
  const tableDiv = document.getElementById('orders-table');

  try {
    const orders = await API.getOrders(status);

    const html = `
      <table>
        <thead>
          <tr>
            <th>Order ID</th>
            <th>User ID</th>
            <th>Product</th>
            <th>Quantity</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          ${orders.length === 0 ? `
            <tr><td colspan="7" class="text-center" style="padding: 40px;">No orders found.</td></tr>
          ` : orders.map(order => `
            <tr>
              <td><code>${order.id}</code></td>
              <td>${order.discordId}</td>
              <td>${order.productName || 'N/A'}</td>
              <td>${order.quantity || 1}</td>
              <td>Rp ${(order.amount || 0).toLocaleString()}</td>
              <td><span class="badge badge-${getStatusClass(order.status)}">${order.status}</span></td>
              <td>${new Date(order.createdAt).toLocaleString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    tableDiv.innerHTML = html;
  } catch (error) {
    tableDiv.innerHTML = `<div class="alert alert-error">Failed to load orders: ${error.message}</div>`;
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

document.addEventListener('DOMContentLoaded', () => {
  window.navigation.registerPage('orders', renderOrders);
});
