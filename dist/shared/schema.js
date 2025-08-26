"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertDriverSchema = exports.insertVehicleSchema = exports.insertJourneySchema = exports.insertUserSchema = exports.drivers = exports.vehicles = exports.journeys = exports.users = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_zod_1 = require("drizzle-zod");
const zod_1 = require("zod");
// Users table for both passengers and drivers
exports.users = (0, pg_core_1.pgTable)('users', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    name: (0, pg_core_1.text)('name').notNull(),
    email: (0, pg_core_1.text)('email').notNull().unique(),
    photoURL: (0, pg_core_1.text)('photo_url'),
    userType: (0, pg_core_1.text)('user_type').notNull().default('user'), // 'user' or 'driver'
    points: (0, pg_core_1.integer)('points').notNull().default(0),
    totalDistance: (0, pg_core_1.decimal)('total_distance', { precision: 10, scale: 2 }).notNull().default('0'),
    roadTaxSaved: (0, pg_core_1.decimal)('road_tax_saved', { precision: 10, scale: 2 }).notNull().default('0'),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow(),
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true)
});
// Journeys table for tracking all trips
exports.journeys = (0, pg_core_1.pgTable)('journeys', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    userId: (0, pg_core_1.text)('user_id').notNull(),
    mode: (0, pg_core_1.text)('mode').notNull(), // walking, cycling, bus, car
    distance: (0, pg_core_1.decimal)('distance', { precision: 10, scale: 2 }).notNull(),
    points: (0, pg_core_1.integer)('points').notNull(),
    co2Saved: (0, pg_core_1.decimal)('co2_saved', { precision: 10, scale: 2 }).notNull(),
    notes: (0, pg_core_1.text)('notes'),
    type: (0, pg_core_1.text)('type').notNull(), // manual, gps, qr_vehicle
    startLocation: (0, pg_core_1.json)('start_location'), // {lat, lon, address}
    endLocation: (0, pg_core_1.json)('end_location'), // {lat, lon, address}
    vehicleId: (0, pg_core_1.text)('vehicle_id'), // for QR scanned journeys
    duration: (0, pg_core_1.integer)('duration'), // in milliseconds
    averageSpeed: (0, pg_core_1.decimal)('average_speed', { precision: 10, scale: 2 }),
    positions: (0, pg_core_1.json)('positions'), // array of GPS coordinates
    timestamp: (0, pg_core_1.timestamp)('timestamp').notNull().defaultNow()
});
// Vehicles table for public transport
exports.vehicles = (0, pg_core_1.pgTable)('vehicles', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    vehicleId: (0, pg_core_1.text)('vehicle_id').notNull().unique(),
    route: (0, pg_core_1.text)('route').notNull(),
    type: (0, pg_core_1.text)('type').notNull(), // bus, train, metro, van
    capacity: (0, pg_core_1.integer)('capacity').notNull(),
    status: (0, pg_core_1.text)('status').notNull().default('inactive'), // active, inactive, maintenance
    driverId: (0, pg_core_1.text)('driver_id').notNull(),
    passengers: (0, pg_core_1.json)('passengers').notNull().default([]), // array of user IDs
    currentLocation: (0, pg_core_1.json)('current_location'), // {lat, lon, timestamp}
    speed: (0, pg_core_1.decimal)('speed', { precision: 10, scale: 2 }).notNull().default('0'),
    lastUpdated: (0, pg_core_1.timestamp)('last_updated').notNull().defaultNow(),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow()
});
// Driver details table
exports.drivers = (0, pg_core_1.pgTable)('drivers', {
    id: (0, pg_core_1.text)('id').primaryKey(),
    userId: (0, pg_core_1.text)('user_id').notNull().unique(),
    vehicleId: (0, pg_core_1.text)('vehicle_id').notNull(),
    licenseNumber: (0, pg_core_1.text)('license_number').notNull(),
    phoneNumber: (0, pg_core_1.text)('phone_number').notNull(),
    emergencyContact: (0, pg_core_1.text)('emergency_contact'),
    experience: (0, pg_core_1.integer)('experience'), // years of experience
    isVerified: (0, pg_core_1.boolean)('is_verified').notNull().default(false),
    createdAt: (0, pg_core_1.timestamp)('created_at').notNull().defaultNow()
});
// Create insert schemas with validation
exports.insertUserSchema = (0, drizzle_zod_1.createInsertSchema)(exports.users, {
    email: zod_1.z.string().email(),
    userType: zod_1.z.enum(['user', 'driver']),
    points: zod_1.z.number().min(0),
    totalDistance: zod_1.z.string().regex(/^\d+(\.\d{1,2})?$/),
    roadTaxSaved: zod_1.z.string().regex(/^\d+(\.\d{1,2})?$/)
});
exports.insertJourneySchema = (0, drizzle_zod_1.createInsertSchema)(exports.journeys, {
    mode: zod_1.z.enum(['walking', 'cycling', 'bus', 'car', 'train', 'metro']),
    distance: zod_1.z.string().regex(/^\d+(\.\d{1,2})?$/),
    points: zod_1.z.number().min(0),
    type: zod_1.z.enum(['manual', 'gps', 'qr_vehicle'])
});
exports.insertVehicleSchema = (0, drizzle_zod_1.createInsertSchema)(exports.vehicles, {
    type: zod_1.z.enum(['bus', 'train', 'metro', 'van']),
    capacity: zod_1.z.number().min(1).max(100),
    status: zod_1.z.enum(['active', 'inactive', 'maintenance'])
});
exports.insertDriverSchema = (0, drizzle_zod_1.createInsertSchema)(exports.drivers, {
    licenseNumber: zod_1.z.string().min(5),
    phoneNumber: zod_1.z.string().regex(/^\+?[1-9]\d{1,14}$/),
    experience: zod_1.z.number().min(0).max(50)
});
//# sourceMappingURL=schema.js.map