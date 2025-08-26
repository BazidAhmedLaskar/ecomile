import { type User, type InsertUser, type Journey, type InsertJourney, type Vehicle, type InsertVehicle, type Driver, type InsertDriver } from '../shared/schema';
export interface IStorage {
    getUser(id: string): Promise<User | undefined>;
    getUserByEmail(email: string): Promise<User | undefined>;
    createUser(insertUser: InsertUser): Promise<User>;
    updateUser(id: string, updates: Partial<User>): Promise<User>;
    getJourneys(userId: string, limit?: number): Promise<Journey[]>;
    createJourney(insertJourney: InsertJourney): Promise<Journey>;
    getJourneyById(id: string): Promise<Journey | undefined>;
    getVehicles(): Promise<Vehicle[]>;
    getVehicleById(id: string): Promise<Vehicle | undefined>;
    getVehicleByVehicleId(vehicleId: string): Promise<Vehicle | undefined>;
    createVehicle(insertVehicle: InsertVehicle): Promise<Vehicle>;
    updateVehicle(id: string, updates: Partial<Vehicle>): Promise<Vehicle>;
    getDriver(userId: string): Promise<Driver | undefined>;
    getDriverByVehicleId(vehicleId: string): Promise<Driver | undefined>;
    createDriver(insertDriver: InsertDriver): Promise<Driver>;
    updateDriver(id: string, updates: Partial<Driver>): Promise<Driver>;
}
export declare class DatabaseStorage implements IStorage {
    getUser(id: string): Promise<User | undefined>;
    getUserByEmail(email: string): Promise<User | undefined>;
    createUser(insertUser: InsertUser): Promise<User>;
    updateUser(id: string, updates: Partial<User>): Promise<User>;
    getJourneys(userId: string, limit?: number): Promise<Journey[]>;
    createJourney(insertJourney: InsertJourney): Promise<Journey>;
    getJourneyById(id: string): Promise<Journey | undefined>;
    getVehicles(): Promise<Vehicle[]>;
    getVehicleById(id: string): Promise<Vehicle | undefined>;
    getVehicleByVehicleId(vehicleId: string): Promise<Vehicle | undefined>;
    createVehicle(insertVehicle: InsertVehicle): Promise<Vehicle>;
    updateVehicle(id: string, updates: Partial<Vehicle>): Promise<Vehicle>;
    getDriver(userId: string): Promise<Driver | undefined>;
    getDriverByVehicleId(vehicleId: string): Promise<Driver | undefined>;
    createDriver(insertDriver: InsertDriver): Promise<Driver>;
    updateDriver(id: string, updates: Partial<Driver>): Promise<Driver>;
}
export declare const storage: DatabaseStorage;
//# sourceMappingURL=storage.d.ts.map