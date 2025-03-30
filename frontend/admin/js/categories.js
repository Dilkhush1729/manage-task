// DOM Elements
const categoriesTable = document.getElementById('categories-table');
const totalCategoriesCount = document.getElementById('total-categories-count');
const mostUsedCategory = document.getElementById('most-used-category');
const usersWithCategories = document.getElementById('users-with-categories');
const categorySearch = document.getElementById('category-search');
const userFilter = document.getElementById('user-filter');
const selectAllCategories = document.getElementById('select-all-categories');
const bulkActions = document.getElementById('bulk-actions');
const bulkDeleteBtn = document.getElementById('bulk-delete-btn');
const paginationStart = document.getElementById('pagination-start');
const paginationEnd = document.getElementById('pagination-end');
const paginationTotal = document.getElementById('pagination-total');
const paginationControls = document.getElementById('pagination-controls');

// Category details modal
const categoryDetailsModal = document.getElementById('category-details-modal');
const categoryDetailsContent = document.getElementById('category-details-content');
const closeCategoryDetails = document.getElementById('close-category-details');
const closeCategoryDetailsBtn = document.getElementById('close-category-details-btn');
const editCategoryBtn = document.getElementById('edit-category-btn');

// Create/Edit category modal
const editCategoryModal = document.getElementById('edit-category-modal');
const categoryModalTitle = document.getElementById('category-modal-title');
const editCategoryForm = document.getElementById('edit-category-form');
const editCategoryId = document.getElementById('edit-category-id');
const editCategoryName = document.getElementById('edit-category-name');
const editCategoryColor = document.getElementById('edit-category-color');
const editCategoryUser = document.getElementById('edit-category-user');
const closeEditCategory = document.getElementById('close-edit-category');
const saveCategoryBtn = document.getElementById('save-category-btn');
const deleteCategoryBtn = document.getElementById('delete-category-btn');
const createCategoryBtn = document.getElementById('create-category-btn');
const colorOptions = document.querySelectorAll('.color-option');

// Import categories modal
const importModal = document.getElementById('import-modal');
const importUser = document.getElementById('import-user');
const importFile = document.getElementById('import-file');
const closeImportModal = document.getElementById('close-import-modal');
const cancelImport = document.getElementById('cancel-import');
const confirmImport = document.getElementById('confirm-import');
const downloadTemplateBtn = document.getElementById('download-template-btn');
const importCategoryBtn = document.getElementById('import-category-btn');

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
let totalCategories = 0;
let filteredCategories = [];
let selectedCategories = new Set();
let allUsers = [];
let categoryTaskCounts = {};


