// DOM Elements
const menuToggle = document.getElementById('menu-toggle');
const sidebar = document.getElementById('sidebar');
const createTaskButton = document.getElementById('create-task-button');
const addCategoryButton = document.getElementById('add-category-button');
const taskModal = document.getElementById('task-modal');
const categoryModal = document.getElementById('category-modal');
const taskDetailsModal = document.getElementById('task-details-modal');
const closeModal = document.getElementById('close-modal');
const closeCategoryModal = document.getElementById('close-category-modal');
const closeDetailsModal = document.getElementById('close-details-modal');
const overlay = document.getElementById('overlay');
const taskForm = document.getElementById('task-form');
const categoryForm = document.getElementById('category-form');
const deleteTaskButton = document.getElementById('delete-task');
const deleteCategoryButton = document.getElementById('delete-category');
const taskContainer = document.getElementById('task-container');
const categoriesList = document.getElementById('categories-list');
const taskCategorySelect = document.getElementById('task-category');
const colorOptions = document.querySelectorAll('.color-option');
const categoryColorInput = document.getElementById('category-color');
const themeSwitch = document.getElementById('theme-switch');
const searchInput = document.getElementById('search-input');
const viewButtons = document.querySelectorAll('.sidebar-item[data-view]');
const currentViewTitle = document.getElementById('current-view-title');
const gridViewButton = document.getElementById('grid-view-button');
const listViewButton = document.getElementById('list-view-button');
const editTaskButton = document.getElementById('edit-task-button');
const completeTaskButton = document.getElementById('complete-task-button');
const dropdownButton = document.querySelector('.dropdown-button');
const dropdownContent = document.querySelector('.dropdown-content');
const sortOptions = document.querySelectorAll('.dropdown-content a');
const deleteConfirmationModal = document.getElementById("confirmationModal");
const taskContentContainer = document.getElementById('calendar-grid');
const enableCalendarView = document.getElementById('calendar-view-enable');
const userAvatar = document.querySelector('.user-avatar');
const logoutButton = document.getElementById('logout-button');
deleteConfirmationModal.style.display = "none";

// API Base URL - Change this to your backend URL
let API_URL = 'http://localhost:5000/api';

// State
let tasks = [];
let categories = [];
let currentView = 'all';
let currentSort = 'date-desc';
let currentTaskId = null;
let currentCategoryId = null;
let isGridView = true;
let isListView = false;
let isCalendarView = false;
let previousCategories = [];
// Authentication Check
function checkAuth() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'main.html';
    return false;
  }
  return true;
}

// Set user info in UI
function setUserInfo() {
  const user = JSON.parse(localStorage.getItem('user'));
  if (user && userAvatar) {
    // Set initial letter of user's name in avatar
    userAvatar.querySelector('span').textContent = user.name.charAt(0).toUpperCase();
    
    // Update username in sidebar if present
    const usernameElement = document.getElementById('username');
    if (usernameElement) {
      usernameElement.textContent = user.name;
    }
  }
}

// Logout function
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'main.html';
}

// Initialize
async function init() {
  // Check if user is authenticated
  if (!checkAuth()) return;
  
  // Set user info in UI
  setUserInfo();
  
  await loadFromBackend();
  renderTasks();
  renderCategories();
  updateCounts();
  setupEventListeners();
  checkTheme();
}

// Event Listeners
function setupEventListeners() {
  // Logout button
  if (logoutButton) {
    logoutButton.addEventListener('click', logout);
  }
  
  // Menu Toggle
  menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
  });

  // Create Task
  createTaskButton.addEventListener('click', () => {
    openTaskModal();
  });

  // Add Category
  addCategoryButton.addEventListener('click', () => {
    openCategoryModal();
  });

  // Close Modals
  closeModal.addEventListener('click', closeTaskModal);
  closeCategoryModal.addEventListener('click', closeCategoriesModal);
  closeDetailsModal.addEventListener('click', closeTaskDetailsModal);
  overlay.addEventListener('click', () => {
    closeTaskModal();
    closeCategoriesModal();
    closeTaskDetailsModal();
  });

  // Form Submissions
  taskForm.addEventListener('submit', handleTaskSubmit);
  categoryForm.addEventListener('submit', handleCategorySubmit);

  // Delete Buttons
  deleteTaskButton.addEventListener('click', handleTaskDelete);
  deleteCategoryButton.addEventListener('click', handleCategoryDelete);

  // Color Options
  colorOptions.forEach(option => {
    option.addEventListener('click', () => {
      colorOptions.forEach(opt => opt.classList.remove('selected'));
      option.classList.add('selected');
      categoryColorInput.value = option.dataset.color;
    });
  });

  // Theme Switch
  themeSwitch.addEventListener('change', () => {
    document.body.classList.toggle('dark', themeSwitch.checked);
    localStorage.setItem('darkMode', themeSwitch.checked);
  });

  // Search
  searchInput.addEventListener('input', () => {
    renderTasks();
  });

  // View Buttons
  viewButtons.forEach(button => {
    button.addEventListener('click', () => {
      viewButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      currentView = button.dataset.view;
      currentViewTitle.textContent = button.querySelector('span').textContent;
      renderTasks();
    });
  });

  // Grid/List View Toggle
  gridViewButton.addEventListener('click', () => {
    isGridView = true;
    isListView = false;
    isCalendarView = false;
    gridViewButton.classList.add('active');
    listViewButton.classList.remove('active');
    taskContainer.classList.remove('list-view');
    taskContainer.classList.remove('grid-view');
    enableCalendarView.classList.remove('active');
    localStorage.setItem('viewMode', 'grid');
    window.location.reload();
  });

  listViewButton.addEventListener('click', () => {
    isListView = true;
    isGridView = false;
    isCalendarView = false;
    listViewButton.classList.add('active');
    gridViewButton.classList.remove('active');
    enableCalendarView.classList.remove('active');
    taskContainer.classList.add('list-view');
    localStorage.setItem('viewMode', 'list');
    window.location.reload();
  });

  enableCalendarView.addEventListener('click', (e) => {
    e.preventDefault();
    isGridView = false;
    isListView = false;
    isCalendarView = true;
    enableCalendarView.classList.add('active');
    listViewButton.classList.remove('active');
    gridViewButton.classList.remove('active');
    localStorage.setItem('viewMode', 'calendar');
    openCalendar();
  });

  // Edit Task
  editTaskButton.addEventListener('click', () => {
    closeTaskDetailsModal();
    openTaskModal(currentTaskId);
  });

  // Complete Task
  completeTaskButton.addEventListener('click', toggleTaskCompletion);

  // Sort Dropdown
  dropdownButton.addEventListener('click', () => {
    dropdownButton.parentElement.classList.toggle('active');
  });

  // Sort Options
  sortOptions.forEach(option => {
    option.addEventListener('click', (e) => {
      e.preventDefault();
      currentSort = option.dataset.sort;
      dropdownButton.parentElement.classList.remove('active');
      renderTasks();
      localStorage.setItem('currentSort', currentSort);
    });
  });
}

