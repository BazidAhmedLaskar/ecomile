// QR Scanner functionality
document.addEventListener('DOMContentLoaded', () => {
    if (!requireAuth()) return;
    initializeQRScanner();
});

let codeReader = null;
let currentJourney = null;
let watchId = null;
let journeyStartTime = null;
let journeyDistance = 0;

function initializeQRScanner() {
    codeReader = new ZXing.BrowserQRCodeReader();
    
    const startScanBtn = document.getElementById('startScanBtn');
    const stopScanBtn = document.getElementById('stopScanBtn');
    const boardVehicleBtn = document.getElementById('boardVehicleBtn');
    const scanAgainBtn = document.getElementById('scanAgainBtn');
    const endJourneyBtn = document.getElementById('endJourneyBtn');
    
    startScanBtn.addEventListener('click', startScanning);
    stopScanBtn.addEventListener('click', stopScanning);
    boardVehicleBtn.addEventListener('click', boardVehicle);
    scanAgainBtn.addEventListener('click', () => {
        hideResult();
        startScanning();
    });
    endJourneyBtn.addEventListener('click', endJourney);
    
    // Check if there's an active journey
    checkActiveJourney();
}

async function startScanning() {
    try {
        const videoInputDevices = await ZXing.BrowserQRCodeReader.listVideoInputDevices();
        
        if (videoInputDevices.length === 0) {
            showError('No camera found. Please check camera permissions.');
            return;
        }
        
        const selectedDeviceId = videoInputDevices[0].deviceId;
        
        document.getElementById('startScanBtn').style.display = 'none';
        document.getElementById('stopScanBtn').style.display = 'block';
        
        codeReader.decodeFromVideoDevice(selectedDeviceId, 'video', (result, err) => {
            if (result) {
                console.log('QR Code detected:', result.text);
                processQRCode(result.text);
            }
            if (err && !(err instanceof ZXing.NotFoundException)) {
                console.error('QR Scanner error:', err);
            }
        });
        
    } catch (error) {
        console.error('Error starting scanner:', error);
        showError('Failed to start camera. Please check permissions.');
    }
}

function stopScanning() {
    codeReader.reset();
    document.getElementById('startScanBtn').style.display = 'block';
    document.getElementById('stopScanBtn').style.display = 'none';
}

function processQRCode(qrData) {
    try {
        // Expected QR format: {"vehicleId":"BUS001","route":"City Center - Airport","type":"bus","driverId":"driver123"}
        const vehicleData = JSON.parse(qrData);
        
        if (vehicleData.vehicleId && vehicleData.route && vehicleData.type) {
            stopScanning();
            showVehicleInfo(vehicleData);
        } else {
            showError('Invalid QR code. Please scan a valid vehicle QR code.');
        }
    } catch (error) {
        showError('Invalid QR code format. Please scan a valid vehicle QR code.');
    }
}

function showVehicleInfo(vehicleData) {
    document.getElementById('vehicleId').textContent = vehicleData.vehicleId;
    document.getElementById('vehicleRoute').textContent = vehicleData.route;
    document.getElementById('vehicleType').textContent = vehicleData.type.toUpperCase();
    
    document.getElementById('scanResult').classList.remove('hidden');
    
    // Store vehicle data for boarding
    window.scannedVehicle = vehicleData;
}

function hideResult() {
    document.getElementById('scanResult').classList.add('hidden');
}

async function boardVehicle() {
    const user = getCurrentUser();
    const vehicleData = window.scannedVehicle;
    
    if (!user || !vehicleData) {
        showError('Unable to board vehicle. Please try again.');
        return;
    }
    
    try {
        // Create journey record in Firestore
        const journeyData = {
            userId: user.uid,
            vehicleId: vehicleData.vehicleId,
            route: vehicleData.route,
            transportMode: vehicleData.type,
            startTime: firebase.firestore.FieldValue.serverTimestamp(),
            startLocation: null,
            endLocation: null,
            distance: 0,
            points: 0,
            status: 'active',
            passengers: [user.uid]
        };
        
        // Get current location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                journeyData.startLocation = {
                    lat: position.coords.latitude,
                    lon: position.coords.longitude
                };
                
                const docRef = await db.collection('journeys').add(journeyData);
                currentJourney = { id: docRef.id, ...journeyData };
                
                // Update vehicle passenger list
                await updateVehiclePassengers(vehicleData.vehicleId, user.uid, 'board');
                
                showActiveJourney();
                startJourneyTracking();
            });
        } else {
            const docRef = await db.collection('journeys').add(journeyData);
            currentJourney = { id: docRef.id, ...journeyData };
            showActiveJourney();
            startJourneyTracking();
        }
        
    } catch (error) {
        console.error('Error boarding vehicle:', error);
        showError('Failed to board vehicle. Please try again.');
    }
}

