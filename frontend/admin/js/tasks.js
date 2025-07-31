// DOM Elements
const tasksTable = document.getElementById('tasks-table');
const totalTasksCount = document.getElementById('total-tasks-count');
const completedTasksCount = document.getElementById('completed-tasks-count');
const pendingTasksCount = document.getElementById('pending-tasks-count');
const highPriorityCount = document.getElementById('high-priority-count');
const taskSearch = document.getElementById('task-search');
const userFilter = document.getElementById('user-filter');
const statusFilter = document.getElementById('status-filter');
const priorityFilter = document.getElementById('priority-filter');
const selectAllTasks = document.getElementById('select-all-tasks');
const bulkActions = document.getElementById('bulk-actions');
const bulkDeleteBtn = document.getElementById('bulk-delete-btn');
const bulkCompleteBtn = document.getElementById('bulk-complete-btn');
const paginationStart = document.getElementById('pagination-start');
const paginationEnd = document.getElementById('pagination-end');
const paginationTotal = document.getElementById('pagination-total');
const paginationControls = document.getElementById('pagination-controls');

// Task details modal
const taskDetailsModal = document.getElementById('task-details-modal');
const taskDetailsContent = document.getElementById('task-details-content');
const closeTaskDetails = document.getElementById('close-task-details');
const closeTaskDetailsBtn = document.getElementById('close-task-details-btn');
const editTaskBtn = document.getElementById('edit-task-btn');

// Create/Edit task modal
const editTaskModal = document.getElementById('edit-task-modal');
const taskModalTitle = document.getElementById('task-modal-title');
const editTaskForm = document.getElementById('edit-task-form');
const editTaskId = document.getElementById('edit-task-id');
const editTaskName = document.getElementById('edit-task-name');
const editTaskDescription = document.getElementById('edit-task-description');
const editTaskDueDate = document.getElementById('edit-task-due-date');
const editTaskDueTime = document.getElementById('edit-task-due-time');
const editTaskUser = document.getElementById('edit-task-user');
const editTaskCategory = document.getElementById('edit-task-category');
const editTaskPriority = document.getElementById('edit-task-priority');
const editTaskStatus = document.getElementById('edit-task-status');
const closeEditTask = document.getElementById('close-edit-task');
const saveTaskBtn = document.getElementById('save-task-btn');
const deleteTaskBtn = document.getElementById('delete-task-btn');
const createTaskBtn = document.getElementById('create-task-btn');

// Import tasks modal
const importModal = document.getElementById('import-modal');
const importUser = document.getElementById('import-user');
const importFile = document.getElementById('import-file');
const closeImportModal = document.getElementById('close-import-modal');
const cancelImport = document.getElementById('cancel-import');
const confirmImport = document.getElementById('confirm-import');
const downloadTemplateBtn = document.getElementById('download-template-btn');
const importTaskBtn = document.getElementById('import-task-btn');

// Export buttons
const exportDropdownBtn = document.getElementById('export-dropdown-btn');
const exportDropdown = document.getElementById('export-dropdown');
const exportCsvBtn = document.getElementById('export-csv-btn');
const exportJsonBtn = document.getElementById('export-json-btn');

// Confirm delete modal
const confirmDeleteModal = document.getElementById('confirm-delete-modal');
const closeConfirmDelete = document.getElementById('close-confirm-delete');
const cancelDelete = document.getElementById('cancel-delete');
const confirmDelete = document.getElementById('confirm-delete');

// Pagination state
let currentPage = 1;
const pageSize = 10;
let totalTasks = 0;
let filteredTasks = [];
let selectedTasks = new Set();
let allUsers = [];
let allCategories = [];

let TASK_API_URL = 'http://localhost:5000/api';
// let TASK_API_URL = 'https://manage-task-backend-2vf9.onrender.com/api';

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

    const response = await fetch(TASK_API_URL + url, options);

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

function formatDate(dateString) {
  const date = new Date(dateString);
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('en-US', options); // e.g., "March 28, 2025"
}

