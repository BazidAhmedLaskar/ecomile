// Real-time Map tracking with speed verification
document.addEventListener('DOMContentLoaded', () => {
    if (!requireAuth()) return;
    initializeRealtimeMap();
});

let realtimeMap = null;
let userMarker = null;
let routePath = null;
let isTracking = false;
let isPaused = false;
let trackingWatcher = null;
let journeyData = {
    startTime: null,
    endTime: null,
    positions: [],
    distance: 0,
    mode: 'walking',
    speeds: [],
    averageSpeed: 0
};

// Speed thresholds for different transport modes (km/h)
const SPEED_THRESHOLDS = {
    walking: { min: 0, max: 8 },
    cycling: { min: 5, max: 35 },
    bus: { min: 10, max: 80 },
    car: { min: 15, max: 120 }
};

function initializeRealtimeMap() {
    setupEventListeners();
    initializeMap();
    loadUserPreferences();
}

function setupEventListeners() {
    document.getElementById('startTrackingBtn').addEventListener('click', startTracking);
    document.getElementById('pauseTrackingBtn').addEventListener('click', pauseTracking);
    document.getElementById('stopTrackingBtn').addEventListener('click', stopTracking);
    document.getElementById('transportMode').addEventListener('change', updateTransportMode);
    document.getElementById('confirmModeBtn').addEventListener('click', confirmCurrentMode);
    document.getElementById('changeModeBtn').addEventListener('click', changeTransportMode);
    document.getElementById('saveJourneyBtn').addEventListener('click', saveJourney);
    document.getElementById('newJourneyBtn').addEventListener('click', startNewJourney);
}

function initializeMap() {
    try {
        // Initialize map with better defaults
        realtimeMap = L.map('realtimeMap').setView([28.6139, 77.2090], 13); // Default to Delhi, India
    
        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
    }).addTo(realtimeMap);
    
    // Get current location and center map
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            
            realtimeMap.setView([lat, lon], 15);
            
            // Add user marker
            userMarker = L.marker([lat, lon], {
                icon: L.divIcon({
                    className: 'user-marker',
                    html: '📍',
                    iconSize: [20, 20]
                })
            }).addTo(realtimeMap);
        }, (error) => {
            console.log('Location access denied, using default location');
        });
    }
    } catch (error) {
        console.error('Map initialization error:', error);
        document.getElementById('realtimeMap').innerHTML = '<p style="text-align: center; color: #666; padding: 50px;">Map loading failed. Please refresh the page.</p>';
    }
}

function loadUserPreferences() {
    const savedMode = localStorage.getItem('ecomiles_preferred_mode');
    if (savedMode) {
        document.getElementById('transportMode').value = savedMode;
        journeyData.mode = savedMode;
    }
}

function updateTransportMode() {
    const newMode = document.getElementById('transportMode').value;
    journeyData.mode = newMode;
    localStorage.setItem('ecomiles_preferred_mode', newMode);
    
    // Update tracking icon based on mode
    if (userMarker) {
        const icons = {
            walking: '🚶',
            cycling: '🚴',
            bus: '🚌',
            car: '🚗'
        };
        
        userMarker.setIcon(L.divIcon({
            className: 'user-marker',
            html: icons[newMode] || '📍',
            iconSize: [20, 20]
        }));
    }
}

async function startTracking() {
    if (!navigator.geolocation) {
        alert('Geolocation is not supported by this browser');
        return;
    }
    
    isTracking = true;
    isPaused = false;
    journeyData = {
        startTime: Date.now(),
        endTime: null,
        positions: [],
        distance: 0,
        mode: document.getElementById('transportMode').value,
        speeds: [],
        averageSpeed: 0
    };
    
    // Update UI
    document.getElementById('startTrackingBtn').style.display = 'none';
    document.getElementById('pauseTrackingBtn').style.display = 'inline-block';
    document.getElementById('stopTrackingBtn').style.display = 'inline-block';
    document.getElementById('trackingStatus').innerHTML = '<span class="status-indicator active"></span><span id="statusText">Tracking Active</span>';
    
    // Start time counter
    startTimeCounter();
    
    // Start GPS tracking
    trackingWatcher = navigator.geolocation.watchPosition(
        handlePositionUpdate,
        handlePositionError,
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 1000
        }
    );
    
    console.log('Tracking started for mode:', journeyData.mode);
}

function pauseTracking() {
    if (isPaused) {
        // Resume
        isPaused = false;
        document.getElementById('pauseTrackingBtn').textContent = 'Pause';
        document.getElementById('statusText').textContent = 'Tracking Active';
    } else {
        // Pause
        isPaused = true;
        document.getElementById('pauseTrackingBtn').textContent = 'Resume';
        document.getElementById('statusText').textContent = 'Tracking Paused';
    }
}

