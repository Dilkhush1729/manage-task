// API Base URL
let API_URL = 'http://localhost:5000/api';

// DOM Elements
const adminSidebar = document.getElementById('admin-sidebar');
const sidebarToggle = document.getElementById('sidebar-toggle');
const themeToggle = document.getElementById('theme-toggle');
const logoutButton = document.getElementById('logout-button');
const dropdownLogout = document.getElementById('dropdown-logout');
const adminUser = document.getElementById('admin-user');
const userIcon = document.getElementById('user-icon');
const userBlock = document.getElementById('user-block');
const adminName = document.getElementById('admin-name');


// Toggle the 'show' class to display or hide the user block
userIcon.addEventListener('click', (e) => {
  userBlock.classList.toggle('show');
});

// Close the user block if clicked outside
document.addEventListener('click', (event) => {
  if (!userIcon.contains(event.target) && !userBlock.contains(event.target)) {
    userBlock.classList.remove('show');
  }
});

// Check if admin is logged in
function checkAdminAuth() {
  const token = localStorage.getItem('adminToken');
  if (!token) {
    window.location.href = window.location.origin+'/frontend/public/main.html';
    return false;
  }
  return true;
}

// Run auth check when page loads
if (checkAdminAuth()) {
  // Set admin info
  const adminData = JSON.parse(localStorage.getItem('adminData'));
  if (adminData && adminName) {
    adminName.textContent = adminData.name;

    // Set avatar initial
    const avatarSpan = document.querySelector('.user-avatar span');
    if (avatarSpan) {
      avatarSpan.textContent = adminData.name.charAt(0).toUpperCase();
    }
  }
}

// Toggle sidebar
if (sidebarToggle) {
  sidebarToggle.addEventListener('click', () => {
    adminSidebar.classList.toggle('collapsed');

    // Save sidebar state to localStorage
    localStorage.setItem('sidebarCollapsed', adminSidebar.classList.contains('collapsed'));
  });
}

// Check saved sidebar state
const sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
if (sidebarCollapsed && adminSidebar) {
  adminSidebar.classList.add('collapsed');
}

// Toggle theme
if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');

    // Update icon
    const icon = themeToggle.querySelector('i');
    if (document.body.classList.contains('dark-mode')) {
      icon.classList.remove('fa-moon');
      icon.classList.add('fa-sun');
    } else {
      icon.classList.remove('fa-sun');
      icon.classList.add('fa-moon');
    }

    // Save theme preference to localStorage
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
  });
}

// Check saved theme preference
const darkMode = localStorage.getItem('darkMode') === 'true';
if (darkMode) {
  document.body.classList.add('dark-mode');

  // Update icon if it exists
  const icon = themeToggle?.querySelector('i');
  if (icon) {
    icon.classList.remove('fa-moon');
    icon.classList.add('fa-sun');
  }
}

// Logout function
function logout() {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminData');
  window.location.href = window.location.origin+'/frontend/public/main.html';
}

// Logout event listeners
if (logoutButton) {
  logoutButton.addEventListener('click', (e) => {
    e.preventDefault();
    logout();
  });
}

if (dropdownLogout) {
  dropdownLogout.addEventListener('click', (e) => {
    e.preventDefault();
    logout();
  });
}

// Helper function to format date
function formatDate(dateString) {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
}

// Helper function to format time
function formatTime(timeString) {
  if (!timeString) return '';

  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours, 10);
  const period = hour >= 12 ? 'PM' : 'AM';
  const formattedHour = hour % 12 || 12;

  return `${formattedHour}:${minutes} ${period}`;
}

// Helper function for API calls
async function apiRequest(endpoint, method = 'GET', data = null) {
  
  try {
    const token = localStorage.getItem('adminToken');

    if (!token) {
      throw new Error('Not authenticated');
    }

    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`${API_URL}${endpoint}`, options);

    // Handle unauthorized
    if (response.status === 401) {
      logout();
      // throw new Error('Session expired. Please login again.');
    }

    // Parse JSON response
    const result = await response.json();

    // Handle error response
    if (!response.ok) {
      throw new Error(result.message || 'API request failed');
    }

    return result;
  } catch (error) {
    console.error('API request error:', error);
    showNotification(error.message, 'error');
    throw error;
  }
}