// Backend API Functions
async function loadFromBackend() {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = 'main.html';
      return;
    }

    // Load Tasks
    const tasksResponse = await fetch(`${API_URL}/tasks`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });

    if (tasksResponse.ok) {
      tasks = await tasksResponse.json(); 
    } else if (tasksResponse.status === 401) {
      logout();
      return;
    } else {
      console.error('Failed to load tasks');
      tasks = [];
    }

    // Load Categories
    const categoriesResponse = await fetch(`${API_URL}/categories`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (categoriesResponse.ok) {
      categories = await categoriesResponse.json();
    } else {
      console.error('Failed to load categories');
      categories = [];
    }

    // Load View Mode
    const viewMode = localStorage.getItem('viewMode');
    if (viewMode === 'list') {
      isGridView = false;
      isCalendarView = false;
      listViewButton.classList.add('active');
      gridViewButton.classList.remove('active');
      taskContainer.classList.add('list-view');
    }

    // Load Sort
    const savedSort = localStorage.getItem('currentSort');
    if (savedSort) {
      currentSort = savedSort;
    }
  } catch (error) {
    console.error('Error loading data from backend:', error);
    triggerNotification('Failed to load data from server. Please check your connection.');
  }
}


// Task Operations
async function addTask(task) {
  try {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(task)
    });

    if (response.ok) {
      const newTask = await response.json();
      tasks.push(newTask);
      triggerNotification("🎉 Task saved successfully! One step closer to achieving your goals! 🚀");
      renderTasks();
      updateCounts();
      return newTask;
    } else if (response.status === 401) {
      logout();
    } else {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add task');
    }
  } catch (error) {
    console.error('Error adding task:', error);
    triggerNotification('Failed to add task: ' + error.message);
  }
}

async function updateTask(id, updatedTask) {
  try {
    const token = localStorage.getItem('token');

    const response = await fetch(`${API_URL}/tasks/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updatedTask)
    });

    if (response.ok) {
      const updated = await response.json();
      const index = tasks.findIndex(task => task._id === id);
      if (index !== -1) {
        tasks[index] = updated;
      }
      triggerNotification("🔄 Task updated successfully! Keep up the momentum! 🚀");
      renderTasks();
      updateCounts();
    } else if (response.status === 401) {
      logout();
    } else {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update task');
    }
  } catch (error) {
    console.error('Error updating task:', error);
    triggerNotification('Failed to update task: ' + error.message);
  }
}

async function deleteTask(id) {
  try {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_URL}/tasks/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      tasks = tasks.filter(task => task._id !== id);
      triggerNotification("✅ Task deleted successfully! Stay focused on what matters! 🚀");
      renderTasks();
      updateCounts();
    } else if (response.status === 401) {
      logout();
    } else {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete task');
    }
  } catch (error) {
    console.error('Error deleting task:', error);
    triggerNotification('Failed to delete task: ' + error.message);
  }
}

async function toggleTaskCompletion() {
  try {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_URL}/tasks/${currentTaskId}/toggle`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      const updated = await response.json();
      const index = tasks.findIndex(task => task._id === currentTaskId);
      if (index !== -1) {
        tasks[index] = updated;
        
        // Update button text
        if (tasks[index].completed) {
          completeTaskButton.innerHTML = '<i class="fas fa-undo"></i><span>Mark as Incomplete</span>';
          completeTaskButton.classList.add('completed');
        } else {
          completeTaskButton.innerHTML = '<i class="fas fa-check"></i><span>Mark as Complete</span>';
          completeTaskButton.classList.remove('completed');
        }
      }
      renderTasks();
      updateCounts();
    } else if (response.status === 401) {
      logout();
    } else {
      const error = await response.json();
      throw new Error(error.message || 'Failed to toggle task completion');
    }
  } catch (error) {
    console.error('Error toggling task completion:', error);
    triggerNotification('Failed to update task: ' + error.message);
  }
  closeTaskDetailsModal();
}

// Category Operations
async function addCategory(category) {
  try {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_URL}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(category)
    });

    if (response.ok) {
      const newCategory = await response.json();
      categories.push(newCategory);
      triggerNotification("✅ Category has been added successfully!");
      renderCategories();
      return newCategory;
    } else if (response.status === 401) {
      logout();
    } else {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add category');
    }
  } catch (error) {
    console.error('Error adding category:', error);
    triggerNotification('Failed to add category: ' + error.message);
  }
}

async function updateCategory(id, updatedCategory) {
  try {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_URL}/categories/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updatedCategory)
    });

    if (response.ok) {
      const updated = await response.json();
      const index = categories.findIndex(category => category._id === id);
      if (index !== -1) {
        categories[index] = updated;
      }
      triggerNotification("🔄 Category updated successfully! Keep everything organized! 📂");
      renderCategories();
      renderTasks(); // Re-render tasks to update category colors
    } else if (response.status === 401) {
      logout();
    } else {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update category');
    }
  } catch (error) {
    console.error('Error updating category:', error);
    triggerNotification('Failed to update category: ' + error.message);
  }
}