function stopTracking() {
    isTracking = false;
    isPaused = false;
    
    if (trackingWatcher) {
        navigator.geolocation.clearWatch(trackingWatcher);
        trackingWatcher = null;
    }
    
    journeyData.endTime = Date.now();
    
    // Update UI
    document.getElementById('startTrackingBtn').style.display = 'inline-block';
    document.getElementById('pauseTrackingBtn').style.display = 'none';
    document.getElementById('stopTrackingBtn').style.display = 'none';
    document.getElementById('trackingStatus').innerHTML = '<span class="status-indicator"></span><span id="statusText">Tracking Stopped</span>';
    
    // Calculate final statistics
    calculateFinalStats();
    
    // Show journey summary
    showJourneySummary();
    
    console.log('Tracking stopped. Journey data:', journeyData);
}

function handlePositionUpdate(position) {
    if (!isTracking || isPaused) return;
    
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;
    const speed = position.coords.speed || 0; // m/s
    const speedKmh = speed * 3.6; // Convert to km/h
    
    const currentPosition = {
        lat: lat,
        lon: lon,
        timestamp: Date.now(),
        speed: speedKmh
    };
    
    journeyData.positions.push(currentPosition);
    journeyData.speeds.push(speedKmh);
    
    // Update map marker
    if (userMarker) {
        userMarker.setLatLng([lat, lon]);
    }
    
    // Update route path
    updateRoutePath();
    
    // Calculate distance if we have previous position
    if (journeyData.positions.length > 1) {
        const prevPos = journeyData.positions[journeyData.positions.length - 2];
        const distance = calculateDistance(prevPos.lat, prevPos.lon, lat, lon);
        journeyData.distance += distance;
    }
    
    // Update live statistics
    updateLiveStats(speedKmh);
    
    // Check speed verification
    checkSpeedVerification(speedKmh);
}

function updateRoutePath() {
    if (journeyData.positions.length < 2) return;
    
    const pathCoords = journeyData.positions.map(pos => [pos.lat, pos.lon]);
    
    if (routePath) {
        realtimeMap.removeLayer(routePath);
    }
    
    routePath = L.polyline(pathCoords, {
        color: getRouteColor(journeyData.mode),
        weight: 4,
        opacity: 0.8
    }).addTo(realtimeMap);
}

function getRouteColor(mode) {
    const colors = {
        walking: '#28a745',
        cycling: '#007bff',
        bus: '#ffc107',
        car: '#dc3545'
    };
    return colors[mode] || '#6c757d';
}

function updateLiveStats(currentSpeed) {
    // Update distance
    document.getElementById('currentDistance').textContent = `${journeyData.distance.toFixed(2)} km`;
    
    // Update speed
    document.getElementById('currentSpeed').textContent = `${Math.round(currentSpeed)} km/h`;
    
    // Calculate and update points
    const points = calculatePoints(journeyData.mode, journeyData.distance);
    document.getElementById('earnedPoints').textContent = points;
}

function calculatePoints(mode, distance) {
    const pointRates = {
        walking: 10,
        cycling: 8,
        bus: 5,
        car: 3
    };
    return Math.round(distance * (pointRates[mode] || 1));
}

function checkSpeedVerification(currentSpeed) {
    const threshold = SPEED_THRESHOLDS[journeyData.mode];
    
    if (currentSpeed < threshold.min || currentSpeed > threshold.max) {
        // Speed doesn't match current mode
        const suggestedMode = suggestTransportMode(currentSpeed);
        
        if (suggestedMode !== journeyData.mode) {
            showSpeedVerification(currentSpeed, suggestedMode);
        }
    } else {
        hideSpeedVerification();
    }
}

function suggestTransportMode(speed) {
    for (const [mode, threshold] of Object.entries(SPEED_THRESHOLDS)) {
        if (speed >= threshold.min && speed <= threshold.max) {
            return mode;
        }
    }
    return 'walking'; // Default fallback
}

function showSpeedVerification(currentSpeed, suggestedMode) {
    const verificationDiv = document.getElementById('speedVerification');
    const messageDiv = document.getElementById('verificationMessage');
    
    messageDiv.textContent = `Current speed (${Math.round(currentSpeed)} km/h) suggests ${suggestedMode} instead of ${journeyData.mode}`;
    verificationDiv.classList.remove('hidden');
}

function hideSpeedVerification() {
    document.getElementById('speedVerification').classList.add('hidden');
}

function confirmCurrentMode() {
    hideSpeedVerification();
    // User confirmed current mode, continue tracking
}