function showActiveJourney() {
    document.getElementById('scanResult').classList.add('hidden');
    document.getElementById('journeyActive').classList.remove('hidden');
    
    const vehicleData = window.scannedVehicle;
    document.getElementById('activeVehicleId').textContent = vehicleData.vehicleId;
    document.getElementById('startTime').textContent = new Date().toLocaleTimeString();
    
    journeyStartTime = Date.now();
    journeyDistance = 0;
}

function startJourneyTracking() {
    if (navigator.geolocation) {
        let lastPosition = null;
        
        watchId = navigator.geolocation.watchPosition(
            (position) => {
                if (lastPosition) {
                    const distance = calculateDistance(
                        lastPosition.coords.latitude,
                        lastPosition.coords.longitude,
                        position.coords.latitude,
                        position.coords.longitude
                    );
                    
                    journeyDistance += distance;
                    updateJourneyDisplay();
                }
                lastPosition = position;
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

function updateJourneyDisplay() {
    document.getElementById('journeyDistance').textContent = `${journeyDistance.toFixed(2)} km`;
    
    // Calculate points based on transport mode (public transport = 5 points/km)
    const points = Math.round(journeyDistance * 5);
    document.getElementById('pointsEarned').textContent = points;
}

async function endJourney() {
    if (!currentJourney) return;
    
    try {
        // Stop GPS tracking
        if (watchId) {
            navigator.geolocation.clearWatch(watchId);
            watchId = null;
        }
        
        // Get current location for end point
        navigator.geolocation.getCurrentPosition(async (position) => {
            const endLocation = {
                lat: position.coords.latitude,
                lon: position.coords.longitude
            };
            
            const points = Math.round(journeyDistance * 5);
            const co2Saved = journeyDistance * 0.21; // 0.21 kg CO2 per km
            
            // Update journey in Firestore
            await db.collection('journeys').doc(currentJourney.id).update({
                endTime: firebase.firestore.FieldValue.serverTimestamp(),
                endLocation: endLocation,
                distance: journeyDistance,
                points: points,
                co2Saved: co2Saved,
                status: 'completed'
            });
            
            // Update user points
            const user = getCurrentUser();
            const userRef = db.collection('users').doc(user.uid);
            await userRef.update({
                points: firebase.firestore.FieldValue.increment(points),
                totalDistance: firebase.firestore.FieldValue.increment(journeyDistance),
                roadTaxSaved: firebase.firestore.FieldValue.increment(points * 0.1)
            });
            
            // Remove from vehicle passengers
            const vehicleData = window.scannedVehicle;
            await updateVehiclePassengers(vehicleData.vehicleId, user.uid, 'alight');
            
            // Reset UI
            document.getElementById('journeyActive').classList.add('hidden');
            currentJourney = null;
            journeyDistance = 0;
            
            alert(`Journey completed! You earned ${points} points and saved ${co2Saved.toFixed(2)} kg CO2.`);
            
            // Redirect to dashboard
            window.location.href = 'dashboard.html';
        });
        
    } catch (error) {
        console.error('Error ending journey:', error);
        showError('Failed to end journey. Please try again.');
    }
}

async function updateVehiclePassengers(vehicleId, userId, action) {
    try {
        const vehicleRef = db.collection('vehicles').doc(vehicleId);
        const vehicleDoc = await vehicleRef.get();
        
        if (vehicleDoc.exists) {
            const vehicleData = vehicleDoc.data();
            let passengers = vehicleData.passengers || [];
            
            if (action === 'board' && !passengers.includes(userId)) {
                passengers.push(userId);
            } else if (action === 'alight') {
                passengers = passengers.filter(id => id !== userId);
            }
            
            await vehicleRef.update({
                passengers: passengers,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
        } else {
            // Create vehicle document if it doesn't exist
            await vehicleRef.set({
                vehicleId: vehicleId,
                passengers: action === 'board' ? [userId] : [],
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
    } catch (error) {
        console.error('Error updating vehicle passengers:', error);
    }
}

function checkActiveJourney() {
    // Check if user has an active journey
    const user = getCurrentUser();
    if (!user) return;
    
    db.collection('journeys')
        .where('userId', '==', user.uid)
        .where('status', '==', 'active')
        .get()
        .then((querySnapshot) => {
            if (!querySnapshot.empty) {
                const journeyDoc = querySnapshot.docs[0];
                currentJourney = { id: journeyDoc.id, ...journeyDoc.data() };
                
                // Show active journey UI
                document.getElementById('journeyActive').classList.remove('hidden');
                document.getElementById('activeVehicleId').textContent = currentJourney.vehicleId;
                
                // Resume tracking
                startJourneyTracking();
            }
        })
        .catch((error) => {
            console.error('Error checking active journey:', error);
        });
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

function showError(message) {
    document.getElementById('errorText').textContent = message;
    document.getElementById('errorMsg').classList.remove('hidden');
    setTimeout(() => {
        document.getElementById('errorMsg').classList.add('hidden');
    }, 5000);
}