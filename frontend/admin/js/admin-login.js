// API Base URL
let API_URL = 'http://localhost:5000/api';
// let API_URL = 'https://manage-task-backend-2vf9.onrender.com/api';

// DOM Elements
const adminLoginForm = document.getElementById('admin-login-form');
const loginError = document.getElementById('login-error');

// Check if admin is already logged in
function checkAuth() {
  const token = localStorage.getItem('adminToken');
  if (token) {
    window.location.href = window.location.origin + '/frontend/admin/dashboard.html';
  }
}

// Run auth check when page loads
checkAuth();

// Admin Login Form Submission
if (adminLoginForm) {
  adminLoginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    loginError.style.display = 'none';
    
    try {
      const response = await fetch(`${API_URL}/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      
      // Store token and admin data
      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('adminData', JSON.stringify(data.admin));
      
      // Redirect to dashboard
      window.location.href = window.location.origin + '/frontend/admin/dashboard.html';
    } catch (error) {
      loginError.textContent = error.message;
      loginError.style.display = 'block';
    }
  });
}