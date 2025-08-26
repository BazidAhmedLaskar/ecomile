import { db } from './db';
import { users, journeys, vehicles, drivers, type User, type InsertUser, type Journey, type InsertJourney, type Vehicle, type InsertVehicle, type Driver, type InsertDriver } from '../shared/schema';
import { eq, desc, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  
  // Journey operations
  getJourneys(userId: string, limit?: number): Promise<Journey[]>;
  createJourney(insertJourney: InsertJourney): Promise<Journey>;
  getJourneyById(id: string): Promise<Journey | undefined>;
  
  // Vehicle operations
  getVehicles(): Promise<Vehicle[]>;
  getVehicleById(id: string): Promise<Vehicle | undefined>;
  getVehicleByVehicleId(vehicleId: string): Promise<Vehicle | undefined>;
  createVehicle(insertVehicle: InsertVehicle): Promise<Vehicle>;
  updateVehicle(id: string, updates: Partial<Vehicle>): Promise<Vehicle>;
  
  // Driver operations
  getDriver(userId: string): Promise<Driver | undefined>;
  getDriverByVehicleId(vehicleId: string): Promise<Driver | undefined>;
  createDriver(insertDriver: InsertDriver): Promise<Driver>;
  updateDriver(id: string, updates: Partial<Driver>): Promise<Driver>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const newUser = { ...insertUser, id: insertUser.id || uuidv4() };
    const [user] = await db.insert(users).values(newUser).returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user;
  }

  // Journey operations
  async getJourneys(userId: string, limit: number = 50): Promise<Journey[]> {
    return await db.select()
      .from(journeys)
      .where(eq(journeys.userId, userId))
      .orderBy(desc(journeys.timestamp))
      .limit(limit);
  }

  async createJourney(insertJourney: InsertJourney): Promise<Journey> {
    const newJourney = { ...insertJourney, id: insertJourney.id || uuidv4() };
    const [journey] = await db.insert(journeys).values(newJourney).returning();
    return journey;
  }

  async getJourneyById(id: string): Promise<Journey | undefined> {
    const [journey] = await db.select().from(journeys).where(eq(journeys.id, id));
    return journey || undefined;
  }

  // Vehicle operations
  async getVehicles(): Promise<Vehicle[]> {
    return await db.select().from(vehicles).orderBy(desc(vehicles.createdAt));
  }

  async getVehicleById(id: string): Promise<Vehicle | undefined> {
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, id));
    return vehicle || undefined;
  }

  async getVehicleByVehicleId(vehicleId: string): Promise<Vehicle | undefined> {
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.vehicleId, vehicleId));
    return vehicle || undefined;
  }

  async createVehicle(insertVehicle: InsertVehicle): Promise<Vehicle> {
    const newVehicle = { ...insertVehicle, id: insertVehicle.id || uuidv4() };
    const [vehicle] = await db.insert(vehicles).values(newVehicle).returning();
    return vehicle;
  }

  async updateVehicle(id: string, updates: Partial<Vehicle>): Promise<Vehicle> {
    const [vehicle] = await db.update(vehicles).set(updates).where(eq(vehicles.id, id)).returning();
    return vehicle;
  }

  // Driver operations
  async getDriver(userId: string): Promise<Driver | undefined> {
    const [driver] = await db.select().from(drivers).where(eq(drivers.userId, userId));
    return driver || undefined;
  }

  async getDriverByVehicleId(vehicleId: string): Promise<Driver | undefined> {
    const [driver] = await db.select().from(drivers).where(eq(drivers.vehicleId, vehicleId));
    return driver || undefined;
  }

  async createDriver(insertDriver: InsertDriver): Promise<Driver> {
    const newDriver = { ...insertDriver, id: insertDriver.id || uuidv4() };
    const [driver] = await db.insert(drivers).values(newDriver).returning();
    return driver;
  }

  async updateDriver(id: string, updates: Partial<Driver>): Promise<Driver> {
    const [driver] = await db.update(drivers).set(updates).where(eq(drivers.id, id)).returning();
    return driver;
  }
}

export const storage = new DatabaseStorage();