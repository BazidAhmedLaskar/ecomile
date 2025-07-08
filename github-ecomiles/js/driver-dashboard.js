// Driver Dashboard functionality
document.addEventListener('DOMContentLoaded', () => {
    if (!requireAuth()) return;
    initializeDriverDashboard();
});

let driverMap = null;
let vehicleMarker = null;
let isServiceActive = false;
let locationWatcher = null;
let currentVehicleData = null;

function initializeDriverDashboard() {
    const user = getCurrentUser();
    
    // Check if user is authorized as driver
    checkDriverAuthorization(user);
    
    // Initialize map
    initializeMap();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load vehicle data
    loadVehicleData();
    
    // Start passenger monitoring
    startPassengerMonitoring();
}

async function checkDriverAuthorization(user) {
    try {
        const driverDoc = await db.collection('drivers').doc(user.uid).get();
        
        if (!driverDoc.exists) {
            alert('You are not authorized as a driver. Redirecting to dashboard.');
            window.location.href = 'dashboard.html';
            return;
        }
        
        const driverData = driverDoc.data();
        currentVehicleData = {
            vehicleId: driverData.vehicleId,
            route: driverData.route,
            type: driverData.vehicleType
        };
        
        // Update UI with vehicle data
        document.getElementById('driverVehicleId').textContent = currentVehicleData.vehicleId;
        document.getElementById('driverRoute').textContent = currentVehicleData.route;
        
    } catch (error) {
        console.error('Error checking driver authorization:', error);
        alert('Error checking authorization. Please try again.');
        window.location.href = 'dashboard.html';
    }
}

function setupEventListeners() {
    document.getElementById('startServiceBtn').addEventListener('click', startService);
    document.getElementById('stopServiceBtn').addEventListener('click', stopService);
    document.getElementById('showQRBtn').addEventListener('click', showQRCode);
    document.getElementById('closeQRBtn').addEventListener('click', closeQRModal);
    document.getElementById('centerMapBtn').addEventListener('click', centerMap);
    document.getElementById('shareLocationBtn').addEventListener('click', shareLocation);
}

function initializeMap() {
    // Initialize map centered on user location
    driverMap = L.map('driverMap').setView([0, 0], 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(driverMap);
    
    // Get current location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            
            driverMap.setView([lat, lon], 15);
            
            // Add vehicle marker
            vehicleMarker = L.marker([lat, lon], {
                icon: L.divIcon({
                    className: 'vehicle-marker',
                    html: '🚌',
                    iconSize: [30, 30]
                })
            }).addTo(driverMap);
            
            vehicleMarker.bindPopup(`Vehicle: ${currentVehicleData?.vehicleId || 'Unknown'}`);
        });
    }
}