function formatTime(timeString) {
  let [hours, minutes] = timeString.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12; // Convert 0 to 12 for 12 AM
  return `${hours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

// Initialize tasks page
async function initTasksPage() {
  try {
    // Load users for filters and dropdowns
    await loadUsers();
    
    // Load categories for dropdowns
    await loadCategories();
    
    // Load tasks
    await loadTasks();
    
    // Set up event listeners
    setupEventListeners();
  } catch (error) {
    console.error('Error initializing tasks page:', error);
    showNotification('Failed to load tasks data', 'error');
  }
}

// Load users
async function loadUsers() {
  try {
    // Get users
    const users = await apiRequest('/admin/users');
    allUsers = users;
    
    // Populate user filter dropdown
    let userOptions = '<option value="">All Users</option>';
    users.forEach(user => {
      userOptions += `<option value="${user._id}">${user.name}</option>`;
    });
    
    userFilter.innerHTML = userOptions;
    editTaskUser.innerHTML = userOptions;
    importUser.innerHTML = userOptions;
  } catch (error) {
    console.error('Error loading users:', error);
    showNotification('Failed to load users', 'error');
  }
}

// Load categories
async function loadCategories() {
  try {
    // Get categories
    const categories = await apiRequest('/admin/categories');
    allCategories = categories;
    
    // Populate category dropdown
    let categoryOptions = '<option value="">No Category</option>';
    categories.forEach(category => {
      categoryOptions += `<option value="${category._id}">${category.name}</option>`;
    });
    
    editTaskCategory.innerHTML = categoryOptions;
  } catch (error) {
    console.error('Error loading categories:', error);
    showNotification('Failed to load categories', 'error');
  }
}

// Load tasks
async function loadTasks(page = 1, filters = {}) {
  try {
    // Show loading
    tasksTable.innerHTML = '<tr><td colspan="7" class="text-center">Loading tasks...</td></tr>';
    
    // Clear selected tasks
    selectedTasks.clear();
    selectAllTasks.checked = false;
    updateBulkActions();
    
    // Get tasks
    const response = await apiRequest('/admin/tasks');
    const tasks = response.tasks || [];
    
    // Apply filters
    filteredTasks = tasks.filter(task => {
      // Search filter
      if (filters.search && !task.name.toLowerCase().includes(filters.search.toLowerCase()) &&
        !(task.description && task.description.toLowerCase().includes(filters.search.toLowerCase()))) {
        return false;
      }

      
      if (filters.userId && (!task.user || task.user._id !== filters.userId)) {
        return false;
      }
      
      // Status filter
      if (filters.status === 'completed' && !task.completed) {
        return false;
      } else if (filters.status === 'pending' && task.completed) {
        return false;
      }
      
      // Priority filter
      if (filters.priority && task.priority !== filters.priority) {
        return false;
      }
      
      return true;
    });
    
    // Update stats
    updateTaskStats(tasks);
    
    // Update pagination
    totalTasks = filteredTasks.length;
    updatePagination(page);
    
    // Get paginated tasks
    const startIndex = (page - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalTasks);
    const paginatedTasks = filteredTasks.slice(startIndex, endIndex);
    
    // Render tasks
    if (paginatedTasks.length === 0) {
      tasksTable.innerHTML = '<tr><td colspan="7" class="text-center">No tasks found</td></tr>';
      return;
    }
    
    tasksTable.innerHTML = paginatedTasks.map(task => `
      <tr>
        <td>
          <div class="form-check">
            <input type="checkbox" class="form-check-input task-checkbox" data-id="${task._id}">
          </div>
        </td>
        <td>
          <div class="task-name-cell">
            <span class="task-name">${task.name}</span>
            ${task.description ? `<span class="task-description">${truncateText(task.description, 50)}</span>` : ''}
          </div>
        </td>
        <td>${task.user ? task.user.name : 'N/A'}</td>
        <td>
          ${task.dueDate ? `${formatDate(task.dueDate)}${task.dueTime ? ' ' + formatTime(task.dueTime) : ''}` : 'No due date'}
        </td>
        <td>
          <span class="badge badge-${task.priority === 'high' ? 'danger' : task.priority === 'medium' ? 'warning' : 'info'}">
            ${capitalizeFirstLetter(task.priority)}
          </span>
        </td>
        <td>
          <span class="badge badge-${task.completed ? 'success' : 'secondary'}">
            ${task.completed ? 'Completed' : 'Pending'}
          </span>
        </td>
        <td>
          <button class="btn btn-sm btn-primary view-task-btn" data-id="${task._id}">
            <i class="fas fa-eye"></i>
          </button>
          <button class="btn btn-sm btn-secondary edit-task-btn" data-id="${task._id}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-sm btn-danger delete-task-btn" data-id="${task._id}">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');
    
    // Add event listeners to buttons
    document.querySelectorAll('.view-task-btn').forEach(btn => {
      btn.addEventListener('click', () => viewTask(btn.dataset.id));
    });
    
    document.querySelectorAll('.edit-task-btn').forEach(btn => {
      btn.addEventListener('click', () => openEditTaskModal(btn.dataset.id));
    });
    
    document.querySelectorAll('.delete-task-btn').forEach(btn => {
      btn.addEventListener('click', () => openDeleteTaskModal([btn.dataset.id]));
    });
    
    // Add event listeners to checkboxes
    document.querySelectorAll('.task-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
          selectedTasks.add(checkbox.dataset.id);
        } else {
          selectedTasks.delete(checkbox.dataset.id);
        }
        updateBulkActions();
      });
    });
  } catch (error) {
    console.error('Error loading tasks:', error);
    tasksTable.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Failed to load tasks</td></tr>';
  }
}