// Setup event listeners
function setupEventListeners() {
  // Search input
  categorySearch.addEventListener('input', debounce(() => {
    loadCategories(1, getFilters());
  }, 300));

  // Filters
  userFilter.addEventListener('change', () => {
    loadCategories(1, getFilters());
  });

  // Select all categories
  selectAllCategories.addEventListener('change', () => {
    const checkboxes = document.querySelectorAll('.category-checkbox');
    checkboxes.forEach(checkbox => {
      checkbox.checked = selectAllCategories.checked;
      if (selectAllCategories.checked) {
        selectedCategories.add(checkbox.dataset.id);
      } else {
        selectedCategories.delete(checkbox.dataset.id);
      }
    });
    updateBulkActions();
  });

  // Bulk actions
  bulkDeleteBtn.addEventListener('click', () => {
    openDeleteCategoryModal(Array.from(selectedCategories));
  });

  // Category details modal
  closeCategoryDetails.addEventListener('click', () => {
    categoryDetailsModal.classList.remove('show');
  });

  closeCategoryDetailsBtn.addEventListener('click', () => {
    categoryDetailsModal.classList.remove('show');
  });

  editCategoryBtn.addEventListener('click', () => {
    openEditCategoryModal(editCategoryBtn.dataset.id);
  });

  // Create/Edit category modal
  createCategoryBtn.addEventListener('click', () => {
    openEditCategoryModal();
  });

  closeEditCategory.addEventListener('click', () => {
    editCategoryModal.classList.remove('show');
  });

  saveCategoryBtn.addEventListener('click', saveCategoryChanges);

  deleteCategoryBtn.addEventListener('click', () => {
    openDeleteCategoryModal([deleteCategoryBtn.dataset.id]);
  });

  // Color options
  colorOptions.forEach(option => {
    option.addEventListener('click', () => {
      colorOptions.forEach(opt => opt.classList.remove('selected'));
      option.classList.add('selected');
      editCategoryColor.value = option.dataset.color;
    });
  });

  // Import categories modal
  importCategoryBtn.addEventListener('click', () => {
    importModal.classList.add('show');
  });

  closeImportModal.addEventListener('click', () => {
    importModal.classList.remove('show');
  });

  cancelImport.addEventListener('click', () => {
    importModal.classList.remove('show');
  });

  confirmImport.addEventListener('click', importCategoriesFromCSV);

  downloadTemplateBtn.addEventListener('click', downloadCSVTemplate);

  // Export dropdown
  exportDropdownBtn.addEventListener('click', () => {
    exportDropdown.classList.toggle('show');
  });

  // Close export dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!exportDropdownBtn.contains(e.target) && !exportDropdown.contains(e.target)) {
      exportDropdown.classList.remove('show');
    }
  });

  exportCsvBtn.addEventListener('click', (e) => {
    e.preventDefault();
    exportCategoriesToCSV();
    exportDropdown.classList.remove('show');
  });

  exportJsonBtn.addEventListener('click', (e) => {
    e.preventDefault();
    exportCategoriesToJSON();
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
    const categoryIds = JSON.parse(confirmDelete.dataset.ids);
    deleteCategories(categoryIds);
  });

  // Close modals when clicking outside
  categoryDetailsModal.addEventListener('click', (e) => {
    if (e.target === categoryDetailsModal) {
      categoryDetailsModal.classList.remove('show');
    }
  });

  editCategoryModal.addEventListener('click', (e) => {
    if (e.target === editCategoryModal) {
      editCategoryModal.classList.remove('show');
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

// Mock functions (replace with your actual implementations)
function showNotification(message, type) {
  console.log(`Notification: ${message} (Type: ${type})`);
}

async function apiRequest(url, method = 'GET', data = null) {
  // let API_URL = '/api'; // Define API_URL here or fetch from config
  const token = localStorage.getItem('adminToken');
  const options = {
    method: method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${API_URL}${url}`, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString(undefined, options);
}

// let API_URL = '/api'; // Define API_URL here or fetch from config

// Initialize categories page
async function initCategoriesPage() {
  try {
    // Load users for filters and dropdowns
    await loadUsers();

    // Load categories
    await loadCategories();

    // Set up event listeners
    setupEventListeners();
  } catch (error) {
    console.error('Error initializing categories page:', error);
    showNotification('Failed to load categories data', 'error');
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
    editCategoryUser.innerHTML = userOptions;
    importUser.innerHTML = userOptions;
  } catch (error) {
    console.error('Error loading users:', error);
    showNotification('Failed to load users', 'error');
  }
}

// Load categories
async function loadCategories(page = 1, filters = {}) {
  try {
    // Show loading
    categoriesTable.innerHTML = '<tr><td colspan="6" class="text-center">Loading categories...</td></tr>';

    // Clear selected categories
    selectedCategories.clear();
    selectAllCategories.checked = false;
    updateBulkActions();

    // Get categories
    const categories = await apiRequest('/admin/categories');

    // Get task counts for each category
    await loadCategoryTaskCounts();

    // Apply filters
    filteredCategories = categories.filter(category => {
      // Search filter
      if (filters.search && !category.name.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }

      // User filter
      if (filters.userId && (!category.user || !category.user._id || category.user._id !== filters.userId)) {
        return false;
      }

      return true;
    });

    // Update stats
    updateCategoryStats(categories);

    // Update pagination
    totalCategories = filteredCategories.length;
    updatePagination(page);

    // Get paginated categories
    const startIndex = (page - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalCategories);
    const paginatedCategories = filteredCategories.slice(startIndex, endIndex);

    // Render categories
    if (paginatedCategories.length === 0) {
      categoriesTable.innerHTML = '<tr><td colspan="6" class="text-center">No categories found</td></tr>';
      return;
    }

    categoriesTable.innerHTML = paginatedCategories.map(category => `
      <tr>
        <td>
          <div class="form-check">
            <input type="checkbox" class="form-check-input category-checkbox" data-id="${category._id}">
          </div>
        </td>
        <td>
          <div class="category-name-cell">
            <span class="category-color" style="background-color: ${category.color}"></span>
            <span class="category-name">${category.name}</span>
          </div>
        </td>
        <td>
          <span class="color-preview" style="background-color: ${category.color}"></span>
          <span class="color-code">${category.color}</span>
        </td>
        <td>${category.user ? category.user.name : 'N/A'}</td>
        <td>${categoryTaskCounts[category._id] || 0}</td>
        <td>
          <button class="btn btn-sm btn-primary view-category-btn" data-id="${category._id}">
            <i class="fas fa-eye"></i>
          </button>
          <button class="btn btn-sm btn-secondary edit-category-btn" data-id="${category._id}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-sm btn-danger delete-category-btn" data-id="${category._id}">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');

    // Add event listeners to buttons
    document.querySelectorAll('.view-category-btn').forEach(btn => {
      btn.addEventListener('click', () => viewCategory(btn.dataset.id));
    });

    document.querySelectorAll('.edit-category-btn').forEach(btn => {
      btn.addEventListener('click', () => openEditCategoryModal(btn.dataset.id));
    });

    document.querySelectorAll('.delete-category-btn').forEach(btn => {
      btn.addEventListener('click', () => openDeleteCategoryModal([btn.dataset.id]));
    });

    // Add event listeners to checkboxes
    document.querySelectorAll('.category-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
          selectedCategories.add(checkbox.dataset.id);
        } else {
          selectedCategories.delete(checkbox.dataset.id);
        }
        updateBulkActions();
      });
    });
  } catch (error) {
    console.error('Error loading categories:', error);
    categoriesTable.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Failed to load categories</td></tr>';
  }
}