// Notification system
function showNotification(message, type = 'success', duration = 5000) {
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
        top: 20px;
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

// Confirm dialog
function showConfirmDialog(message, confirmCallback, cancelCallback = null) {
  // Create modal if it doesn't exist
  let modalBackdrop = document.querySelector('.confirm-modal-backdrop');

  if (!modalBackdrop) {
    modalBackdrop = document.createElement('div');
    modalBackdrop.className = 'modal-backdrop confirm-modal-backdrop';

    // Add styles if not already added
    if (!document.querySelector('#confirm-dialog-styles')) {
      const style = document.createElement('style');
      style.id = 'confirm-dialog-styles';
      style.textContent = `
        .confirm-modal {
          max-width: 400px;
        }
        
        .confirm-message {
          margin-bottom: 1.5rem;
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(modalBackdrop);
  }

  // Create modal content
  const modal = document.createElement('div');
  modal.className = 'modal confirm-modal';
  modal.innerHTML = `
    <div class="modal-header">
      <h3 class="modal-title">Confirm Action</h3>
      <button class="modal-close" id="confirm-close">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <div class="modal-body">
      <p class="confirm-message">${message}</p>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" id="confirm-cancel">Cancel</button>
      <button class="btn btn-danger" id="confirm-ok">Confirm</button>
    </div>
  `;

  modalBackdrop.innerHTML = '';
  modalBackdrop.appendChild(modal);

  // Show modal
  setTimeout(() => {
    modalBackdrop.classList.add('show');
  }, 10);

  // Event listeners
  const closeButton = document.getElementById('confirm-close');
  const cancelButton = document.getElementById('confirm-cancel');
  const confirmButton = document.getElementById('confirm-ok');

  function closeModal() {
    modalBackdrop.classList.remove('show');
    setTimeout(() => {
      modalBackdrop.remove();
    }, 300);
  }

  closeButton.addEventListener('click', () => {
    closeModal();
    if (cancelCallback) cancelCallback();
  });

  cancelButton.addEventListener('click', () => {
    closeModal();
    if (cancelCallback) cancelCallback();
  });

  confirmButton.addEventListener('click', () => {
    closeModal();
    confirmCallback();
  });

  // Close on backdrop click
  modalBackdrop.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) {
      closeModal();
      if (cancelCallback) cancelCallback();
    }
  });
}

// Loading indicator
function showLoading(container, message = 'Loading...') {
  // Create loading element
  const loadingEl = document.createElement('div');
  loadingEl.className = 'loading-indicator';
  loadingEl.innerHTML = `
    <div class="loading-spinner"></div>
    <p class="loading-message">${message}</p>
  `;

  // Add styles if not already added
  if (!document.querySelector('#loading-styles')) {
    const style = document.createElement('style');
    style.id = 'loading-styles';
    style.textContent = `
      .loading-indicator {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        text-align: center;
      }
      
      .loading-spinner {
        width: 40px;
        height: 40px;
        border: 3px solid rgba(0, 0, 0, 0.1);
        border-radius: 50%;
        border-top-color: var(--admin-primary);
        animation: spin 1s ease-in-out infinite;
        margin-bottom: 1rem;
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      
      .loading-message {
        color: var(--admin-gray);
        margin: 0;
      }
      
      .dark-mode .loading-spinner {
        border-color: rgba(255, 255, 255, 0.1);
        border-top-color: var(--admin-primary);
      }
    `;
    document.head.appendChild(style);
  }

  // Clear container and add loading indicator
  if (typeof container === 'string') {
    container = document.querySelector(container);
  }

  if (container) {
    container.innerHTML = '';
    container.appendChild(loadingEl);
  }

  return loadingEl;
}

// Hide loading indicator
function hideLoading(loadingEl) {
  if (loadingEl && loadingEl.parentNode) {
    loadingEl.parentNode.removeChild(loadingEl);
  }
}

// Format number with commas
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Truncate text
function truncateText(text, length = 30) {
  if (!text) return '';
  return text.length > length ? text.substring(0, length) + '...' : text;
}

// Get relative time
function getRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
  }

  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
}