// Update task stats
function updateTaskStats(tasks) {
  // Total tasks
  totalTasksCount.textContent = tasks.length;
  
  // Completed tasks
  const completed = tasks.filter(task => task.completed).length;
  completedTasksCount.textContent = completed;
  
  // Pending tasks
  const pending = tasks.length - completed;
  pendingTasksCount.textContent = pending;
  
  // High priority tasks
  const highPriority = tasks.filter(task => task.priority === 'high').length;
  highPriorityCount.textContent = highPriority;
}

// Update pagination
function updatePagination(page) {
  // Update current page
  currentPage = page;
  
  // Calculate start and end indices
  const startIndex = (page - 1) * pageSize + 1;
  const endIndex = Math.min(startIndex + pageSize - 1, totalTasks);
  
  // Update pagination info
  paginationStart.textContent = totalTasks > 0 ? startIndex : 0;
  paginationEnd.textContent = endIndex;
  paginationTotal.textContent = totalTasks;
  
  // Generate pagination controls
  const totalPages = Math.ceil(totalTasks / pageSize);
  
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
      loadTasks(parseInt(btn.dataset.page), getFilters());
    });
  });
}

// Get current filters
function getFilters() {
  return {
    search: taskSearch.value.trim(),
    userId: userFilter.value,
    status: statusFilter.value,
    priority: priorityFilter.value
  };
}

// Update bulk actions visibility
function updateBulkActions() {
  if (selectedTasks.size > 0) {
    bulkActions.style.display = 'flex';
  } else {
    bulkActions.style.display = 'none';
  }
}
// Function to format date and time
function formatDateTime(dateString) {
  const options = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  };
  const date = new Date(dateString);
  return date.toLocaleString('en-US', options);
}

