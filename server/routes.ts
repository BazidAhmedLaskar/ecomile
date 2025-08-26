import express from 'express';
import { storage } from './storage';
import { insertUserSchema, insertJourneySchema, insertVehicleSchema, insertDriverSchema } from '../shared/schema';

const router = express.Router();

// User routes
router.get('/api/users/:id', async (req, res) => {
  try {
    const user = await storage.getUser(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/api/users', async (req, res) => {
  try {
    const userData = insertUserSchema.parse(req.body);
    const user = await storage.createUser(userData);
    res.status(201).json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(400).json({ error: 'Invalid user data' });
  }
});

router.put('/api/users/:id', async (req, res) => {
  try {
    const user = await storage.updateUser(req.params.id, req.body);
    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Journey routes
router.get('/api/journeys/:userId', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const journeys = await storage.getJourneys(req.params.userId, limit);
    res.json(journeys);
  } catch (error) {
    console.error('Error fetching journeys:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/api/journeys', async (req, res) => {
  try {
    const journeyData = insertJourneySchema.parse(req.body);
    const journey = await storage.createJourney(journeyData);
    res.status(201).json(journey);
  } catch (error) {
    console.error('Error creating journey:', error);
    res.status(400).json({ error: 'Invalid journey data' });
  }
});

// Vehicle routes
router.get('/api/vehicles', async (req, res) => {
  try {
    const vehicles = await storage.getVehicles();
    res.json(vehicles);
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/api/vehicles/:vehicleId', async (req, res) => {
  try {
    const vehicle = await storage.getVehicleByVehicleId(req.params.vehicleId);
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    res.json(vehicle);
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/api/vehicles', async (req, res) => {
  try {
    const vehicleData = insertVehicleSchema.parse(req.body);
    const vehicle = await storage.createVehicle(vehicleData);
    res.status(201).json(vehicle);
  } catch (error) {
    console.error('Error creating vehicle:', error);
    res.status(400).json({ error: 'Invalid vehicle data' });
  }
});

router.put('/api/vehicles/:id', async (req, res) => {
  try {
    const vehicle = await storage.updateVehicle(req.params.id, req.body);
    res.json(vehicle);
  } catch (error) {
    console.error('Error updating vehicle:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Driver routes
router.get('/api/drivers/:userId', async (req, res) => {
  try {
    const driver = await storage.getDriver(req.params.userId);
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }
    res.json(driver);
  } catch (error) {
    console.error('Error fetching driver:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/api/drivers', async (req, res) => {
  try {
    const driverData = insertDriverSchema.parse(req.body);
    const driver = await storage.createDriver(driverData);
    res.status(201).json(driver);
  } catch (error) {
    console.error('Error creating driver:', error);
    res.status(400).json({ error: 'Invalid driver data' });
  }
});

router.put('/api/drivers/:id', async (req, res) => {
  try {
    const driver = await storage.updateDriver(req.params.id, req.body);
    res.json(driver);
  } catch (error) {
    console.error('Error updating driver:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;