// DOM Elements
const profileForm = document.getElementById('profile-form');
const adminDisplayName = document.getElementById('admin-display-name');
const adminEmail = document.getElementById('admin-email');
const saveProfileBtn = document.getElementById('save-profile-btn');

const passwordForm = document.getElementById('password-form');
const currentPassword = document.getElementById('current-password');
const newPassword = document.getElementById('new-password');
const confirmPassword = document.getElementById('confirm-password');
const updatePasswordBtn = document.getElementById('update-password-btn');

const secondaryAdminContainer = document.getElementById('secondary-admin-container');
const addAdminBtn = document.getElementById('add-admin-btn');

const appearanceForm = document.getElementById('appearance-form');
const themeOptions = document.querySelectorAll('.theme-option');
const sidebarPositionRadios = document.querySelectorAll('input[name="sidebar-position"]');
const saveAppearanceBtn = document.getElementById('save-appearance-btn');

// Create secondary admin modal
const createAdminModal = document.getElementById('create-admin-modal');
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

// let API_URL = '/api'; // Replace with your actual API URL

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
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add('show');
  }, 10);

  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

// Initialize settings page
async function initSettingsPage() {
  try {
    // Load admin profile
    await loadAdminProfile();
    
    // Load secondary admin info
    await loadSecondaryAdmins();
    
    // Load appearance settings
    loadAppearanceSettings();
    
    // Set up event listeners
    setupEventListeners();
  } catch (error) {
    console.error('Error initializing settings page:', error);
    showNotification('Failed to load settings', 'error');
  }
}

// Load admin profile
async function loadAdminProfile() {
  try {
    // Get current admin data
    const admin = await apiRequest('/admin/profile');
    
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
    showNotification('Failed to load profile information', 'error');
  }
}

