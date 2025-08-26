// Dashboard functionality

document.addEventListener('DOMContentLoaded', () => {
    console.log('Dashboard loading...');
    
    // Check authentication
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            console.log('User authenticated:', user.uid);
            initializeDashboard();
        } else {
            console.log('No user found, redirecting to login');
            window.location.href = 'login.html';
        }
    });
});

function logout() {
    firebase.auth().signOut().then(() => {
        localStorage.removeItem('ecomiles_user');
        window.location.href = 'index.html';
    }).catch(err => {
        console.error('Error signing out:', err);
    });
}

async function initializeDashboard() {
    const user = firebase.auth().currentUser;
    if (!user) {
        console.log('No authenticated user found');
        return;
    }

    console.log('Initializing dashboard for user:', user.uid);
    
    // Update user info display
    updateUserInfo({
        name: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        uid: user.uid
    });
    
    // Load user data from Firebase
    await loadUserStats(user.uid);
    await loadRecentJourneys(user.uid);
    await initializeWeeklyChart(user.uid);
}

function updateUserInfo(user) {
    const welcomeEl = document.getElementById('welcomeMessage');
    const name = user.name || 'User';

    // Static "Hi," and animated waving hand
    welcomeEl.innerHTML = `Hi, <span id="typedName"></span> <span class="wave">👋</span>`;

    // Typing effect
    const typedNameEl = document.getElementById('typedName');
    let index = 0;

    function typeLetter() {
        if (index < name.length) {
            typedNameEl.textContent += name.charAt(index);
            index++;
            setTimeout(typeLetter, 100);
        }
    }

    typeLetter();

    // Set email and avatar
    const emailEl = document.getElementById('userEmail');
    const avatar = document.getElementById('userAvatar');
    const profileAvatarImg = document.getElementById('profileAvatarImg');

    if (emailEl) emailEl.textContent = user.email;
    
    if (user.photoURL) {
        if (avatar) {
            avatar.src = user.photoURL;
            avatar.style.display = 'block';
        }
        if (profileAvatarImg) {
            profileAvatarImg.src = user.photoURL;
            profileAvatarImg.style.display = 'block';
        }
    } else {
        if (avatar) avatar.style.display = 'none';
        if (profileAvatarImg) profileAvatarImg.style.display = 'none';
    }
}

async function loadUserStats(uid) {
    try {
        console.log('Loading stats for user:', uid);
        const doc = await db.collection('users').doc(uid).get();
        
        if (doc.exists) {
            const data = doc.data();
            console.log('User data loaded:', data);
            updateStatCards(data);
        } else {
            console.log('No user document found, creating one...');
            // Create user document if it doesn't exist
            await createUserDocument(uid);
            updateStatCards({ points: 0, totalDistance: 0, roadTaxSaved: 0 });
        }
    } catch (err) {
        console.error('Error loading stats:', err);
        updateStatCards({ points: 0, totalDistance: 0, roadTaxSaved: 0 });
    }
}

