# EcoMiles Deployment Guide

## 🚀 Complete Deployment Steps

### 1. Firebase Setup

#### Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name (e.g., "ecomiles-app")
4. Disable Google Analytics (optional)
5. Click "Create project"

#### Enable Authentication
1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Click on **Google** provider
3. Toggle "Enable"
4. Add your email as authorized domain
5. Click "Save"

#### Setup Firestore Database
1. Go to **Firestore Database**
2. Click "Create database"
3. Choose "Start in test mode"
4. Select your region
5. Click "Done"

#### Get Configuration Keys
1. Go to **Project Settings** (gear icon)
2. Scroll down to "Your apps"
3. Click **Web** icon (`</>`)
4. Register your app (name: "EcoMiles")
5. Copy the config values:
   - `apiKey`
   - `projectId` 
   - `appId`

### 2. Netlify Deployment

#### Prepare Environment Variables
1. In your Netlify dashboard, go to **Site settings** > **Environment variables**
2. Add these variables:
   ```
   VITE_FIREBASE_API_KEY = your-api-key-here
   VITE_FIREBASE_PROJECT_ID = your-project-id-here
   VITE_FIREBASE_APP_ID = your-app-id-here
   ```

#### Deploy to Netlify
1. **Option A: Drag & Drop**
   - Zip all files (except node_modules, .git)
   - Drag zip to Netlify deploy area

2. **Option B: Git Connection**
   - Connect your GitHub/GitLab repo
   - Set build command: (leave empty)
   - Set publish directory: `/` (root)

#### Configure Firebase Authorized Domains
1. Go back to Firebase Console
2. **Authentication** > **Settings** > **Authorized domains**
3. Add your Netlify domain:
   - `your-app-name.netlify.app`
   - `localhost` (for testing)

### 3. Security Rules (Firestore)

Replace default Firestore rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Anyone can read leaderboard (but only public profiles)
    match /users/{userId} {
      allow read: if request.auth != null && resource.data.showInLeaderboard == true;
    }
    
    // Users can read/write their own journeys
    match /journeys/{journeyId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
```

### 4. Testing Deployment

1. **Visit your site**: `https://your-app-name.netlify.app`
2. **Test login**: Click "Login with Google"
3. **Verify data**: Check if user data saves to Firestore
4. **Test features**:
   - Add a journey
   - Check dashboard updates
   - Toggle leaderboard privacy
   - View leaderboard

### 5. Final Configuration

#### Update Firebase Config
The app automatically detects environment variables. Your `js/firebase-config.js` will use:
- `window.FIREBASE_CONFIG.apiKey` (from Netlify env vars)
- `window.FIREBASE_CONFIG.projectId`
- `window.FIREBASE_CONFIG.appId`

#### Verify No Demo Data
✅ All demo/test data has been removed
✅ Users start with clean profiles
✅ No mock users in leaderboard

### 6. Features Included

#### Core Features
- 🔐 **Google Authentication**
- 📊 **Real-time Dashboard**
- 🚶‍♀️ **Journey Tracking** (Manual & GPS)
- 🏆 **Leaderboard** with privacy controls
- 🎖️ **Rewards & Badges**
- 👤 **Profile Management**

#### Privacy Features
- 🔒 **Leaderboard Visibility Toggle**
- 👁️ **Private profile option**
- 🛡️ **Secure data storage**

#### Mobile Features
- 📱 **Responsive design**
- 🍔 **Hamburger profile menu**
- 🌐 **GPS tracking support**

### 7. Support & Troubleshooting

#### Common Issues

**Login not working:**
- Check Firebase authorized domains
- Verify environment variables
- Check browser console for errors

**Data not saving:**
- Check Firestore security rules
- Verify user authentication
- Check network connection

**Leaderboard empty:**
- Users must opt-in to appear
- Check privacy settings
- Verify Firestore permissions

#### Environment Variables Format
```bash
# In Netlify dashboard:
VITE_FIREBASE_API_KEY=AIzaSyC...
VITE_FIREBASE_PROJECT_ID=ecomiles-12345
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

### 8. Post-Deployment Checklist

- [ ] Firebase project created
- [ ] Authentication enabled (Google)
- [ ] Firestore database setup
- [ ] Security rules configured
- [ ] Environment variables added to Netlify
- [ ] Authorized domains updated
- [ ] Site deployed successfully
- [ ] Login functionality tested
- [ ] Data persistence verified
- [ ] Privacy toggle working
- [ ] Mobile responsiveness checked

🎉 **Your EcoMiles app is now live and ready for users!**

---

## 🔧 Technical Notes

- **Framework**: Vanilla JavaScript (no build step required)
- **Hosting**: Static hosting compatible (Netlify, Vercel, GitHub Pages)
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth with Google
- **No server required**: Frontend-only application