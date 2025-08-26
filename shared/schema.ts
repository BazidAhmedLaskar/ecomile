import { pgTable, text, integer, boolean, timestamp, decimal, json } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

// Users table for both passengers and drivers
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  photoURL: text('photo_url'),
  userType: text('user_type').notNull().default('user'), // 'user' or 'driver'
  points: integer('points').notNull().default(0),
  totalDistance: decimal('total_distance', { precision: 10, scale: 2 }).notNull().default('0'),
  roadTaxSaved: decimal('road_tax_saved', { precision: 10, scale: 2 }).notNull().default('0'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  isActive: boolean('is_active').notNull().default(true)
});

// Journeys table for tracking all trips
export const journeys = pgTable('journeys', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  mode: text('mode').notNull(), // walking, cycling, bus, car
  distance: decimal('distance', { precision: 10, scale: 2 }).notNull(),
  points: integer('points').notNull(),
  co2Saved: decimal('co2_saved', { precision: 10, scale: 2 }).notNull(),
  notes: text('notes'),
  type: text('type').notNull(), // manual, gps, qr_vehicle
  startLocation: json('start_location'), // {lat, lon, address}
  endLocation: json('end_location'), // {lat, lon, address}
  vehicleId: text('vehicle_id'), // for QR scanned journeys
  duration: integer('duration'), // in milliseconds
  averageSpeed: decimal('average_speed', { precision: 10, scale: 2 }),
  positions: json('positions'), // array of GPS coordinates
  timestamp: timestamp('timestamp').notNull().defaultNow()
});

// Vehicles table for public transport
export const vehicles = pgTable('vehicles', {
  id: text('id').primaryKey(),
  vehicleId: text('vehicle_id').notNull().unique(),
  route: text('route').notNull(),
  type: text('type').notNull(), // bus, train, metro, van
  capacity: integer('capacity').notNull(),
  status: text('status').notNull().default('inactive'), // active, inactive, maintenance
  driverId: text('driver_id').notNull(),
  passengers: json('passengers').notNull().default([]), // array of user IDs
  currentLocation: json('current_location'), // {lat, lon, timestamp}
  speed: decimal('speed', { precision: 10, scale: 2 }).notNull().default('0'),
  lastUpdated: timestamp('last_updated').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

// Driver details table
export const drivers = pgTable('drivers', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().unique(),
  vehicleId: text('vehicle_id').notNull(),
  licenseNumber: text('license_number').notNull(),
  phoneNumber: text('phone_number').notNull(),
  emergencyContact: text('emergency_contact'),
  experience: integer('experience'), // years of experience
  isVerified: boolean('is_verified').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

// Create insert schemas with validation
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email(),
  userType: z.enum(['user', 'driver']),
  points: z.number().min(0),
  totalDistance: z.string().regex(/^\d+(\.\d{1,2})?$/),
  roadTaxSaved: z.string().regex(/^\d+(\.\d{1,2})?$/)
});

export const insertJourneySchema = createInsertSchema(journeys, {
  mode: z.enum(['walking', 'cycling', 'bus', 'car', 'train', 'metro']),
  distance: z.string().regex(/^\d+(\.\d{1,2})?$/),
  points: z.number().min(0),
  type: z.enum(['manual', 'gps', 'qr_vehicle'])
});

export const insertVehicleSchema = createInsertSchema(vehicles, {
  type: z.enum(['bus', 'train', 'metro', 'van']),
  capacity: z.number().min(1).max(100),
  status: z.enum(['active', 'inactive', 'maintenance'])
});

export const insertDriverSchema = createInsertSchema(drivers, {
  licenseNumber: z.string().min(5),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/),
  experience: z.number().min(0).max(50)
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Journey = typeof journeys.$inferSelect;
export type InsertJourney = z.infer<typeof insertJourneySchema>;
export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type Driver = typeof drivers.$inferSelect;
export type InsertDriver = z.infer<typeof insertDriverSchema>;