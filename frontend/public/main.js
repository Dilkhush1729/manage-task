
// DOM Elements
const header = document.getElementById('header');
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');
const mobileMenuClose = document.getElementById('mobile-menu-close');

// Modal Elements
const signupBtn = document.getElementById('login-signup-btn');
const adminLoginBtn = document.getElementById('admin-login-btn');
const mobileSignupBtn = document.getElementById('mobile-signup-btn');
const mobileAdminLoginBtn = document.getElementById('mobile-admin-login-btn');
const heroSignupBtn = document.getElementById('hero-signup-btn');
const ctaSignupBtn = document.getElementById('cta-signup-btn');

const signupModal = document.getElementById('signup-modal');
const adminLoginModal = document.getElementById('admin-login-modal');

const closeSignupModal = document.getElementById('close-user-login-btn');
const closeAdminLoginModal = document.getElementById('close-admin-login-modal');

const closeAdminLoginBtn = document.getElementById('close-admin-login-btn');

// Testimonial Elements
const testimonialDots = document.querySelectorAll('.dot');
const testimonialCards = document.querySelector('.testimonial-cards');

// Event Listeners
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// Mobile Menu
mobileMenuBtn.addEventListener('click', () => {
    mobileMenu.classList.add('show');
});

mobileMenuClose.addEventListener('click', () => {
    mobileMenu.classList.remove('show');
});

// Modal Functions
function openModal(modal) {
    modal.classList.add('show');
}

function closeModal(modal) {
    modal.classList.remove('show');
}

// Signup Modal
signupBtn.addEventListener('click', (e) => {
    e.preventDefault();
    signupModal.style.display = 'block'
    openModal(signupModal);
});

mobileSignupBtn.addEventListener('click', (e) => {
    e.preventDefault();
    mobileMenu.classList.remove('show');
    openModal(signupModal);
});

heroSignupBtn.addEventListener('click', (e) => {
    e.preventDefault();
    openModal(signupModal);
});

ctaSignupBtn.addEventListener('click', (e) => {
    e.preventDefault();
    openModal(signupModal);
});

// Admin Login Modal
adminLoginBtn.addEventListener('click', (e) => {
    e.preventDefault();
    openModal(adminLoginModal);
});
closeSignupModal.addEventListener('click', (e) => {
    e.preventDefault();
    closeModal(signupModal)
})

mobileAdminLoginBtn.addEventListener('click', (e) => {
    e.preventDefault();
    mobileMenu.classList.remove('show');
    openModal(adminLoginModal);
});

if (closeAdminLoginModal) {
    closeAdminLoginModal.addEventListener('click', () => {
        closeModal(adminLoginModal);
    });
}

closeAdminLoginBtn.addEventListener('click', () => {
    closeModal(adminLoginModal);
});

// Testimonial Slider
testimonialDots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
        // Update active dot
        testimonialDots.forEach(d => d.classList.remove('active'));
        dot.classList.add('active');

        // Scroll to the corresponding testimonial
        const testimonialWidth = document.querySelector('.testimonial-card').offsetWidth + 32; // 32 is the gap
        testimonialCards.scrollTo({
            left: testimonialWidth * index,
            behavior: 'smooth'
        });
    });
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        if (this.getAttribute('href') === '#') return;

        e.preventDefault();

        const targetId = this.getAttribute('href');
        if (targetId === '#hero-signup-btn' || targetId === '#cta-signup-btn') return;

        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 80, // 80px offset for the header
                behavior: 'smooth'
            });

            // Close mobile menu if open
            mobileMenu.classList.remove('show');
        }
    });
});