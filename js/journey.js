// Journey tracking functionality - FIXED VERSION
let gpsWatchId = null;
let gpsStartPosition = null;
let gpsCurrentPosition = null;
let isTracking = false;

document.addEventListener('DOMContentLoaded', () => {
    // Wait for Firebase to initialize before checking auth
    const checkAuthAndInit = () => {
        if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
            if (!requireAuth()) {
                return;
            }
            // Initialize journey functionality
            initializeJourney();
        } else {
            // Wait a bit more for Firebase to load
            setTimeout(checkAuthAndInit, 500);
        }
    };
    
    checkAuthAndInit();
});

function initializeJourney() {
    // Setup mode selection
    setupModeSelection();
    
    // Setup manual form
    setupManualForm();
    
    // Setup GPS form
    setupGpsForm();
}

function setupModeSelection() {
    const manualModeBtn = document.getElementById('manualModeBtn');
    const gpsModeBtn = document.getElementById('gpsModeBtn');
    const manualForm = document.getElementById('manualForm');
    const gpsForm = document.getElementById('gpsForm');
    
    manualModeBtn.addEventListener('click', () => {
        manualModeBtn.className = 'btn-primary';
        gpsModeBtn.className = 'btn-secondary';
        manualForm.style.display = 'block';
        gpsForm.style.display = 'none';
        
        // Stop any ongoing GPS tracking
        stopGpsTracking();
    });
    
    gpsModeBtn.addEventListener('click', () => {
        gpsModeBtn.className = 'btn-primary';
        manualModeBtn.className = 'btn-secondary';
        gpsForm.style.display = 'block';
        manualForm.style.display = 'none';
        
        // Reset GPS form
        resetGpsForm();
    });
}

function setupManualForm() {
    const form = document.getElementById('manualJourneyForm');
    const modeSelect = document.getElementById('transportMode');
    const distanceInput = document.getElementById('distance');
    const pointsPreview = document.getElementById('pointsPreview');
    const previewText = document.getElementById('previewText');
    
    // Update preview when inputs change
    function updatePreview() {
        const mode = modeSelect.value;
        const distance = parseFloat(distanceInput.value) || 0;
        
        if (mode && distance > 0) {
            const points = calculatePoints(mode, distance);
            const co2Saved = (distance * 0.21).toFixed(1);
            
            previewText.innerHTML = `
                <strong>Distance:</strong> ${distance} km<br>
                <strong>Mode:</strong> ${mode.charAt(0).toUpperCase() + mode.slice(1)}<br>
                <strong>Points Earned:</strong> ${points}<br>
                <strong>CO₂ Saved:</strong> ${co2Saved} kg
            `;
            pointsPreview.style.display = 'block';
        } else {
            pointsPreview.style.display = 'none';
        }
    }
    
    modeSelect.addEventListener('change', updatePreview);
    distanceInput.addEventListener('input', updatePreview);
    
    form.addEventListener('submit', handleManualSubmit);
}

function setupGpsForm() {
    const startBtn = document.getElementById('startGpsBtn');
    const stopBtn = document.getElementById('stopGpsBtn');
    const gpsTransportMode = document.getElementById('gpsTransportMode');
    const submitBtn = document.getElementById('submitGpsJourney');
    
    startBtn.addEventListener('click', startGpsTracking);
    stopBtn.addEventListener('click', stopGpsTracking);
    gpsTransportMode.addEventListener('change', updateGpsPreview);
    submitBtn.addEventListener('click', handleGpsSubmit);
}

function calculatePoints(mode, distance) {
    const pointsMap = {
        'walk': 10,
        'cycle': 8,
        'bus': 5,
        'carpool': 3,
        'train': 5,
        'metro': 5
    };
    
    const pointsPerKm = pointsMap[mode] || 0;
    return Math.round(pointsPerKm * distance);
}