// Load category task counts
async function loadCategoryTaskCounts() {
  try {
    // Get tasks
    const response = await apiRequest('/admin/tasks');
    const tasks = response.tasks || [];

    // Count tasks per category
    categoryTaskCounts = {};
    tasks.forEach(task => {
      if (task.category) {
        const categoryId = typeof task.category === 'object' ? task.category._id : task.category;
        categoryTaskCounts[categoryId] = (categoryTaskCounts[categoryId] || 0) + 1;
      }
    });

    return categoryTaskCounts;
  } catch (error) {
    console.error('Error loading category task counts:', error);
    return {};
  }
}

// Update category stats
function updateCategoryStats(categories) {
  // Total categories
  totalCategoriesCount.textContent = categories.length;

  // Most used category
  let mostUsedCategoryId = null;
  let maxTaskCount = 0;

  Object.entries(categoryTaskCounts).forEach(([categoryId, count]) => {
    if (count > maxTaskCount) {
      mostUsedCategoryId = categoryId;
      maxTaskCount = count;
    }
  });

  if (mostUsedCategoryId) {
    const category = categories.find(cat => cat._id === mostUsedCategoryId);
    if (category) {
      mostUsedCategory.textContent = category.name;
    } else {
      mostUsedCategory.textContent = '-';
    }
  } else {
    mostUsedCategory.textContent = '-';
  }

  // Users with categories
  const uniqueUserIds = new Set();
  categories.forEach(category => {
    if (category.user && category.user._id) {
      uniqueUserIds.add(category.user._id);
    }
  });

  usersWithCategories.textContent = uniqueUserIds.size;
}

// Update pagination
function updatePagination(page) {
  // Update current page
  currentPage = page;

  // Calculate start and end indices
  const startIndex = (page - 1) * pageSize + 1;
  const endIndex = Math.min(startIndex + pageSize - 1, totalCategories);

  // Update pagination info
  paginationStart.textContent = totalCategories > 0 ? startIndex : 0;
  paginationEnd.textContent = endIndex;
  paginationTotal.textContent = totalCategories;

  // Generate pagination controls
  const totalPages = Math.ceil(totalCategories / pageSize);

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
      loadCategories(parseInt(btn.dataset.page), getFilters());
    });
  });
}

