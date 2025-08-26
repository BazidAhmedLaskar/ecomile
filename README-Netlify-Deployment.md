# EcoMiles - Netlify Deployment Guide

## About
EcoMiles is now configured as a static web application using Firebase for backend services, ready for Netlify deployment.

## Project Structure
```
/
├── index.html          # Landing page
├── login.html          # Authentication page
├── dashboard.html      # User dashboard
├── journey.html        # Add journey page
├── leaderboard.html    # Leaderboard
├── profile.html        # User profile
├── css/styles.css      # Styles
├── js/                 # JavaScript files
│   ├── firebase-config.js
│   ├── dashboard.js
│   ├── login.js
│   └── ...
├── netlify.toml        # Netlify configuration
└── _headers           # Security headers

## Environment Variables for Netlify

Set these in your Netlify dashboard under Site Settings > Environment Variables:

- `VITE_FIREBASE_API_KEY` - Your Firebase API key
- `VITE_FIREBASE_PROJECT_ID` - Your Firebase project ID  
- `VITE_FIREBASE_APP_ID` - Your Firebase app ID

## Firebase Setup Required

1. Create a Firebase project
2. Enable Authentication with Google provider
3. Create Firestore database
4. Add your Netlify domain to authorized domains

## Deployment Steps

1. Connect your GitHub repository to Netlify
2. Set environment variables in Netlify dashboard
3. Deploy - Netlify will automatically build and serve your static files

## Features Included

- ✅ Firebase Authentication (Google)
- ✅ Firestore Database for data storage
- ✅ Responsive design
- ✅ Journey tracking
- ✅ Points system
- ✅ Leaderboard
- ✅ Real-time map integration
- ✅ QR code scanning for vehicles

## File Changes Made

- Removed TypeScript server code (not needed for static deployment)
- Updated all HTML files with proper Firebase configuration
- Added environment variable injection for Netlify
- Created netlify.toml configuration
- Added security headers