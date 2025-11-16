// Auto-Store Desktop GUI - JavaScript

// Load configuration on page load
window.addEventListener('DOMContentLoaded', async () => {
    await loadConfig();
    await loadStats();
    await loadProducts();
    await loadOrders();

    // Auto-refresh every 30 seconds
    setInterval(async () => {
        await loadStats();
        await loadOrders();
    }, 30000);
});

// Load configuration
async function loadConfig() {
    try {
        const config = await eel.get_config()();

        document.getElementById('config-mode').textContent = config.mode;
        document.getElementById('config-db').textContent = config.database;
        document.getElementById('config-bot').textContent = config.bot_enabled ? '✅ Yes' : '❌ No';
        document.getElementById('config-web').textContent = config.web_enabled ? '✅ Yes' : '❌ No';
    } catch (error) {
        console.error('Error loading config:', error);
    }
}

// Load statistics
async function loadStats() {
    try {
        const stats = await eel.get_stats()();

        if (stats.error) {
            console.error('Stats error:', stats.error);
            return;
        }

        document.getElementById('stat-users').textContent = stats.users.toLocaleString();
        document.getElementById('stat-products').textContent = stats.products.toLocaleString();
        document.getElementById('stat-orders').textContent = stats.orders.toLocaleString();
        document.getElementById('stat-sales').textContent = `Rp ${stats.total_sales.toLocaleString('id-ID', {minimumFractionDigits: 0})}`;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load products
async function loadProducts() {
    const tbody = document.getElementById('products-body');
    tbody.innerHTML = '<tr><td colspan="5" class="loading">Loading products...</td></tr>';

    try {
        const products = await eel.get_products(true)();

        if (products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="loading">No products found</td></tr>';
            return;
        }

        tbody.innerHTML = products.map(product => {
            const price = product.discount_price
                ? `<span style="text-decoration: line-through;">Rp ${product.price.toLocaleString('id-ID')}</span> <strong>Rp ${product.discount_price.toLocaleString('id-ID')}</strong>`
                : `Rp ${product.price.toLocaleString('id-ID')}`;

            const stock = product.available_stock > 0
                ? `${product.available_stock} / ${product.total_stock}`
                : '<span style="color: #f44336;">Out of Stock</span>';

            const status = product.is_active
                ? '<span class="status-active">Active</span>'
                : '<span class="status-inactive">Inactive</span>';

            return `
                <tr>
                    <td><strong>${product.code}</strong></td>
                    <td>${product.name}</td>
                    <td>${price}</td>
                    <td>${stock}</td>
                    <td>${status}</td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading products:', error);
        tbody.innerHTML = '<tr><td colspan="5" class="loading" style="color: #f44336;">Error loading products</td></tr>';
    }
}

// Load orders
async function loadOrders() {
    const tbody = document.getElementById('orders-body');
    tbody.innerHTML = '<tr><td colspan="4" class="loading">Loading orders...</td></tr>';

    try {
        const orders = await eel.get_recent_orders(10)();

        if (orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" class="loading">No orders found</td></tr>';
            return;
        }

        tbody.innerHTML = orders.map(order => {
            const date = new Date(order.created_at);
            const dateStr = date.toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            const statusClass = `status-${order.status.toLowerCase()}`;
            const status = `<span class="${statusClass}">${order.status.toUpperCase()}</span>`;

            return `
                <tr>
                    <td><strong>${order.order_number}</strong></td>
                    <td>${status}</td>
                    <td>Rp ${order.total.toLocaleString('id-ID', {minimumFractionDigits: 0})}</td>
                    <td>${dateStr}</td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading orders:', error);
        tbody.innerHTML = '<tr><td colspan="4" class="loading" style="color: #f44336;">Error loading orders</td></tr>';
    }
}
