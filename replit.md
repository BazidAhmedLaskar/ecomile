# EcoMiles - Sustainability Tracking Application

## Overview

EcoMiles is a frontend-only web application that tracks and gamifies sustainable transportation choices. The application helps users monitor their eco-friendly travel habits, earn points for sustainable transportation modes, and compete with others through a leaderboard system. The app focuses on encouraging walking, cycling, public transport, and carpooling while providing tangible benefits like road tax deductions.

## System Architecture

### Frontend Architecture
- **Technology Stack**: Pure HTML, CSS, and JavaScript (Vanilla JS)
- **Architecture Pattern**: Multi-page application with static routing
- **Data Persistence**: Firebase Firestore with localStorage backup
- **External Services**: Firebase for authentication and data storage

### Authentication Strategy
- **Provider**: Firebase Authentication
- **Method**: Google Sign-in popup only
- **Session Management**: User data stored in localStorage after successful login
- **Flow**: Login → Store user data → Redirect to dashboard

## Key Components

### Core Pages
1. **Landing Page** (`index.html`) - Application introduction and entry point with feature overview
2. **Authentication** (`login.html`) - Google login integration with Firebase Auth
3. **Dashboard** (`dashboard.html`) - Main user interface with metrics, charts, and recent journeys
4. **Journey Tracking** (`journey.html`) - Manual entry and GPS-based trip logging with real-time tracking
5. **Real-time Map** (`realtime-map.html`) - Live GPS tracking with speed verification and route visualization
6. **QR Scanner** (`qr-scanner.html`) - QR code scanning for public transport check-in with passenger tracking
7. **Driver Dashboard** (`driver-dashboard.html`) - Vehicle management interface for drivers with real-time passenger monitoring
8. **Leaderboard** (`leaderboard.html`) - User ranking system with top 3 podium and full table
9. **Rewards** (`rewards.html`) - Achievement badges and road tax deduction calculator
10. **Profile** (`profile.html`) - User account management with journey history and data export
11. **Setup Demo Data** (`setup-demo-data.html`) - Driver account creation and vehicle configuration
12. **Information Pages** (`how-it-works.html`, `contact.html`, `404.html`) - Support content and error handling

### JavaScript Modules
- **Firebase Configuration** (`js/firebase-config.js`) - Authentication and Firestore setup with error handling
- **Login Handler** (`js/login.js`) - Authentication flow management with popup handling
- **Dashboard Controller** (`js/dashboard.js`) - Metrics calculation, Chart.js integration, and recent journeys
- **Journey Controller** (`js/journey.js`) - Trip logging with GPS tracking using Haversine formula
- **QR Scanner** (`js/qr-scanner.js`) - QR code scanning, vehicle check-in, and passenger management
- **Driver Dashboard** (`js/driver-dashboard.js`) - Vehicle status monitoring, passenger tracking, and QR code generation
- **Real-time Map** (`js/realtime-map.js`) - Live GPS tracking with speed verification and route visualization

### Styling
- **CSS Framework**: Custom CSS (`css/styles.css`) with comprehensive component library
- **Responsive Design**: Mobile-first approach with flexible grid layouts
- **UI Components**: Native HTML elements with modern styling and hover effects

## Data Flow

### User Journey Flow
1. User accesses landing page with feature overview
2. Navigates to login page for Google authentication via Firebase
3. Successful login stores user data in localStorage and initializes Firestore document
4. Dashboard displays real-time metrics from Firestore with Chart.js visualization
5. Users can log journeys manually or via GPS tracking with live distance calculation
6. Points system awards EcoPoints based on transportation mode multipliers

### Data Storage Strategy
- **Primary**: Firebase Firestore for persistent data storage
- **Backup**: localStorage for offline functionality and session management
- **Data Synchronization**: Real-time sync with Firestore, fallback to localStorage

### Metrics Calculation
- **EcoPoints**: Walking (10 pts/km), Cycling (8 pts/km), Public Transport (5 pts/km), Carpool (3 pts/km)
- **CO2 Savings**: 1 km = 0.21 kg CO2 saved calculation
- **Road Tax Deduction**: ₹0.1 per EcoPoint earned (₹1 per 10 points)
- **Analytics**: Chart.js for weekly EcoPoints trend visualization

### Badge System
- **Eco Starter**: 100 points (₹10 tax deduction)
- **Green Commuter**: 250 points (₹25 tax deduction)
- **Eco Warrior**: 500 points (₹50 tax deduction)
- **Sustainability Champion**: 750 points (₹75 tax deduction)
- **Green Hero**: 1000 points (₹100 tax deduction)
- **Planet Guardian**: 1500 points (₹150 tax deduction)
- **Eco Legend**: 2000 points (₹200 tax deduction)

## External Dependencies

### Firebase Services
- **Firebase App** (v10.5.2) - Core Firebase functionality
- **Firebase Auth** (v10.5.2) - Google authentication provider with popup flow
- **Firebase Firestore** (v10.5.2) - Real-time document database

### Visualization Libraries
- **Chart.js** (CDN) - Weekly EcoPoints line chart with gradient fill

### Browser APIs
- **Geolocation API** - GPS tracking with high accuracy for journey measurement
- **localStorage API** - Client-side session and backup data persistence

## Environment Configuration

### Firebase Setup Required
- **VITE_FIREBASE_API_KEY** - Firebase project API key
- **VITE_FIREBASE_PROJECT_ID** - Firebase project identifier
- **VITE_FIREBASE_APP_ID** - Firebase application ID

### User Setup Instructions
1. Create Firebase project at console.firebase.google.com
2. Enable Google Authentication in Authentication section
3. Add authorized domains for development and production
4. Configure Firestore database with security rules
5. Obtain API keys from project settings

## Data Model

### Users Collection (`/users/{uid}`)
```
{
  name: string,
  email: string,
  photoURL: string,
  points: number,
  totalDistance: number,
  roadTaxSaved: number,
  createdAt: timestamp
}
```

### Journeys Collection (`/journeys/{docId}`)
```
{
  userId: string,
  mode: string,
  distance: number,
  points: number,
  notes: string,
  type: 'manual' | 'gps',
  startLocation: {lat, lon} | null,
  endLocation: {lat, lon} | null,
  timestamp: timestamp
}
```

## Deployment Strategy

### Hosting Requirements
- **Type**: Static web hosting (Netlify, Vercel, GitHub Pages)
- **Build Process**: No build step required (vanilla HTML/CSS/JS)
- **Domain**: Custom domain support with Firebase authorized domains configuration

### Browser Compatibility
- **Target**: Modern browsers with ES6+ support and Geolocation API
- **Progressive Enhancement**: Graceful degradation for GPS-unsupported devices
- **Mobile Support**: Touch-friendly responsive design

## Changelog

- July 07, 2025: Converted from full-stack to frontend-only vanilla JS application with Firebase backend
- July 07, 2025: Implemented complete page structure with navigation and responsive design
- July 07, 2025: Added GPS tracking with Haversine distance calculation
- July 07, 2025: Integrated Chart.js for weekly progress visualization
- July 07, 2025: Created comprehensive badge system with tax deduction rewards
- July 07, 2025: Implemented profile management with data export and journey history
- July 08, 2025: Added QR code scanning system for public transport check-in and passenger tracking
- July 08, 2025: Implemented driver dashboard with real-time passenger monitoring and vehicle management
- July 08, 2025: Created real-time map tracking with speed verification and route visualization
- July 08, 2025: Integrated vehicle-passenger authentication system with GPS verification

## User Preferences

Preferred communication style: Simple, everyday language.