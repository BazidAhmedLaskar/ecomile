// Firebase configuration - using environment variables for Netlify deployment
const firebaseConfig = {
  apiKey: window.FIREBASE_CONFIG?.apiKey || "AIzaSyDFJQKYkWywoSprZqOtjqjoYAe7nkGOfEI",
  authDomain: window.FIREBASE_CONFIG?.authDomain || "ecomiles-70c6e.firebaseapp.com",
  projectId: window.FIREBASE_CONFIG?.projectId || "ecomiles-70c6e",
  storageBucket: window.FIREBASE_CONFIG?.storageBucket || "ecomiles-70c6e.firebasestorage.app",
  messagingSenderId: window.FIREBASE_CONFIG?.messagingSenderId || "247523942180",
  appId: window.FIREBASE_CONFIG?.appId || "1:247523942180:web:947f664f5de7f0c1759db1",
  measurementId: window.FIREBASE_CONFIG?.measurementId || "G-2TP0NK67TX"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Google Auth Provider
const googleProvider = new firebase.auth.GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Auth observer
auth.onAuthStateChanged((user) => {
  if (user) {
    const userData = {
      uid: user.uid,
      name: user.displayName,
      email: user.email,
      photoURL: user.photoURL
    };
    localStorage.setItem('ecomiles_user', JSON.stringify(userData));
    initializeUserData(user);
  } else {
    localStorage.removeItem('ecomiles_user');
  }
});

// Create user doc if not exist
async function initializeUserData(user) {
  try {
    const userRef = db.collection('users').doc(user.uid);
    const docSnap = await userRef.get();
    if (!docSnap.exists) {
      await userRef.set({
        name: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        userType: 'user',
        points: 0,
        totalDistance: 0,
        roadTaxSaved: 0,
        journeys: [],
        isActive: true,
        showInLeaderboard: true, // Privacy setting for leaderboard visibility
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
  } catch (err) {
    console.error('Error initializing user data:', err);
  }
}

// Firebase helper functions
function getCurrentUser() {
  const str = localStorage.getItem('ecomiles_user');
  return str ? JSON.parse(str) : null;
}

function isUserLoggedIn() {
  return getCurrentUser() !== null;
}

function requireAuth() {
  if (!isUserLoggedIn()) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

function logout() {
  auth.signOut().then(() => {
    localStorage.removeItem('ecomiles_user');
    window.location.href = 'index.html';
  }).catch(err => {
    console.error('Error signing out:', err);
  });
}

// Journey management functions for Firebase
async function saveJourney(journeyData) {
  const user = getCurrentUser();
  if (!user) return null;
  
  try {
    const journey = {
      ...journeyData,
      userId: user.uid,
      id: Date.now().toString(),
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    const docRef = await db.collection('journeys').add(journey);
    
    // Update user stats
    await updateUserStats(user.uid, journeyData.points, parseFloat(journeyData.distance));
    
    return { id: docRef.id, ...journey };
  } catch (error) {
    console.error('Error saving journey:', error);
    return null;
  }
}

async function getUserJourneys(userId, limit = 50) {
  try {
    const snapshot = await db.collection('journeys')
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching journeys:', error);
    return [];
  }
}

async function updateUserStats(userId, points, distance) {
  try {
    const userRef = db.collection('users').doc(userId);
    await userRef.update({
      points: firebase.firestore.FieldValue.increment(points),
      totalDistance: firebase.firestore.FieldValue.increment(distance),
      roadTaxSaved: firebase.firestore.FieldValue.increment(distance * 0.15) // Estimated tax savings
    });
  } catch (error) {
    console.error('Error updating user stats:', error);
  }
}

// Vehicle management functions
async function getVehicles() {
  try {
    const snapshot = await db.collection('vehicles').get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    return [];
  }
}

async function getVehicleById(vehicleId) {
  try {
    const doc = await db.collection('vehicles').doc(vehicleId).get();
    if (doc.exists) {
      return { id: doc.id, ...doc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    return null;
  }
}

async function updateVehicleLocation(vehicleId, location) {
  try {
    await db.collection('vehicles').doc(vehicleId).update({
      currentLocation: location,
      lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating vehicle location:', error);
  }
}

// Driver functions
async function createDriver(driverData) {
  try {
    const docRef = await db.collection('drivers').add({
      ...driverData,
      id: Date.now().toString(),
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return { id: docRef.id, ...driverData };
  } catch (error) {
    console.error('Error creating driver:', error);
    return null;
  }
}

async function getDriverByUserId(userId) {
  try {
    const snapshot = await db.collection('drivers')
      .where('userId', '==', userId)
      .get();
    
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error fetching driver:', error);
    return null;
  }
}

// Leaderboard functions - only shows users who opted in
async function getLeaderboard(limit = 10) {
  try {
    const snapshot = await db.collection('users')
      .where('showInLeaderboard', '==', true)
      .orderBy('points', 'desc')
      .limit(limit)
      .get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }
}

// Update user privacy settings
async function updateUserPrivacy(userId, showInLeaderboard) {
  try {
    await db.collection('users').doc(userId).update({
      showInLeaderboard: showInLeaderboard
    });
    return true;
  } catch (error) {
    console.error('Error updating privacy settings:', error);
    return false;
  }
}