// Load secondary admins
async function loadSecondaryAdmins() {
  try {
    // Show loading
    secondaryAdminContainer.innerHTML = '<p class="text-center">Loading administrators...</p>';
    
    // Get secondary admins
    const admins = await apiRequest('/admin/secondary-admins');
    
    // Render admins list
    if (admins.length === 0) {
      secondaryAdminContainer.innerHTML = '<p class="text-center">No secondary administrators found.</p>';
      return;
    }
    
    const adminsList = document.createElement('ul');
    adminsList.className = 'admin-list';
    
    admins.forEach(admin => {
      const listItem = document.createElement('li');
      listItem.className = 'admin-item';
      
      listItem.innerHTML = `
        <div class="admin-info">
          <div class="admin-avatar">
            <span>${admin.name.charAt(0).toUpperCase()}</span>
          </div>
          <div class="admin-details">
            <h4>${admin.name}</h4>
            <p>${admin.email}</p>
          </div>
        </div>
        <div class="admin-actions">
          <button class="btn btn-sm btn-danger delete-admin-btn" data-id="${admin._id}">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;
      
      adminsList.appendChild(listItem);
    });
    
    secondaryAdminContainer.innerHTML = '';
    secondaryAdminContainer.appendChild(adminsList);
    
    // Add event listeners to delete buttons
    document.querySelectorAll('.delete-admin-btn').forEach(btn => {
      btn.addEventListener('click', () => openDeleteAdminModal(btn.dataset.id));
    });
  } catch (error) {
    console.error('Error loading secondary admins:', error);
    secondaryAdminContainer.innerHTML = '<p class="text-center text-danger">Failed to load administrators.</p>';
  }
}

// Load appearance settings
function loadAppearanceSettings() {
  // Load theme preference
  const currentTheme = localStorage.getItem('admin-theme') || 'light';
  
  // Select appropriate theme option
  themeOptions.forEach(option => {
    if (option.dataset.theme === currentTheme) {
      option.classList.add('selected');
    } else {
      option.classList.remove('selected');
    }
  });
  
  // Apply theme to body
  document.body.classList.toggle('dark-mode', currentTheme === 'dark');
  
  // Update theme toggle icon
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.innerHTML = currentTheme === 'dark' 
      ? '<i class="fas fa-sun"></i>' 
      : '<i class="fas fa-moon"></i>';
  }
  
  // Load sidebar position
  const sidebarPosition = localStorage.getItem('sidebar-position') || 'left';
  
  // Select appropriate radio button
  sidebarPositionRadios.forEach(radio => {
    if (radio.value === sidebarPosition) {
      radio.checked = true;
    }
  });
  
  // Apply sidebar position
  const adminSidebar = document.querySelector('.admin-sidebar');
  const adminMain = document.querySelector('.admin-main');
  
  if (adminSidebar && adminMain) {
    adminSidebar.style.left = sidebarPosition === 'left' ? '0' : 'auto';
    adminSidebar.style.right = sidebarPosition === 'right' ? '0' : 'auto';
    adminMain.style.marginLeft = sidebarPosition === 'left' ? '260px' : '0';
    adminMain.style.marginRight = sidebarPosition === 'right' ? '260px' : '0';
  }
}

// Save profile changes
async function saveProfileChanges() {
  try {
    const name = adminDisplayName.value.trim();
    const email = adminEmail.value.trim();
    
    // Validate form
    if (!name || !email) {
      showNotification('Name and email are required', 'error');
      return;
    }
    
    // Prepare data
    const profileData = { name, email };
    
    // Update profile
    await apiRequest('/admin/profile', 'PUT', profileData);
    
    // Show success message
    showNotification('Profile updated successfully', 'success');
    
    // Reload admin profile to update UI
    await loadAdminProfile();
  } catch (error) {
    console.error('Error saving profile changes:', error);
    showNotification('Failed to update profile', 'error');
  }
}

// Update password
async function updatePassword() {
  try {
    const current = currentPassword.value;
    const newPass = newPassword.value;
    const confirm = confirmPassword.value;
    
    // Validate form
    if (!current || !newPass || !confirm) {
      showNotification('All password fields are required', 'error');
      return;
    }else if (newPass !== confirm) {
      showNotification('New passwords do not match', 'error');
      return;
    }else if(newPass.length < 6) {
      showNotification('Password must be at least 6 characters long', 'error');
      return;
    }
    
    // Prepare data
    const passwordData = {
      currentPassword: current,
      newPassword: newPass
    };
    
    // Update password
    await apiRequest('/admin/change-password', 'POST', passwordData);
    
    // Show success message
    showNotification('Password updated successfully', 'success');
    
    // Clear form
    passwordForm.reset();
  } catch (error) {
    console.error('Error updating password:', error);
    showNotification('Failed to update password. Please check your current password.', 'error');
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
    
    // Apply settings
    loadAppearanceSettings();
    
    // Show success message
    showNotification('Appearance settings saved successfully', 'success');
  } catch (error) {
    console.error('Error saving appearance settings:', error);
    showNotification('Failed to save appearance settings', 'error');
  }
}

// Open create admin modal
function openCreateAdminModal() {
  // Clear form
  createAdminForm.reset();
  
  // Show modal
  createAdminModal.classList.add('show');
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
    
    // Validate form
    if (!name || !email || !password || !confirmPassword) {
      showNotification('All fields are required', 'error');
      return;
    }
    
    if (password !== confirmPassword) {
      showNotification('Passwords do not match', 'error');
      return;
    }
    
    if (password.length < 6) {
      showNotification('Password must be at least 6 characters long', 'error');
      return;
    }
    
    // Prepare data
    const adminData = {
      name,
      email,
      password
    };
    
    // Create admin
    await apiRequest('/admin/secondary-admins', 'POST', adminData);
    
    // Close modal
    createAdminModal.classList.remove('show');
    
    // Show success message
    showNotification('Administrator added successfully', 'success');
    
    // Reload secondary admins
    await loadSecondaryAdmins();
  } catch (error) {
    console.error('Error creating admin:', error);
    showNotification('Failed to add administrator', 'error');
  }
}

// Delete admin
async function deleteAdmin(adminId) {
  try {
    // Delete admin
    await apiRequest(`/admin/secondary-admins/${adminId}`, 'DELETE');
    
    // Close modal
    confirmDeleteAdminModal.classList.remove('show');
    
    // Show success message
    showNotification('Administrator removed successfully', 'success');
    
    // Reload secondary admins
    await loadSecondaryAdmins();
  } catch (error) {
    console.error('Error deleting admin:', error);
    showNotification('Failed to remove administrator', 'error');
  }
}

// Setup event listeners
function setupEventListeners() {
  // Profile form
  saveProfileBtn.addEventListener('click', saveProfileChanges);
  
  // Password form
  updatePasswordBtn.addEventListener('click', updatePassword);
  
  // Theme options
  themeOptions.forEach(option => {
    option.addEventListener('click', () => {
      themeOptions.forEach(opt => opt.classList.remove('selected'));
      option.classList.add('selected');
    });
  });
  
  // Appearance form
  saveAppearanceBtn.addEventListener('click', saveAppearanceSettings);
  
  // Add admin button
  addAdminBtn.addEventListener('click', openCreateAdminModal);
  
  // Create admin modal
  closeCreateAdmin.addEventListener('click', () => {
    createAdminModal.classList.remove('show');
  });
  
  cancelCreateAdmin.addEventListener('click', () => {
    createAdminModal.classList.remove('show');
  });
  
  saveAdminBtn.addEventListener('click', createAdmin);
  
  // Confirm delete modal
  closeConfirmDeleteAdmin.addEventListener('click', () => {
    confirmDeleteAdminModal.classList.remove('show');
  });
  
  cancelDeleteAdmin.addEventListener('click', () => {
    confirmDeleteAdminModal.classList.remove('show');
  });
  
  confirmDeleteAdmin.addEventListener('click', () => {
    deleteAdmin(confirmDeleteAdmin.dataset.id);
  });
  
  // Close modals when clicking outside
  createAdminModal.addEventListener('click', (e) => {
    if (e.target === createAdminModal) {
      createAdminModal.classList.remove('show');
    }
  });
  
  confirmDeleteAdminModal.addEventListener('click', (e) => {
    if (e.target === confirmDeleteAdminModal) {
      confirmDeleteAdminModal.classList.remove('show');
    }
  });
}

// Initialize settings page when DOM is loaded
document.addEventListener('DOMContentLoaded', initSettingsPage);