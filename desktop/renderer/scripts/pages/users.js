function renderUsers() {
  const container = document.getElementById('content-container');

  container.innerHTML = `
    <div class="page-header">
      <h1 class="page-title">Users</h1>
      <p class="page-subtitle">Manage registered users</p>
    </div>

    <div class="card">
      <div class="table-container" id="users-table">
        <p class="text-center" style="padding: 40px;">Loading users...</p>
      </div>
    </div>
  `;

  loadUsers();
}

async function loadUsers() {
  const tableDiv = document.getElementById('users-table');

  try {
    const users = await API.getUsers();

    const html = `
      <table>
        <thead>
          <tr>
            <th>Discord ID</th>
            <th>Username</th>
            <th>Balance</th>
            <th>Total Orders</th>
            <th>Joined</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${users.length === 0 ? `
            <tr><td colspan="6" class="text-center" style="padding: 40px;">No users found.</td></tr>
          ` : users.map(user => `
            <tr>
              <td><code>${user.discordId}</code></td>
              <td>${user.username || 'N/A'}</td>
              <td>Rp ${(user.balance || 0).toLocaleString()}</td>
              <td>${user.totalOrders || 0}</td>
              <td>${new Date(user.createdAt).toLocaleDateString()}</td>
              <td>
                <button class="btn btn-sm btn-outline" onclick="editUserBalance('${user.discordId}')">Edit Balance</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    tableDiv.innerHTML = html;
  } catch (error) {
    tableDiv.innerHTML = `<div class="alert alert-error">Failed to load users: ${error.message}</div>`;
  }
}

function editUserBalance(discordId) {
  const amount = prompt('Enter balance change amount (positive to add, negative to subtract):');
  if (!amount) return;

  const reason = prompt('Enter reason for balance change:');

  API.updateUserBalance(discordId, parseInt(amount), reason || 'Manual adjustment')
    .then(() => {
      alert('Balance updated successfully!');
      loadUsers();
    })
    .catch(error => {
      alert('Failed to update balance: ' + error.message);
    });
}

document.addEventListener('DOMContentLoaded', () => {
  window.navigation.registerPage('users', renderUsers);
});
