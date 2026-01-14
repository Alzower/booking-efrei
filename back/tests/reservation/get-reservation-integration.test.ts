import { vi, describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from "vitest";
import prisma from "../../db/prisma.ts";
import jwt from "jsonwebtoken";
import {
  getReservationsByUser,
  getReservationAfterDate,
  getAllReservationsByRoomId,
  getAllReservations,
} from "../../controller/reservation/get-reservation.ts";

// Helper to check if database is available
async function isDatabaseAvailable(): Promise<boolean> {
  try {
    await new Promise((resolve) => setTimeout(resolve, 100));
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error("Database connection error:", error);
    return false;
  }
}

// Helper to create test room
async function createTestRoom(
  name: string = "Test Room",
  capacity: number = 10,
  equipment: string[] = []
) {
  return await prisma.room.create({
    data: {
      name,
      capacity,
      equipment,
    },
  });
}

// Helper to create test user
async function createTestUser(email: string) {
  const bcrypt = await import("bcrypt");
  const hashedPassword = await bcrypt.default.hash("TestPass123!", 10);

  try {
    await prisma.user.delete({
      where: { email },
    }).catch(() => {});
  } catch (error) {
    // User doesn't exist, continue
  }

  return await prisma.user.create({
    data: {
      email,
      name: "Test User",
      password: hashedPassword,
      role: "USER",
    },
  });
}

// Helper to create admin user
async function createAdminUser(email: string) {
  const bcrypt = await import("bcrypt");
  const hashedPassword = await bcrypt.default.hash("TestPass123!", 10);

  try {
    await prisma.user.delete({
      where: { email },
    }).catch(() => {});
  } catch (error) {
    // User doesn't exist, continue
  }

  return await prisma.user.create({
    data: {
      email,
      name: "Admin User",
      password: hashedPassword,
      role: "ADMIN",
    },
  });
}

// Helper to create reservation
async function createReservation(roomId: string, userId: string, startTime: Date, endTime: Date) {
  return await prisma.reservation.create({
    data: {
      roomId,
      userId,
      startTime,
      endTime,
      status: "confirmed",
    },
  });
}

// Helper to generate JWT token
function generateToken(userId: string, email: string, secret: string = "test-secret-key"): string {
  return jwt.sign({ id: userId, email }, secret, { expiresIn: "7d" });
}

describe("Get Reservation Integration Tests", () => {
  const jwtSecret = "test-secret-key-integration";
  let testUser: any;
  let adminUser: any;
  let testRoom: any;
  let otherRoom: any;
  let databaseAvailable = true;

  beforeAll(async () => {
    vi.stubEnv("JWT_SECRET", jwtSecret);
    databaseAvailable = await isDatabaseAvailable();
    if (!databaseAvailable) {
      console.warn("⚠️  DATABASE NOT AVAILABLE FOR GET-RESERVATION INTEGRATION TESTS");
    } else {
      console.log("\n✅ Database connection successful. Running get-reservation integration tests...\n");
    }
  });

  afterAll(async () => {
    vi.unstubAllEnvs();
  });

  beforeEach(async () => {
    if (!databaseAvailable) return;

    // Create users
    testUser = await createTestUser(`user-get-res-${Date.now()}@example.com`);
    adminUser = await createAdminUser(`admin-get-res-${Date.now()}@example.com`);

    // Create rooms
    testRoom = await createTestRoom(`Test Room ${Date.now()}`, 10, ["Projector"]);
    otherRoom = await createTestRoom(`Other Room ${Date.now()}`, 20, ["TV"]);
  });

  afterEach(async () => {
    if (!databaseAvailable) return;

    // Clean up
    try {
      if (testRoom?.id) {
        await prisma.reservation.deleteMany({
          where: { roomId: testRoom.id },
        }).catch(() => {});
        await prisma.room.delete({
          where: { id: testRoom.id },
        }).catch(() => {});
      }
      if (otherRoom?.id) {
        await prisma.reservation.deleteMany({
          where: { roomId: otherRoom.id },
        }).catch(() => {});
        await prisma.room.delete({
          where: { id: otherRoom.id },
        }).catch(() => {});
      }
    } catch (error) {
      // Rooms may not exist
    }

    try {
      if (testUser?.id) {
        await prisma.user.delete({
          where: { id: testUser.id },
        }).catch(() => {});
      }
      if (adminUser?.id) {
        await prisma.user.delete({
          where: { id: adminUser.id },
        }).catch(() => {});
      }
    } catch (error) {
      // Users may not exist
    }
  });

  // ==================== GET RESERVATIONS BY USER ====================
  describe("getReservationsByUser (GET /)", () => {
    it("should return user's reservations successfully", async () => {
      const startTime = new Date("2026-02-01T10:00:00Z");
      const endTime = new Date("2026-02-01T11:00:00Z");
      const reservation = await createReservation(testRoom.id, testUser.id, startTime, endTime);

      const token = generateToken(testUser.id, testUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: testUser.id, email: testUser.email },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await getReservationsByUser(req, res);

      expect(status).toHaveBeenCalledWith(200);
      const reservations = json.mock.calls[0][0];
      expect(Array.isArray(reservations)).toBe(true);
      expect(reservations.length).toBeGreaterThan(0);
      expect(reservations[0].userId).toBe(testUser.id);
    });

    it("should return empty array when user has no reservations", async () => {
      const token = generateToken(testUser.id, testUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: testUser.id, email: testUser.email },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await getReservationsByUser(req, res);

      expect(status).toHaveBeenCalledWith(200);
      const reservations = json.mock.calls[0][0];
      expect(Array.isArray(reservations)).toBe(true);
      expect(reservations).toHaveLength(0);
    });

    it("should return 400 when userId is not provided", async () => {
      if (!databaseAvailable) {
      }

      const req: any = {
        headers: { authorization: "Bearer invalid-token" },
        user: undefined,
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await getReservationsByUser(req, res);

      expect(status).toHaveBeenCalledWith(400);
      const errorResponse = json.mock.calls[0][0];
      expect(errorResponse.error).toBeDefined();
      expect(errorResponse.error.toLowerCase()).toContain("utilisateur");
    });

    it("should return multiple reservations for same user", async () => {
      // Create 3 reservations for the same user
      const startTime1 = new Date("2026-02-01T10:00:00Z");
      const endTime1 = new Date("2026-02-01T11:00:00Z");
      await createReservation(testRoom.id, testUser.id, startTime1, endTime1);

      const startTime2 = new Date("2026-02-02T14:00:00Z");
      const endTime2 = new Date("2026-02-02T15:00:00Z");
      await createReservation(testRoom.id, testUser.id, startTime2, endTime2);

      const startTime3 = new Date("2026-02-03T09:00:00Z");
      const endTime3 = new Date("2026-02-03T10:00:00Z");
      await createReservation(otherRoom.id, testUser.id, startTime3, endTime3);

      const token = generateToken(testUser.id, testUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: testUser.id, email: testUser.email },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await getReservationsByUser(req, res);

      expect(status).toHaveBeenCalledWith(200);
      const reservations = json.mock.calls[0][0];
      expect(reservations.length).toBe(3);
      expect(reservations.every((r: any) => r.userId === testUser.id)).toBe(true);
    });

    it("should return only user's reservations, not others", async () => {
      const otherUser = await createTestUser(`other-user-${Date.now()}@example.com`);

      try {
        const startTime1 = new Date("2026-02-01T10:00:00Z");
        const endTime1 = new Date("2026-02-01T11:00:00Z");
        await createReservation(testRoom.id, testUser.id, startTime1, endTime1);

        const startTime2 = new Date("2026-02-02T10:00:00Z");
        const endTime2 = new Date("2026-02-02T11:00:00Z");
        await createReservation(testRoom.id, otherUser.id, startTime2, endTime2);

        const token = generateToken(testUser.id, testUser.email, jwtSecret);

        const req: any = {
          headers: { authorization: `Bearer ${token}` },
          user: { id: testUser.id, email: testUser.email },
        };

        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const res: any = { status, json };

        await getReservationsByUser(req, res);

        expect(status).toHaveBeenCalledWith(200);
        const reservations = json.mock.calls[0][0];
        expect(reservations.length).toBe(1);
        expect(reservations[0].userId).toBe(testUser.id);
      } finally {
        await prisma.user.delete({
          where: { id: otherUser.id },
        }).catch(() => {});
      }
    });

    it("should return reservations with complete data", async () => {
      const startTime = new Date("2026-02-01T10:00:00Z");
      const endTime = new Date("2026-02-01T11:00:00Z");
      await createReservation(testRoom.id, testUser.id, startTime, endTime);

      const token = generateToken(testUser.id, testUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: testUser.id, email: testUser.email },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await getReservationsByUser(req, res);

      const reservations = json.mock.calls[0][0];
      expect(reservations[0]).toHaveProperty("id");
      expect(reservations[0]).toHaveProperty("roomId");
      expect(reservations[0]).toHaveProperty("userId");
      expect(reservations[0]).toHaveProperty("startTime");
      expect(reservations[0]).toHaveProperty("endTime");
      expect(reservations[0]).toHaveProperty("status");
      expect(reservations[0]).toHaveProperty("createdAt");
    });
  });

  // ==================== GET RESERVATION AFTER DATE ====================
  describe("getReservationAfterDate (GET /:date)", () => {
    it("should return reservations starting from given date", async () => {
      const startTime1 = new Date("2026-02-01T10:00:00Z");
      const endTime1 = new Date("2026-02-01T11:00:00Z");
      await createReservation(testRoom.id, testUser.id, startTime1, endTime1);

      const startTime2 = new Date("2026-03-01T10:00:00Z");
      const endTime2 = new Date("2026-03-01T11:00:00Z");
      await createReservation(testRoom.id, testUser.id, startTime2, endTime2);

      const token = generateToken(testUser.id, testUser.email, jwtSecret);
      const filterDate = "2026-02-15";

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: testUser.id, email: testUser.email },
        params: { date: filterDate },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await getReservationAfterDate(req, res);

      expect(status).toHaveBeenCalledWith(200);
      const reservations = json.mock.calls[0][0];
      expect(Array.isArray(reservations)).toBe(true);
      expect(reservations.length).toBeGreaterThan(0);
      // Should contain reservation on 2026-03-01 but not 2026-02-01
      expect(
        reservations.some((r: any) => new Date(r.startTime) >= new Date(filterDate))
      ).toBe(true);
    });

    it("should return 400 for invalid date format", async () => {
      const token = generateToken(testUser.id, testUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: testUser.id, email: testUser.email },
        params: { date: "invalid-date" },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await getReservationAfterDate(req, res);

      expect(status).toHaveBeenCalledWith(400);
      const errorResponse = json.mock.calls[0][0];
      expect(errorResponse.error).toBeDefined();
      expect(errorResponse.error.toLowerCase()).toContain("date");
    });

    it("should return 400 when userId is not provided", async () => {
      if (!databaseAvailable) {
      }

      const req: any = {
        headers: { authorization: "Bearer invalid-token" },
        user: undefined,
        params: { date: "2026-02-01" },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await getReservationAfterDate(req, res);

      expect(status).toHaveBeenCalledWith(400);
    });

    it("should return empty array when no reservations after date", async () => {
      const startTime = new Date("2026-02-01T10:00:00Z");
      const endTime = new Date("2026-02-01T11:00:00Z");
      await createReservation(testRoom.id, testUser.id, startTime, endTime);

      const token = generateToken(testUser.id, testUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: testUser.id, email: testUser.email },
        params: { date: "2027-01-01" },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await getReservationAfterDate(req, res);

      expect(status).toHaveBeenCalledWith(200);
      const reservations = json.mock.calls[0][0];
      expect(reservations).toHaveLength(0);
    });

    it("should accept ISO date format", async () => {
      const startTime = new Date("2026-02-01T10:00:00Z");
      const endTime = new Date("2026-02-01T11:00:00Z");
      await createReservation(testRoom.id, testUser.id, startTime, endTime);

      const token = generateToken(testUser.id, testUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: testUser.id, email: testUser.email },
        params: { date: "2026-02-01T00:00:00Z" },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await getReservationAfterDate(req, res);

      expect(status).toHaveBeenCalledWith(200);
    });

    it("should include reservations starting exactly at given date", async () => {
      const filterDate = new Date("2026-02-01T10:00:00Z");
      const startTime = filterDate;
      const endTime = new Date(filterDate.getTime() + 60 * 60 * 1000);
      await createReservation(testRoom.id, testUser.id, startTime, endTime);

      const token = generateToken(testUser.id, testUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: testUser.id, email: testUser.email },
        params: { date: filterDate.toISOString() },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await getReservationAfterDate(req, res);

      expect(status).toHaveBeenCalledWith(200);
      const reservations = json.mock.calls[0][0];
      expect(reservations.length).toBeGreaterThan(0);
    });
  });

  // ==================== GET ALL RESERVATIONS BY ROOM ID ====================
  describe("getAllReservationsByRoomId (GET /room/:roomId) - Admin only", () => {
    it("should return all reservations for a room", async () => {
      const startTime1 = new Date("2026-02-01T10:00:00Z");
      const endTime1 = new Date("2026-02-01T11:00:00Z");
      await createReservation(testRoom.id, testUser.id, startTime1, endTime1);

      const otherUser = await createTestUser(`other-user-${Date.now()}@example.com`);
      try {
        const startTime2 = new Date("2026-02-02T10:00:00Z");
        const endTime2 = new Date("2026-02-02T11:00:00Z");
        await createReservation(testRoom.id, otherUser.id, startTime2, endTime2);

        const token = generateToken(adminUser.id, adminUser.email, jwtSecret);

        const req: any = {
          headers: { authorization: `Bearer ${token}` },
          user: { id: adminUser.id, email: adminUser.email },
          params: { roomId: testRoom.id },
        };

        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const res: any = { status, json };

        await getAllReservationsByRoomId(req, res);

        expect(status).toHaveBeenCalledWith(200);
        const reservations = json.mock.calls[0][0];
        expect(Array.isArray(reservations)).toBe(true);
        expect(reservations.length).toBe(2);
        expect(reservations.every((r: any) => r.roomId === testRoom.id)).toBe(true);
      } finally {
        await prisma.user.delete({
          where: { id: otherUser.id },
        }).catch(() => {});
      }
    });

    it("should return 400 when roomId is not provided", async () => {
      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        params: { roomId: undefined },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await getAllReservationsByRoomId(req, res);

      expect(status).toHaveBeenCalledWith(400);
      const errorResponse = json.mock.calls[0][0];
      expect(errorResponse.error).toBeDefined();
      expect(errorResponse.error.toLowerCase()).toContain("salle");
    });

    it("should return empty array when room has no reservations", async () => {
      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        params: { roomId: testRoom.id },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await getAllReservationsByRoomId(req, res);

      expect(status).toHaveBeenCalledWith(200);
      const reservations = json.mock.calls[0][0];
      expect(Array.isArray(reservations)).toBe(true);
      expect(reservations).toHaveLength(0);
    });

    it("should only return reservations for specific room", async () => {
      const startTime1 = new Date("2026-02-01T10:00:00Z");
      const endTime1 = new Date("2026-02-01T11:00:00Z");
      await createReservation(testRoom.id, testUser.id, startTime1, endTime1);

      const startTime2 = new Date("2026-02-02T10:00:00Z");
      const endTime2 = new Date("2026-02-02T11:00:00Z");
      await createReservation(otherRoom.id, testUser.id, startTime2, endTime2);

      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        params: { roomId: testRoom.id },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await getAllReservationsByRoomId(req, res);

      expect(status).toHaveBeenCalledWith(200);
      const reservations = json.mock.calls[0][0];
      expect(reservations.length).toBe(1);
      expect(reservations[0].roomId).toBe(testRoom.id);
    });
  });

  // ==================== GET ALL RESERVATIONS ====================
  describe("getAllReservations (GET /all)", () => {
    it("should return all reservations from all users", async () => {
      const startTime1 = new Date("2026-02-01T10:00:00Z");
      const endTime1 = new Date("2026-02-01T11:00:00Z");
      await createReservation(testRoom.id, testUser.id, startTime1, endTime1);

      const otherUser = await createTestUser(`other-user-${Date.now()}@example.com`);
      try {
        const startTime2 = new Date("2026-02-02T10:00:00Z");
        const endTime2 = new Date("2026-02-02T11:00:00Z");
        await createReservation(testRoom.id, otherUser.id, startTime2, endTime2);

        const token = generateToken(testUser.id, testUser.email, jwtSecret);

        const req: any = {
          headers: { authorization: `Bearer ${token}` },
          user: { id: testUser.id, email: testUser.email },
        };

        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const res: any = { status, json };

        await getAllReservations(req, res);

        expect(status).toHaveBeenCalledWith(200);
        const reservations = json.mock.calls[0][0];
        expect(Array.isArray(reservations)).toBe(true);
        expect(reservations.length).toBeGreaterThanOrEqual(2);
      } finally {
        await prisma.user.delete({
          where: { id: otherUser.id },
        }).catch(() => {});
      }
    });

    it("should return 400 when userId is not provided", async () => {
      if (!databaseAvailable) {
      }

      const req: any = {
        headers: { authorization: "Bearer invalid-token" },
        user: undefined,
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await getAllReservations(req, res);

      expect(status).toHaveBeenCalledWith(400);
    });

    it("should return array with all reservations", async () => {
      const startTime = new Date("2026-02-01T10:00:00Z");
      const endTime = new Date("2026-02-01T11:00:00Z");
      await createReservation(testRoom.id, testUser.id, startTime, endTime);

      const token = generateToken(testUser.id, testUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: testUser.id, email: testUser.email },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await getAllReservations(req, res);

      expect(status).toHaveBeenCalledWith(200);
      const reservations = json.mock.calls[0][0];
      expect(Array.isArray(reservations)).toBe(true);
    });
  });

  // ==================== DATABASE ERROR TESTS ====================
  describe("Database Error Handling", () => {
    it("should return 500 on database error in getReservationsByUser", async () => {
      const token = generateToken(testUser.id, testUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: testUser.id, email: testUser.email },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      // Mock prisma to throw error
      const originalFindMany = prisma.reservation.findMany;
      (prisma.reservation as any).findMany = vi
        .fn()
        .mockRejectedValueOnce(new Error("DB Error"));

      try {
        await getReservationsByUser(req, res);

        expect(status).toHaveBeenCalledWith(500);
        const errorResponse = json.mock.calls[0][0];
        expect(errorResponse.error).toBeDefined();
      } finally {
        (prisma.reservation as any).findMany = originalFindMany;
      }
    });

    it("should return 500 on database error in getReservationAfterDate", async () => {
      const token = generateToken(testUser.id, testUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: testUser.id, email: testUser.email },
        params: { date: "2026-02-01" },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      const originalFindMany = prisma.reservation.findMany;
      (prisma.reservation as any).findMany = vi
        .fn()
        .mockRejectedValueOnce(new Error("DB Error"));

      try {
        await getReservationAfterDate(req, res);

        expect(status).toHaveBeenCalledWith(500);
      } finally {
        (prisma.reservation as any).findMany = originalFindMany;
      }
    });

    it("should return 500 on database error in getAllReservationsByRoomId", async () => {
      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        params: { roomId: testRoom.id },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      const originalFindMany = prisma.reservation.findMany;
      (prisma.reservation as any).findMany = vi
        .fn()
        .mockRejectedValueOnce(new Error("DB Error"));

      try {
        await getAllReservationsByRoomId(req, res);

        expect(status).toHaveBeenCalledWith(500);
      } finally {
        (prisma.reservation as any).findMany = originalFindMany;
      }
    });

    it("should return 500 on database error in getAllReservations", async () => {
      const token = generateToken(testUser.id, testUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: testUser.id, email: testUser.email },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      const originalFindMany = prisma.reservation.findMany;
      (prisma.reservation as any).findMany = vi
        .fn()
        .mockRejectedValueOnce(new Error("DB Error"));

      try {
        await getAllReservations(req, res);

        expect(status).toHaveBeenCalledWith(500);
      } finally {
        (prisma.reservation as any).findMany = originalFindMany;
      }
    });
  });

  // ==================== RESPONSE STRUCTURE TESTS ====================
  describe("Response Structure", () => {
    it("should return array of reservations with complete data", async () => {
      const startTime = new Date("2026-02-01T10:00:00Z");
      const endTime = new Date("2026-02-01T11:00:00Z");
      await createReservation(testRoom.id, testUser.id, startTime, endTime);

      const token = generateToken(testUser.id, testUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: testUser.id, email: testUser.email },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await getReservationsByUser(req, res);

      const reservations = json.mock.calls[0][0];
      expect(reservations[0]).toHaveProperty("id");
      expect(reservations[0]).toHaveProperty("roomId");
      expect(reservations[0]).toHaveProperty("userId");
      expect(reservations[0]).toHaveProperty("startTime");
      expect(reservations[0]).toHaveProperty("endTime");
      expect(reservations[0]).toHaveProperty("status");
      expect(reservations[0]).toHaveProperty("createdAt");
    });
  });

  // ==================== EDGE CASES ====================
  describe("Get Reservation - Edge Cases", () => {
    it("should handle multiple reservations at the same time in different rooms", async () => {
      const startTime = new Date("2026-02-01T10:00:00Z");
      const endTime = new Date("2026-02-01T11:00:00Z");

      await createReservation(testRoom.id, testUser.id, startTime, endTime);
      await createReservation(otherRoom.id, testUser.id, startTime, endTime);

      const token = generateToken(testUser.id, testUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: testUser.id, email: testUser.email },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await getReservationsByUser(req, res);

      expect(status).toHaveBeenCalledWith(200);
      const reservations = json.mock.calls[0][0];
      expect(reservations.length).toBe(2);
    });

    it("should filter correctly by date with many reservations", async () => {
      // Create reservations across multiple months
      const dates = [
        new Date("2026-01-15T10:00:00Z"),
        new Date("2026-02-01T10:00:00Z"),
        new Date("2026-02-15T10:00:00Z"),
        new Date("2026-03-01T10:00:00Z"),
        new Date("2026-04-01T10:00:00Z"),
      ];

      for (const date of dates) {
        const endTime = new Date(date.getTime() + 60 * 60 * 1000);
        await createReservation(testRoom.id, testUser.id, date, endTime);
      }

      const token = generateToken(testUser.id, testUser.email, jwtSecret);
      const filterDate = "2026-02-10";

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: testUser.id, email: testUser.email },
        params: { date: filterDate },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await getReservationAfterDate(req, res);

      expect(status).toHaveBeenCalledWith(200);
      const reservations = json.mock.calls[0][0];
      // Should have 3 reservations (Feb 15, Mar 1, Apr 1)
      expect(reservations.length).toBe(3);
    });
  });
});