async function createUserDocument(uid) {
    const user = firebase.auth().currentUser;
    if (!user) return;
    
    try {
        await db.collection('users').doc(uid).set({
            name: user.displayName || 'User',
            email: user.email,
            photoURL: user.photoURL || '',
            points: 0,
            totalDistance: 0,
            roadTaxSaved: 0,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log('User document created successfully');
    } catch (error) {
        console.error('Error creating user document:', error);
    }
}

function updateStatCards(data) {
    console.log('Updating stat cards with data:', data);
    
    const totalPointsEl = document.getElementById('totalPoints');
    const totalDistanceEl = document.getElementById('totalDistance');
    const co2SavedEl = document.getElementById('co2Saved');
    const roadTaxSavedEl = document.getElementById('roadTaxSaved');
    
    if (totalPointsEl) totalPointsEl.textContent = (data.points || 0).toLocaleString();
    if (totalDistanceEl) totalDistanceEl.textContent = `${(data.totalDistance || 0).toFixed(1)} km`;
    if (co2SavedEl) co2SavedEl.textContent = `${((data.totalDistance || 0) * 0.21).toFixed(1)} kg`;
    if (roadTaxSavedEl) roadTaxSavedEl.textContent = `₹${(data.roadTaxSaved || 0).toFixed(0)}`;
}

async function loadRecentJourneys(uid) {
    const list = document.getElementById('journeysList');
    try {
        const snapshot = await db.collection('journeys')
            .where('userId', '==', uid)
            .orderBy('timestamp', 'desc')
            .limit(5)
            .get();

        if (snapshot.empty) {
            list.innerHTML = `<p style="text-align:center;color:#666;padding:40px;">
                No journeys yet. <a href="journey.html">Add your first journey!</a>
            </p>`;
            return;
        }

        let html = '';
        snapshot.forEach(doc => {
            const j = doc.data();
            const date = j.timestamp?.toDate() || new Date();
            const emoji = getModeEmoji(j.mode || j.transportMode);

            html += `
            <div class="journey-item" style="background:#fff;padding:20px;margin:10px 0;border-radius:8px;box-shadow:0 1px 8px rgba(0,0,0,0.08);display:flex;justify-content:space-between;">
                <div>
                    <div style="font-weight:600">${emoji} ${capitalize(j.mode || j.transportMode || 'Journey')}</div>
                    <div style="font-size:0.9rem;color:#888">${date.toLocaleDateString()} at ${date.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                </div>
                <div style="text-align:right">
                    <div style="font-weight:700;color:#28a745">+${j.points || 0} points</div>
                    <div style="font-size:0.9rem;color:#666">${(j.distance || 0).toFixed(1)} km</div>
                </div>
            </div>`;
        });

        list.innerHTML = html;
    } catch (err) {
        console.error('Journey load failed:', err);
        list.innerHTML = `<p style="text-align:center;color:#666;padding:30px;">Could not load journeys.</p>`;
    }
}

function getModeEmoji(mode) {
    return {
        walk: '🚶', walking: '🚶', cycle: '🚴', cycling: '🚴', bus: '🚌',
        carpool: '🚘', car: '🚘', train: '🚆', metro: '🚇'
    }[mode] || '🚶';
}

function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

async function initializeWeeklyChart(uid) {
    const canvas = document.getElementById('weeklyChart');
    const container = document.querySelector('.chart-container');
    try {
        const data = await getWeeklyJourneyData(uid);

        const labels = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(); d.setDate(d.getDate() - (6 - i));
            return d.toLocaleDateString('en-IN', { weekday: 'short' });
        });

        new Chart(canvas, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'EcoPoints',
                    data,
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40,167,69,0.1)',
                    borderWidth: 3,
                    pointBackgroundColor: '#28a745',
                    pointBorderColor: '#fff',
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#444' },
                        grid: { color: '#eee' }
                    },
                    x: {
                        ticks: { color: '#444' },
                        grid: { display: false }
                    }
                }
            }
        });

    } catch (err) {
        console.error('Chart error:', err);
        container.innerHTML = `<p style="text-align:center;color:#999">No journey data available for chart.</p>`;
    }
}

async function getWeeklyJourneyData(uid) {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 6);
    weekAgo.setHours(0, 0, 0, 0);

    const result = Array(7).fill(0);
    try {
        const snap = await db.collection('journeys')
            .where('userId', '==', uid)
            .where('timestamp', '>=', firebase.firestore.Timestamp.fromDate(weekAgo))
            .orderBy('timestamp', 'asc')
            .get();

        const today = new Date();
        snap.forEach(doc => {
            const j = doc.data();
            const ts = j.timestamp?.toDate();
            const diff = Math.floor((today - ts) / (1000 * 60 * 60 * 24));
            if (diff >= 0 && diff < 7) result[6 - diff] += j.points || 0;
        });
    } catch (e) {
        console.error('Weekly data error:', e);
    }
    return result;
}