function changeTransportMode() {
    const currentSpeed = journeyData.speeds[journeyData.speeds.length - 1] || 0;
    const suggestedMode = suggestTransportMode(currentSpeed);
    
    document.getElementById('transportMode').value = suggestedMode;
    journeyData.mode = suggestedMode;
    
    updateTransportMode();
    hideSpeedVerification();
}

function startTimeCounter() {
    const updateTime = () => {
        if (!isTracking) return;
        
        const elapsed = Date.now() - journeyData.startTime;
        const hours = Math.floor(elapsed / 3600000);
        const minutes = Math.floor((elapsed % 3600000) / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        
        document.getElementById('journeyTime').textContent = 
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        setTimeout(updateTime, 1000);
    };
    
    updateTime();
}

function calculateFinalStats() {
    // Calculate average speed
    if (journeyData.speeds.length > 0) {
        journeyData.averageSpeed = journeyData.speeds.reduce((a, b) => a + b, 0) / journeyData.speeds.length;
    }
    
    // Calculate duration
    const duration = journeyData.endTime - journeyData.startTime;
    journeyData.duration = duration;
}

function showJourneySummary() {
    const summaryDiv = document.getElementById('journeySummary');
    
    // Update summary data
    document.getElementById('summaryDistance').textContent = `${journeyData.distance.toFixed(2)} km`;
    
    const duration = journeyData.duration;
    const hours = Math.floor(duration / 3600000);
    const minutes = Math.floor((duration % 3600000) / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    document.getElementById('summaryDuration').textContent = 
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    document.getElementById('summarySpeed').textContent = `${Math.round(journeyData.averageSpeed)} km/h`;
    
    const points = calculatePoints(journeyData.mode, journeyData.distance);
    document.getElementById('summaryPoints').textContent = points;
    
    const co2Saved = journeyData.distance * 0.21;
    document.getElementById('summaryCO2').textContent = `${co2Saved.toFixed(2)} kg`;
    
    summaryDiv.classList.remove('hidden');
}

async function saveJourney() {
    const user = getCurrentUser();
    if (!user) {
        alert('Please log in to save journey');
        return;
    }
    
    try {
        const points = calculatePoints(journeyData.mode, journeyData.distance);
        const co2Saved = journeyData.distance * 0.21;
        
        // Save journey to Firestore
        const journeyDoc = {
            userId: user.uid,
            mode: journeyData.mode,
            distance: journeyData.distance,
            points: points,
            co2Saved: co2Saved,
            duration: journeyData.duration,
            averageSpeed: journeyData.averageSpeed,
            startTime: new Date(journeyData.startTime),
            endTime: new Date(journeyData.endTime),
            positions: journeyData.positions,
            type: 'realtime_gps',
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection('journeys').add(journeyDoc);
        
        // Update user stats
        const userRef = db.collection('users').doc(user.uid);
        await userRef.update({
            points: firebase.firestore.FieldValue.increment(points),
            totalDistance: firebase.firestore.FieldValue.increment(journeyData.distance),
            roadTaxSaved: firebase.firestore.FieldValue.increment(points * 0.1)
        });
        
        alert(`Journey saved! You earned ${points} points and saved ${co2Saved.toFixed(2)} kg CO₂.`);
        
        // Redirect to dashboard
        window.location.href = 'dashboard.html';
        
    } catch (error) {
        console.error('Error saving journey:', error);
        alert('Failed to save journey. Please try again.');
    }
}

function startNewJourney() {
    // Reset everything
    journeyData = {
        startTime: null,
        endTime: null,
        positions: [],
        distance: 0,
        mode: 'walking',
        speeds: [],
        averageSpeed: 0
    };
    
    // Clear map
    if (routePath) {
        realtimeMap.removeLayer(routePath);
        routePath = null;
    }
    
    // Reset UI
    document.getElementById('journeySummary').classList.add('hidden');
    document.getElementById('currentDistance').textContent = '0.0 km';
    document.getElementById('currentSpeed').textContent = '0 km/h';
    document.getElementById('journeyTime').textContent = '00:00:00';
    document.getElementById('earnedPoints').textContent = '0';
    
    console.log('Ready for new journey');
}

function handlePositionError(error) {
    console.error('Geolocation error:', error);
    
    let errorMessage = 'Unable to get your location. ';
    switch (error.code) {
        case error.PERMISSION_DENIED:
            errorMessage += 'Please allow location access.';
            break;
        case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information unavailable.';
            break;
        case error.TIMEOUT:
            errorMessage += 'Location request timed out.';
            break;
        default:
            errorMessage += 'An unknown error occurred.';
            break;
    }
    
    alert(errorMessage);
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}