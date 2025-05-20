// DOM Elements
const usersTable = document.getElementById('users-table');
const totalUsersCount = document.getElementById('total-users-count');
const activeUsersCount = document.getElementById('active-users-count');
const newUsersCount = document.getElementById('new-users-count');
const userSearch = document.getElementById('user-search');
const paginationStart = document.getElementById('pagination-start');
const paginationEnd = document.getElementById('pagination-end');
const paginationTotal = document.getElementById('pagination-total');
const paginationControls = document.getElementById('pagination-controls');

// User details modal
const userDetailsModal = document.getElementById('user-details-modal');
const userDetailsContent = document.getElementById('user-details-content');
const closeUserDetails = document.getElementById('close-user-details');
const closeUserDetailsBtn = document.getElementById('close-user-details-btn');
const editUserBtn = document.getElementById('edit-user-btn');

// Edit user modal
const editUserModal = document.getElementById('edit-user-modal');
const editUserForm = document.getElementById('edit-user-form');
const editUserId = document.getElementById('edit-user-id');
const editUserName = document.getElementById('edit-user-name');
const editUserEmail = document.getElementById('edit-user-email');
const editUserPassword = document.getElementById('edit-user-password');
const closeEditUser = document.getElementById('close-edit-user');
const saveUserBtn = document.getElementById('save-user-btn');
const deleteUserBtn = document.getElementById('delete-user-btn');

// Confirm delete modal
const confirmDeleteModal = document.getElementById('confirm-delete-modal');
const closeConfirmDelete = document.getElementById('close-confirm-delete');
const cancelDelete = document.getElementById('cancel-delete');
const confirmDelete = document.getElementById('confirm-delete');

// Pagination state
let currentPage = 1;
const pageSize = 10;
let totalUsers = 0;
let filteredUsers = [];

// let USERS_API = 'http://localhost:5000/api';
let USERS_API = 'https://manage-task-backend-2vf9.onrender.com/api';