// View task details
async function viewTask(taskId) {
  try {
    // Show modal
    taskDetailsModal.classList.add('show');
    
    // Show loading
    taskDetailsContent.innerHTML = '<div class="text-center">Loading task details...</div>';
    
    // Get task data
    const task = await apiRequest(`/admin/tasks/${taskId}`);
    
    // Fetch categories
    const categories = await apiRequest('/admin/categories'); // Fetch categories here

    // Find user and category
    const user = task.user || { name: 'N/A', email: 'N/A' };
    const category = task.category || { name: 'No Category', color: '#cccccc' };
    
    // Render task details
    taskDetailsContent.innerHTML = `
      <div class="task-details">
        <div class="task-header">
          <h4 class="task-title">${task.name}</h4>
          <span class="badge badge-${task.priority === 'high' ? 'danger' : task.priority === 'medium' ? 'warning' : 'info'}">
            ${capitalizeFirstLetter(task.priority)}
          </span>
          <span class="badge badge-${task.completed ? 'success' : 'secondary'}">
            ${task.completed ? 'Completed' : 'Pending'}
          </span>
        </div>
        
        <div class="task-info-grid">
          <div class="task-info-item">
            <div class="info-label">Assigned To</div>
            <div class="info-value">${user.name}</div>
          </div>
          
          <div class="task-info-item">
            <div class="info-label">Category</div>
            <div class="info-value">
              <span class="category-color" style="background-color: ${category.color}"></span>
              ${category.name}
            </div>
          </div>
          
          <div class="task-info-item">
            <div class="info-label">Due Date</div>
            <div class="info-value">
              ${task.dueDate ? `${formatDate(task.dueDate)}${task.dueTime ? ' at ' + formatTime(task.dueTime) : ''}` : 'No due date'}
            </div>
          </div>
          
          <div class="task-info-item">
            <div class="info-label">Created</div>
            <div class="info-value">${formatDateTime(task.createdAt)}</div>
          </div>
        </div>
        
        <div class="task-description-section">
          <div class="info-label">Description</div>
          <div class="task-description-content">
            ${task.description ? task.description.replace(/\n/g, '<br>') : 'No description provided.'}
          </div>
        </div>
        
        <div class="task-category-history-section">
          <div class="info-label">Category History</div>
          <table class="task-category-history-table">
            <thead>
              <tr>
                <th>Category Name</th>
                <th>Updated At</th>
              </tr>
            </thead>
            <tbody>
              ${task.categoryHistory.map(history => {
                const category = categories.find(cat => cat._id === history.categoryId);
                return `
                  <tr>
                    <td>${category ? category.name : 'Unknown Category'}</td>
                    <td>${formatDateTime(history.changedAt)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
    
    // Store task ID for edit button
    editTaskBtn.dataset.id = taskId;
  } catch (error) {
    console.error('Error loading task details:', error);
    taskDetailsContent.innerHTML = '<div class="text-center text-danger">Failed to load task details</div>';
  }
}

// Open create/edit task modal
async function openEditTaskModal(taskId = null) {
  try {
    // Close task details modal if open
    taskDetailsModal.classList.remove('show');
    
    // Show edit task modal
    editTaskModal.classList.add('show');
    
    // Clear form
    editTaskForm.reset();
    
    if (taskId) {
      // Edit existing task
      taskModalTitle.textContent = 'Edit Task';
      deleteTaskBtn.style.display = 'block';
      
      // Get task data
      const task = await apiRequest(`/admin/tasks/${taskId}`);
      // Populate form
      editTaskId.value = taskId;
      editTaskName.value = task.name;
      editTaskDescription.value = task.description || '';
      editTaskDueDate.value = task.dueDate || '';
      editTaskDueTime.value = task.dueTime || '';
      editTaskUser.value = task.user ? task.user._id : '';
      editTaskCategory.value = task.category ? task.category._id : '';
      editTaskPriority.value = task.priority;
      editTaskStatus.value = task.completed.toString();
      
      // Store task ID for delete button
      deleteTaskBtn.dataset.id = taskId;
    } else {
      // Create new task
      taskModalTitle.textContent = 'Create Task';
      deleteTaskBtn.style.display = 'none';
      
      // Set default values
      editTaskId.value = '';
      editTaskStatus.value = 'false'; // Pending by default
      
      // Set today's date as default
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      editTaskDueDate.value = `${year}-${month}-${day}`;
    }
    // Add the event listener for user selection
    editTaskUser .addEventListener('change', async () => {
      const userId = editTaskUser .value;
      if (userId) {
        await loadCategoriesForUser (userId);
      } else {
        // Reset categories dropdown if no user is selected
        editTaskCategory.innerHTML = '<option value="">No Category</option>';
      }
    });

  } catch (error) {
    console.error('Error loading task for edit:', error);
    showNotification('Failed to load task data', 'error');
    editTaskModal.classList.remove('show');
  }
}
async function loadCategoriesForUser (userId) {
  try {
    const categories = await apiRequest(`/admin/categories/user/${userId}`); // Call the new endpoint
    let categoryOptions = '<option value="">Select Category</option>';
    categories.forEach(category => {
      categoryOptions += `<option value="${category._id}">${category.name}</option>`;
    });
    editTaskCategory.innerHTML = categoryOptions;
  } catch (error) {
    console.error('Error loading categories for user:', error);
    showNotification('Failed to load categories for the selected user', 'error');
    editTaskCategory.innerHTML = '<option value="">No Category</option>'; // Reset on error
  }
}

// Open delete task modal
function openDeleteTaskModal(taskIds) {
  // Close other modals
  taskDetailsModal.classList.remove('show');
  editTaskModal.classList.remove('show');
  
  // Show confirm delete modal
  confirmDeleteModal.classList.add('show');
  
  // Store task IDs for delete button
  confirmDelete.dataset.ids = JSON.stringify(taskIds);
}

// Save task changes
async function saveTaskChanges() {
  try {
    const taskId = editTaskId.value;
    const name = editTaskName.value.trim();
    const description = editTaskDescription.value.trim();
    const dueDate = editTaskDueDate.value;
    const dueTime = editTaskDueTime.value;
    const userId = editTaskUser.value;
    const category = editTaskCategory.value || null;
    const priority = editTaskPriority.value;
    const completed = editTaskStatus.value === 'true';
    
    // Validate form
    if (!name || !userId) {
      showNotification('Task name and assigned user are required', 'error');
      return;
    }
    
    // Prepare data
    const taskData = {
      name,
      description,
      dueDate,
      dueTime,
      userId,
      category,
      priority,
      completed
    };
    
    if (taskId) {
      // Update existing task
      await apiRequest(`/admin/tasks/${taskId}`, 'PUT', taskData);
      showNotification('Task updated successfully', 'success');
    } else {
      // Create new task
      await apiRequest('/admin/tasks', 'POST', taskData);
      showNotification('Task created successfully', 'success');
    }
    
    // Close modal
    editTaskModal.classList.remove('show');
    
    // Reload tasks
    loadTasks(currentPage, getFilters());
  } catch (error) {
    console.error('Error saving task:', error);
    showNotification('Failed to save task', 'error');
  }
}

// Delete tasks
async function deleteTasks(taskIds) {
  try {
    if (taskIds.length === 1) {
      // Delete single task
      await apiRequest(`/admin/tasks/${taskIds[0]}`, 'DELETE');
    } else {
      // Bulk delete tasks
      await apiRequest('/admin/tasks/bulk-delete', 'POST', { taskIds });
    }
    
    // Close modal
    confirmDeleteModal.classList.remove('show');
    
    // Show success message
    showNotification(`${taskIds.length} task(s) deleted successfully`, 'error');
    
    // Clear selected tasks
    selectedTasks.clear();
    updateBulkActions();
    
    // Reload tasks
    loadTasks(currentPage, getFilters());
  } catch (error) {
    console.error('Error deleting tasks:', error);
    showNotification('Failed to delete tasks', 'error');
  }
}

// Mark tasks as completed
async function markTasksAsCompleted(taskIds) {
  try {
    await apiRequest(`/admin/tasks/bulk/complete`, 'PUT', { taskIds });

    showNotification(`${taskIds.length} task(s) marked as completed`, 'success');
    
    // Clear selected tasks
    selectedTasks.clear();
    updateBulkActions();
    loadTasks(currentPage, getFilters());
  } catch (error) {
    console.error('Error marking tasks as completed:', error);
    showNotification('Failed to update tasks', 'error');
  }
}

// Import tasks from CSV
async function importTasksFromCSV() {
  try {
    const userId = importUser.value;
    const file = importFile.files[0];
    
    if (!userId) {
      showNotification('Please select a user', 'error');
      return;
    }
    
    if (!file) {
      showNotification('Please select a CSV file', 'error');
      return;
    }
    
    // Read file
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const csvData = e.target.result;
        
        // Send to API
        const result = await apiRequest('/admin/tasks/import/csv', 'POST', {
          csvData,
          userId
        });
        
        // Close modal
        importModal.classList.remove('show');
        
        // Show success message
        showNotification(`${result.importedCount} tasks imported successfully`, 'success');
        
        // Show errors if any
        if (result.errors && result.errors.length > 0) {
          console.error('Import errors:', result.errors);
          showNotification(`${result.errors.length} errors occurred during import. Check console for details.`, 'warning');
        }
        
        // Reload tasks
        loadTasks(currentPage, getFilters());
      } catch (error) {
        console.error('Error processing CSV:', error);
        showNotification('Failed to process CSV file', 'error');
      }
    };
    
    reader.readAsText(file);
  } catch (error) {
    console.error('Error importing tasks:', error);
    showNotification('Failed to import tasks', 'error');
  }
}

