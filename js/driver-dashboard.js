// Driver Dashboard functionality
document.addEventListener('DOMContentLoaded', () => {
    // Wait for Firebase to load, then check authentication
    const initializeWhenReady = () => {
        if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
            firebase.auth().onAuthStateChanged((user) => {
                if (user) {
                    console.log('User authenticated:', user.uid);
                    initializeDriverDashboard();
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

let driverMap = null;
let vehicleMarker = null;
let isServiceActive = false;
let locationWatcher = null;
let currentVehicleData = null;

function initializeDriverDashboard() {
    const user = getCurrentUser();
    
    checkDriverAuthorization(user);
    initializeMap();
    setupEventListeners();
    loadVehicleData();
    startPassengerMonitoring();
}

async function checkDriverAuthorization(user) {
    try {
        const driverRef = db.collection('drivers').doc(user.uid);
        let driverDoc = await driverRef.get();

        if (!driverDoc.exists) {
            const defaultData = {
                vehicleId: `BUS${Date.now().toString().slice(-4)}`,
                route: "Not assigned",
                vehicleType: "Electric Bus",
                email: user.email,
                name: user.displayName || '',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            await driverRef.set(defaultData);
            driverDoc = await driverRef.get();
            console.log("✅ Driver profile created.");
        }

        const driverData = driverDoc.data();
        currentVehicleData = {
            vehicleId: driverData.vehicleId,
            route: driverData.route,
            type: driverData.vehicleType
        };

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
    driverMap = L.map('driverMap').setView([0, 0], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(driverMap);

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            driverMap.setView([lat, lon], 15);

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

        document.getElementById('startServiceBtn').style.display = 'none';
        document.getElementById('stopServiceBtn').style.display = 'block';
        document.getElementById('vehicleStatus').textContent = 'Active';
        document.getElementById('vehicleStatus').className = 'status-active';

        startLocationTracking();

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

        document.getElementById('startServiceBtn').style.display = 'block';
        document.getElementById('stopServiceBtn').style.display = 'none';
        document.getElementById('vehicleStatus').textContent = 'Inactive';
        document.getElementById('vehicleStatus').className = 'status-inactive';

        if (locationWatcher) {
            navigator.geolocation.clearWatch(locationWatcher);
            locationWatcher = null;
        }

        await db.collection('vehicles').doc(currentVehicleData.vehicleId).update({
            status: 'inactive',
            passengers: [],
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        });

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

                if (vehicleMarker) {
                    vehicleMarker.setLatLng([lat, lon]);
                }

                document.getElementById('vehicleSpeed').textContent = `${Math.round(speed * 3.6)} km/h`;

                if (isServiceActive) {
                    try {
                        await db.collection('vehicles').doc(currentVehicleData.vehicleId).update({
                            currentLocation: {
                                lat: lat,
                                lon: lon,
                                timestamp: firebase.firestore.FieldValue.serverTimestamp()
                            },
                            speed: speed * 3.6,
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
    console.log('Vehicle data loaded:', currentVehicleData);
}
