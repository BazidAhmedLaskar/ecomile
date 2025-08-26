const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Firebase config from environment variables
const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
};

// Middleware to inject Firebase config into HTML pages
app.use((req, res, next) => {
    if (req.path.endsWith('.html') || req.path === '/') {
        const filePath = req.path === '/' ? 'index.html' : req.path.substring(1);
        
        fs.readFile(path.join(__dirname, filePath), 'utf8', (err, data) => {
            if (err) {
                return next();
            }
            
            // Inject Firebase config before the closing head tag
            const configScript = `
                <script>
                    window.FIREBASE_CONFIG = ${JSON.stringify(firebaseConfig)};
                </script>
            `;
            
            const modifiedHtml = data.replace('</head>', `    ${configScript}\n</head>`);
            
            res.type('html').send(modifiedHtml);
        });
    } else {
        next();
    }
});

// Middleware for parsing JSON
app.use(express.json());

// In-memory storage for development (will be replaced with PostgreSQL later)
const users = new Map();
const journeys = new Map();
const vehicles = new Map();
const drivers = new Map();

// User API routes
app.get('/api/users/:id', (req, res) => {
    const user = users.get(req.params.id);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
});

app.post('/api/users', (req, res) => {
    const user = { ...req.body, id: req.body.id || Date.now().toString() };
    users.set(user.id, user);
    res.status(201).json(user);
});

app.put('/api/users/:id', (req, res) => {
    const user = users.get(req.params.id);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    const updatedUser = { ...user, ...req.body };
    users.set(req.params.id, updatedUser);
    res.json(updatedUser);
});

// Journey API routes
app.get('/api/journeys/:userId', (req, res) => {
    const userJourneys = Array.from(journeys.values())
        .filter(journey => journey.userId === req.params.userId)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    res.json(userJourneys);
});

app.post('/api/journeys', (req, res) => {
    const journey = { ...req.body, id: Date.now().toString(), timestamp: new Date().toISOString() };
    journeys.set(journey.id, journey);
    res.status(201).json(journey);
});

// Vehicle API routes
app.get('/api/vehicles', (req, res) => {
    res.json(Array.from(vehicles.values()));
});

app.get('/api/vehicles/:vehicleId', (req, res) => {
    const vehicle = Array.from(vehicles.values()).find(v => v.vehicleId === req.params.vehicleId);
    if (!vehicle) {
        return res.status(404).json({ error: 'Vehicle not found' });
    }
    res.json(vehicle);
});

app.post('/api/vehicles', (req, res) => {
    const vehicle = { ...req.body, id: Date.now().toString(), createdAt: new Date().toISOString() };
    vehicles.set(vehicle.id, vehicle);
    res.status(201).json(vehicle);
});

app.put('/api/vehicles/:id', (req, res) => {
    const vehicle = vehicles.get(req.params.id);
    if (!vehicle) {
        return res.status(404).json({ error: 'Vehicle not found' });
    }
    const updatedVehicle = { ...vehicle, ...req.body, lastUpdated: new Date().toISOString() };
    vehicles.set(req.params.id, updatedVehicle);
    res.json(updatedVehicle);
});

// Driver API routes
app.get('/api/drivers/:userId', (req, res) => {
    const driver = Array.from(drivers.values()).find(d => d.userId === req.params.userId);
    if (!driver) {
        return res.status(404).json({ error: 'Driver not found' });
    }
    res.json(driver);
});

app.post('/api/drivers', (req, res) => {
    const driver = { ...req.body, id: Date.now().toString(), createdAt: new Date().toISOString() };
    drivers.set(driver.id, driver);
    res.status(201).json(driver);
});

app.put('/api/drivers/:id', (req, res) => {
    const driver = drivers.get(req.params.id);
    if (!driver) {
        return res.status(404).json({ error: 'Driver not found' });
    }
    const updatedDriver = { ...driver, ...req.body };
    drivers.set(req.params.id, updatedDriver);
    res.json(updatedDriver);
});

// Serve static files
app.use(express.static(__dirname));

// Handle 404s by serving 404.html
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, '404.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌱 EcoMiles server running on http://0.0.0.0:${PORT}`);
    console.log(`📱 Access the app at: http://localhost:${PORT}`);
    
    if (firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId) {
        console.log('✅ Firebase configuration loaded successfully');
    } else {
        console.log('⚠️  Firebase configuration incomplete - check environment variables');
    }
    
    console.log('🔗 API endpoints available:');
    console.log('   - GET/POST /api/users/:id');
    console.log('   - GET/POST /api/journeys/:userId'); 
    console.log('   - GET/POST /api/vehicles');
    console.log('   - GET/POST /api/drivers/:userId');
});