async function deleteCategory(id) {
  try {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_URL}/categories/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.ok) {
      categories = categories.filter(category => category._id !== id);
      // The backend will handle updating tasks that use this category
      
      triggerNotification("🎯 Category deleted successfully! Time for a fresh start! 🚀");
      renderCategories();
      
      // Reload tasks to get the updated category references
      const tasksResponse = await fetch(`${API_URL}/tasks`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (tasksResponse.ok) {
        tasks = await tasksResponse.json();
        renderTasks();
      }
    } else if (response.status === 401) {
      logout();
    } else {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete category');
    }
  } catch (error) {
    console.error('Error deleting category:', error);
    triggerNotification('Failed to delete category: ' + error.message);
  }
}

// Render Functions
function renderTasks() {
  taskContainer.innerHTML = '';

  // Filter tasks based on current view and search
  let filteredTasks = tasks;
  const searchTerm = searchInput.value.toLowerCase();

  // Apply view filter
  if (currentView === 'today') {
    const today = getTodayDate();
    filteredTasks = filteredTasks.filter(task => task.dueDate === today);
  } else if (currentView === 'upcoming') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    filteredTasks = filteredTasks.filter(task => {
      if (!task.dueDate || task.completed) return false;
      const dueDate = new Date(task.dueDate);
      return dueDate > today;
    });
  } else if (currentView === 'completed') {
    filteredTasks = filteredTasks.filter(task => task.completed);
  } else if (currentView.startsWith('category-')) {
    const categoryId = currentView.replace('category-', '');
    filteredTasks = filteredTasks.filter(task => task.category === categoryId);
  }

  // Apply search filter
  if (searchTerm) {
    filteredTasks = filteredTasks.filter(task => {
      return (
        (task.name && task.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    });
  }

  // Sort tasks
  filteredTasks = sortTasks(filteredTasks, currentSort);

  // Check if there are no tasks
  if (filteredTasks.length === 0) {
    renderEmptyState();
    return;
  }

  // Render each task
  filteredTasks.forEach(task => {
    const taskCard = document.createElement('div');
    taskCard.className = `task-card ${task.completed ? 'completed' : ''}`;
    taskCard.dataset.id = task._id;

    // Find category
    const category = task.category ? categories.find(cat => cat._id === task.category) : null;

    // Create task card content
    if (isGridView) {
      const now = new Date(); // Get the current date and time
      const taskDueDate = task.dueDate && task.dueTime ? new Date(task.dueDate + ' ' + task.dueTime) : null;
      const isOverdue = taskDueDate < now && !task.completed;

      taskCard.innerHTML = `
        <div class="task-header-row">
          <h3 class="task-title">${task.name}</h3>
          <div class="task-checkbox ${task.completed ? 'checked' : ''}" data-id="${task._id}">
            ${task.completed ? '<i class="fas fa-check"></i>' : ''}
          </div>
        </div>
        ${task.dueDate ? `
        <div class="task-date">
          <i class="far fa-calendar"></i>
          <span>${formatDate(task.dueDate)}${task.dueTime ? ' at ' + formatTime(task.dueTime) : ''}</span>
          ${isOverdue ? '<span class="due-tag">( Task Is Over Due ) </span>' : ''}
        </div>
        ` : ''}
        ${task.description ? `<p class="task-description">${task.description}</p>` : ''}
        <div class="task-footer">
          ${category ? `
          <div class="task-category" style="background-color: ${category.color}20; color: ${category.color}">
            <span class="category-color" style="background-color: ${category.color}"></span>
            <span>${category.name}</span>
          </div>
          ` : ''}
          <div class="task-priority">
            <span class="priority-indicator priority-${task.priority}"></span>
            <span>${capitalizeFirstLetter(task.priority)}</span>
          </div>
        </div>
      `;
    }
    else{
      // List view
      taskCard.innerHTML = `
        <div class="task-checkbox ${task.completed ? 'checked' : ''}" data-id="${task._id}">
          ${task.completed ? '<i class="fas fa-check"></i>' : ''}
        </div>
        <div class="task-header-row">
          <h3 class="task-title">${task.name}</h3>
          ${task.dueDate ? `
          <div class="task-date">
            <i class="far fa-calendar"></i>
            <span>${formatDate(task.dueDate)}${task.dueTime ? ' at ' + formatTime(task.dueTime) : ''}</span>
          </div>
          ` : ''}
        </div>
        <div class="task-footer">
          ${category ? `
          <div class="task-category" style="background-color: ${category.color}20; color: ${category.color}">
            <span class="category-color" style="background-color: ${category.color}"></span>
            <span>${category.name}</span>
          </div>
          ` : ''}
          <div class="task-priority">
            <span class="priority-indicator priority-${task.priority}"></span>
            <span>${capitalizeFirstLetter(task.priority)}</span>
          </div>
        </div>
      `;
    }

    taskContainer.appendChild(taskCard);

    // Add event listeners
    taskCard.addEventListener('click', (e) => {
      // Don't open details if clicking on checkbox
      if (!e.target.closest('.task-checkbox')) {
        openTaskDetailsModal(task._id);
      }
    });

    const checkbox = taskCard.querySelector('.task-checkbox');
    checkbox.addEventListener('click', async (e) => {
      e.stopPropagation(); // Prevent opening details
      const taskId = checkbox.dataset.id;
      
      try {
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_URL}/tasks/${taskId}/toggle`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const updatedTask = await response.json();
          const taskIndex = tasks.findIndex(t => t._id === taskId);
          
          if (taskIndex !== -1) {
            tasks[taskIndex] = updatedTask;
            renderTasks();
            updateCounts();
          }
          
          if (updatedTask.completed) {
            triggerNotification("🎉 Congratulations! You have completed your task.");
          } else {
            triggerNotification("😔 Oops! You have undone your task.");
          }
        } else if (response.status === 401) {
          logout();
        } else {
          throw new Error('Failed to toggle task completion');
        }
      } catch (error) {
        console.error('Error toggling task completion:', error);
        triggerNotification('Failed to update task: ' + error.message);
      }
    });
  });
}

function renderEmptyState() {
  let message = '';
  let icon = 'fas fa-tasks';

  if (searchInput.value) {
    message = 'No tasks match your search';
    icon = 'fas fa-search';
  } else if (currentView === 'today') {
    message = 'No tasks due today';
    icon = 'fas fa-calendar-day';
  } else if (currentView === 'upcoming') {
    message = 'No upcoming tasks';
    icon = 'fas fa-calendar-alt';
  } else if (currentView === 'completed') {
    message = 'No completed tasks';
    icon = 'fas fa-check-circle';
  } else if (currentView.startsWith('category-')) {
    const categoryId = currentView.replace('category-', '');
    const category = categories.find(cat => cat._id === categoryId);
    message = `No tasks in ${category ? category.name : 'this category'}`;
    icon = 'fas fa-tag';
  } else {
    message = 'No tasks yet';
    icon = 'fas fa-tasks';
  }
  
  taskContainer.innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon">
        <i class="${icon}"></i>
      </div>
      <h3 class="empty-state-title">${message}</h3>
      <p class="empty-state-description">
        ${searchInput.value ? 'Try a different search term or' : 'Get started by'} creating a new task.
      </p>
      <button class="empty-state-button" id="empty-state-create-button" onclick="openTaskModal()">
        <i class="fas fa-plus"></i>
        <span>Create Task</span>
      </button>
    </div>
  `;
}

function renderCategories() {
  // Render sidebar categories
  categoriesList.innerHTML = '';
  categories.forEach(category => {
    const li = document.createElement('li');
    li.className = `category-item ${currentView === 'category-' + category._id ? 'active' : ''}`;
    li.dataset.id = category._id;
    li.dataset.view = 'category-' + category._id;
    const trimmedName = category.name.length > 13 ? category.name.substring(0, 13) + '...' : category.name;
    li.innerHTML = `
      <span class="category-color" style="background-color: ${category.color}"></span>
      <span class="category-name" title="${category.name}">${trimmedName}</span>
      <span class="task-count" id="category-${category._id}-count">0</span>
      <span class="delete-category" data-id="${category._id}">&times;</span>
      <span class="edit-category" data-id="${category._id}"><i class="fas fa-edit"></i></span>
    `;

    categoriesList.appendChild(li);
    // Edit category button functionality
    li.querySelector('.edit-category').addEventListener('click', () => {
      const categoryId = li.dataset.id;
      openCategoryModal(categoryId);
    })
    // Add event listener for category selection
    li.addEventListener('click', (event) => {
      if (event.target.classList.contains('delete-category')) return; // Prevent category deletion click from triggering selection

      viewButtons.forEach(btn => btn.classList.remove('active'));
      document.querySelectorAll('.category-item').forEach(item => item.classList.remove('active'));
      li.classList.add('active');
      currentView = 'category-' + category._id;
      currentViewTitle.textContent = category.name;
      renderTasks();
      localStorage.setItem('currentView', currentView);
    });

    // Add event listener for category deletion
    li.querySelector('.delete-category').addEventListener('click', (event) => {
      event.stopPropagation(); // Prevent triggering category selection
      deleteConfirmationModal.style.display = "block";
      deleteConfirmationModal.style.display = "flex";

      document.getElementById('cancel-btn').addEventListener('click', (event) => {
        event.preventDefault();
        deleteConfirmationModal.style.display = "none";
      })

      document.getElementById('confirm-btn').addEventListener('click', (e) => {
        e.preventDefault();
        deleteConfirmationModal.style.display = "none";
        deleteCategory(category._id);
      })
    });
  });

  // Render task form categories
  taskCategorySelect.innerHTML = '<option value="">No Category</option>';
  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category._id;
    option.textContent = category.name;
    taskCategorySelect.appendChild(option);
  });

  updateCounts();
}

function updateCounts() {
  // All tasks count
  document.getElementById('all-count').textContent = tasks.length;

  // Today count
  const today = getTodayDate();
  const todayCount = tasks.filter(task => task.dueDate === today).length;
  document.getElementById('today-count').textContent = todayCount;

  // Upcoming count
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  const upcomingCount = tasks.filter(task => {
    if (!task.dueDate || task.completed) return false;
    const dueDate = new Date(task.dueDate);
    return dueDate > todayDate;
  }).length;
  document.getElementById('upcoming-count').textContent = upcomingCount;

  // Completed count
  const completedCount = tasks.filter(task => task.completed).length;
  document.getElementById('completed-count').textContent = completedCount;

  // Category counts
  categories.forEach(category => {
    const count = tasks.filter(task => task.category === category._id).length;
    const countElement = document.getElementById(`category-${category._id}-count`);
    if (countElement) {
      countElement.textContent = count;
    }
  });
}

// Modal Functions
function openTaskModal(taskId = null) {
  currentTaskId = taskId;
  const modalTitle = document.getElementById('modal-title');
  const taskNameInput = document.getElementById('task-name');
  const taskDescriptionInput = document.getElementById('task-description');
  const dueDateInput = document.getElementById('due-date');
  const dueTimeInput = document.getElementById('due-time');
  const taskCategorySelect = document.getElementById('task-category');
  const taskPrioritySelect = document.getElementById('task-priority');
  const taskIdInput = document.getElementById('task-id');

  // Reset form
  taskForm.reset();
  if (taskId) {
    // Edit mode
    modalTitle.textContent = 'Edit Task';
    deleteTaskButton.style.display = 'block';

    const task = tasks.find(task => task._id === taskId);
    if (task) {
      taskNameInput.value = task.name;
      taskDescriptionInput.value = task.description || '';
      dueDateInput.value = task.dueDate || '';
      dueTimeInput.value = task.dueTime || '';
      taskCategorySelect.value = task.category || '';
      taskPrioritySelect.value = task.priority;
      taskIdInput.value = task._id;
    }
  } else {
    // Create mode
    modalTitle.textContent = 'Create New Task';
    deleteTaskButton.style.display = 'none';
    taskIdInput.value = '';

    // Set default due date to today
    dueDateInput.value = getTodayDate();
  }

  taskModal.style.display = 'block';
  overlay.style.display = 'block';
  taskNameInput.focus();
}

function closeTaskModal() {
  taskModal.style.display = 'none';
  overlay.style.display = 'none';
}

function openCategoryModal(categoryId = null) {
  currentCategoryId = categoryId;
  const modalTitle = document.getElementById('category-modal-title');
  const categoryNameInput = document.getElementById('category-name');
  const categoryColorInput = document.getElementById('category-color');
  const categoryIdInput = document.getElementById('category-id');

  // Reset form
  categoryForm.reset();

  // Reset color options
  colorOptions.forEach(option => option.classList.remove('selected'));
  colorOptions[0].classList.add('selected');
  categoryColorInput.value = colorOptions[0].dataset.color;
  deleteCategoryButton.style.display = 'none';

  if (categoryId) {
    // Edit mode
    const saveButton = document.getElementById('save-category');
    overlay.style.display = 'block';
    categoryModal.style.display = 'block';
    modalTitle.textContent = 'Edit Category';
    deleteCategoryButton.style.display = 'block';
    saveButton.textContent = "Update Category";

    const category = categories.find(category => category._id === categoryId);
    if (category) {
      categoryNameInput.value = category.name;
      categoryColorInput.value = category.color;
      categoryIdInput.value = category._id;

      // Select the correct color option
      colorOptions.forEach(option => {
        if (option.dataset.color === category.color) {
          option.classList.add('selected');
        } else {
          option.classList.remove('selected');
        }
      });
    }
  }
  else {
    modalTitle.textContent = 'Add Category';
    categoryIdInput.value = '';
    categoryModal.style.display = 'block';
    overlay.style.display = 'block';
    categoryNameInput.focus();
  }
}

function closeCategoriesModal() {
  categoryModal.style.display = 'none';
  overlay.style.display = 'none';
}

function openTaskDetailsModal(taskId) {
  currentTaskId = taskId;
  const task = tasks.find(task => task._id === taskId);
  if (!task) return;

  const taskDetailsTitle = document.getElementById('task-details-title');
  const taskDetailsDate = document.getElementById('task-details-date');
  const taskDetailsCategory = document.getElementById('task-details-category');
  const taskDetailsPriority = document.getElementById('task-details-priority');
  const taskDetailsDescription = document.getElementById('task-details-description-text');
  const completeTaskButton = document.getElementById('complete-task-button');

  taskDetailsTitle.textContent = task.name;

  // Format date
  if (task.dueDate) {
    taskDetailsDate.textContent = `${formatDate(task.dueDate)}${task.dueTime ? ' at ' + formatTime(task.dueTime) : ''}`;
  } else {
    taskDetailsDate.textContent = 'No due date';
  }

  // Category
  if (task.category) {
    const category = categories.find(cat => cat._id === task.category);
    if (category) {
      taskDetailsCategory.innerHTML = `<span class="category-color" style="background-color: ${category.color}"></span> ${category.name}`;
    } else {
      taskDetailsCategory.textContent = 'No category';
    }
  } else {
    taskDetailsCategory.textContent = 'No category';
  }

  // Priority
  taskDetailsPriority.innerHTML = `<span class="priority-indicator priority-${task.priority}"></span>${capitalizeFirstLetter(task.priority)}`;

  // Description
  taskDetailsDescription.textContent = task.description || 'No description provided.';

  // Complete button
  if (task.completed) {
    completeTaskButton.innerHTML = '<i class="fas fa-undo"></i><span>Mark as Incomplete</span>';
    completeTaskButton.classList.add('completed');
  } else {
    completeTaskButton.innerHTML = '<i class="fas fa-check"></i><span>Mark as Complete</span>';
    completeTaskButton.classList.remove('completed');
  }

  taskDetailsModal.style.display = 'block';
  overlay.style.display = 'block';
}

function closeTaskDetailsModal() {
  taskDetailsModal.style.display = 'none';
  overlay.style.display = 'none';
}

// Form Handlers
async function handleTaskSubmit(e) {
  e.preventDefault();

  const taskId = document.getElementById('task-id').value;
  const name = document.getElementById('task-name').value;
  const description = document.getElementById('task-description').value;
  const dueDate = document.getElementById('due-date').value;
  const dueTime = document.getElementById('due-time').value;
  const category = document.getElementById('task-category').value;
  const priority = document.getElementById('task-priority').value;

  const taskData = {
    name,
    description,
    dueDate,
    dueTime,
    category: category || null,
    priority
  };

  if (taskId) {
    await updateTask(taskId, taskData);
  } else {
    await addTask(taskData);
  }

  closeTaskModal();
}

async function handleCategorySubmit(e) {
  e.preventDefault();

  const categoryId = document.getElementById('category-id').value;
  const name = document.getElementById('category-name').value;
  const color = document.getElementById('category-color').value;

  const categoryData = {
    name,
    color
  };

  if (categoryId) {
    await updateCategory(categoryId, categoryData);
  } else {
    await addCategory(categoryData);
  }

  closeCategoriesModal();
}

async function handleTaskDelete() {
  if (currentTaskId) {
    await deleteTask(currentTaskId);
    closeTaskModal();
  }
}

async function handleCategoryDelete() {
  if (currentCategoryId) {
    await deleteCategory(currentCategoryId);
    closeCategoriesModal();
  }
}

// Utility Functions
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDate(dateString) {
  if (!dateString) return '';

  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', options);
}

function formatTime(timeString) {
  if (!timeString) return '';

  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours, 10);
  const period = hour >= 12 ? 'PM' : 'AM';
  const formattedHour = hour % 12 || 12;

  return `${formattedHour}:${minutes} ${period}`;
}

function capitalizeFirstLetter(string) {
  if (typeof string !== 'string' || string.length === 0) {
    console.error('Invalid input:', string);
    return ''; // Return an empty string if input is invalid
  }
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function sortTasks(tasks, sortBy) {
  return [...tasks].sort((a, b) => {
    switch (sortBy) {
      case 'date-asc':
        return new Date(a.dueDate || '9999-12-31') - new Date(b.dueDate || '9999-12-31');
      case 'date-desc':
        return new Date(b.dueDate || '0000-01-01') - new Date(a.dueDate || '0000-01-01');
      case 'priority-high':
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      case 'priority-low':
        const priorityOrderReverse = { low: 0, medium: 1, high: 2 };
        return priorityOrderReverse[a.priority] - priorityOrderReverse[b.priority];
      case 'name-asc':
        return (a.name || "").localeCompare(b.name || "");
      case 'name-desc':
        return (b.name || "").localeCompare(a.name || "");
      default:
        return new Date(b.createdAt) - new Date(a.createdAt);
    }
  });
}

function checkTheme() {
  const darkMode = localStorage.getItem('darkMode');
  if (darkMode === 'true') {
    document.body.classList.add('dark');
    themeSwitch.checked = true;
  }
}

// keyboard shortcuts 
document.addEventListener("keydown", (event) => {
  if (event.ctrlKey && event.key === "k") {
    event.preventDefault()
    document.getElementById("create-task-button").click();
  } else if (event.ctrlKey && event.key === "f") {
    event.preventDefault()
    document.getElementById("search-input").focus();
  }
})

const settingsButton = document.getElementById('settings-button');
const closeSettingsButton = document.getElementById('close-settings');
const settingsOffcanvas = document.getElementById('settings-offcanvas');
const settingsOverlay = document.getElementById('settings-overlay');

// Toggle settings offcanvas
settingsButton.addEventListener('click', () => {
  settingsOffcanvas.classList.add('active');
  settingsOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
});

// Close settings offcanvas
closeSettingsButton.addEventListener('click', closeSettings);
settingsOverlay.addEventListener('click', closeSettings);

function closeSettings() {
  settingsOffcanvas.classList.remove('active');
  settingsOverlay.classList.remove('active');
  document.body.style.overflow = '';
}

// Export tasks
document.getElementById("exportTasks").addEventListener("click", async () => {
  try {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_URL}/tasks`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch tasks');
    }
    
    const tasks = await response.json();
    
    if (tasks.length === 0) {
      alert("No tasks available to export.");
      return;
    }

    // Define CSV headers
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID,Name,Description,Due Date,Due Time,Category,Priority,Completed,Created At\n";

    // Convert each task object into a CSV row
    tasks.forEach(task => {
      let row = `${task._id},"${task.name}","${task.description ? task.description.replace(/\n/g, " ") : ""}",${task.dueDate || ""},${task.dueTime || ""},${task.category || ""},${task.priority},${task.completed},${task.createdAt}`;
      csvContent += row + "\n";
    });

    // Create a downloadable CSV file
    let encodedUri = encodeURI(csvContent);
    let link = document.createElement("a");
    link.href = encodedUri;
    link.download = "tasks.csv";
    link.click();
  } catch (error) {
    console.error('Error exporting tasks:', error);
    triggerNotification('Failed to export tasks: ' + error.message);
  }
});

// Import tasks
document.getElementById("importTasks").addEventListener("change", async (event) => {
  let file = event.target.files[0];

  if (file) {
    let reader = new FileReader();
    reader.onload = async (e) => {
      let csvData = e.target.result.split("\n").slice(1); // Skip header row
      let importedTasks = [];

      csvData.forEach(row => {
        if (!row.trim()) return; // Skip empty rows
        
        let columns = row.split(",");

        if (columns.length >= 9) { // Ensure the row has enough data
          let task = {
            name: columns[1].trim().replace(/"/g, ""), // Remove quotes
            description: columns[2].trim().replace(/"/g, ""),
            dueDate: columns[3].trim(),
            dueTime: columns[4].trim(),
            category: columns[5].trim() || null,
            priority: columns[6].trim(),
            completed: columns[7].trim().toLowerCase() === "true" // Convert to boolean
          };
          importedTasks.push(task);
        }
      });

      try {
        const token = localStorage.getItem('token');
        
        // Import each task to the backend
        for (const task of importedTasks) {
          await fetch(`${API_URL}/tasks`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(task)
          });
        }

        alert("Tasks imported successfully!");
        triggerNotification("✅ Tasks imported successfully!");
        
        // Reload tasks from backend
        await loadFromBackend();
        renderTasks();
        updateCounts();
      } catch (error) {
        console.error('Error importing tasks:', error);
        triggerNotification('Failed to import tasks: ' + error.message);
      }
    };

    reader.readAsText(file);
  }
});

// Import categories 
document.getElementById("importCategories").addEventListener("change", async (event) => {
  let file = event.target.files[0];

  if (file) {
    let reader = new FileReader();
    reader.onload = async (e) => {
      let csvData = e.target.result.split("\n").slice(1); // Skip header row
      let importedCategories = [];

      csvData.forEach(row => {
        if (!row.trim()) return; // Skip empty rows
        
        let columns = row.split(",");

        if (columns.length >= 3) { // Ensure the row has enough data
          let category = {
            name: columns[1].trim().replace(/"/g, ""), // Remove quotes
            color: columns[2].trim().replace(/"/g, "")
          };
          importedCategories.push(category);
        }
      });

      try {
        const token = localStorage.getItem('token');
        
        // Import each category to the backend
        for (const category of importedCategories) {
          await fetch(`${API_URL}/categories`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(category)
          });
        }

        alert("Categories imported successfully!");
        triggerNotification("✅ Categories imported successfully!");
        
        // Reload categories from backend
        await loadFromBackend();
        renderCategories();
        renderTasks();
      } catch (error) {
        console.error('Error importing categories:', error);
        triggerNotification('Failed to import categories: ' + error.message);
      }
    };

    reader.readAsText(file);
  }
});

// Export categories 
document.getElementById("exportCategories").addEventListener("click", async () => {
  try {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_URL}/categories`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch categories');
    }
    
    const categories = await response.json();
    
    if (categories.length === 0) {
      alert("No categories to export.");
      return;
    }

    let csvContent = "ID,Name,Color\n"; // CSV Header
    categories.forEach(category => {
      csvContent += `${category._id},"${category.name}","${category.color}"\n`;
    });

    let blob = new Blob([csvContent], { type: "text/csv" });
    let link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "categories.csv";
    link.click();
  } catch (error) {
    console.error('Error exporting categories:', error);
    triggerNotification('Failed to export categories: ' + error.message);
  }
});

// push notification 
let notificationDisplayed = false;
function triggerNotification(message) {
  // Remove Duplicate Notifications
  if (notificationDisplayed) {
    return;
  }
  notificationDisplayed = true;
  const notification = document.createElement("div");
  notification.classList.add("notification");
  notification.innerText = message;

  const container = document.getElementById("notification-container");
  container.appendChild(notification);

  setTimeout(() => {
    notification.classList.add("hide");
    setTimeout(() => {
      container.removeChild(notification);
      notificationDisplayed = false;
    }, 0);
  }, 3000);
}

// Calendar view code
function openCalendar() {
  taskContainer.innerHTML = '';
  taskContainer.style.background = 'rgba(255, 255, 255, 0.2);';
  taskContainer.innerHTML =
    `<div class="calendar-module-container">
        <!-- Calendar View -->
        <div class="calendar-view">
        <!-- Calendar Controls -->
        <div class="calendar-controls">
            <div class="flex items-center gap-4">
            <button class="today-button" id="todayButton">Today</button>
            <div class="flex">
                <button class="nav-button nav-button-left" id="prevButton">
                <svg class="icon-sm" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
                </button>
                <button class="nav-button nav-button-right" id="nextButton">
                <svg class="icon-sm" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
                </button>
            </div>
            <h2 class="current-date" id="currentDate">March 15</h2>
            </div>

            <div class="view-selector">
            <button class="view-button" data-view="day">Day</button>
            <button class="view-button active" data-view="week">Week</button>
            <button class="view-button" data-view="month">Month</button>
            </div>
        </div>

        <!-- Week View -->
        <div class="calendar-container">
            <div class="calendar-inner">
            <!-- Week Header -->
            <div class="week-header" id="weekHeader">
                <div class="time-column-header"></div>
                <!-- Day headers will be inserted by JavaScript -->
            </div>

            <!-- Time Grid -->
            <div class="time-grid">
                <!-- Time Labels -->
                <div class="time-labels" id="timeLabels">
                <!-- Time slots will be inserted by JavaScript -->
                </div>

                <!-- Days Columns -->
                <div class="days-columns" id="daysColumns">
                <!-- Day columns will be inserted by JavaScript -->
                </div>
            </div>
            </div>
        </div>
    </div>

<!-- Event Details Popup -->
<div class="event-popup" id="eventPopup">
  <div class="event-popup-content" id="eventPopupContent">
    <!-- Event details will be inserted by JavaScript -->
  </div>
</div>
</div>`;

  // Initialize variables
  let currentView = 'week';
  let currentDate = new Date();
  let selectedTask = null;

  // Initialize the calendar
  function initCalendar() {
    updateCurrentDateDisplay();
    initWeekView();
    addEventListeners();
  }

  // Update current date display
  function updateCurrentDateDisplay() {
    const options = { month: 'long', day: 'numeric' };
    const newDate = document.getElementById('currentDate')
    if (options && newDate) {
      newDate.textContent = currentDate.toLocaleString('default', options);
    }
  }

  // Initialize week view
  function initWeekView() {
    // Clear existing content
    document.getElementById('weekHeader').innerHTML = '<div class="time-column-header"></div>';
    document.getElementById('timeLabels').innerHTML = '';
    document.getElementById('daysColumns').innerHTML = '';

    // Get start of week (Sunday)
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

    // Add week header days
    const weekDays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    const weekHeader = document.getElementById('weekHeader');

    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(startOfWeek);
      dayDate.setDate(startOfWeek.getDate() + i);

      const dayHeader = document.createElement('div');
      dayHeader.className = 'day-header';

      const dayName = document.createElement('div');
      dayName.className = 'day-name';
      dayName.textContent = weekDays[i];

      const dayNumber = document.createElement('div');
      const isCurrentDay = isSameDay(dayDate, new Date());
      dayNumber.className = isCurrentDay ? 'day-number current' : 'day-number';
      dayNumber.textContent = dayDate.getDate();

      dayHeader.appendChild(dayName);
      dayHeader.appendChild(dayNumber);
      weekHeader.appendChild(dayHeader);
    }

    // Add time labels (8 AM to 8 PM)
    const timeLabels = document.getElementById('timeLabels');

    for (let hour = 0; hour < 24; hour++) {
      const timeLabel = document.createElement('div');
      timeLabel.className = 'time-label';
      timeLabel.textContent = formatHour(hour);
      timeLabels.appendChild(timeLabel);
    }

    // Function to format hour correctly (12-hour format with AM/PM)
    function formatHour(hour) {
      if (hour === 0) return "12 AM"; // Midnight
      if (hour === 12) return "12 PM"; // Noon
      return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
    }

    // Add day columns
    const daysColumns = document.getElementById('daysColumns');
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const dayColumn = document.createElement('div');
      dayColumn.className = 'day-column';

      // Add time slots
      for (let hour = 1; hour <= 24; hour++) {
        const timeSlot = document.createElement('div');
        timeSlot.className = 'time-slot';
        dayColumn.appendChild(timeSlot);
      }

      // Get date for this column
      const columnDate = new Date(startOfWeek);
      columnDate.setDate(startOfWeek.getDate() + dayIndex);

      // Add tasks for this day
      const dayTasks = tasks.filter(task => {
        const taskDate = new Date(task.dueDate);
        return isSameDay(taskDate, columnDate);
      });

      dayTasks.forEach(task => {
        const taskElement = createTaskElement(task);
        dayColumn.appendChild(taskElement);
      });

      daysColumns.appendChild(dayColumn);
    }
  }

  // Create task element
  function createTaskElement(task) {
    const taskElement = document.createElement('div');
    taskElement.className = `event priority-${task.priority} ${task.completed ? 'completed' : ''}`;

    // Calculate position based on due time
    const [hours, minutes] = task.dueTime.split(':').map(Number);
    const timePosition = hours + minutes / 60; // Convert time to decimal hours

    taskElement.style.top = `${timePosition * 5}rem`; // 5rem per hour, starting at 12 AM
    taskElement.style.height = '4rem'; // Fixed height for tasks

    const taskTitle = document.createElement('div');
    taskTitle.className = 'event-title';
    taskTitle.textContent = task.name;

    const taskTime = document.createElement('div');
    taskTime.className = 'event-time';
    taskTime.textContent = formatTime1(task.dueTime);

    taskElement.appendChild(taskTitle);
    taskElement.appendChild(taskTime);

    // Add click event
    taskElement.addEventListener('click', () => {
      showTaskDetails(task);
    });

    return taskElement;
  }

  // Function to format time as AM/PM
  function formatTime1(time) {
    const [hour, minute] = time.split(':').map(Number);
    const period = hour < 12 ? 'AM' : 'PM';
    const formattedHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${formattedHour}:${minute.toString().padStart(2, '0')} ${period}`;
  }

  // Show task details
  function showTaskDetails(task) {
    selectedTask = task;
    const eventPopup = document.getElementById('eventPopup');
    const eventPopupContent = document.getElementById('eventPopupContent');

    // Set background color based on priority
    eventPopupContent.className = `event-popup-content priority-${task.priority}`;

    // Format date
    const taskDate = new Date(task.dueDate);
    const dateOptions = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
    const formattedDate = taskDate.toLocaleDateString('en-US', dateOptions);
    const category = categories.find(cat => cat._id === task.category);
    const categoryText = category ? category.name : 'Task Category not Assigned. Please Edit the task to assign a category.';
    // Create content
    eventPopupContent.innerHTML = `
    <h3 class="event-title">${task.name}</h3>
    <div class="event-status ${task.completed ? 'completed' : 'pending'}">
      ${task.completed ? 'Completed' : 'Pending'}
    </div>
    <div class="event-detail">Category : ${categoryText}</div>
    <div class="event-detail">
      <svg class="event-detail-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
      </svg>
      ${formatTime(task.dueTime)} - Due Time
    </div>
    <div class="event-detail">
      <svg class="event-detail-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
      </svg>
      ${formattedDate}
    </div>
    <div class="event-detail">
      <svg class="event-detail-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 20h9"></path>
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
      </svg>
      Priority: ${capitalizeFirstLetter(task.priority)}
    </div>
    <p class="event-description"><strong>Description:</strong><br>${task.description || 'No description provided.'}</p>
    <div class="event-detail">
      <svg class="event-detail-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
      </svg>
      Created: ${new Date(task.createdAt).toLocaleString()}
    </div>
    <div class="event-actions">
      <button class="event-close-button" id="closeEventPopup">Close</button>
    </div>
  `;

    // Show popup
    eventPopup.classList.add('show');

    // Add close event
    document.getElementById('closeEventPopup').addEventListener('click', () => {
      eventPopup.classList.remove('show');
      selectedTask = null;
    });
  }

  // Add event listeners
  function addEventListeners() {
    // Today button
    document.getElementById('todayButton').addEventListener('click', () => {
      currentDate = new Date();
      updateCurrentDateDisplay();
      initWeekView();
    });

    // Previous button
    document.getElementById('prevButton').addEventListener('click', () => {
      if (currentView === 'day') {
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (currentView === 'week') {
        currentDate.setDate(currentDate.getDate() - 7);
      } else if (currentView === 'month') {
        currentDate.setMonth(currentDate.getMonth() - 1);
      }
      updateCurrentDateDisplay();
      initWeekView();
    });

    // Next button
    document.getElementById('nextButton').addEventListener('click', () => {
      if (currentView === 'day') {
        currentDate.setDate(currentDate.getDate() + 1);
      } else if (currentView === 'week') {
        currentDate.setDate(currentDate.getDate() + 7);
      } else if (currentView === 'month') {
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
      updateCurrentDateDisplay();
      initWeekView();
    });

    // View buttons
    document.querySelectorAll('.view-button').forEach(button => {
      button.addEventListener('click', () => {
        // Remove active class from all buttons
        document.querySelectorAll('.view-button').forEach(btn => {
          btn.classList.remove('active');
        });

        // Add active class to clicked button
        button.classList.add('active');

        // Update current view
        currentView = button.dataset.view;

        // Currently only week view is implemented
        initWeekView();
      });
    });
  }

  // Helper function: Format hour (8 AM, 2 PM, etc.)
  function formatHour(hour) {
    return hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
  }

  // Helper function: Check if two dates are the same day
  function isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate();
  }

  // Initialize the calendar
  initCalendar();

  // Expose functions to window for external access
  window.calendarModule = {
    refreshCalendar: function () {
      initWeekView();
    },
    goToDate: function (date) {
      currentDate = new Date(date);
      updateCurrentDateDisplay();
      initWeekView();
    }
  };
}

// Initialize the app
init();