async function apiRequest(url, method = 'GET', data = null) {
  let token = localStorage.getItem('adminToken');
  try {
    const options = {
      method: method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : null,
    };

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
    }

    // Check the content type of the response
    const contentType = response.headers.get('Content-Type');
    if (contentType && contentType.includes('text/csv')) {
      // If the response is CSV, return it as text
      return await response.text();
    } else {
      // Otherwise, parse it as JSON
      return await response.json();
    }
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

// Initialize users page
async function initUsersPage() {
  try {
    // Load all users
    await loadUsers();
    // Set up event listeners
    setupEventListeners();
  } catch (error) {
    console.error('Error initializing users page:', error);
    showNotification('Failed to load users data', 'error');
  }
}

// Load users
async function loadUsers(page = 1, searchTerm = '') {
  // Get users
  const users = await apiRequest(`${USERS_API}/admin/users`);
  try {
    // Show loading
    usersTable.innerHTML = '<tr><td colspan="5" class="text-center">Loading users...</td></tr>';
    
    // Filter users if search term is provided
    filteredUsers = searchTerm 
      ? users.filter(user => 
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
          user.email.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : [...users];
    
    // Update stats
    updateUserStats(users);
    
    // Update pagination
    totalUsers = filteredUsers.length;
    updatePagination(page);
    
    // Get paginated users
    const startIndex = (page - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalUsers);
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
    
    // Render users
    if (paginatedUsers.length === 0) {
      usersTable.innerHTML = '<tr><td colspan="5" class="text-center">No users found</td></tr>';
      return;
    }
    
    // Get task counts for each user
    const userStats = await Promise.all(
      paginatedUsers.map(user => apiRequest(`${USERS_API}/admin/users/${user._id}/stats`))
    );
    
    // Combine user data with stats
    const usersWithStats = paginatedUsers.map((user, index) => ({
      ...user,
      stats: userStats[index].stats
    }));
    
    // Render users
    usersTable.innerHTML = usersWithStats.map(user => `
      <tr>
        <td>${user.name}</td>
        <td>${user.email}</td>
        <td>${user.stats.totalTasks} (${user.stats.completedTasks} completed)</td>
        <td>${formatDate(user.createdAt)}</td>
        <td>
          <button class="btn btn-sm btn-primary view-user-btn" data-id="${user._id}">
            <i class="fas fa-eye"></i>
          </button>
          <button class="btn btn-sm btn-secondary edit-user-btn" data-id="${user._id}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-sm btn-danger delete-user-btn" data-id="${user._id}">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');
    
    // Add event listeners to buttons
    document.querySelectorAll('.view-user-btn').forEach(btn => {
      btn.addEventListener('click', () => viewUser(btn.dataset.id));
    });
    
    document.querySelectorAll('.edit-user-btn').forEach(btn => {
      btn.addEventListener('click', () => openEditUserModal(btn.dataset.id));
    });
    
    document.querySelectorAll('.delete-user-btn').forEach(btn => {
      btn.addEventListener('click', () => openDeleteUserModal(btn.dataset.id));
    });
  } catch (error) {
    console.error('Error loading users:', error);
    usersTable.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Failed to load users</td></tr>';
  }
}

function formatDate(dateString) {
  if(dateString){
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  }
}

// Update user stats
function updateUserStats(users) {
  // Total users
  totalUsersCount.textContent = users.length;
  
  // Active users (users with at least one task)
  // In a real app, you would calculate this from the database
  // For this demo, we'll just use a random number
  const activeUsers = Math.floor(users.length * 0.8);
  activeUsersCount.textContent = activeUsers;
  
  // New users (joined this week)
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  const newUsers = users.filter(user => new Date(user.createdAt) >= oneWeekAgo).length;
  newUsersCount.textContent = newUsers;
}

// Update pagination
function updatePagination(page) {
  // Update current page
  currentPage = page;
  
  // Calculate start and end indices
  const startIndex = (page - 1) * pageSize + 1;
  const endIndex = Math.min(startIndex + pageSize - 1, totalUsers);
  
  // Update pagination info
  paginationStart.textContent = totalUsers > 0 ? startIndex : 0;
  paginationEnd.textContent = endIndex;
  paginationTotal.textContent = totalUsers;
  
  // Generate pagination controls
  const totalPages = Math.ceil(totalUsers / pageSize);
  
  let paginationHTML = '';
  
  // Previous button
  paginationHTML += `
    <button class="pagination-button" ${page === 1 ? 'disabled' : ''} data-page="${page - 1}">
      <i class="fas fa-chevron-left"></i>
    </button>
  `;
  
  // Page buttons
  const maxButtons = 5;
  const startPage = Math.max(1, page - Math.floor(maxButtons / 2));
  const endPage = Math.min(totalPages, startPage + maxButtons - 1);
  
  for (let i = startPage; i <= endPage; i++) {
    paginationHTML += `
      <button class="pagination-button ${i === page ? 'active' : ''}" data-page="${i}">
        ${i}
      </button>
    `;
  }
  
  // Next button
  paginationHTML += `
    <button class="pagination-button" ${page === totalPages ? 'disabled' : ''} data-page="${page + 1}">
      <i class="fas fa-chevron-right"></i>
    </button>
  `;
  
  // Update pagination controls
  paginationControls.innerHTML = paginationHTML;
  
  // Add event listeners to pagination buttons
  document.querySelectorAll('.pagination-button:not([disabled])').forEach(btn => {
    btn.addEventListener('click', () => {
      loadUsers(parseInt(btn.dataset.page), userSearch.value);
    });
  });
}

// View user details
async function viewUser(userId) {
  try {
    // Show modal
    userDetailsModal.classList.add('show');
    
    // Show loading
    userDetailsContent.innerHTML = '<div class="text-center">Loading user details...</div>';
    
    // Get user data
    const user = await apiRequest(`${USERS_API}/admin/users/${userId}`);
    
    // Get user stats
    const userStats = await apiRequest(`${USERS_API}/admin/users/${userId}/stats`);
    
    // Render user details
    userDetailsContent.innerHTML = `
      <div class="user-details">
        <div class="user-avatar-large mb-3">
          <span>${user.name.charAt(0).toUpperCase()}</span>
        </div>
        
        <div class="user-info-group mb-3">
          <h4 class="user-name">${user.name}</h4>
          <p class="user-email">${user.email}</p>
          <p class="user-joined">Joined: ${formatDate(user.createdAt)}</p>
        </div>
        
        <div class="user-stats-grid">
          <div class="user-stat-card">
            <div class="stat-value">${userStats.stats.totalTasks}</div>
            <div class="stat-label">Total Tasks</div>
          </div>
          
          <div class="user-stat-card">
            <div class="stat-value">${userStats.stats.completedTasks}</div>
            <div class="stat-label">Completed</div>
          </div>
          
          <div class="user-stat-card">
            <div class="stat-value">${userStats.stats.pendingTasks}</div>
            <div class="stat-label">Pending</div>
          </div>
          
          <div class="user-stat-card">
            <div class="stat-value">${userStats.stats.categoryCount}</div>
            <div class="stat-label">Categories</div>
          </div>
        </div>
        
        <div class="user-activity mb-3">
          <h5>Recent Activity</h5>
          <div class="activity-chart-container">
            <canvas id="user-activity-chart"></canvas>
          </div>
        </div>
      </div>
    `;
    
    // Store user ID for edit button
    editUserBtn.dataset.id = userId;
    
    // Initialize activity chart
    const activityChartCtx = document.getElementById('user-activity-chart');
    if (activityChartCtx) {
      const dailyCreation = userStats.stats.dailyTaskCreation;
      const dailyCompletion = userStats.stats.dailyTaskCompletion;
      
      new Chart(activityChartCtx, {
        type: 'line',
        data: {
          labels: dailyCreation.map(item => {
            const date = new Date(item.date);
            return date.toLocaleDateString('en-US', { weekday: 'short' });
          }),
          datasets: [
            {
              label: 'Tasks Created',
              data: dailyCreation.map(item => item.count),
              borderColor: '#6c5ce7',
              backgroundColor: 'rgba(108, 92, 231, 0.1)',
              tension: 0.4,
              fill: true
            },
            {
              label: 'Tasks Completed',
              data: dailyCompletion.map(item => item.count),
              borderColor: '#00b894',
              backgroundColor: 'rgba(0, 184, 148, 0.1)',
              tension: 0.4,
              fill: true
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom'
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                precision: 0
              }
            }
          }
        }
      });
    }
  } catch (error) {
    console.error('Error loading user details:', error);
    userDetailsContent.innerHTML = '<div class="text-center text-danger">Failed to load user details</div>';
  }
}

// Open edit user modal
async function openEditUserModal(userId) {
  try {
    // Close user details modal if open
    userDetailsModal.classList.remove('show');
    
    // Show edit user modal
    editUserModal.classList.add('show');
    
    // Clear form
    editUserForm.reset();
    
    // Get user data
    const user = await apiRequest(`${USERS_API}/admin/users/${userId}`);
    
    // Populate form
    editUserId.value = userId;
    editUserName.value = user.name;
    editUserEmail.value = user.email;
    
    // Store user ID for delete button
    deleteUserBtn.dataset.id = userId;
  } catch (error) {
    console.error('Error loading user for edit:', error);
    showNotification('Failed to load user data', 'error');
    editUserModal.classList.remove('show');
  }
}

// Open delete user modal
function openDeleteUserModal(userId) {
  // Close other modals
  userDetailsModal.classList.remove('show');
  editUserModal.classList.remove('show');
  
  // Show confirm delete modal
  confirmDeleteModal.classList.add('show');
  
  // Store user ID for delete button
  confirmDelete.dataset.id = userId;
}

// Save user changes
async function saveUserChanges() {
  try {
    const userId = editUserId.value;
    const name = editUserName.value.trim();
    const email = editUserEmail.value.trim();
    const password = editUserPassword.value.trim();
    
    // Validate form
    if (!name || !email) {
      showNotification('Name and email are required', 'error');
      return;
    }
    
    // Prepare data
    const userData = { name, email };
    
    // Update user
    await apiRequest(`${USERS_API}/admin/users/${userId}`, 'PUT', userData);
    
    // Reset password if provided
    if (password) {
      if (password.length < 6) {
        showNotification('Password must be at least 6 characters long', 'error');
        return;
      }
      
      await apiRequest(`${USERS_API}/admin/users/${userId}/reset-password`, 'POST', { newPassword: password });
    }
    
    // Close modal
    editUserModal.classList.remove('show');
    
    // Show success message
    showNotification('User updated successfully', 'success');
    
    // Reload users
    loadUsers(currentPage, userSearch.value);
  } catch (error) {
    console.error('Error saving user changes:', error);
    showNotification('Failed to update user', 'error');
  }
}

// Delete user
async function deleteUser(userId) {
  try {
    // Delete user
    await apiRequest(`${USERS_API}/admin/users/${userId}`, 'DELETE');
    
    // Close modal
    confirmDeleteModal.classList.remove('show');
    
    // Show success message
    showNotification('User deleted successfully', 'success');
    
    // Reload users
    loadUsers(currentPage, userSearch.value);
  } catch (error) {
    console.error('Error deleting user:', error);
    showNotification('Failed to delete user', 'error');
  }
}

// Setup event listeners
function setupEventListeners() {
  // Search input
  userSearch.addEventListener('input', debounce(() => {
    loadUsers(1, userSearch.value);
  }, 300));
  
  // User details modal
  closeUserDetails.addEventListener('click', () => {
    userDetailsModal.classList.remove('show');
  });
  
  closeUserDetailsBtn.addEventListener('click', () => {
    userDetailsModal.classList.remove('show');
  });
  
  editUserBtn.addEventListener('click', () => {
    openEditUserModal(editUserBtn.dataset.id);
  });
  
  // Edit user modal
  closeEditUser.addEventListener('click', () => {
    editUserModal.classList.remove('show');
  });
  
  saveUserBtn.addEventListener('click', saveUserChanges);
  
  deleteUserBtn.addEventListener('click', () => {
    openDeleteUserModal(deleteUserBtn.dataset.id);
  });
  
  // Confirm delete modal
  closeConfirmDelete.addEventListener('click', () => {
    confirmDeleteModal.classList.remove('show');
  });
  
  cancelDelete.addEventListener('click', () => {
    confirmDeleteModal.classList.remove('show');
  });
  
  confirmDelete.addEventListener('click', () => {
    deleteUser(confirmDelete.dataset.id);
  });
  
  // Close modals when clicking outside
  userDetailsModal.addEventListener('click', (e) => {
    if (e.target === userDetailsModal) {
      userDetailsModal.classList.remove('show');
    }
  });
  
  editUserModal.addEventListener('click', (e) => {
    if (e.target === editUserModal) {
      editUserModal.classList.remove('show');
    }
  });
  
  confirmDeleteModal.addEventListener('click', (e) => {
    if (e.target === confirmDeleteModal) {
      confirmDeleteModal.classList.remove('show');
    }
  });
}

// Helper function for debouncing
function debounce(func, delay) {
  let timeout;
  return function() {
    const context = this;
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), delay);
  };
}

// Add styles for user details
const style = document.createElement('style');
style.textContent = `
  .user-details {
    padding: 10px 1rem;
  }
  
  .user-avatar-large {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background-color: var(--admin-primary);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    font-weight: 600;
    margin: 0 auto;
  }
  
  .user-info-group {
    text-align: center;
  }
  
  .user-name {
    font-size: 1.5rem;
    margin-bottom: 0.25rem;
  }
  
  .user-email {
    color: var(--admin-gray);
    margin-bottom: 0.25rem;
  }
  
  .user-joined {
    font-size: 0.875rem;
    color: var(--admin-gray);
  }
  
  .user-stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  
  .user-stat-card {
    background-color: var(--admin-gray-light);
    border-radius: var(--admin-radius);
    padding: 1rem;
    text-align: center;
  }
  
  .stat-value {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 0.25rem;
  }
  
  .stat-label {
    font-size: 0.875rem;
    color: var(--admin-gray);
  }
  
  .activity-chart-container {
    height: 200px;
    margin-top: 1rem;
  }
  
  @media (max-width: 768px) {
    .user-stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
`;
document.head.appendChild(style);

// Initialize users page when DOM is loaded
document.addEventListener('DOMContentLoaded', initUsersPage);