async function startService() {
    if (!currentVehicleData) {
        alert('Vehicle data not loaded. Please try again.');
        return;
    }
    
    try {
        isServiceActive = true;
        
        // Update UI
        document.getElementById('startServiceBtn').style.display = 'none';
        document.getElementById('stopServiceBtn').style.display = 'block';
        document.getElementById('vehicleStatus').textContent = 'Active';
        document.getElementById('vehicleStatus').className = 'status-active';
        
        // Start location tracking
        startLocationTracking();
        
        // Update vehicle status in Firestore
        await db.collection('vehicles').doc(currentVehicleData.vehicleId).set({
            vehicleId: currentVehicleData.vehicleId,
            route: currentVehicleData.route,
            type: currentVehicleData.type,
            status: 'active',
            driverId: getCurrentUser().uid,
            currentLocation: null,
            passengers: [],
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
        console.log('Service started successfully');
        
    } catch (error) {
        console.error('Error starting service:', error);
        alert('Failed to start service. Please try again.');
    }
}

async function stopService() {
    try {
        isServiceActive = false;
        
        // Update UI
        document.getElementById('startServiceBtn').style.display = 'block';
        document.getElementById('stopServiceBtn').style.display = 'none';
        document.getElementById('vehicleStatus').textContent = 'Inactive';
        document.getElementById('vehicleStatus').className = 'status-inactive';
        
        // Stop location tracking
        if (locationWatcher) {
            navigator.geolocation.clearWatch(locationWatcher);
            locationWatcher = null;
        }
        
        // Update vehicle status in Firestore
        await db.collection('vehicles').doc(currentVehicleData.vehicleId).update({
            status: 'inactive',
            passengers: [],
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Clear passenger list
        updatePassengersList([]);
        
        console.log('Service stopped successfully');
        
    } catch (error) {
        console.error('Error stopping service:', error);
        alert('Failed to stop service. Please try again.');
    }
}

function startLocationTracking() {
    if (navigator.geolocation) {
        locationWatcher = navigator.geolocation.watchPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                const speed = position.coords.speed || 0;
                
                // Update map marker
                if (vehicleMarker) {
                    vehicleMarker.setLatLng([lat, lon]);
                }
                
                // Update speed display
                document.getElementById('vehicleSpeed').textContent = `${Math.round(speed * 3.6)} km/h`;
                
                // Update location in Firestore
                if (isServiceActive) {
                    try {
                        await db.collection('vehicles').doc(currentVehicleData.vehicleId).update({
                            currentLocation: {
                                lat: lat,
                                lon: lon,
                                timestamp: firebase.firestore.FieldValue.serverTimestamp()
                            },
                            speed: speed * 3.6, // Convert to km/h
                            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                        });
                    } catch (error) {
                        console.error('Error updating location:', error);
                    }
                }
            },
            (error) => {
                console.error('Geolocation error:', error);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 1000
            }
        );
    }
}

function startPassengerMonitoring() {
    if (!currentVehicleData) return;
    
    // Listen for real-time passenger updates
    db.collection('vehicles').doc(currentVehicleData.vehicleId)
        .onSnapshot((doc) => {
            if (doc.exists) {
                const vehicleData = doc.data();
                const passengers = vehicleData.passengers || [];
                updatePassengersList(passengers);
            }
        });
}

async function updatePassengersList(passengerIds) {
    const passengersList = document.getElementById('passengersList');
    const passengerCount = document.getElementById('passengerCount');
    
    passengerCount.textContent = passengerIds.length;
    
    if (passengerIds.length === 0) {
        passengersList.innerHTML = '<div class="no-passengers">No passengers currently on board</div>';
        return;
    }
    
    try {
        const passengerPromises = passengerIds.map(async (userId) => {
            const userDoc = await db.collection('users').doc(userId).get();
            return userDoc.exists ? { id: userId, ...userDoc.data() } : null;
        });
        
        const passengers = (await Promise.all(passengerPromises)).filter(p => p !== null);
        
        passengersList.innerHTML = passengers.map(passenger => `
            <div class="passenger-card">
                <img src="${passenger.photoURL || '/css/default-avatar.png'}" alt="${passenger.name}" class="passenger-avatar">
                <div class="passenger-info">
                    <div class="passenger-name">${passenger.name}</div>
                    <div class="passenger-email">${passenger.email}</div>
                    <div class="passenger-id">ID: ${passenger.id.substring(0, 8)}...</div>
                </div>
                <div class="passenger-status">
                    <span class="status-active">On Board</span>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading passenger data:', error);
        passengersList.innerHTML = '<div class="error">Error loading passenger data</div>';
    }
}

function showQRCode() {
    if (!currentVehicleData) {
        alert('Vehicle data not available');
        return;
    }
    
    const qrData = JSON.stringify({
        vehicleId: currentVehicleData.vehicleId,
        route: currentVehicleData.route,
        type: currentVehicleData.type,
        driverId: getCurrentUser().uid
    });
    
    // Generate QR code
    QRCode.toCanvas(qrData, { width: 200 }, (error, canvas) => {
        if (error) {
            console.error('Error generating QR code:', error);
            alert('Failed to generate QR code');
            return;
        }
        
        const qrDisplay = document.getElementById('qrCodeDisplay');
        qrDisplay.innerHTML = '';
        qrDisplay.appendChild(canvas);
        
        document.getElementById('qrModal').classList.remove('hidden');
    });
}

function closeQRModal() {
    document.getElementById('qrModal').classList.add('hidden');
}

function centerMap() {
    if (navigator.geolocation && driverMap) {
        navigator.geolocation.getCurrentPosition((position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            driverMap.setView([lat, lon], 15);
        });
    }
}

async function shareLocation() {
    if (!navigator.geolocation) {
        alert('Geolocation not supported');
        return;
    }
    
    navigator.geolocation.getCurrentPosition(async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        
        try {
            await db.collection('vehicles').doc(currentVehicleData.vehicleId).update({
                sharedLocation: {
                    lat: lat,
                    lon: lon,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                }
            });
            
            alert('Location shared with passengers');
        } catch (error) {
            console.error('Error sharing location:', error);
            alert('Failed to share location');
        }
    });
}

async function loadVehicleData() {
    // Load any additional vehicle data needed
    console.log('Vehicle data loaded:', currentVehicleData);
}