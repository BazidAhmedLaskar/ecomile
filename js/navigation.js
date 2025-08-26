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

// Global Dashboard for all pages
function initializeGlobalDashboard() {
    createGlobalStatsWidget();
    loadUserStats();
}

function createGlobalStatsWidget() {
    // Only create if not already exists
    if (document.getElementById('globalStatsWidget')) return;
    
    const widget = document.createElement('div');
    widget.id = 'globalStatsWidget';
    widget.innerHTML = `
        <div style="position: fixed; top: 70px; right: 20px; z-index: 1000; background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); padding: 15px; min-width: 200px; font-size: 0.9rem; border: 2px solid #28a745;">
            <div style="display: flex; align-items: center; margin-bottom: 10px;">
                <span style="font-size: 1.2rem; margin-right: 8px;">📊</span>
                <strong style="color: #28a745;">Live Stats</strong>
                <button onclick="toggleGlobalStats()" style="background: none; border: none; margin-left: auto; font-size: 1rem; cursor: pointer;">−</button>
            </div>
            <div id="globalStatsContent">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px;">
                    <div style="text-align: center; padding: 8px; background: #f8f9fa; border-radius: 6px;">
                        <div style="font-weight: bold; color: #28a745;" id="globalPoints">-</div>
                        <div style="font-size: 0.8rem; color: #666;">EcoPoints</div>
                    </div>
                    <div style="text-align: center; padding: 8px; background: #f8f9fa; border-radius: 6px;">
                        <div style="font-weight: bold; color: #007bff;" id="globalDistance">-</div>
                        <div style="font-size: 0.8rem; color: #666;">Total km</div>
                    </div>
                </div>
                <div style="text-align: center; padding: 8px; background: #e8f5e8; border-radius: 6px; margin-bottom: 10px;">
                    <div style="font-weight: bold; color: #155724;" id="globalTaxSaved">₹-</div>
                    <div style="font-size: 0.8rem; color: #666;">Tax Saved</div>
                </div>
                <div id="liveJourneyStats" style="display: none; background: #fff3cd; border-radius: 6px; padding: 8px; border: 1px solid #ffeaa7;">
                    <div style="font-size: 0.8rem; color: #856404; margin-bottom: 5px;"><strong>🚀 Live Journey</strong></div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; font-size: 0.8rem;">
                        <div>Distance: <span id="liveDist">0</span>km</div>
                        <div>Speed: <span id="liveSpeed">0</span>km/h</div>
                        <div>Time: <span id="liveTime">00:00</span></div>
                        <div>Mode: <span id="liveMode">-</span></div>
                    </div>
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

// Update live journey stats (called from journey.js)
function updateGlobalLiveStats(distance, speed, time, mode) {
    const liveJourneyStats = document.getElementById('liveJourneyStats');
    if (!liveJourneyStats) return;
    
    liveJourneyStats.style.display = 'block';
    document.getElementById('liveDist').textContent = distance.toFixed(2);
    document.getElementById('liveSpeed').textContent = Math.round(speed);
    document.getElementById('liveTime').textContent = time;
    document.getElementById('liveMode').textContent = mode || '-';
}

// Hide live journey stats when journey ends
function hideLiveJourneyStats() {
    const liveJourneyStats = document.getElementById('liveJourneyStats');
    if (liveJourneyStats) {
        liveJourneyStats.style.display = 'none';
    }
}

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