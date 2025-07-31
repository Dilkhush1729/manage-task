// DOM Elements
const profileForm = document.getElementById('profile-form');
const adminDisplayName = document.getElementById('admin-display-name');
const adminEmail = document.getElementById('admin-email');
const saveProfileBtn = document.getElementById('save-profile-btn');
const currentPasswordInput = document.getElementById('current-password');
const newPasswordInput = document.getElementById('new-password');

const passwordForm = document.getElementById('password-form');
const currentPassword = document.getElementById('current-password');
const newPassword = document.getElementById('new-password');
const confirmPassword = document.getElementById('confirm-password');

const secondaryAdminContainer = document.getElementById('secondary-admin-container');
const addAdminBtn = document.getElementById('add-admin-btn');

const appearanceForm = document.getElementById('appearance-form');
const themeOptions = document.querySelectorAll('.theme-option');
const sidebarPositionRadios = document.querySelectorAll('input[name="sidebar-position"]');
const saveAppearanceBtn = document.getElementById('save-appearance-btn');

// Create secondary admin modal
const createAdminModal = document.getElementById('create-admin-modal');
const adminModal = document.getElementById('create-admin-modal-content');
const createAdminForm = document.getElementById('create-admin-form');
const secondaryAdminName = document.getElementById('secondary-admin-name');
const secondaryAdminEmail = document.getElementById('secondary-admin-email');
const secondaryAdminPassword = document.getElementById('secondary-admin-password');
const secondaryAdminConfirmPassword = document.getElementById('secondary-admin-confirm-password');
const closeCreateAdmin = document.getElementById('close-create-admin');
const cancelCreateAdmin = document.getElementById('cancel-create-admin');
const saveAdminBtn = document.getElementById('save-admin-btn');

// Confirm delete modal
const confirmDeleteAdminModal = document.getElementById('confirm-delete-admin-modal');
const closeConfirmDeleteAdmin = document.getElementById('close-confirm-delete-admin');
const cancelDeleteAdmin = document.getElementById('cancel-delete-admin');
const confirmDeleteAdmin = document.getElementById('confirm-delete-admin');

let API_URL = 'http://localhost:5000/api'; // Replace with your actual API URL
// let API_URL = 'https://manage-task-backend-2vf9.onrender.com/api';

let isEditMode = false;
let editingAdminId = null;

