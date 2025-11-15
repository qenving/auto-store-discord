function renderStock() {
  const container = document.getElementById('content-container');

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">Stock Management</h1>
      <p class="page-subtitle">Manage product stock inventory</p>
    </div>

    <div class="card">
      <div class="card-header">
        <h2 class="card-title">Select Product</h2>
      </div>
      <div class="form-group">
        <select id="stock-product-select" class="form-select">
          <option value="">Loading products...</option>
        </select>
      </div>
    </div>

    <div id="stock-content"></div>
  `;

  loadProductsForStock();
}

async function loadProductsForStock() {
  try {
    const products = await API.getProducts();
    const select = document.getElementById('stock-product-select');

    select.innerHTML = `
      <option value="">-- Select a product --</option>
      ${products.map(p => `<option value="${p.id}">${p.name} (Rp ${p.price.toLocaleString()})</option>`).join('')}
    `;

    select.addEventListener('change', (e) => {
      if (e.target.value) {
        loadStockForProduct(e.target.value);
      }
    });
  } catch (error) {
    console.error('Error loading products:', error);
  }
}

async function loadStockForProduct(productId) {
  const content = document.getElementById('stock-content');
  content.innerHTML = '<div class="card"><p class="text-center" style="padding: 20px;">Loading stock...</p></div>';

  try {
    const stock = await API.getStock(productId);

    content.innerHTML = `
      <div class="card">
        <div class="card-header flex items-center justify-between">
          <h2 class="card-title">Stock Items (${stock.length})</h2>
          <div class="flex gap-2">
            <button class="btn btn-sm btn-primary" onclick="showAddStockModal(${productId})">+ Add Single</button>
            <button class="btn btn-sm btn-success" onclick="showBulkStockModal(${productId})">📋 Bulk Upload</button>
            <button class="btn btn-sm btn-danger" onclick="clearAllStock(${productId})">🗑️ Clear All</button>
          </div>
        </div>

        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Stock Data</th>
                <th>Status</th>
                <th>Added At</th>
              </tr>
            </thead>
            <tbody>
              ${stock.length === 0 ? `
                <tr><td colspan="4" class="text-center" style="padding: 40px;">No stock available. Add stock using the buttons above.</td></tr>
              ` : stock.map((item, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td><code>${item.data}</code></td>
                  <td><span class="badge badge-${item.isUsed ? 'danger' : 'success'}">${item.isUsed ? 'Used' : 'Available'}</span></td>
                  <td>${new Date(item.createdAt).toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } catch (error) {
    content.innerHTML = `<div class="alert alert-error">Failed to load stock: ${error.message}</div>`;
  }
}

function showAddStockModal(productId) {
  alert('Add Stock modal - To be implemented');
}

function showBulkStockModal(productId) {
  alert('Bulk Upload modal - To be implemented');
}

async function clearAllStock(productId) {
  if (!confirm('Are you sure you want to clear all stock for this product?')) return;

  try {
    await API.clearStock(productId);
    loadStockForProduct(productId);
  } catch (error) {
    alert('Failed to clear stock: ' + error.message);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.navigation.registerPage('stock', renderStock);
});