async function handleManualSubmit(event) {
    event.preventDefault();
    
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving Journey...';
        
        const mode = document.getElementById('transportMode').value;
        const distance = parseFloat(document.getElementById('distance').value);
        const notes = document.getElementById('journeyNotes').value.trim();
        
        // Validation
        if (!mode || !distance || distance <= 0) {
            throw new Error('Please fill in all required fields');
        }
        
        if (distance > 1000) {
            throw new Error('Distance cannot exceed 1000 km');
        }
        
        const points = calculatePoints(mode, distance);
        
        console.log('Manual journey data:', { mode, distance, points, notes });
        
        await saveJourney({
            mode,
            distance,
            points,
            notes,
            type: 'manual',
            startLocation: null,
            endLocation: null
        });
        
        // Show success and redirect
        alert(`Journey saved! You earned ${points} EcoPoints.`);
        window.location.href = 'dashboard.html';
        
    } catch (error) {
        console.error('Error saving manual journey:', error);
        alert('Failed to save journey: ' + error.message);
        
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

function startGpsTracking() {
    if (!navigator.geolocation) {
        showGpsError('GPS is not supported by this browser.');
        return;
    }
    
    const statusText = document.getElementById('gpsStatusText');
    const startBtn = document.getElementById('startGpsBtn');
    const stopBtn = document.getElementById('stopGpsBtn');
    const distanceDisplay = document.getElementById('gpsDistance');
    const errorDiv = document.getElementById('gpsError');
    
    // Hide error and update UI
    errorDiv.style.display = 'none';
    startBtn.style.display = 'none';
    stopBtn.style.display = 'inline-block';
    distanceDisplay.style.display = 'block';
    
    statusText.textContent = 'Getting GPS location...';
    isTracking = true;
    
    // Get initial position
    navigator.geolocation.getCurrentPosition(
        (position) => {
            gpsStartPosition = position;
            gpsCurrentPosition = position;
            statusText.textContent = 'Tracking your journey...';
            console.log('GPS tracking started at:', position.coords);
            
            // Start watching position
            gpsWatchId = navigator.geolocation.watchPosition(
                updateGpsPosition,
                handleGpsError,
                {
                    enableHighAccuracy: true,
                    maximumAge: 30000,
                    timeout: 27000
                }
            );
        },
        (error) => {
            console.error('GPS error getting initial position:', error);
            handleGpsError(error);
            resetGpsTracking();
        },
        {
            enableHighAccuracy: true,
            timeout: 10000
        }
    );
}

function updateGpsPosition(position) {
    if (!isTracking) return;
    
    gpsCurrentPosition = position;
    console.log('GPS position updated:', position.coords);
    
    if (gpsStartPosition) {
        const distance = calculateGpsDistance(
            gpsStartPosition.coords.latitude,
            gpsStartPosition.coords.longitude,
            position.coords.latitude,
            position.coords.longitude
        );
        
        document.getElementById('distanceValue').textContent = distance.toFixed(2);
        console.log('Distance calculated:', distance.toFixed(2), 'km');
        
        // Update preview if transport mode is selected
        updateGpsPreview();
    }
}

function stopGpsTracking() {
    if (gpsWatchId !== null) {
        navigator.geolocation.clearWatch(gpsWatchId);
        gpsWatchId = null;
    }
    
    isTracking = false;
    
    const statusText = document.getElementById('gpsStatusText');
    const startBtn = document.getElementById('startGpsBtn');
    const stopBtn = document.getElementById('stopGpsBtn');
    const completionForm = document.getElementById('gpsCompletionForm');
    
    statusText.textContent = 'Journey completed';
    startBtn.style.display = 'inline-block';
    stopBtn.style.display = 'none';
    
    // Show completion form if distance > 0
    const currentDistance = parseFloat(document.getElementById('distanceValue').textContent);
    if (currentDistance > 0) {
        completionForm.style.display = 'block';
    }
    
    console.log('GPS tracking stopped. Final distance:', currentDistance);
}

function resetGpsTracking() {
    stopGpsTracking();
    
    const statusText = document.getElementById('gpsStatusText');
    const distanceDisplay = document.getElementById('gpsDistance');
    const completionForm = document.getElementById('gpsCompletionForm');
    const errorDiv = document.getElementById('gpsError');
    
    statusText.textContent = 'Ready to start';
    distanceDisplay.style.display = 'none';
    completionForm.style.display = 'none';
    errorDiv.style.display = 'none';
    
    document.getElementById('distanceValue').textContent = '0.0';
    document.getElementById('gpsTransportMode').value = '';
    document.getElementById('gpsJourneyNotes').value = '';
    
    gpsStartPosition = null;
    gpsCurrentPosition = null;
}

function resetGpsForm() {
    if (isTracking) {
        stopGpsTracking();
    }
    resetGpsTracking();
}

function handleGpsError(error) {
    let message = 'GPS error occurred.';
    
    switch (error.code) {
        case error.PERMISSION_DENIED:
            message = 'GPS access denied. Please allow location access and try again.';
            break;
        case error.POSITION_UNAVAILABLE:
            message = 'GPS position unavailable. Please try again.';
            break;
        case error.TIMEOUT:
            message = 'GPS request timed out. Please try again.';
            break;
    }
    
    console.error('GPS Error:', message, error);
    showGpsError(message);
}

function showGpsError(message) {
    const errorDiv = document.getElementById('gpsError');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

function calculateGpsDistance(lat1, lon1, lat2, lon2) {
    // Haversine formula
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function updateGpsPreview() {
    const mode = document.getElementById('gpsTransportMode').value;
    const distance = parseFloat(document.getElementById('distanceValue').textContent) || 0;
    const previewDiv = document.getElementById('gpsPointsPreview');
    const previewText = document.getElementById('gpsPreviewText');
    
    if (mode && distance > 0) {
        const points = calculatePoints(mode, distance);
        const co2Saved = (distance * 0.21).toFixed(1);
        
        previewText.innerHTML = `
            <strong>Distance:</strong> ${distance.toFixed(2)} km<br>
            <strong>Mode:</strong> ${mode.charAt(0).toUpperCase() + mode.slice(1)}<br>
            <strong>Points Earned:</strong> ${points}<br>
            <strong>CO₂ Saved:</strong> ${co2Saved} kg
        `;
        previewDiv.style.display = 'block';
    } else {
        previewDiv.style.display = 'none';
    }
}

async function handleGpsSubmit() {
    const submitBtn = document.getElementById('submitGpsJourney');
    const originalText = submitBtn.textContent;
    
    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving Journey...';
        
        const mode = document.getElementById('gpsTransportMode').value;
        const distance = parseFloat(document.getElementById('distanceValue').textContent);
        const notes = document.getElementById('gpsJourneyNotes').value.trim();
        
        // Validation
        if (!mode || !distance || distance <= 0) {
            throw new Error('Please select a transport mode and ensure GPS distance is recorded');
        }
        
        if (distance > 1000) {
            throw new Error('Distance cannot exceed 1000 km');
        }
        
        const points = calculatePoints(mode, distance);
        
        console.log('GPS journey data:', { mode, distance, points, notes, gpsStartPosition, gpsCurrentPosition });
        
        await saveJourney({
            mode,
            distance,
            points,
            notes,
            type: 'gps',
            startLocation: gpsStartPosition ? {
                lat: gpsStartPosition.coords.latitude,
                lng: gpsStartPosition.coords.longitude,
                address: "GPS Start Location"
            } : null,
            endLocation: gpsCurrentPosition ? {
                lat: gpsCurrentPosition.coords.latitude,
                lng: gpsCurrentPosition.coords.longitude,
                address: "GPS End Location"
            } : null
        });
        
        // Show success and redirect
        alert(`GPS journey saved! You earned ${points} EcoPoints.`);
        window.location.href = 'dashboard.html';
        
    } catch (error) {
        console.error('Error saving GPS journey:', error);
        alert('Failed to save journey: ' + error.message);
        
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

async function saveJourney(journeyData) {
    const user = getCurrentUser();
    if (!user) throw new Error('User not authenticated');
    
    try {
        console.log('Saving journey with user ID:', user.uid);
        console.log('Journey data:', journeyData);
        
        // Prepare start and end locations with proper structure
        const startLocation = journeyData.startLocation ? {
            lat: journeyData.startLocation.lat || 0,
            lng: journeyData.startLocation.lng || 0,
            address: journeyData.startLocation.address || ""
        } : {
            lat: 0,
            lng: 0,
            address: ""
        };
        
        const endLocation = journeyData.endLocation ? {
            lat: journeyData.endLocation.lat || 0,
            lng: journeyData.endLocation.lng || 0,
            address: journeyData.endLocation.address || ""
        } : {
            lat: 0,
            lng: 0,
            address: ""
        };
        
        // Create journey document with proper field names matching database structure
        const journeyDoc = {
            userId: user.uid,
            transportMode: journeyData.mode,
            distance: journeyData.distance || 0,
            pointsEarned: journeyData.points || 0,
            notes: journeyData.notes || '',
            status: 'completed',
            startLocation: startLocation,
            endLocation: endLocation,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        console.log('Journey document to save:', journeyDoc);
        
        // Add journey to journeys collection
        const journeyRef = await db.collection('journeys').add(journeyDoc);
        console.log('Journey saved with ID:', journeyRef.id);
        
        // Update user stats
        const userRef = db.collection('users').doc(user.uid);
        
        await userRef.update({
            points: firebase.firestore.FieldValue.increment(journeyData.points),
            totalDistance: firebase.firestore.FieldValue.increment(journeyData.distance),
            roadTaxSaved: firebase.firestore.FieldValue.increment(journeyData.points * 0.1) // ₹0.1 per point
        });
        
        console.log('User stats updated successfully');
        return journeyRef.id;
        
    } catch (error) {
        console.error('Error saving journey to Firestore:', error);
        throw error;
    }
}

function logout() {
    auth.signOut().then(() => {
        localStorage.removeItem('ecomiles_user');
        window.location.href = 'index.html';
    }).catch(err => {
        console.error('Error signing out:', err);
    });
}