async function apiRequest(url, method = 'GET', data = null) {
  const token = localStorage.getItem('adminToken');
  try {
    const options = {
      method: method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`${API_URL}${url}`, options);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// Show notification
function showToast(message, type = 'success', duration = 5000) {
  // Create notification element if it doesn't exist
  let notificationContainer = document.querySelector('.notification-container');

  if (!notificationContainer) {
    notificationContainer = document.createElement('div');
    notificationContainer.className = 'notification-container';
    document.body.appendChild(notificationContainer);

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .notification-container {
        position: fixed;
        top: 10px;
        right: 20px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-width: 350px;
      }
      
      .notification {
        padding: 15px 20px;
        border-radius: var(--admin-radius);
        box-shadow: var(--admin-shadow);
        display: flex;
        align-items: center;
        gap: 10px;
        animation: slideInRight 0.3s ease-out forwards;
        position: relative;
        overflow: hidden;
      }
      
      .notification.success {
        background-color: var(--admin-success);
        color: white;
      }
      
      .notification.error {
        background-color: var(--admin-danger);
        color: white;
      }
      
      .notification.info {
        background-color: var(--admin-info);
        color: white;
      }
      
      .notification.warning {
        background-color: var(--admin-warning);
        color: var(--admin-dark);
      }
      
      .notification-icon {
        font-size: 1.25rem;
      }
      
      .notification-message {
        flex: 1;
      }
      
      .notification-close {
        background: none;
        border: none;
        color: inherit;
        cursor: pointer;
        opacity: 0.7;
        transition: opacity 0.2s;
        font-size: 1rem;
      }
      
      .notification-close:hover {
        opacity: 1;
      }
      
      .notification-progress {
        position: absolute;
        bottom: 0;
        left: 0;
        height: 3px;
        background-color: rgba(255, 255, 255, 0.5);
        width: 100%;
        transform-origin: left;
      }
      
      @keyframes slideInRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      @keyframes slideOutRight {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Create notification
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;

  // Icon based on type
  let icon;
  switch (type) {
    case 'success':
      icon = 'fas fa-check-circle';
      break;
    case 'error':
      icon = 'fas fa-exclamation-circle';
      break;
    case 'info':
      icon = 'fas fa-info-circle';
      break;
    case 'warning':
      icon = 'fas fa-exclamation-triangle';
      break;
    default:
      icon = 'fas fa-bell';
  }

  // Create notification content
  notification.innerHTML = `
    <div class="notification-icon">
      <i class="${icon}"></i>
    </div>
    <div class="notification-message">${message}</div>
    <button class="notification-close">
      <i class="fas fa-times"></i>
    </button>
    <div class="notification-progress"></div>
  `;

  // Add to container
  notificationContainer.appendChild(notification);

  // Animate progress bar
  const progressBar = notification.querySelector('.notification-progress');
  progressBar.style.animation = `shrinkWidth ${duration / 1000}s linear forwards`;
  progressBar.style.animationFillMode = 'forwards';

  // Add keyframes for progress bar if not already added
  if (!document.querySelector('#notification-keyframes')) {
    const keyframes = document.createElement('style');
    keyframes.id = 'notification-keyframes';
    keyframes.textContent = `
      @keyframes shrinkWidth {
        from { width: 100%; }
        to { width: 0%; }
      }
    `;
    document.head.appendChild(keyframes);
  }

  // Close button event
  const closeButton = notification.querySelector('.notification-close');
  closeButton.addEventListener('click', () => {
    closeNotification(notification);
  });

  // Auto close after duration
  setTimeout(() => {
    closeNotification(notification);
  }, duration);

  // Close notification function
  function closeNotification(notif) {
    notif.style.animation = 'slideOutRight 0.3s ease-in forwards';
    setTimeout(() => {
      notif.remove();
    }, 300);
  }
}

// Initialize settings page
async function initSettingsPage() {
  try {
    // Load admin profile
    await loadAdminProfile();
    
    // Load secondary admin info
    await loadSecondaryAdmins();

    // Set up event listeners
    setupEventListeners();
  } catch (error) {
    console.error('Error initializing settings page:', error);
    showToast('Failed to load settings', 'error');
  }
}

// Load admin profile
async function loadAdminProfile() {
  try {
    // Get current admin data
    const admin = await apiRequest('/admin/me');
    console.log('Admin profile loaded:', admin.email);

    if (admin.email === 'admin@taskmanager.com') {
      document.getElementById('secondary-admin-display').style.display = 'block';
    } else {
      document.getElementById('secondary-admin-display').style.display = 'none';
    }
    // Populate form fields
    adminDisplayName.value = admin.name;
    adminEmail.value = admin.email;
    
    // Update header display name
    const adminNameEl = document.getElementById('admin-name');
    if (adminNameEl) {
      adminNameEl.textContent = admin.name;
    }
    
    // Update avatar letter
    const userAvatarSpan = document.querySelector('.user-avatar span');
    if (userAvatarSpan) {
      userAvatarSpan.textContent = admin.name.charAt(0).toUpperCase();
    }
  } catch (error) {
    console.error('Error loading admin profile:', error);
    showToast('Failed to load profile information', 'error');
  }
}

// Load secondary admins
async function loadSecondaryAdmins() {
  try {
    // Show loading
    secondaryAdminContainer.innerHTML = '<p class="text-center">Loading administrators...</p>';
    
    // Get secondary admins
    const admins = await apiRequest('/admin/secondary-admin');
    
    // Render admins list
    if (admins.length === 0) {
      secondaryAdminContainer.innerHTML = '<p class="text-center">No secondary administrators found.</p>';
      return;
    }
    
    const adminsList = document.createElement('ul');
    adminsList.className = 'admin-list';

    // Create the table structure once
    const table = document.createElement('table');
    table.className = 'admin-item-table';
    table.style.width = '100%';
    table.style.color = '#000';
    table.style.borderCollapse = 'collapse';
    table.style.marginBottom = '10px';

    table.innerHTML = `
      <thead>
        <tr style="background-color: #f5f5f5;">
          <th style="padding: 8px; border: 1px solid #ddd;">Avatar</th>
          <th style="padding: 8px; border: 1px solid #ddd;">Name</th>
          <th style="padding: 8px; border: 1px solid #ddd;">Email</th>
          <th style="padding: 8px; border: 1px solid #ddd;">Actions</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;

    const tbody = table.querySelector('tbody');
    admins.forEach(admin => {
      const row = document.createElement('tr');
      row.style.textAlign = 'center';
      row.style.color = 'var(--admin-primary)';

      row.innerHTML = `
        <td style="padding: 8px; border: 1px solid #ddd; display: flex; justify-content: center; align-items: center;">
          <div class="user-avatar">
            <span style="background:#333; color:#fff; padding:6px 10px; border-radius:50%;">
              ${admin.name.charAt(0).toUpperCase()}
            </span>
          </div>
        </td>
        <td style="padding: 8px; border: 1px solid #ddd;">${admin.name}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${admin.email}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">
          <button class="btn btn-sm btn-danger delete-admin-btn" data-id="${admin._id}">
            <i class="fas fa-trash"></i>
          </button>
          <button class="btn btn-sm btn-primary edit-admin-btn" data-id="${admin._id}">
            <i class="fas fa-edit"></i>
          </button>
        </td>
      `;

      tbody.appendChild(row);
    });

    // Append the table to adminsList
    adminsList.appendChild(table);

    secondaryAdminContainer.innerHTML = '';
    secondaryAdminContainer.appendChild(adminsList);
    
    // Add event listeners to delete buttons
    document.querySelectorAll('.delete-admin-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const adminId = btn.getAttribute('data-id');
        openDeleteAdminModal(adminId);
      });
    });
    // Add event listeners to edit buttons
    document.querySelectorAll('.edit-admin-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const adminId = btn.getAttribute('data-id');
        const selectedAdmin = admins.find(a => a._id === adminId);
        openEditAdminModal(selectedAdmin);
      });
    });

  } catch (error) {
    console.error('Error loading secondary admins:', error);
    secondaryAdminContainer.innerHTML = '<p class="text-center text-danger">Failed to load administrators.</p>';
  }
}

// Save profile changes
async function saveProfileChanges(e) {
  e.preventDefault();
  try {
    const name = adminDisplayName.value.trim();
    const email = adminEmail.value.trim();
    const currentPassword = currentPasswordInput.value.trim();
    const newPassword = newPasswordInput.value.trim();

    // Validate form
    if (!name || !email || !currentPassword) {
      showToast('Name, email, and current password are required', 'error');
      return;
    }

    if (newPassword && newPassword.length < 6) {
      showToast('New password must be at least 6 characters long', 'error');
      return;
    }
    
    // Prepare data
    const profileData = {
      name,
      email,
      currentPassword,
      ...(newPassword ? { newPassword } : {}) // Only include newPassword if provided
    };

    // Send update request
    await apiRequest('/admin/update-credentials', 'PUT', profileData);

    showToast('Profile updated successfully', 'success');

    // Reload admin profile to update UI
    await loadAdminProfile();

    // Reset password fields
    currentPasswordInput.value = '';
    newPasswordInput.value = '';
  } catch (error) {
    console.error('Error saving profile changes:', error);
    showToast(error.message || 'Failed to update profile', 'error');
  }
}

// Save appearance settings
function saveAppearanceSettings() {
  try {
    // Get selected theme
    const selectedTheme = document.querySelector('.theme-option.selected').dataset.theme;
    
    // Save theme preference to local storage
    localStorage.setItem('admin-theme', selectedTheme);
    
    // Get selected sidebar position
    const sidebarPosition = document.querySelector('input[name="sidebar-position"]:checked').value;
    
    // Save sidebar position to local storage
    localStorage.setItem('sidebar-position', sidebarPosition);
    // Show success message
    showToast('Appearance settings saved successfully', 'success');
  } catch (error) {
    console.error('Error saving appearance settings:', error);
    showToast('Failed to save appearance settings', 'error');
  }
}

// Open create admin modal
function openCreateAdminModal() {
  isEditMode = false;
  editingAdminId = null;
  let adminModalTitle = document.getElementById('admin-modal-title');

  createAdminForm.reset();
  if (adminModalTitle) {
    adminModalTitle.textContent = 'Add New Admin';
  }

  saveAdminBtn.textContent = 'Create Admin';
  createAdminModal.classList.add('show');
  adminModal.style.display = 'block';
}

// Open modal for Edit
function openEditAdminModal(admin) {
  console.log('Opening edit modal for admin:', admin);
  const adminData = Array.isArray(admin) ? admin[0] : admin;
  isEditMode = true;
  editingAdminId = adminData._id;
  console.log('Editing admin ID:', editingAdminId);

  // Pre-fill form
  secondaryAdminName.value = adminData.name;
  secondaryAdminEmail.value = adminData.email;
  secondaryAdminPassword.value = '';
  secondaryAdminConfirmPassword.value = '';
  let adminModalTitle = document.getElementById('admin-modal-title');

  adminModalTitle.textContent = 'Edit Admin';
  saveAdminBtn.textContent = 'Update Admin';

  createAdminModal.classList.add('show');
  adminModal.style.display = 'block';
}

// Open delete admin modal
function openDeleteAdminModal(adminId) {
  // Show modal
  confirmDeleteAdminModal.classList.add('show');
  
  // Store admin ID for delete button
  confirmDeleteAdmin.dataset.id = adminId;
}

// Create new admin
async function createAdmin() {
  try {
    const name = secondaryAdminName.value.trim();
    const email = secondaryAdminEmail.value.trim();
    const password = secondaryAdminPassword.value;
    const confirmPassword = secondaryAdminConfirmPassword.value;
    if (!validateForm(name, email, password, confirmPassword)) return;
    const adminData = { name, email, password };

    await apiRequest('/admin/create-secondary', 'POST', adminData);
    createAdminModal.classList.remove('show');
    adminModal.style.display = 'none';
    // Show success message
    showToast('Administrator added successfully', 'success');

    // Reload secondary admins
    await loadSecondaryAdmins();
  } catch (error) {
    console.error('Error creating admin:', error);
    showToast('Failed to add administrator', 'error');
  }
}

// Update admin
async function updateAdmin() {
  try {
    const name = secondaryAdminName.value.trim();
    const email = secondaryAdminEmail.value.trim();
    const password = secondaryAdminPassword.value;
    const confirmPassword = secondaryAdminConfirmPassword.value;

    if (!validateForm(name, email, password, confirmPassword, true)) return;

    const adminData = { name, email };
    if (password) adminData.password = password;

    await apiRequest(`/admin/secondary-admin/${editingAdminId}`, 'PUT', adminData);

    createAdminModal.classList.remove('show');
    adminModal.style.display = 'none';

    showToast('Admin data updated successfully', 'success');
    await loadSecondaryAdmins();
  } catch (error) {
    console.error('Error updating admin:', error);
    showToast('Failed to update administrator', 'error');
  }
}

// Common validation
function validateForm(name, email, password, confirmPassword, isEdit = false) {
  if (!name || !email || (!isEdit && (!password || !confirmPassword))) {
    showToast('All fields are required', 'error');
    return false;
  }
  if (!isEdit && password !== confirmPassword) {
    showToast('Passwords do not match', 'error');
    return false;
  }
  if (password && password.length < 6) {
    showToast('Password must be at least 6 characters long', 'error');
    return false;
  }
  return true;
}



// Delete admin
async function deleteAdmin(adminId) {
  try {
    // Delete admin
    await apiRequest(`/admin/secondary-admin/${adminId}`, 'DELETE');
    // Close modal
    confirmDeleteAdminModal.classList.remove('show');
    // Show success message
    showToast('Administrator removed successfully', 'success');
    // Reload secondary admins
    await loadSecondaryAdmins();
  } catch (error) {
    console.error('Error deleting admin:', error);
    showToast('Failed to remove administrator', 'error');
  }
}

// Setup event listeners
function setupEventListeners() {
  // Profile form
  if (saveProfileBtn) {
    saveProfileBtn.addEventListener('click', saveProfileChanges);
  }
  // Theme options
  if (themeOptions && themeOptions.length > 0) {
    themeOptions.forEach(option => {
      option.addEventListener('click', () => {
        themeOptions.forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
      });
    });
  }
  // Appearance form
  if (saveAppearanceBtn) {
    saveAppearanceBtn.addEventListener('click', saveAppearanceSettings);
  }
  // Add admin button
  if (addAdminBtn) {
    addAdminBtn.addEventListener('click', () => {
      openCreateAdminModal();
    });
  }
  // Create admin modal
  if (closeCreateAdmin) {
    closeCreateAdmin.addEventListener('click', () => {
      createAdminModal.classList.remove('show');
      adminModal.style.display = 'none';
    });
  }

  if (cancelCreateAdmin) {
    cancelCreateAdmin.addEventListener('click', () => {
      createAdminModal.classList.remove('show');
      adminModal.style.display = 'none';
    });
  }

  if (saveAdminBtn) {
    // Save button click
    saveAdminBtn.addEventListener('click', async () => {
      if (isEditMode) {
        await updateAdmin();
      } else {
        await createAdmin();
      }
    });
  }

  // Confirm delete modal
  if (closeConfirmDeleteAdmin) {
    closeConfirmDeleteAdmin.addEventListener('click', () => {
      confirmDeleteAdminModal.classList.remove('show');
    });
  }

  if (cancelDeleteAdmin) {
    cancelDeleteAdmin.addEventListener('click', () => {
      confirmDeleteAdminModal.classList.remove('show');
    });
  }

  if (confirmDeleteAdmin) {
    confirmDeleteAdmin.addEventListener('click', () => {
      deleteAdmin(confirmDeleteAdmin.dataset.id);

    });
  }

  // Close modals when clicking outside
  if (createAdminModal) {
    createAdminModal.addEventListener('click', (e) => {
      if (e.target === createAdminModal) {
        createAdminModal.classList.remove('show');
        adminModal.style.display = 'none';
      }
    });
  }

  if (confirmDeleteAdminModal) {
    confirmDeleteAdminModal.addEventListener('click', (e) => {
      if (e.target === confirmDeleteAdminModal) {
        confirmDeleteAdminModal.classList.remove('show');
      }
    });
  }
}

// Password toggle functionality
document.querySelectorAll('.toggle-password').forEach(button => {
  button.addEventListener('click', function () {
    const input = this.previousElementSibling;
    const icon = this.querySelector('i');

    if (input.type === 'password') {
      input.type = 'text';
      icon.classList.remove('fa-eye');
      icon.classList.add('fa-eye-slash');
    } else {
      input.type = 'password';
      icon.classList.remove('fa-eye-slash');
      icon.classList.add('fa-eye');
    }
  });
});


// Initialize settings page when DOM is loaded
document.addEventListener('DOMContentLoaded', initSettingsPage);