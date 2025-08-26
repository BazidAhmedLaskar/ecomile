"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const storage_1 = require("./storage");
const schema_1 = require("../shared/schema");
const router = express_1.default.Router();
// User routes
router.get('/api/users/:id', async (req, res) => {
    try {
        const user = await storage_1.storage.getUser(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    }
    catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/api/users', async (req, res) => {
    try {
        const userData = schema_1.insertUserSchema.parse(req.body);
        const user = await storage_1.storage.createUser(userData);
        res.status(201).json(user);
    }
    catch (error) {
        console.error('Error creating user:', error);
        res.status(400).json({ error: 'Invalid user data' });
    }
});
router.put('/api/users/:id', async (req, res) => {
    try {
        const user = await storage_1.storage.updateUser(req.params.id, req.body);
        res.json(user);
    }
    catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Journey routes
router.get('/api/journeys/:userId', async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 50;
        const journeys = await storage_1.storage.getJourneys(req.params.userId, limit);
        res.json(journeys);
    }
    catch (error) {
        console.error('Error fetching journeys:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/api/journeys', async (req, res) => {
    try {
        const journeyData = schema_1.insertJourneySchema.parse(req.body);
        const journey = await storage_1.storage.createJourney(journeyData);
        res.status(201).json(journey);
    }
    catch (error) {
        console.error('Error creating journey:', error);
        res.status(400).json({ error: 'Invalid journey data' });
    }
});
// Vehicle routes
router.get('/api/vehicles', async (req, res) => {
    try {
        const vehicles = await storage_1.storage.getVehicles();
        res.json(vehicles);
    }
    catch (error) {
        console.error('Error fetching vehicles:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.get('/api/vehicles/:vehicleId', async (req, res) => {
    try {
        const vehicle = await storage_1.storage.getVehicleByVehicleId(req.params.vehicleId);
        if (!vehicle) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }
        res.json(vehicle);
    }
    catch (error) {
        console.error('Error fetching vehicle:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/api/vehicles', async (req, res) => {
    try {
        const vehicleData = schema_1.insertVehicleSchema.parse(req.body);
        const vehicle = await storage_1.storage.createVehicle(vehicleData);
        res.status(201).json(vehicle);
    }
    catch (error) {
        console.error('Error creating vehicle:', error);
        res.status(400).json({ error: 'Invalid vehicle data' });
    }
});
router.put('/api/vehicles/:id', async (req, res) => {
    try {
        const vehicle = await storage_1.storage.updateVehicle(req.params.id, req.body);
        res.json(vehicle);
    }
    catch (error) {
        console.error('Error updating vehicle:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Driver routes
router.get('/api/drivers/:userId', async (req, res) => {
    try {
        const driver = await storage_1.storage.getDriver(req.params.userId);
        if (!driver) {
            return res.status(404).json({ error: 'Driver not found' });
        }
        res.json(driver);
    }
    catch (error) {
        console.error('Error fetching driver:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
router.post('/api/drivers', async (req, res) => {
    try {
        const driverData = schema_1.insertDriverSchema.parse(req.body);
        const driver = await storage_1.storage.createDriver(driverData);
        res.status(201).json(driver);
    }
    catch (error) {
        console.error('Error creating driver:', error);
        res.status(400).json({ error: 'Invalid driver data' });
    }
});
router.put('/api/drivers/:id', async (req, res) => {
    try {
        const driver = await storage_1.storage.updateDriver(req.params.id, req.body);
        res.json(driver);
    }
    catch (error) {
        console.error('Error updating driver:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=routes.js.map