# Firebase Firestore Database Setup Instructions

## 1. Create Collections and Documents

### Step 1: Go to Firebase Console
1. Open https://console.firebase.google.com
2. Select your project: `ecomiles-70c6e`
3. Click on "Firestore Database" in the left sidebar
4. Click "Create database" if not already created

### Step 2: Set Database Security Rules
Click on "Rules" tab and replace the content with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Journeys collection - users can only read/write their own journeys
    match /journeys/{journeyId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == resource.data.userId || 
         request.auth.uid == request.resource.data.userId);
    }
    
    // Vehicles collection - read for all authenticated, write for drivers only
    match /vehicles/{vehicleId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        (request.auth.uid == resource.data.driverId || 
         request.auth.uid == request.resource.data.driverId);
    }
    
    // Drivers collection - drivers can only access their own data
    match /drivers/{driverId} {
      allow read, write: if request.auth != null && request.auth.uid == driverId;
    }
    
    // Public leaderboard data - read only for authenticated users
    match /leaderboard/{document} {
      allow read: if request.auth != null;
      allow write: if false; // Managed by cloud functions
    }
  }
}
```

### Step 3: Create Initial Collections
Go to "Data" tab and create these collections by adding sample documents:

#### Collection: `users`
Create a document with ID: `sample-user-id`
```json
{
  "name": "Sample User",
  "email": "sample@example.com",
  "photoURL": "https://example.com/photo.jpg",
  "points": 0,
  "totalDistance": 0,
  "roadTaxSaved": 0,
  "createdAt": "2025-01-08T00:00:00Z"
}
```

#### Collection: `journeys`
Create a document with ID: `sample-journey-id`
```json
{
  "userId": "sample-user-id",
  "mode": "walking",
  "distance": 2.5,
  "points": 25,
  "co2Saved": 0.525,
  "notes": "Morning walk to office",
  "type": "manual",
  "startLocation": {
    "lat": 40.7128,
    "lon": -74.0060
  },
  "endLocation": {
    "lat": 40.7589,
    "lon": -73.9851
  },
  "timestamp": "2025-01-08T08:00:00Z"
}
```

#### Collection: `vehicles`
Create a document with ID: `BUS001`
```json
{
  "vehicleId": "BUS001",
  "route": "City Center - Airport",
  "type": "bus",
  "status": "inactive",
  "driverId": "driver-user-id",
  "passengers": [],
  "currentLocation": {
    "lat": 40.7128,
    "lon": -74.0060,
    "timestamp": "2025-01-08T00:00:00Z"
  },
  "speed": 0,
  "lastUpdated": "2025-01-08T00:00:00Z",
  "createdAt": "2025-01-08T00:00:00Z"
}
```

#### Collection: `drivers`
Create a document with ID: `driver-user-id`
```json
{
  "vehicleId": "BUS001",
  "route": "City Center - Airport",
  "vehicleType": "bus",
  "driverName": "John Driver",
  "driverEmail": "driver@example.com",
  "createdAt": "2025-01-08T00:00:00Z"
}
```

## 2. Authentication Setup

### Step 1: Enable Authentication
1. Click "Authentication" in left sidebar
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Google" provider
5. Add authorized domains:
   - `localhost` (for development)
   - Your Replit domain when deployed

### Step 2: Set up Authorized Domains
In Authentication > Settings > Authorized domains, add:
- `localhost`
- `127.0.0.1`
- Your production domain

## 3. Project Configuration

### Your Current Firebase Config (already in code):
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyDFJQKYkWywoSprZqOtjqjoYAe7nkGOfEI",
  authDomain: "ecomiles-70c6e.firebaseapp.com",
  projectId: "ecomiles-70c6e",
  storageBucket: "ecomiles-70c6e.appspot.com",
  messagingSenderId: "247523942180",
  appId: "1:247523942180:web:947f664f5de7f0c1759db1",
  measurementId: "G-2TP0NK67TX"
};
```

## 4. Test the Setup

### Step 1: Create Test Data
After setting up, you can test by:
1. Go to your app: http://localhost:3000
2. Login with Google
3. Go to "Setup Demo Data" page
4. Create a driver account
5. Test QR scanning and GPS tracking

### Step 2: Verify Data Flow
Check Firestore console to see:
- User documents created automatically on login
- Journey documents when trips are logged
- Vehicle passenger updates during QR scanning
- Real-time location updates from driver dashboard

## 5. Production Deployment

### Security Considerations:
1. Keep your API keys secure
2. The current rules allow authenticated users appropriate access
3. Consider adding rate limiting for production
4. Monitor usage in Firebase console

### Scaling:
- Current structure supports unlimited users
- Real-time updates work automatically
- Consider adding indexes for large datasets

## 6. Backup Your Data

### Export Data:
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Export data
firebase firestore:export gs://ecomiles-70c6e.appspot.com/backups/
```

## Troubleshooting

### Common Issues:
1. **Permission denied**: Check if user is authenticated
2. **Rules rejected**: Verify security rules syntax
3. **Network errors**: Check internet connection and Firebase status

### Debug Mode:
Add this to your JavaScript console to see Firestore operations:
```javascript
firebase.firestore().enableNetwork();
firebase.firestore().settings({ ignoreUndefinedProperties: true });
```

Your Firebase database is now ready to handle all the EcoMiles features including QR scanning, GPS tracking, and real-time passenger monitoring!