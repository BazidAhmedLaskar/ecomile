// Journey tracking functionality - FIXED VERSION
let gpsWatchId = null;
let gpsStartPosition = null;
let gpsCurrentPosition = null;
let isTracking = false;
let totalDistance = 0;

// Google Maps variables
let gpsMap = null;
let startMarker = null;
let currentMarker = null;
let pathPolyline = null;
let pathCoordinates = [];
let gpsTimer = null;
let gpsStartTime = null;

document.addEventListener('DOMContentLoaded', () => {
    // Wait for Firebase to load, then check authentication
    const initializeWhenReady = () => {
        if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
            firebase.auth().onAuthStateChanged((user) => {
                if (user) {
                    console.log('User authenticated:', user.uid);
                    // Initialize journey functionality
                    initializeJourney();
                } else {
                    console.log('No user found, redirecting to login');
                    window.location.href = 'login.html';
                }
            });
        } else {
            // Wait for Firebase to load
            setTimeout(initializeWhenReady, 500);
        }
    };
    
    initializeWhenReady();
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
    const modeSelect = document.getElementById('transportMode');
    const distanceInput = document.getElementById('expectedDistance');
    const setupPreview = document.getElementById('setupPreview');
    const setupPreviewText = document.getElementById('setupPreviewText');
    const startBtn = document.getElementById('startManualJourney');
    const endBtn = document.getElementById('endManualJourney');
    const saveBtn = document.getElementById('saveCompletedJourney');
    
    // Update preview when inputs change
    function updateSetupPreview() {
        const mode = modeSelect.value;
        const distance = parseFloat(distanceInput.value) || 0;
        
        if (mode && distance > 0) {
            const points = calculatePoints(mode, distance);
            const co2Saved = (distance * 0.21).toFixed(1);
            
            setupPreviewText.innerHTML = `
                <strong>Transport Mode:</strong> ${mode.charAt(0).toUpperCase() + mode.slice(1)}<br>
                <strong>Expected Distance:</strong> ${distance} km<br>
                <strong>Estimated Points:</strong> ${points}<br>
                <strong>Estimated CO₂ Saved:</strong> ${co2Saved} kg
            `;
            setupPreview.style.display = 'block';
        } else {
            setupPreview.style.display = 'none';
        }
    }
    
    modeSelect.addEventListener('change', updateSetupPreview);
    distanceInput.addEventListener('input', updateSetupPreview);
    startBtn.addEventListener('click', startManualJourney);
    endBtn.addEventListener('click', endManualJourney);
    saveBtn.addEventListener('click', saveManualJourney);
}

let manualJourneyData = null;
let manualStartTime = null;
let manualTimer = null;

function startManualJourney() {
    const mode = document.getElementById('transportMode').value;
    const expectedDistance = parseFloat(document.getElementById('expectedDistance').value);
    const notes = document.getElementById('journeyNotes').value.trim();
    
    if (!mode || !expectedDistance || expectedDistance <= 0) {
        alert('Please fill in all required fields');
        return;
    }
    
    // Store journey data
    manualJourneyData = {
        mode,
        expectedDistance,
        notes
    };
    
    // Set start time
    manualStartTime = new Date();
    
    // Initialize manual verification map
    initializeManualVerificationMap();
    
    // Switch to tracking phase
    document.getElementById('manualSetup').style.display = 'none';
    document.getElementById('manualTracking').style.display = 'block';
    
    // Update tracking display
    document.getElementById('activeMode').textContent = mode.charAt(0).toUpperCase() + mode.slice(1);
    document.getElementById('activeDistance').textContent = expectedDistance;
    document.getElementById('startTime').textContent = manualStartTime.toLocaleTimeString();
    
    // Start timer
    updateElapsedTime();
    manualTimer = setInterval(updateElapsedTime, 1000);
}