// Get current filters
function getFilters() {
  return {
    search: categorySearch.value.trim(),
    userId: userFilter.value
  };
}

// Update bulk actions visibility
function updateBulkActions() {
  if (selectedCategories.size > 0) {
    bulkActions.style.display = 'flex';
  } else {
    bulkActions.style.display = 'none';
  }
}

// View category details
async function viewCategory(categoryId) {
  try {
    // Show modal
    categoryDetailsModal.classList.add('show');

    // Show loading
    categoryDetailsContent.innerHTML = '<div class="text-center">Loading category details...</div>';

    // Get category data
    const category = await apiRequest(`/admin/categories/${categoryId}`);
    console.log('category', category)

    // Find user
    const user = category.user || { name: 'N/A', email: 'N/A' };

    // Get tasks for this category
    const response = await apiRequest('/admin/tasks');
    const tasks = response.tasks || [];

    const categoryTasks = tasks.filter(task => {
      let taskCategoryId;

      if (Array.isArray(task.category)) {
        // If task.category is an array, check if it includes the categoryId
        return task.category.some(cat => (typeof cat === 'object' ? cat._id === categoryId : cat === categoryId));
      } else if (typeof task.category === 'object' && task.category !== null) {
        // If task.category is an object, extract _id
        taskCategoryId = task.category._id;
      } else {
        // If task.category is a string (assuming it's the ID itself)
        taskCategoryId = task.category;
      }

      return taskCategoryId === categoryId;
    });

    console.log('category task ', categoryTasks)

    // Render category details
    categoryDetailsContent.innerHTML = `
      <div class="category-details">
        <div class="category-header">
          <div class="category-color-large" style="background-color: ${category.color}"></div>
          <h4 class="category-title">${category.name}</h4>
        </div>
        
        <div class="category-info-grid">
          <div class="category-info-item">
            <div class="info-label">Color</div>
            <div class="info-value">
              <span class="color-preview" style="background-color: ${category.color}"></span>
              <span class="color-code">${category.color}</span>
            </div>
          </div>
          
          <div class="category-info-item">
            <div class="info-label">Assigned To</div>
            <div class="info-value">${user.name}</div>
            <div class="info-value">${user.email}</div>
          </div>
          
          <div class="category-info-item">
            <div class="info-label">Tasks</div>
            <div class="info-value">${categoryTasks.length}</div>
          </div>
          
          <div class="category-info-item">
            <div class="info-label">Created</div>
            <div class="info-value">${formatDate(category.createdAt)}</div>
          </div>
        </div>
        
        <div class="category-tasks-section">
          <div class="info-label">Tasks in this Category</div>
          <div class="category-tasks-list">
            ${categoryTasks.length > 0 ? `
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>Task Name</th>
                    <th>Due Date</th>
                    <th>Priority</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${categoryTasks.slice(0, 5).map(task => `
                    <tr>
                      <td>${task.name}</td>
                      <td>${task.dueDate ? formatDate(task.dueDate) : 'No due date'}</td>
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
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              ${categoryTasks.length > 5 ? `
                <div class="text-center mt-3">
                  <p>Showing 5 of ${categoryTasks.length} tasks</p>
                </div>
              ` : ''}
            ` : '<p>No tasks in this category</p>'}
          </div>
        </div>
      </div>
    `;

    // Store category ID for edit button
    editCategoryBtn.dataset.id = categoryId;
  } catch (error) {
    console.error('Error loading category details:', error);
    categoryDetailsContent.innerHTML = '<div class="text-center text-danger">Failed to load category details</div>';
  }
}

// Open create/edit category modal
async function openEditCategoryModal(categoryId = null) {
  try {
    // Close category details modal if open
    categoryDetailsModal.classList.remove('show');

    // Show edit category modal
    editCategoryModal.classList.add('show');

    // Clear form
    editCategoryForm.reset();

    // Reset color selection
    colorOptions.forEach(option => {
      option.classList.remove('selected');
    });
    colorOptions[0].classList.add('selected');
    editCategoryColor.value = colorOptions[0].dataset.color;

    if (categoryId) {
      // Edit existing category
      categoryModalTitle.textContent = 'Edit Category';
      deleteCategoryBtn.style.display = 'block';

      // Get category data
      const category = await apiRequest(`/admin/categories/${categoryId}`);

      // Populate form
      editCategoryId.value = categoryId;
      editCategoryName.value = category.name;
      editCategoryUser.value = category.user ? category.user._id : '';

      // Set color
      editCategoryColor.value = category.color;

      // Select color option
      const colorOption = Array.from(colorOptions).find(option => option.dataset.color === category.color);
      if (colorOption) {
        colorOptions.forEach(option => option.classList.remove('selected'));
        colorOption.classList.add('selected');
      }

      // Store category ID for delete button
      deleteCategoryBtn.dataset.id = categoryId;
    } else {
      // Create new category
      categoryModalTitle.textContent = 'Create Category';
      deleteCategoryBtn.style.display = 'none';

      // Set default values
      editCategoryId.value = '';
    }
  } catch (error) {
    console.error('Error loading category for edit:', error);
    showNotification('Failed to load category data', 'error');
    editCategoryModal.classList.remove('show');
  }
}

// Open delete category modal
function openDeleteCategoryModal(categoryIds) {
  // Close other modals
  categoryDetailsModal.classList.remove('show');
  editCategoryModal.classList.remove('show');

  // Show confirm delete modal
  confirmDeleteModal.classList.add('show');

  // Store category IDs for delete button
  confirmDelete.dataset.ids = JSON.stringify(categoryIds);
}

// Save category changes
async function saveCategoryChanges() {
  try {
    const categoryId = editCategoryId.value;
    const name = editCategoryName.value.trim();
    const color = editCategoryColor.value;
    const userId = editCategoryUser.value;

    // Validate form
    if (!name || !color || !userId) {
      showNotification('Category name, color, and assigned user are required', 'error');
      return;
    }

    // Prepare data
    const categoryData = {
      name,
      color,
      userId
    };

    if (categoryId) {
      // Update existing category
      await apiRequest(`/admin/categories/${categoryId}`, 'PUT', categoryData);
      showNotification('Category updated successfully', 'success');
    } else {
      // Create new category
      await apiRequest('/admin/categories', 'POST', categoryData);
      showNotification('Category created successfully', 'success');
    }

    // Close modal
    editCategoryModal.classList.remove('show');

    // Reload categories
    loadCategories(currentPage, getFilters());
  } catch (error) {
    console.error('Error saving category:', error);
    showNotification('Failed to save category', 'error');
  }
}

// Delete categories
async function deleteCategories(categoryIds) {
  try {
    if (categoryIds.length === 1) {
      // Delete single category
      await apiRequest(`/admin/categories/${categoryIds[0]}`, 'DELETE');
    } else {
      // Bulk delete categories
      await apiRequest('/admin/categories/bulk-delete', 'POST', { categoryIds });
    }

    // Close modal
    confirmDeleteModal.classList.remove('show');

    // Show success message
    showNotification(`${categoryIds.length} category(s) deleted successfully`, 'success');

    // Clear selected categories
    selectedCategories.clear();
    updateBulkActions();

    // Reload categories
    loadCategories(currentPage, getFilters());
  } catch (error) {
    console.error('Error deleting categories:', error);
    showNotification('Failed to delete categories', 'error');
  }
}

// Import categories from CSV
async function importCategoriesFromCSV() {
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
        const result = await apiRequest('/admin/categories/import/csv', 'POST', {
          csvData,
          userId
        });

        // Close modal
        importModal.classList.remove('show');

        // Show success message
        showNotification(`${result.importedCount} categories imported successfully`, 'success');

        // Show errors if any
        if (result.errors && result.errors.length > 0) {
          console.error('Import errors:', result.errors);
          showNotification(`${result.errors.length} errors occurred during import. Check console for details.`, 'warning');
        }

        // Reload categories
        loadCategories(currentPage, getFilters());
      } catch (error) {
        console.error('Error processing CSV:', error);
        showNotification('Failed to process CSV file', 'error');
      }
    };

    reader.readAsText(file);
  } catch (error) {
    console.error('Error importing categories:', error);
    showNotification('Failed to import categories', 'error');
  }
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
      throw new Error('Session expired. Please login again.');
    }

    // Check the content type of the response
    const contentType = response.headers.get('Content-Type');

    if (contentType && contentType.includes('text/csv')) {
      // If the response is CSV, return it as text
      return await response.text();
    } else {
      // Otherwise, parse it as JSON
      const result = await response.json();

      // Handle error response
      if (!response.ok) {
        throw new Error(result.message || 'API request failed');
      }

      return result;
    }
  } catch (error) {
    console.error('API request error:', error);
    showNotification(error.message, 'error');
    throw error;
  }
}

// Export categories to CSV
async function exportCategoriesToCSV() {
  try {
    // Get export URL
    const userId = userFilter.value;
    const url = `/admin/categories/export/csv${userId ? `?userId=${userId}` : ''}`;

    // Use apiRequest to fetch the CSV data
    const csvData = await apiRequest(url, 'GET');

    // Create a Blob from the CSV data
    const blob = new Blob([csvData], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'categories.csv';
    a.click();
  } catch (error) {
    console.error('Error exporting categories:', error);
    showNotification('Failed to export categories', 'error');
  }
}

// Export categories to JSON
function exportCategoriesToJSON() {
  try {
    // Convert filtered categories to JSON
    const categoriesToExport = filteredCategories.map(category => ({
      id: category._id,
      name: category.name,
      color: category.color,
      user: category.user ? category.user.name : null,
      taskCount: categoryTaskCounts[category._id] || 0,
      createdAt: category.createdAt
    }));

    // Create a blob and download
    const blob = new Blob([JSON.stringify(categoriesToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'categories.json';
    a.click();

    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting categories to JSON:', error);
    showNotification('Failed to export categories', 'error');
  }
}

// Download CSV template
function downloadCSVTemplate() {
  const template = `Name,Color
Work,#4f46e5
Personal,#10b981
Shopping,#f59e0b`;

  const blob = new Blob([template], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'categories_template.csv';
  a.click();

  URL.revokeObjectURL(url);
}

// Helper function for debouncing
function debounce(func, delay) {
  let timeout;
  return function () {
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

// Add styles for category details
const style = document.createElement('style');
style.textContent = `
  .category-details {
    padding: 1rem;
  }
  
  .category-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  
  .category-color-large {
    width: 3rem;
    height: 3rem;
    border-radius: 0.5rem;
  }
  
  .category-title {
    font-size: 1.5rem;
    margin: 0;
  }
  
  .category-info-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  
  .category-info-item {
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
  
  .info-value {
    font-size: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .color-preview {
    display: inline-block;
    width: 1rem;
    height: 1rem;
    border-radius: 0.25rem;
  }
  
  .color-code {
    font-family: monospace;
  }
  
  .category-tasks-section {
    background-color: var(--admin-gray-light);
    border-radius: var(--admin-radius);
    padding: 1rem;
  }
  
  .category-tasks-list {
    margin-top: 0.5rem;
  }
  
  .category-name-cell {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .category-color {
    display: inline-block;
    width: 1rem;
    height: 1rem;
    border-radius: 0.25rem;
  }
  
  .color-picker {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }
  
  .color-option {
    width: 2rem;
    height: 2rem;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: transform 0.2s;
    border: 2px solid transparent;
  }
  
  .color-option:hover {
    transform: scale(1.1);
  }
  
  .color-option.selected {
    border-color: var(--admin-dark);
    transform: scale(1.1);
  }
  
  @media (max-width: 768px) {
    .category-info-grid {
      grid-template-columns: 1fr;
    }
  }
`;
document.head.appendChild(style);

// Initialize categories page when DOM is loaded
document.addEventListener('DOMContentLoaded', initCategoriesPage);