// Export tasks to CSV
async function exportTasksToCSV() {
  try {
    const userId = userFilter.value;
    const url = `/admin/tasks/export/csv${userId ? `?userId=${userId}` : ''}`;
    
    // Use apiRequest to fetch the CSV data
    const csvData = await apiRequest(url, 'GET');

    // Create a Blob from the CSV data
    const blob = new Blob([csvData], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'tasks.csv';
    a.click();
  } catch (error) {
    console.error('Error exporting tasks:', error);
    showNotification('Failed to export tasks', 'error');
  }
}

// Export tasks to JSON
function exportTasksToJSON() {
  try {
    // Convert filtered tasks to JSON
    const tasksToExport = filteredTasks.map(task => ({
      id: task._id,
      name: task.name,
      description: task.description,
      dueDate: task.dueDate,
      dueTime: task.dueTime,
      priority: task.priority,
      status: task.completed ? 'completed' : 'pending',
      category: task.category ? task.category.name : null,
      user: task.user ? task.user.name : null,
      createdAt: task.createdAt
    }));
    
    // Create a blob and download
    const blob = new Blob([JSON.stringify(tasksToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tasks.json';
    a.click();
    
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting tasks to JSON:', error);
    showNotification('Failed to export tasks', 'error');
  }
}

// Download CSV template
function downloadCSVTemplate() {
  const template = `Name,Description,Due Date,Due Time,Category Id,Priority,Completed
  "Task 1","Description for task 1","2025-12-31","14:00","67db1805653a686047418c91","high","false"
  "Task 2","Description for task 2","2025-12-31","15:00","67db1805653a686047418c91","medium","true"`;

  const blob = new Blob([template], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = 'tasks_template.csv';
  a.click();
  
  URL.revokeObjectURL(url);
}

// Setup event listeners
function setupEventListeners() {
  // Search input
  taskSearch.addEventListener('input', debounce(() => {
    loadTasks(1, getFilters());
  }, 300));
  
  // Filters
  userFilter.addEventListener('change', () => {
    loadTasks(1, getFilters());
  });
  
  statusFilter.addEventListener('change', () => {
    loadTasks(1, getFilters());
  });
  
  priorityFilter.addEventListener('change', () => {
    loadTasks(1, getFilters());
  });
  
  // Select all tasks
  selectAllTasks.addEventListener('change', () => {
    const checkboxes = document.querySelectorAll('.task-checkbox');
    checkboxes.forEach(checkbox => {
      checkbox.checked = selectAllTasks.checked;
      if (selectAllTasks.checked) {
        selectedTasks.add(checkbox.dataset.id);
      } else {
        selectedTasks.delete(checkbox.dataset.id);
      }
    });
    updateBulkActions();
  });
  
  // Bulk actions
  bulkDeleteBtn.addEventListener('click', () => {
    openDeleteTaskModal(Array.from(selectedTasks));
  });
  
  bulkCompleteBtn.addEventListener('click', () => {
    markTasksAsCompleted(Array.from(selectedTasks));
  });
  
  // Task details modal
  closeTaskDetails.addEventListener('click', () => {
    taskDetailsModal.classList.remove('show');
  });
  
  closeTaskDetailsBtn.addEventListener('click', () => {
    taskDetailsModal.classList.remove('show');
  });
  
  editTaskBtn.addEventListener('click', () => {
    openEditTaskModal(editTaskBtn.dataset.id);
  });
  
  // Create/Edit task modal
  createTaskBtn.addEventListener('click', () => {
    openEditTaskModal();
  });
  
  closeEditTask.addEventListener('click', () => {
    editTaskModal.classList.remove('show');
  });
  
  saveTaskBtn.addEventListener('click', saveTaskChanges);
  
  deleteTaskBtn.addEventListener('click', () => {
    openDeleteTaskModal([deleteTaskBtn.dataset.id]);
  });
  
  // Import tasks modal
  importTaskBtn.addEventListener('click', () => {
    importModal.classList.add('show');
  });
  
  closeImportModal.addEventListener('click', () => {
    importModal.classList.remove('show');
  });
  
  cancelImport.addEventListener('click', () => {
    importModal.classList.remove('show');
  });
  
  confirmImport.addEventListener('click', importTasksFromCSV);
  
  downloadTemplateBtn.addEventListener('click', downloadCSVTemplate);
  
  exportDropdown.style.display='none';
  // Export dropdown
  exportDropdownBtn.addEventListener('click', () => {
    if (exportDropdown.style.display === 'block') {
      exportDropdown.style.display = 'none';
    } else {
      exportDropdown.style.display = 'block';
    }
  });

  
  // Close export dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!exportDropdownBtn.contains(e.target) && !exportDropdown.contains(e.target)) {
      exportDropdown.classList.remove('show');
    }
  });
  
  exportCsvBtn.addEventListener('click', (e) => {
    e.preventDefault();
    exportTasksToCSV();
    exportDropdown.classList.remove('show');
  });
  
  exportJsonBtn.addEventListener('click', (e) => {
    e.preventDefault();
    exportTasksToJSON();
    exportDropdown.classList.remove('show');
  });
  
  // Confirm delete modal
  closeConfirmDelete.addEventListener('click', () => {
    confirmDeleteModal.classList.remove('show');
  });
  
  cancelDelete.addEventListener('click', () => {
    confirmDeleteModal.classList.remove('show');
  });
  
  confirmDelete.addEventListener('click', () => {
    const taskIds = JSON.parse(confirmDelete.dataset.ids);
    deleteTasks(taskIds);
  });
  
  // Close modals when clicking outside
  taskDetailsModal.addEventListener('click', (e) => {
    if (e.target === taskDetailsModal) {
      taskDetailsModal.classList.remove('show');
    }
  });
  
  editTaskModal.addEventListener('click', (e) => {
    if (e.target === editTaskModal) {
      editTaskModal.classList.remove('show');
    }
  });
  
  importModal.addEventListener('click', (e) => {
    if (e.target === importModal) {
      importModal.classList.remove('show');
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

// Helper function to capitalize first letter
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Helper function to truncate text
function truncateText(text, length) {
  if (!text) return '';
  return text.length > length ? text.substring(0, length) + '...' : text;
}

// Add styles for task details
const style = document.createElement('style');
style.textContent = `
  .task-details {
    padding: 1rem;
  }
  
  .task-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }
  
  .task-title {
    font-size: 1.5rem;
    margin: 0;
    flex: 1;
  }
  
  .task-info-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  
  .task-info-item {
    background-color: var(--admin-gray-light);
    border-radius: var(--admin-radius);
    padding: 1rem;
  }
  
  .info-label {
    font-size: 0.75rem;
    color: var(--admin-gray);
    margin-bottom: 0.5rem;
    font-weight: 500;
  }
  .task-category-history-section .info-label{
    padding-top: 20px;
  }
  .task-category-history-content{
    line-height: 30px;
  }
  .info-value {
    font-size: 1rem;
  }
  
  .category-color {
    display: inline-block;
    width: 0.75rem;
    height: 0.75rem;
    border-radius: 50%;
    margin-right: 0.5rem;
  }
  
  .task-description-section {
    background-color: var(--admin-gray-light);
    border-radius: var(--admin-radius);
    padding: 1rem;
  }
  
  .task-description-content {
    margin-top: 0.5rem;
  }
  
  .task-name-cell {
    display: flex;
    flex-direction: column;
  }
  
  .task-description {
    font-size: 0.75rem;
    color: var(--admin-gray);
    margin-top: 0.25rem;
  }
  
  .code-block {
    background-color: var(--admin-gray-light);
    border-radius: var(--admin-radius);
    padding: 1rem;
    overflow-x: auto;
  }
  
  .code-block pre {
    margin: 0;
    font-family: monospace;
    font-size: 0.875rem;
  }
  
  .filter-container {
    display: flex;
    gap: 0.5rem;
  }
  
  .search-container {
    margin-right: 1rem;
  }
  
  .dropdown {
    position: relative;
  }
  
  .dropdown-menu {
    position: absolute;
    top: 100%;
    right: 0;
    background-color: var(--admin-light);
    border: 1px solid var(--admin-border);
    border-radius: var(--admin-radius);
    box-shadow: var(--admin-shadow);
    min-width: 200px;
    z-index: 100;
    padding: 0.5rem 0;
    margin-top: 0.5rem;
    display: none;
  }
  
  .dropdown-menu.show {
    display: block;
  }
  
  .dropdown-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    color: var(--admin-dark);
    text-decoration: none;
    transition: var(--admin-transition);
  }
  
  .dropdown-item:hover {
    background-color: var(--admin-gray-light);
  }
  
  .bulk-actions {
    display: none;
    gap: 0.5rem;
  }
  
  @media (max-width: 768px) {
    .task-info-grid {
      grid-template-columns: 1fr;
    }
    
    .filter-container {
      flex-direction: column;
    }
  }
`;
document.head.appendChild(style);

// Initialize tasks page when DOM is loaded
document.addEventListener('DOMContentLoaded', initTasksPage);