function updateElapsedTime() {
    if (!manualStartTime) return;
    
    const now = new Date();
    const elapsed = Math.floor((now - manualStartTime) / 1000);
    
    const hours = Math.floor(elapsed / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((elapsed % 3600) / 60).toString().padStart(2, '0');
    const seconds = (elapsed % 60).toString().padStart(2, '0');
    
    document.getElementById('elapsedTime').textContent = `${hours}:${minutes}:${seconds}`;
}

function endManualJourney() {
    const actualDistance = parseFloat(document.getElementById('actualDistance').value);
    
    if (!actualDistance || actualDistance <= 0) {
        alert('Please enter the actual distance traveled');
        return;
    }
    
    if (actualDistance > 1000) {
        alert('Distance cannot exceed 1000 km');
        return;
    }
    
    // Stop timer
    if (manualTimer) {
        clearInterval(manualTimer);
        manualTimer = null;
    }
    
    // Calculate points and savings
    const points = calculatePoints(manualJourneyData.mode, actualDistance);
    const co2Saved = (actualDistance * 0.21).toFixed(1);
    const roadTaxSaved = (points * 0.1).toFixed(1);
    
    // Update journey data with actual values
    manualJourneyData.actualDistance = actualDistance;
    manualJourneyData.points = points;
    manualJourneyData.endTime = new Date();
    
    // Switch to completion phase
    document.getElementById('manualTracking').style.display = 'none';
    document.getElementById('manualCompletion').style.display = 'block';
    
    // Show completion summary
    const elapsed = Math.floor((manualJourneyData.endTime - manualStartTime) / 1000);
    const duration = `${Math.floor(elapsed / 60)}m ${elapsed % 60}s`;
    
    document.getElementById('completionSummary').innerHTML = `
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #28a745; margin-bottom: 15px;">Journey Summary</h4>
            <div style="text-align: left; line-height: 1.6;">
                <strong>Transport Mode:</strong> ${manualJourneyData.mode.charAt(0).toUpperCase() + manualJourneyData.mode.slice(1)}<br>
                <strong>Distance Traveled:</strong> ${actualDistance} km<br>
                <strong>Duration:</strong> ${duration}<br>
                <strong>EcoPoints Earned:</strong> <span style="color: #28a745; font-weight: bold;">${points}</span><br>
                <strong>CO₂ Saved:</strong> ${co2Saved} kg<br>
                <strong>Road Tax Saved:</strong> ₹${roadTaxSaved}<br>
                ${manualJourneyData.notes ? `<strong>Notes:</strong> ${manualJourneyData.notes}` : ''}
            </div>
        </div>
    `;
}

async function saveManualJourney() {
    if (!manualJourneyData || !manualJourneyData.actualDistance) {
        alert('No journey data to save');
        return;
    }
    
    const saveBtn = document.getElementById('saveCompletedJourney');
    const originalText = saveBtn.textContent;
    
    try {
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving Journey...';
        
        await saveJourney({
            mode: manualJourneyData.mode,
            distance: manualJourneyData.actualDistance,
            points: manualJourneyData.points,
            notes: manualJourneyData.notes,
            type: 'manual',
            startLocation: null,
            endLocation: null
        });
        
        // Show success and redirect
        alert(`Journey saved! You earned ${manualJourneyData.points} EcoPoints.`);
        window.location.href = 'dashboard.html';
        
    } catch (error) {
        console.error('Error saving manual journey:', error);
        alert('Failed to save journey: ' + error.message);
        
        saveBtn.disabled = false;
        saveBtn.textContent = originalText;
    }
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

// Haversine formula to calculate distance between two GPS coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in kilometers
    
    return distance;
}

// Old handleManualSubmit function removed - now using 3-phase system

// Initialize Google Maps (called by Google Maps API)
function initGoogleMaps() {
    console.log('Google Maps API loaded');
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
    
    // Show map container
    document.getElementById('gpsMapContainer').style.display = 'block';
    
    statusText.textContent = 'Getting GPS location...';
    isTracking = true;
    
    // Initialize GPS timer
    gpsStartTime = new Date();
    updateGpsTimer();
    gpsTimer = setInterval(updateGpsTimer, 1000);
    
    // Reset tracking variables
    pathCoordinates = [];
    totalDistance = 0;
    
    // Get initial position
    navigator.geolocation.getCurrentPosition(
        (position) => {
            gpsStartPosition = position;
            gpsCurrentPosition = position;
            statusText.textContent = 'Tracking your journey...';
            console.log('GPS tracking started at:', position.coords);
            
            // Initialize map with starting position
            initializeGpsMap(position);
            
            // Start watching position
            gpsWatchId = navigator.geolocation.watchPosition(
                updateGpsPosition,
                handleGpsError,
                {
                    enableHighAccuracy: true,
                    maximumAge: 5000,
                    timeout: 10000
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

function initializeGpsMap(position) {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    
    // Always use the default fallback map
    initializeFallbackMap(lat, lng);
}

function initializeGoogleMap(lat, lng) {
    // Create Google Maps instance
    gpsMap = new google.maps.Map(document.getElementById('gpsMap'), {
        zoom: 16,
        center: { lat, lng },
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        styles: [
            {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
            }
        ]
    });
    
    // Add start marker
    startMarker = new google.maps.Marker({
        position: { lat, lng },
        map: gpsMap,
        title: 'Journey Start',
        icon: {
            url: 'data:image/svg+xml;base64,' + btoa(`
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
                    <circle cx="16" cy="16" r="12" fill="#28a745" stroke="white" stroke-width="3"/>
                    <text x="16" y="20" text-anchor="middle" fill="white" font-size="12" font-weight="bold">S</text>
                </svg>
            `),
            scaledSize: new google.maps.Size(32, 32)
        }
    });
    
    // Add current position marker
    currentMarker = new google.maps.Marker({
        position: { lat, lng },
        map: gpsMap,
        title: 'Current Position',
        icon: {
            url: 'data:image/svg+xml;base64,' + btoa(`
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="8" fill="#007bff" stroke="white" stroke-width="2"/>
                    <circle cx="12" cy="12" r="3" fill="white"/>
                </svg>
            `),
            scaledSize: new google.maps.Size(24, 24)
        }
    });
    
    // Initialize path
    pathPolyline = new google.maps.Polyline({
        path: [{ lat, lng }],
        geodesic: true,
        strokeColor: '#28a745',
        strokeOpacity: 1.0,
        strokeWeight: 4
    });
    pathPolyline.setMap(gpsMap);
    
    // Store first coordinate
    pathCoordinates.push({ lat, lng });
}

function initializeFallbackMap(lat, lng) {
    // Create fallback map using OpenStreetMap
    const mapElement = document.getElementById('gpsMap');
    
    mapElement.innerHTML = `
        <div style="width: 100%; height: 100%; background: #f0f0f0; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative;">
            <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; max-width: 300px;">
                <div style="font-size: 2rem; margin-bottom: 10px;">🗺️</div>
                <h4 style="margin: 0 0 10px 0; color: #333;">GPS Tracking Active</h4>
                <p style="margin: 0; color: #666; font-size: 0.9rem;">Your location is being tracked. Real-time data will appear below.</p>
                
                <div style="margin-top: 15px; padding: 10px; background: #f8f9fa; border-radius: 6px;">
                    <div style="font-size: 0.8rem; color: #888; margin-bottom: 5px;">Current Location</div>
                    <div style="font-family: monospace; font-size: 0.9rem; color: #333;" id="currentCoords">
                        ${lat.toFixed(6)}, ${lng.toFixed(6)}
                    </div>
                </div>
            </div>
            
            <!-- Track visualization -->
            <div style="position: absolute; top: 20px; left: 20px; background: rgba(40, 167, 69, 0.9); color: white; padding: 8px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: bold;">
                📍 Journey Started
            </div>
        </div>
    `;
    
            // Store coordinate for path tracking
    pathCoordinates.push({ lat, lng });
    
    // Calculate and display current speed if we have enough data
    if (pathCoordinates.length >= 2 && gpsStartTime) {
        const timeElapsed = (new Date() - gpsStartTime) / 1000; // seconds
        const currentSpeed = totalDistance > 0 ? (totalDistance / timeElapsed) * 3600 : 0; // km/h
        
        // Update speed display
        const speedEl = document.getElementById('realTimeSpeed');
        if (speedEl) {
            speedEl.textContent = currentSpeed.toFixed(1);
        }
        
        // Auto-detect and suggest transport mode
        const suggestedMode = detectTransportMode(currentSpeed, totalDistance);
        if (suggestedMode) {
            updateTransportModeSuggestion(suggestedMode, currentSpeed);
        }
    }
}

// Manual journey verification map
function initializeManualVerificationMap() {
    if (!navigator.geolocation) {
        document.getElementById('manualMap').innerHTML = `
            <div style="text-align: center; color: #999;">
                📍 GPS not available on this device
            </div>
        `;
        return;
    }
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            document.getElementById('manualMap').innerHTML = `
                <div style="width: 100%; height: 100%; background: #f8f9fa; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative;">
                    <div style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); text-align: center; max-width: 250px;">
                        <div style="font-size: 1.5rem; margin-bottom: 8px;">📍</div>
                        <h4 style="margin: 0 0 8px 0; color: #333;">Location Verified</h4>
                        <p style="margin: 0; color: #666; font-size: 0.85rem;">Your location is being tracked for transport verification</p>
                        
                        <div style="margin-top: 12px; padding: 8px; background: #f8f9fa; border-radius: 6px;">
                            <div style="font-size: 0.75rem; color: #888; margin-bottom: 3px;">Current Coordinates</div>
                            <div style="font-family: monospace; font-size: 0.8rem; color: #333;">
                                ${lat.toFixed(6)}, ${lng.toFixed(6)}
                            </div>
                        </div>
                    </div>
                    
                    <div style="position: absolute; top: 15px; left: 15px; background: rgba(40, 167, 69, 0.9); color: white; padding: 6px 10px; border-radius: 15px; font-size: 0.75rem; font-weight: bold;">
                        ✓ Verified
                    </div>
                </div>
            `;
        },
        (error) => {
            document.getElementById('manualMap').innerHTML = `
                <div style="text-align: center; color: #999;">
                    📍 Location access denied<br>
                    <small>Manual verification only</small>
                </div>
            `;
        },
        {
            enableHighAccuracy: true,
            timeout: 10000
        }
    );
}

function updateGpsTimer() {
    if (!gpsStartTime) return;
    
    const now = new Date();
    const elapsed = Math.floor((now - gpsStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const seconds = (elapsed % 60).toString().padStart(2, '0');
    
    const timerElement = document.getElementById('gpsElapsedTime');
    if (timerElement) {
        timerElement.textContent = `${minutes}:${seconds}`;
    }
}

function updateGpsPosition(position) {
    if (!isTracking) return;
    
    const prevPosition = gpsCurrentPosition;
    gpsCurrentPosition = position;
    console.log('GPS position updated:', position.coords);
    
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    
    // Update default map system
    const coordsElement = document.getElementById('currentCoords');
    if (coordsElement) {
        coordsElement.textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
    
    // Calculate distance if we have a previous position
    if (prevPosition) {
        const distance = calculateDistance(
            prevPosition.coords.latitude,
            prevPosition.coords.longitude,
            lat,
            lng
        );
        
        // Add to total distance
        totalDistance += distance;
        
        // Update distance display
        const distanceEl = document.getElementById('realTimeDistance');
        if (distanceEl) {
            distanceEl.textContent = totalDistance.toFixed(2);
        }
        
        // Update hidden distance value for form submission
        const distanceValue = document.getElementById('distanceValue');
        if (distanceValue) {
            distanceValue.textContent = totalDistance.toFixed(2);
        }
    }
    
    // Add to path for distance calculation
    pathCoordinates.push({ lat, lng });
    
    if (gpsStartPosition) {
        // Calculate total distance from start
        const totalDistance = calculateGpsDistance(
            gpsStartPosition.coords.latitude,
            gpsStartPosition.coords.longitude,
            position.coords.latitude,
            position.coords.longitude
        );
        
        // Calculate speed if we have previous position
        let currentSpeed = 0;
        if (prevPosition && position.timestamp && prevPosition.timestamp) {
            const timeDiff = (position.timestamp - prevPosition.timestamp) / 1000; // seconds
            const distanceSegment = calculateGpsDistance(
                prevPosition.coords.latitude,
                prevPosition.coords.longitude,
                position.coords.latitude,
                position.coords.longitude
            );
            currentSpeed = timeDiff > 0 ? (distanceSegment / timeDiff) * 3600 : 0; // km/h
        }
        
        // Update real-time displays
        document.getElementById('realTimeDistance').textContent = totalDistance.toFixed(2);
        document.getElementById('currentSpeed').textContent = Math.round(currentSpeed);
        document.getElementById('distanceValue').textContent = totalDistance.toFixed(2);
        
        // Auto-detect and suggest transport mode based on average speed
        const suggestedMode = detectTransportMode(currentSpeed, totalDistance);
        updateTransportModeSuggestion(suggestedMode, currentSpeed);
        
        // Removed inconvenient live stats updates
        
        console.log(`Distance: ${totalDistance.toFixed(2)} km, Speed: ${currentSpeed.toFixed(1)} km/h, Suggested: ${suggestedMode}`);
        
        // Update preview if transport mode is selected
        updateGpsPreview();
    }
}

function stopGpsTracking() {
    if (gpsWatchId !== null) {
        navigator.geolocation.clearWatch(gpsWatchId);
        gpsWatchId = null;
    }
    
    // Stop GPS timer
    if (gpsTimer) {
        clearInterval(gpsTimer);
        gpsTimer = null;
    }
    
    isTracking = false;
    
    // Removed live journey stats functionality
    
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

// Transport mode detection based on speed
function detectTransportMode(currentSpeed, totalDistance) {
    // Only suggest after some distance to get accurate readings
    if (totalDistance < 0.1) return null;
    
    // Speed ranges for different transport modes (km/h)
    if (currentSpeed >= 0 && currentSpeed <= 8) {
        return 'walk';  // Walking: 0-8 km/h
    } else if (currentSpeed > 8 && currentSpeed <= 25) {
        return 'cycle'; // Cycling: 8-25 km/h
    } else if (currentSpeed > 25 && currentSpeed <= 50) {
        return 'bus';   // Bus/Public transport: 25-50 km/h
    } else if (currentSpeed > 50 && currentSpeed <= 80) {
        return 'carpool'; // Carpool: 50-80 km/h
    } else if (currentSpeed > 80) {
        return 'train'; // Train/Metro: 80+ km/h
    }
    return null;
}

function updateTransportModeSuggestion(suggestedMode, currentSpeed) {
    const modeSelect = document.getElementById('gpsTransportMode');
    if (!modeSelect || !suggestedMode) return;
    
    // Auto-select suggested mode if none selected
    if (!modeSelect.value) {
        modeSelect.value = suggestedMode;
        
        // Add visual indicator
        const modeIndicator = document.getElementById('modeIndicator') || createModeIndicator();
        modeIndicator.innerHTML = `
            <div style="background: #e8f5e8; padding: 10px; border-radius: 6px; margin: 10px 0; border-left: 4px solid #28a745;">
                <strong>🤖 Auto-detected:</strong> ${getModeDisplayName(suggestedMode)} 
                <small style="color: #666;">(${Math.round(currentSpeed)} km/h)</small>
            </div>
        `;
        modeIndicator.style.display = 'block';
    }
}

function createModeIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'modeIndicator';
    const modeSelect = document.getElementById('gpsTransportMode');
    modeSelect.parentNode.insertBefore(indicator, modeSelect.nextSibling);
    return indicator;
}

function getModeDisplayName(mode) {
    const modeNames = {
        'walk': '🚶 Walking',
        'cycle': '🚴 Cycling', 
        'bus': '🚌 Bus/Public Transport',
        'carpool': '🚘 Carpool',
        'train': '🚆 Train',
        'metro': '🚇 Metro'
    };
    return modeNames[mode] || mode;
}

function resetGpsTracking() {
    stopGpsTracking();
    
    // Reset tracking variables
    totalDistance = 0;
    pathCoordinates = [];
    
    const statusText = document.getElementById('gpsStatusText');
    const distanceDisplay = document.getElementById('gpsDistance');
    const completionForm = document.getElementById('gpsCompletionForm');
    const errorDiv = document.getElementById('gpsError');
    const mapContainer = document.getElementById('gpsMapContainer');
    const modeIndicator = document.getElementById('modeIndicator');
    
    statusText.textContent = 'Ready to start';
    distanceDisplay.style.display = 'none';
    completionForm.style.display = 'none';
    errorDiv.style.display = 'none';
    mapContainer.style.display = 'none';
    
    if (modeIndicator) {
        modeIndicator.style.display = 'none';
    }
    
    // Reset all displays
    document.getElementById('distanceValue').textContent = '0.0';
    document.getElementById('realTimeDistance').textContent = '0.0';
    document.getElementById('currentSpeed').textContent = '0';
    document.getElementById('gpsElapsedTime').textContent = '00:00';
    document.getElementById('gpsTransportMode').value = '';
    document.getElementById('gpsJourneyNotes').value = '';
    
    // Clear map variables
    gpsMap = null;
    startMarker = null;
    currentMarker = null;
    pathPolyline = null;
    pathCoordinates = [];
    gpsStartTime = null;
    
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
    const user = firebase.auth().currentUser;
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
        
        // Create journey document with fields matching what dashboard expects
        const journeyDoc = {
            userId: user.uid,
            mode: journeyData.mode,  // Dashboard uses 'mode' field
            transportMode: journeyData.mode,  // Keep both for compatibility
            distance: journeyData.distance || 0,
            points: journeyData.points || 0,  // Dashboard uses 'points' field
            pointsEarned: journeyData.points || 0,  // Keep both for compatibility
            notes: journeyData.notes || '',
            status: 'completed',
            type: journeyData.type || 'manual',
            startLocation: startLocation,
            endLocation: endLocation,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
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