"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storage = exports.DatabaseStorage = void 0;
const db_1 = require("./db");
const schema_1 = require("../shared/schema");
const drizzle_orm_1 = require("drizzle-orm");
const uuid_1 = require("uuid");
class DatabaseStorage {
    // User operations
    async getUser(id) {
        const [user] = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, id));
        return user || undefined;
    }
    async getUserByEmail(email) {
        const [user] = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.email, email));
        return user || undefined;
    }
    async createUser(insertUser) {
        const newUser = { ...insertUser, id: insertUser.id || (0, uuid_1.v4)() };
        const [user] = await db_1.db.insert(schema_1.users).values(newUser).returning();
        return user;
    }
    async updateUser(id, updates) {
        const [user] = await db_1.db.update(schema_1.users).set(updates).where((0, drizzle_orm_1.eq)(schema_1.users.id, id)).returning();
        return user;
    }
    // Journey operations
    async getJourneys(userId, limit = 50) {
        return await db_1.db.select()
            .from(schema_1.journeys)
            .where((0, drizzle_orm_1.eq)(schema_1.journeys.userId, userId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.journeys.timestamp))
            .limit(limit);
    }
    async createJourney(insertJourney) {
        const newJourney = { ...insertJourney, id: insertJourney.id || (0, uuid_1.v4)() };
        const [journey] = await db_1.db.insert(schema_1.journeys).values(newJourney).returning();
        return journey;
    }
    async getJourneyById(id) {
        const [journey] = await db_1.db.select().from(schema_1.journeys).where((0, drizzle_orm_1.eq)(schema_1.journeys.id, id));
        return journey || undefined;
    }
    // Vehicle operations
    async getVehicles() {
        return await db_1.db.select().from(schema_1.vehicles).orderBy((0, drizzle_orm_1.desc)(schema_1.vehicles.createdAt));
    }
    async getVehicleById(id) {
        const [vehicle] = await db_1.db.select().from(schema_1.vehicles).where((0, drizzle_orm_1.eq)(schema_1.vehicles.id, id));
        return vehicle || undefined;
    }
    async getVehicleByVehicleId(vehicleId) {
        const [vehicle] = await db_1.db.select().from(schema_1.vehicles).where((0, drizzle_orm_1.eq)(schema_1.vehicles.vehicleId, vehicleId));
        return vehicle || undefined;
    }
    async createVehicle(insertVehicle) {
        const newVehicle = { ...insertVehicle, id: insertVehicle.id || (0, uuid_1.v4)() };
        const [vehicle] = await db_1.db.insert(schema_1.vehicles).values(newVehicle).returning();
        return vehicle;
    }
    async updateVehicle(id, updates) {
        const [vehicle] = await db_1.db.update(schema_1.vehicles).set(updates).where((0, drizzle_orm_1.eq)(schema_1.vehicles.id, id)).returning();
        return vehicle;
    }
    // Driver operations
    async getDriver(userId) {
        const [driver] = await db_1.db.select().from(schema_1.drivers).where((0, drizzle_orm_1.eq)(schema_1.drivers.userId, userId));
        return driver || undefined;
    }
    async getDriverByVehicleId(vehicleId) {
        const [driver] = await db_1.db.select().from(schema_1.drivers).where((0, drizzle_orm_1.eq)(schema_1.drivers.vehicleId, vehicleId));
        return driver || undefined;
    }
    async createDriver(insertDriver) {
        const newDriver = { ...insertDriver, id: insertDriver.id || (0, uuid_1.v4)() };
        const [driver] = await db_1.db.insert(schema_1.drivers).values(newDriver).returning();
        return driver;
    }
    async updateDriver(id, updates) {
        const [driver] = await db_1.db.update(schema_1.drivers).set(updates).where((0, drizzle_orm_1.eq)(schema_1.drivers.id, id)).returning();
        return driver;
    }
}
exports.DatabaseStorage = DatabaseStorage;
exports.storage = new DatabaseStorage();
//# sourceMappingURL=storage.js.map