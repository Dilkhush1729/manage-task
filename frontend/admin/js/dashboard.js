// DOM Elements
const totalUsersCount = document.getElementById('total-users-count');
const totalTasksCount = document.getElementById('total-tasks-count');
const completionRate = document.getElementById('completion-rate');
const totalCategoriesCount = document.getElementById('total-categories-count');
const usersTrend = document.getElementById('users-trend');
const tasksTrend = document.getElementById('tasks-trend');
const completionTrend = document.getElementById('completion-trend');
const completionTrendContainer = document.getElementById('completion-trend-container');
const categoriesTrend = document.getElementById('categories-trend');
const recentUsersTable = document.getElementById('recent-users-table');

// Charts
let taskActivityChart;
let tasksByPriorityChart;
let taskStatusChart;

// Mock functions (replace with your actual implementations)
// async function apiRequest(url) {
//   // Simulate API request
//   return new Promise(resolve => {
//     console.log('new user creation')
//     setTimeout(() => {
//       let data;
//       if (url === '/admin/users') {
//         data = Array.from({ length: 10 }, (_, i) => ({
//           _id: `user${i + 1}`,
//           name: `User ${i + 1}`,
//           email: `user${i + 1}@example.com`,
//           createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString()
//         }));
//       } else if (url === '/admin/categories') {
//         data = Array.from({ length: 5 }, (_, i) => ({
//           _id: `category${i + 1}`,
//           name: `Category ${i + 1}`
//         }));
//       } else if (url === '/admin/tasks/stats/overview') {
//         data = {
//           totalTasks: 50,
//           recentTasks: 10,
//           completionRate: 75.5,
//           completedTasks: 38,
//           pendingTasks: 12,
//           tasksByPriority: {
//             high: 15,
//             medium: 20,
//             low: 15
//           },
//           dailyTaskCreation: Array.from({ length: 7 }, (_, i) => ({
//             date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
//             count: Math.floor(Math.random() * 5) + 1
//           }))
//         };
//       } else if (url.startsWith('/admin/users/user') && url.endsWith('/stats')) {
//         const userId = url.split('/')[3];
//         data = {
//           stats: {
//             totalTasks: Math.floor(Math.random() * 20) + 5,
//             completedTasks: Math.floor(Math.random() * 20) + 5
//           }
//         };
//       } else if (url.startsWith('/admin/users/user')) {
//         const userId = url.split('/')[3];
//         data = {
//           _id: userId,
//           name: `User ${userId.slice(4)}`,
//           email: `user${userId.slice(4)}@example.com`,
//           createdAt: new Date().toISOString()
//         };
//       } else {
//         data = {};
//       }
//       resolve(data);
//     }, 500);
//   });
// }

