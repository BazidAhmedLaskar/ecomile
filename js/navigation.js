// Global Navigation JavaScript for EcoMiles

// Toggle Profile Navigation Menu
function toggleProfileMenu() {
    const dropdown = document.getElementById('navDropdown');
    if (dropdown) {
        dropdown.classList.toggle('show');
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const profileMenu = document.querySelector('.profile-menu');
    const dropdown = document.getElementById('navDropdown');
    
    if (dropdown && !profileMenu.contains(event.target)) {
        dropdown.classList.remove('show');
    }
});

// Close dropdown when pressing escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const dropdown = document.getElementById('navDropdown');
        if (dropdown) {
            dropdown.classList.remove('show');
        }
    }
});

// Update profile avatar with user data (for all pages)
function updateProfileAvatar() {
    if (typeof getCurrentUser === 'function') {
        const user = getCurrentUser();
        if (user && user.photoURL) {
            const profileAvatarImg = document.getElementById('profileAvatarImg');
            const userAvatar = document.getElementById('userAvatar');
            
            if (profileAvatarImg) {
                profileAvatarImg.src = user.photoURL;
                profileAvatarImg.style.display = 'block';
            }
            
            if (userAvatar) {
                userAvatar.src = user.photoURL;
                userAvatar.style.display = 'block';
            }
        }
    }
}

// Initialize navigation on page load
document.addEventListener('DOMContentLoaded', function() {
    // Set up profile avatar if user data is available
    setTimeout(updateProfileAvatar, 1000);
    
    // Add current page highlighting
    highlightCurrentPage();
    
    // Status widget removed as requested
});

// Highlight current page in navigation
function highlightCurrentPage() {
    const currentPage = window.location.pathname.split('/').pop();
    const navLinks = document.querySelectorAll('.nav-dropdown a');
    
    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href');
        if (linkPage === currentPage) {
            link.style.backgroundColor = '#e8f5e8';
            link.style.color = '#2E7D32';
            link.style.fontWeight = '600';
        }
    });
}

// Status widget completely removed as requested

// Global logout function (works across all pages)
function logout() {
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().signOut().then(() => {
            localStorage.removeItem('ecomiles_user');
            window.location.href = 'index.html';
        }).catch(err => {
            console.error('Error signing out:', err);
        });
    } else {
        // Fallback if Firebase isn't loaded
        localStorage.removeItem('ecomiles_user');
        window.location.href = 'index.html';
    }
}