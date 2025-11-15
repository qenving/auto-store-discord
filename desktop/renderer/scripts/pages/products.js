function renderProducts() {
  const container = document.getElementById('content-container');

  container.innerHTML = `
    <div class="page-header">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="page-title">Products</h1>
          <p class="page-subtitle">Manage your products and inventory</p>
        </div>
        <button class="btn btn-primary" onclick="showAddProductModal()">
          + Add Product
        </button>
      </div>
    </div>

    <div class="card">
      <div class="table-container" id="products-table">
        <p class="text-center" style="padding: 40px;">Loading products...</p>
      </div>
    </div>
  `;

  loadProducts();
}

async function loadProducts() {
  try {
    const products = await API.getProducts();

    const tableHtml = `
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Description</th>
            <th>Price</th>
            <th>Status</th>
            <th>Stock</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${products.length === 0 ? `
            <tr><td colspan="7" class="text-center" style="padding: 40px;">No products found. Click "Add Product" to create one.</td></tr>
          ` : products.map(p => `
            <tr>
              <td><code>${p.id}</code></td>
              <td>${p.name}</td>
              <td>${p.description || '-'}</td>
              <td>Rp ${p.price.toLocaleString()}</td>
              <td><span class="badge badge-${p.isActive ? 'success' : 'danger'}">${p.isActive ? 'Active' : 'Inactive'}</span></td>
              <td>${p.stockCount || 0} items</td>
              <td>
                <button class="btn btn-sm btn-outline" onclick="editProduct(${p.id})">Edit</button>
                <button class="btn btn-sm btn-danger" onclick="deleteProduct(${p.id})">Delete</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    document.getElementById('products-table').innerHTML = tableHtml;
  } catch (error) {
    document.getElementById('products-table').innerHTML = `
      <div class="alert alert-error">Failed to load products: ${error.message}</div>
    `;
  }
}

// Placeholder functions - to be implemented
function showAddProductModal() {
  alert('Add Product modal - To be implemented in full version');
}

function editProduct(id) {
  alert(`Edit Product ${id} - To be implemented in full version`);
}

async function deleteProduct(id) {
  if (!confirm('Are you sure you want to delete this product?')) return;

  try {
    await API.deleteProduct(id);
    loadProducts();
  } catch (error) {
    alert('Failed to delete product: ' + error.message);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.navigation.registerPage('products', renderProducts);
});