function formatNumber(number) {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function showNotification(message, type = 'success') {
  alert(`${type.toUpperCase()}: ${message}`);
}

function showLoading(element, message = 'Loading...') {
  element.innerHTML = `<div class="text-center">${message}</div>`;
}

// Initialize dashboard
async function initDashboard() {
  try {
    // Load dashboard data
    const dashboardData = await loadDashboardData();

    // Update overview cards
    updateOverviewCards(dashboardData);
    
    // Load recent users
    await loadRecentUsers();
    
    // Initialize charts
    initCharts(dashboardData);
  } catch (error) {
    console.error('Error initializing dashboard:', error);
    showNotification('Failed to load dashboard data', 'error');
  }
}

// Load dashboard data
async function loadDashboardData() {
  try {
    // Get users count
    const usersResponse = await apiRequest('/admin/users');
    const usersCount = usersResponse.length;
    
    // Get task statistics
    const taskStats = await apiRequest('/admin/tasks/stats/overview');
    
    // Get categories count
    const categoriesResponse = await apiRequest('/admin/categories');
    const categoriesCount = categoriesResponse.length;
    
    return {
      usersCount,
      taskStats,
      categoriesCount
    };
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    throw error;
  }
}

// Update overview cards
function updateOverviewCards(data) {
  // Users count
  if (totalUsersCount) {
    totalUsersCount.textContent = formatNumber(data.usersCount);
    
    // Simulate trend (in a real app, you would calculate this from historical data)
    const usersTrendValue = Math.floor(Math.random() * 20) + 5;
    usersTrend.textContent = `${usersTrendValue}%`;
  }
  
  // Tasks count
  if (totalTasksCount && data.taskStats) {
    totalTasksCount.textContent = formatNumber(data.taskStats.totalTasks);
    
    // Calculate trend based on recent tasks
    const tasksTrendValue = data.taskStats.totalTasks > 0 
      ? Math.floor((data.taskStats.recentTasks / data.taskStats.totalTasks) * 100)
      : 0;
    
    tasksTrend.textContent = `${tasksTrendValue}%`;
  }
  
  // Completion rate
  if (completionRate && data.taskStats) {
    const rate = data.taskStats.completionRate.toFixed(1);
    completionRate.textContent = `${rate}%`;
    
    // Simulate trend (in a real app, you would calculate this from historical data)
    const completionTrendValue = Math.floor(Math.random() * 15) - 5;
    completionTrend.textContent = `${Math.abs(completionTrendValue)}%`;
    
    // Update trend direction
    if (completionTrendValue >= 0) {
      completionTrendContainer.classList.add('up');
      completionTrendContainer.classList.remove('down');
      completionTrendContainer.querySelector('i').className = 'fas fa-arrow-up';
    } else {
      completionTrendContainer.classList.add('down');
      completionTrendContainer.classList.remove('up');
      completionTrendContainer.querySelector('i').className = 'fas fa-arrow-down';
    }
  }
  
  // Categories count
  if (totalCategoriesCount) {
    totalCategoriesCount.textContent = formatNumber(data.categoriesCount);
    
    // Simulate trend (in a real app, you would calculate this from historical data)
    const categoriesTrendValue = Math.floor(Math.random() * 10) + 2;
    categoriesTrend.textContent = `${categoriesTrendValue}%`;
  }
}

// Load recent users
async function loadRecentUsers() {
  try {

    recentUsersTable.innerHTML = '<tr><td colspan="5" class="text-center">Loading users...</td></tr>';
    
    // Get users
    const users = await apiRequest('/admin/users');

    // Sort by creation date (newest first)
    users.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Take only the 5 most recent users
    const recentUsers = users.slice(0, 5);
    
    // Get task counts for each user
    const userStats = await Promise.all(
      recentUsers.map(user => apiRequest(`/admin/users/${user._id}/stats`))
    );
    
    // Combine user data with stats
    const usersWithStats = recentUsers.map((user, index) => ({
      ...user,
      stats: userStats[index].stats
    }));
    
    // Render users
    if (usersWithStats.length === 0) {
      recentUsersTable.innerHTML = '<tr><td colspan="5" class="text-center">No users found</td></tr>';
      return;
    }
    
    recentUsersTable.innerHTML = usersWithStats.map(user => `
      <tr>
        <td>${user.name}</td>
        <td>${user.email}</td>
        <td>${user.stats.totalTasks} (${user.stats.completedTasks} completed)</td>
        <td>${formatDate(user.createdAt)}</td>
        <td style="display:none;">
          <a href="user-details.html?id=${user._id}" class="btn btn-sm btn-primary">
            <i class="fas fa-eye"></i>
          </a>
        </td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('Error loading recent users:', error);
    recentUsersTable.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Failed to load users</td></tr>';
  }
}

// Initialize charts
function initCharts(data) {
  // Task Activity Chart
  const taskActivityCtx = document.getElementById('task-activity-chart');
  if (taskActivityCtx && data.taskStats) {
    const dailyData = data.taskStats.dailyTaskCreation;
    console.log('daily data : ', dailyData);
    taskActivityChart = new Chart(taskActivityCtx, {
      type: 'line',
      data: {
        labels: dailyData.map(item => {
          const date = new Date(item.date);
          return date.toLocaleDateString('en-US', { weekday: 'short' });
        }),
        datasets: [
          {
            label: 'Tasks Created',
            data: dailyData.map(item => item.count),
            borderColor: '#6c5ce7',
            backgroundColor: 'rgba(108, 92, 231, 0.1)',
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
            display: false
          },
          tooltip: {
            mode: 'index',
            intersect: false
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
    
    // Add event listeners for chart period buttons
    const chartPeriodButtons = document.querySelectorAll('.chart-action[data-period]');
    chartPeriodButtons.forEach(button => {
      button.addEventListener('click', () => {
        // Remove active class from all buttons
        chartPeriodButtons.forEach(btn => btn.classList.remove('active'));
        
        // Add active class to clicked button
        button.classList.add('active');
        
        // Update chart data based on period
        // In a real app, you would fetch different data based on the period
        // For this demo, we'll just simulate different data
        const period = button.dataset.period;
        
        if (period === 'month') {
          // Simulate monthly data
          const monthlyData = Array.from({ length: 30 }, (_, i) => ({
            date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            count: Math.floor(Math.random() * 10) + 1
          }));
          
          taskActivityChart.data.labels = monthlyData.map(item => {
            const date = new Date(item.date);
            return date.getDate();
          });
          
          taskActivityChart.data.datasets[0].data = monthlyData.map(item => item.count);
          taskActivityChart.update();
        } else {
          // Reset to weekly data
          taskActivityChart.data.labels = dailyData.map(item => {
            const date = new Date(item.date);
            return date.toLocaleDateString('en-US', { weekday: 'short' });
          });
          
          taskActivityChart.data.datasets[0].data = dailyData.map(item => item.count);
          taskActivityChart.update();
        }
      });
    });
  }
  
  // Tasks by Priority Chart
  const priorityChartCtx = document.getElementById('tasks-by-priority-chart');
  if (priorityChartCtx && data.taskStats) {
    const priorityData = data.taskStats.tasksByPriority;
    
    tasksByPriorityChart = new Chart(priorityChartCtx, {
      type: 'doughnut',
      data: {
        labels: ['High', 'Medium', 'Low'],
        datasets: [
          {
            data: [priorityData.high, priorityData.medium, priorityData.low],
            backgroundColor: ['#ff7675', '#fdcb6e', '#74b9ff'],
            borderColor: ['#ff7675', '#fdcb6e', '#74b9ff'],
            borderWidth: 1
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
        }
      }
    });
  }
  
  // Task Status Chart
  const statusChartCtx = document.getElementById('task-status-chart');
  if (statusChartCtx && data.taskStats) {
    const completedTasks = data.taskStats.completedTasks;
    const pendingTasks = data.taskStats.pendingTasks;
    
    taskStatusChart = new Chart(statusChartCtx, {
      type: 'pie',
      data: {
        labels: ['Completed', 'Pending'],
        datasets: [
          {
            data: [completedTasks, pendingTasks],
            backgroundColor: ['#00b894', '#6c5ce7'],
            borderColor: ['#00b894', '#6c5ce7'],
            borderWidth: 1
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
        }
      }
    });
  }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', initDashboard);

// Add user details page functionality
function setupUserDetailsPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get('id');
  
  if (userId) {
    loadUserDetails(userId);
  }
}

// Load user details
async function loadUserDetails(userId) {
  try {
    // Show loading
    const userDetailsContainer = document.getElementById('user-details-container');
    if (userDetailsContainer) {
      showLoading(userDetailsContainer, 'Loading user details...');
    }
    
    // Get user data
    const user = await apiRequest(`/admin/users/${userId}`);
    
    // Get user stats
    const userStats = await apiRequest(`/admin/users/${userId}/stats`);
    
    // Update UI with user data
    updateUserDetailsUI(user, userStats);
  } catch (error) {
    console.error('Error loading user details:', error);
    showNotification('Failed to load user details', 'error');
  }
}

// Update user details UI
function updateUserDetailsUI(user, userStats) {
    const userDetailsContainer = document.getElementById('user-details-container');
    if (userDetailsContainer) {
        userDetailsContainer.innerHTML = `
            <h2>User Details</h2>
            <p><strong>Name:</strong> ${user.name}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Total Tasks:</strong> ${userStats.stats.totalTasks}</p>
            <p><strong>Completed Tasks:</strong> ${userStats.stats.completedTasks}</p>
            <p><strong>Registration Date:</strong> ${formatDate(user.createdAt)}</p>
        `;
    }
}

// If on user details page, setup the page
if (window.location.pathname.includes('user-details.html')) {
  setupUserDetailsPage();
}