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
    
    // Initialize global dashboard
    setTimeout(initializeGlobalDashboard, 1500);
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

// Simplified Dashboard for all pages
function initializeGlobalDashboard() {
    // Remove the inconvenient live status dashboard
    // Only show basic user stats without live tracking
    createSimpleStatsWidget();
    loadUserStats();
}

function createSimpleStatsWidget() {
    // Only create if not already exists
    if (document.getElementById('globalStatsWidget')) return;
    
    const widget = document.createElement('div');
    widget.id = 'globalStatsWidget';
    widget.innerHTML = `
        <div style="position: fixed; top: 70px; right: 20px; z-index: 1000; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); padding: 12px; min-width: 160px; font-size: 0.85rem; border: 1px solid #ddd;">
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
                <span style="font-size: 1rem; margin-right: 6px;">📊</span>
                <strong style="color: #28a745; font-size: 0.9rem;">My Stats</strong>
                <button onclick="toggleGlobalStats()" style="background: none; border: none; margin-left: auto; font-size: 0.9rem; cursor: pointer;">−</button>
            </div>
            <div id="globalStatsContent">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 8px;">
                    <div style="text-align: center; padding: 6px; background: #f8f9fa; border-radius: 4px;">
                        <div style="font-weight: bold; color: #28a745; font-size: 0.9rem;" id="globalPoints">-</div>
                        <div style="font-size: 0.7rem; color: #666;">Points</div>
                    </div>
                    <div style="text-align: center; padding: 6px; background: #f8f9fa; border-radius: 4px;">
                        <div style="font-weight: bold; color: #007bff; font-size: 0.9rem;" id="globalDistance">-</div>
                        <div style="font-size: 0.7rem; color: #666;">km</div>
                    </div>
                </div>
                <div style="text-align: center; padding: 6px; background: #e8f5e8; border-radius: 4px;">
                    <div style="font-weight: bold; color: #155724; font-size: 0.9rem;" id="globalTaxSaved">₹-</div>
                    <div style="font-size: 0.7rem; color: #666;">Tax Saved</div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(widget);
}

function toggleGlobalStats() {
    const content = document.getElementById('globalStatsContent');
    const button = document.querySelector('#globalStatsWidget button');
    
    if (content.style.display === 'none') {
        content.style.display = 'block';
        button.textContent = '−';
    } else {
        content.style.display = 'none';
        button.textContent = '+';
    }
}

async function loadUserStats() {
    try {
        const user = firebase.auth().currentUser;
        if (!user) return;
        
        const db = firebase.firestore();
        const userDoc = await db.collection('users').doc(user.uid).get();
        
        if (userDoc.exists) {
            const userData = userDoc.data();
            document.getElementById('globalPoints').textContent = userData.points || 0;
            document.getElementById('globalDistance').textContent = (userData.totalDistance || 0).toFixed(1);
            document.getElementById('globalTaxSaved').textContent = `₹${userData.roadTaxSaved || 0}`;
        }
    } catch (error) {
        console.log('Error loading user stats:', error);
    }
}

// Removed live journey stats tracking as it was inconvenient

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