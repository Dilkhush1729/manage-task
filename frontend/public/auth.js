// API Base URL
var USER_API_URL = "http://localhost:5000/api"
// let USER_API_URL = 'https://manage-task-backend-2vf9.onrender.com/api';

// DOM Elements
const loginForm = document.getElementById("login-form")
const registerForm = document.getElementById("register-form")
var userloginError = document.getElementById("user-login-error")
const registerError = document.getElementById("register-error")
const showLoginBtn = document.getElementById("show-login")
const showRegisterBtn = document.getElementById("show-register")
const loginWrapper = document.getElementById("login-wrapper")
const registerWrapper = document.getElementById("register-wrapper")

// Check if user is already logged in
function checkAuth() {
  const token = localStorage.getItem("token")
  if (token) {
    window.location.href = "index.html"
  }
}

// Run auth check when page loads
checkAuth()

// Toggle between login and register forms
showLoginBtn.addEventListener("click", (e) => {
  e.preventDefault()
  registerWrapper.classList.remove("active")
  loginWrapper.classList.add("active")
})

showRegisterBtn.addEventListener("click", (e) => {
  e.preventDefault()
  loginWrapper.classList.remove("active")
  registerWrapper.classList.add("active")
})

// Login Form Submission
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault()

    const email = document.getElementById("user-login-email").value
    const password = document.getElementById("user-login-password").value

    userloginError.style.display = "none"

    try {
      const response = await fetch(`${USER_API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Login failed")
      }

      // Store token and user data
      localStorage.setItem("token", data.userToken)
      localStorage.setItem("user", JSON.stringify(data.user))
      
      // Redirect to dashboard
      window.location.href = "index.html"
    } catch (error) {
      userloginError.textContent = error.message
      userloginError.style.display = "block"
    }
  })
}

// Register Form Submission
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault()

    const name = document.getElementById("name").value
    const email = document.getElementById("user-email").value
    const password = document.getElementById("user-password").value
    const confirmPassword = document.getElementById("confirmPassword").value

    registerError.style.display = "block"

    // Check if passwords match
    if (password !== confirmPassword) {
      registerError.textContent = "Passwords do not match"
      registerError.style.display = "block"
      return
    }

    try {
      const response = await fetch(`${USER_API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password, confirmPassword }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Registration failed")
      }

      // Store token and user data
      localStorage.setItem("token", data.userToken)
      localStorage.setItem("user", JSON.stringify(data.user))

      // Redirect to dashboard
      window.location.href = "index.html"
    } catch (error) {
      registerError.textContent = error.message
      registerError.style.display = "block"
    }
  })
}