import { vi, describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from "vitest";
import prisma from "../../db/prisma.ts";
import jwt from "jsonwebtoken";
import { createReservation } from "../../controller/reservation/create-reservation.ts";

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

// Helper to create reservation
async function createReservationInDb(
  roomId: string,
  userId: string,
  startTime: Date,
  endTime: Date
) {
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

describe("Create Reservation Integration Tests - createReservation (POST /)", () => {
  const jwtSecret = "test-secret-key-integration";
  let testUser: any;
  let testRoom: any;
  let otherRoom: any;
  let databaseAvailable = true;

  beforeAll(async () => {
    vi.stubEnv("JWT_SECRET", jwtSecret);
    databaseAvailable = await isDatabaseAvailable();
    if (!databaseAvailable) {
      console.warn("⚠️  DATABASE NOT AVAILABLE FOR CREATE-RESERVATION INTEGRATION TESTS");
    } else {
      console.log("\n✅ Database connection successful. Running create-reservation integration tests...\n");
    }
  });

  afterAll(async () => {
    vi.unstubAllEnvs();
  });

  beforeEach(async () => {
    if (!databaseAvailable) return;

    // Create test user
    testUser = await createTestUser(`user-create-res-${Date.now()}@example.com`);

    // Create test rooms
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
    } catch (error) {
      // User may not exist
    }
  });

  // ==================== SUCCESSFUL CREATION TESTS ====================
  describe("Successful Reservation Creation", () => {
    it("should create reservation successfully", async () => {
      const startTime = new Date(Date.now() + 86400000); // Tomorrow
      const endTime = new Date(startTime.getTime() + 3600000); // +1 hour

      const token = generateToken(testUser.id, testUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: testUser.id, email: testUser.email },
        body: {
          roomId: testRoom.id,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await createReservation(req, res);

      expect(status).toHaveBeenCalledWith(201);
      expect(json).toHaveBeenCalled();
      const createdRes = json.mock.calls[0][0];
      expect(createdRes.roomId).toBe(testRoom.id);
      expect(createdRes.userId).toBe(testUser.id);

      // Verify in database
      const dbRes = await prisma.reservation.findUnique({
        where: { id: createdRes.id },
      });
      expect(dbRes).not.toBeNull();
      expect(dbRes?.status).toBe("confirmed");
    });

    it("should return HTTP 201 status on successful creation", async () => {
      const startTime = new Date(Date.now() + 86400000);
      const endTime = new Date(startTime.getTime() + 3600000);

      const token = generateToken(testUser.id, testUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: testUser.id, email: testUser.email },
        body: {
          roomId: testRoom.id,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await createReservation(req, res);

      expect(status).toHaveBeenCalledWith(201);
    });

    it("should return created reservation with all fields", async () => {
      const startTime = new Date(Date.now() + 86400000);
      const endTime = new Date(startTime.getTime() + 3600000);

      const token = generateToken(testUser.id, testUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: testUser.id, email: testUser.email },
        body: {
          roomId: testRoom.id,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await createReservation(req, res);

      const createdRes = json.mock.calls[0][0];
      expect(createdRes).toHaveProperty("id");
      expect(createdRes).toHaveProperty("roomId");
      expect(createdRes).toHaveProperty("userId");
      expect(createdRes).toHaveProperty("startTime");
      expect(createdRes).toHaveProperty("endTime");
      expect(createdRes).toHaveProperty("status");
      expect(createdRes).toHaveProperty("createdAt");
    });

    it("should create reservation with correct status", async () => {
      const startTime = new Date(Date.now() + 86400000);
      const endTime = new Date(startTime.getTime() + 3600000);

      const token = generateToken(testUser.id, testUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: testUser.id, email: testUser.email },
        body: {
          roomId: testRoom.id,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await createReservation(req, res);

      const createdRes = json.mock.calls[0][0];
      expect(createdRes.status).toBe("confirmed");
    });

    it("should create multiple reservations for same user in different rooms", async () => {
      const token = generateToken(testUser.id, testUser.email, jwtSecret);

      // First reservation
      const startTime1 = new Date(Date.now() + 86400000);
      const endTime1 = new Date(startTime1.getTime() + 3600000);

      const req1: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: testUser.id, email: testUser.email },
        body: {
          roomId: testRoom.id,
          startTime: startTime1.toISOString(),
          endTime: endTime1.toISOString(),
        },
      };

      const json1 = vi.fn();
      const status1 = vi.fn(() => ({ json: json1 }));
      const res1: any = { status: status1, json: json1 };

      await createReservation(req1, res1);
      expect(status1).toHaveBeenCalledWith(201);

      // Second reservation in different room
      const startTime2 = new Date(Date.now() + 86400000);
      const endTime2 = new Date(startTime2.getTime() + 3600000);

      const req2: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: testUser.id, email: testUser.email },
        body: {
          roomId: otherRoom.id,
          startTime: startTime2.toISOString(),
          endTime: endTime2.toISOString(),
        },
      };

      const json2 = vi.fn();
      const status2 = vi.fn(() => ({ json: json2 }));
      const res2: any = { status: status2, json: json2 };

      await createReservation(req2, res2);
      expect(status2).toHaveBeenCalledWith(201);

      // Verify both exist
      const reservations = await prisma.reservation.findMany({
        where: { userId: testUser.id },
      });
      expect(reservations.length).toBe(2);
    });

    it("should create reservation with multiple hours duration", async () => {
      const startTime = new Date(Date.now() + 86400000);
      const endTime = new Date(startTime.getTime() + 7200000); // +2 hours

      const token = generateToken(testUser.id, testUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: testUser.id, email: testUser.email },
        body: {
          roomId: testRoom.id,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await createReservation(req, res);

      expect(status).toHaveBeenCalledWith(201);
      const createdRes = json.mock.calls[0][0];
      const start = new Date(createdRes.startTime);
      const end = new Date(createdRes.endTime);
      expect(end.getTime() - start.getTime()).toBe(7200000);
    });
  });

  // ==================== VALIDATION ERROR TESTS ====================
  describe("Reservation Validation", () => {
    it("should return 400 when userId is not provided", async () => {
      const startTime = new Date(Date.now() + 86400000);
      const endTime = new Date(startTime.getTime() + 3600000);

      const req: any = {
        headers: { authorization: "Bearer invalid-token" },
        user: undefined,
        body: {
          roomId: testRoom.id,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await createReservation(req, res);

      expect(status).toHaveBeenCalledWith(400);
      const errorResponse = json.mock.calls[0][0];
      expect(errorResponse.error).toBeDefined();
      expect(errorResponse.error.toLowerCase()).toContain("utilisateur");
    });

    it("should return 400 when roomId is not provided", async () => {
      const startTime = new Date(Date.now() + 86400000);
      const endTime = new Date(startTime.getTime() + 3600000);

      const token = generateToken(testUser.id, testUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: testUser.id, email: testUser.email },
        body: {
          roomId: undefined,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await createReservation(req, res);

      expect(status).toHaveBeenCalledWith(400);
      const errorResponse = json.mock.calls[0][0];
      expect(errorResponse.error).toBeDefined();
      expect(errorResponse.error.toLowerCase()).toContain("salle");
    });

    it("should return 400 when startTime is after endTime", async () => {
      const endTime = new Date(Date.now() + 86400000);
      const startTime = new Date(endTime.getTime() + 3600000); // After endTime

      const token = generateToken(testUser.id, testUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: testUser.id, email: testUser.email },
        body: {
          roomId: testRoom.id,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await createReservation(req, res);

      expect(status).toHaveBeenCalledWith(400);
      const errorResponse = json.mock.calls[0][0];
      expect(errorResponse.error).toBeDefined();
      expect(errorResponse.error.toLowerCase()).toContain("horaire");
    });

    it("should return 400 when startTime is in the past", async () => {
      const startTime = new Date(Date.now() - 3600000); // 1 hour ago
      const endTime = new Date(startTime.getTime() + 7200000);

      const token = generateToken(testUser.id, testUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: testUser.id, email: testUser.email },
        body: {
          roomId: testRoom.id,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await createReservation(req, res);

      expect(status).toHaveBeenCalledWith(400);
      const errorResponse = json.mock.calls[0][0];
      expect(errorResponse.error).toBeDefined();
      expect(errorResponse.error.toLowerCase()).toContain("horaire");
    });

    it("should return 400 when endTime is in the past", async () => {
      const endTime = new Date(Date.now() - 3600000); // 1 hour ago
      const startTime = new Date(endTime.getTime() - 3600000);

      const token = generateToken(testUser.id, testUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: testUser.id, email: testUser.email },
        body: {
          roomId: testRoom.id,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await createReservation(req, res);

      expect(status).toHaveBeenCalledWith(400);
    });

    it("should return 400 for same startTime and endTime", async () => {
      const startTime = new Date(Date.now() + 86400000);
      const endTime = startTime; // Same as startTime

      const token = generateToken(testUser.id, testUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: testUser.id, email: testUser.email },
        body: {
          roomId: testRoom.id,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await createReservation(req, res);

      expect(status).toHaveBeenCalledWith(400);
    });
  });

  // ==================== OVERLAP/CONFLICT TESTS ====================
  describe("Reservation Overlap Detection", () => {
    it("should return 400 when room is already booked for time slot", async () => {
      const startTime1 = new Date(Date.now() + 86400000);
      const endTime1 = new Date(startTime1.getTime() + 3600000);

      // Create first reservation
      await createReservationInDb(testRoom.id, testUser.id, startTime1, endTime1);

      const token = generateToken(testUser.id, testUser.email, jwtSecret);

      // Try to create overlapping reservation
      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: testUser.id, email: testUser.email },
        body: {
          roomId: testRoom.id,
          startTime: startTime1.toISOString(),
          endTime: endTime1.toISOString(),
        },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await createReservation(req, res);

      expect(status).toHaveBeenCalledWith(400);
      const errorResponse = json.mock.calls[0][0];
      expect(errorResponse.error).toBeDefined();
      expect(errorResponse.error.toLowerCase()).toContain("réservée");
    });

    it("should return 400 when new reservation partially overlaps", async () => {
      const startTime1 = new Date(Date.now() + 86400000);
      const endTime1 = new Date(startTime1.getTime() + 3600000);

      // Create first reservation
      await createReservationInDb(testRoom.id, testUser.id, startTime1, endTime1);

      const token = generateToken(testUser.id, testUser.email, jwtSecret);

      // Try to create overlapping reservation (starts during existing reservation)
      const startTime2 = new Date(startTime1.getTime() + 1800000); // Midway through
      const endTime2 = new Date(endTime1.getTime() + 3600000);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: testUser.id, email: testUser.email },
        body: {
          roomId: testRoom.id,
          startTime: startTime2.toISOString(),
          endTime: endTime2.toISOString(),
        },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await createReservation(req, res);

      expect(status).toHaveBeenCalledWith(400);
    });

    it("should return 400 when new reservation contains existing reservation", async () => {
      const startTime1 = new Date(Date.now() + 86400000);
      const endTime1 = new Date(startTime1.getTime() + 3600000);

      // Create first reservation
      await createReservationInDb(testRoom.id, testUser.id, startTime1, endTime1);

      const token = generateToken(testUser.id, testUser.email, jwtSecret);

      // Try to create larger reservation that contains existing one
      const startTime2 = new Date(startTime1.getTime() - 3600000);
      const endTime2 = new Date(endTime1.getTime() + 3600000);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: testUser.id, email: testUser.email },
        body: {
          roomId: testRoom.id,
          startTime: startTime2.toISOString(),
          endTime: endTime2.toISOString(),
        },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await createReservation(req, res);

      expect(status).toHaveBeenCalledWith(400);
    });

    it("should allow reservation if room is free at different time", async () => {
      const startTime1 = new Date(Date.now() + 86400000);
      const endTime1 = new Date(startTime1.getTime() + 3600000);

      // Create first reservation
      await createReservationInDb(testRoom.id, testUser.id, startTime1, endTime1);

      const token = generateToken(testUser.id, testUser.email, jwtSecret);

      // Create reservation after first one
      const startTime2 = new Date(endTime1.getTime() + 3600000); // After first reservation
      const endTime2 = new Date(startTime2.getTime() + 3600000);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: testUser.id, email: testUser.email },
        body: {
          roomId: testRoom.id,
          startTime: startTime2.toISOString(),
          endTime: endTime2.toISOString(),
        },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await createReservation(req, res);

      expect(status).toHaveBeenCalledWith(201);
    });

    it("should allow reservation in different room at same time", async () => {
      const startTime = new Date(Date.now() + 86400000);
      const endTime = new Date(startTime.getTime() + 3600000);

      // Create reservation in first room
      await createReservationInDb(testRoom.id, testUser.id, startTime, endTime);

      const token = generateToken(testUser.id, testUser.email, jwtSecret);

      // Create reservation in different room at same time
      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: testUser.id, email: testUser.email },
        body: {
          roomId: otherRoom.id,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await createReservation(req, res);

      expect(status).toHaveBeenCalledWith(201);
    });

    it("should allow back-to-back reservations (no gap)", async () => {
      const startTime1 = new Date(Date.now() + 86400000);
      const endTime1 = new Date(startTime1.getTime() + 3600000);

      // Create first reservation
      await createReservationInDb(testRoom.id, testUser.id, startTime1, endTime1);

      const token = generateToken(testUser.id, testUser.email, jwtSecret);

      // Create second reservation starting exactly when first ends
      const startTime2 = endTime1;
      const endTime2 = new Date(startTime2.getTime() + 3600000);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: testUser.id, email: testUser.email },
        body: {
          roomId: testRoom.id,
          startTime: startTime2.toISOString(),
          endTime: endTime2.toISOString(),
        },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await createReservation(req, res);

      // Should be allowed since they don't overlap
      expect(status).toHaveBeenCalledWith(201);
    });
  });

  // ==================== DATABASE ERROR TESTS ====================
  describe("Database Error Handling", () => {
    it("should return 500 on database error during overlap check", async () => {
      if (!databaseAvailable) {
      }

      const startTime = new Date(Date.now() + 86400000);
      const endTime = new Date(startTime.getTime() + 3600000);

      const token = generateToken(testUser.id, testUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: testUser.id, email: testUser.email },
        body: {
          roomId: testRoom.id,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        },
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
        await createReservation(req, res);

        expect(status).toHaveBeenCalledWith(500);
        const errorResponse = json.mock.calls[0][0];
        expect(errorResponse.error).toBeDefined();
        expect(errorResponse.error.toLowerCase()).toContain("création");
      } finally {
        (prisma.reservation as any).findMany = originalFindMany;
      }
    });

    it("should return 500 on database error during reservation creation", async () => {
      if (!databaseAvailable) {
      }

      const startTime = new Date(Date.now() + 86400000);
      const endTime = new Date(startTime.getTime() + 3600000);

      const token = generateToken(testUser.id, testUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: testUser.id, email: testUser.email },
        body: {
          roomId: testRoom.id,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      // Mock prisma to throw error on create
      const originalCreate = prisma.reservation.create;
      (prisma.reservation as any).create = vi
        .fn()
        .mockRejectedValueOnce(new Error("DB Error"));

      try {
        await createReservation(req, res);

        expect(status).toHaveBeenCalledWith(500);
      } finally {
        (prisma.reservation as any).create = originalCreate;
      }
    });
  });

  // ==================== EDGE CASES ====================
  describe("Create Reservation - Edge Cases", () => {
    it("should create reservation with very long duration", async () => {
      if (!databaseAvailable) {
      }

      const startTime = new Date(Date.now() + 86400000);
      const endTime = new Date(startTime.getTime() + 604800000); // 7 days

      const token = generateToken(testUser.id, testUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: testUser.id, email: testUser.email },
        body: {
          roomId: testRoom.id,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await createReservation(req, res);

      expect(status).toHaveBeenCalledWith(201);
    });

    it("should create reservation with minimum duration (1 minute)", async () => {
      if (!databaseAvailable) {
      }

      const startTime = new Date(Date.now() + 86400000);
      const endTime = new Date(startTime.getTime() + 60000); // 1 minute

      const token = generateToken(testUser.id, testUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: testUser.id, email: testUser.email },
        body: {
          roomId: testRoom.id,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await createReservation(req, res);

      expect(status).toHaveBeenCalledWith(201);
    });

    it("should create reservation far in the future", async () => {
      if (!databaseAvailable) {
      }

      const startTime = new Date(Date.now() + 31536000000); // 1 year from now
      const endTime = new Date(startTime.getTime() + 3600000);

      const token = generateToken(testUser.id, testUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: testUser.id, email: testUser.email },
        body: {
          roomId: testRoom.id,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await createReservation(req, res);

      expect(status).toHaveBeenCalledWith(201);
    });

    it("should accept various valid date formats", async () => {
      if (!databaseAvailable) {
      }

      const startTime = new Date(Date.now() + 86400000);
      const endTime = new Date(startTime.getTime() + 3600000);

      const token = generateToken(testUser.id, testUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: testUser.id, email: testUser.email },
        body: {
          roomId: testRoom.id,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await createReservation(req, res);

      expect(status).toHaveBeenCalledWith(201);
    });

    it("should create reservation with milliseconds in timestamp", async () => {
      if (!databaseAvailable) {
      }

      const startTime = new Date(Date.now() + 86400000 + 123); // With milliseconds
      const endTime = new Date(startTime.getTime() + 3600000);

      const token = generateToken(testUser.id, testUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: testUser.id, email: testUser.email },
        body: {
          roomId: testRoom.id,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await createReservation(req, res);

      expect(status).toHaveBeenCalledWith(201);
    });
  });

  // ==================== RESPONSE STRUCTURE TESTS ====================
  describe("Response Structure", () => {
    it("should return created reservation with correct user and room IDs", async () => {
      if (!databaseAvailable) {
      }

      const startTime = new Date(Date.now() + 86400000);
      const endTime = new Date(startTime.getTime() + 3600000);

      const token = generateToken(testUser.id, testUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: testUser.id, email: testUser.email },
        body: {
          roomId: testRoom.id,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await createReservation(req, res);

      const createdRes = json.mock.calls[0][0];
      expect(createdRes.userId).toBe(testUser.id);
      expect(createdRes.roomId).toBe(testRoom.id);
    });

    it("should return correct timestamps in response", async () => {
      if (!databaseAvailable) {
      }

      const startTime = new Date(Date.now() + 86400000);
      const endTime = new Date(startTime.getTime() + 3600000);

      const token = generateToken(testUser.id, testUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: testUser.id, email: testUser.email },
        body: {
          roomId: testRoom.id,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await createReservation(req, res);

      const createdRes = json.mock.calls[0][0];
      const returnedStart = new Date(createdRes.startTime);
      const returnedEnd = new Date(createdRes.endTime);

      expect(returnedStart.getTime()).toBe(startTime.getTime());
      expect(returnedEnd.getTime()).toBe(endTime.getTime());
    });
  });

  // ==================== AUTHORIZATION TESTS ====================
  describe("Authorization & Permission", () => {
    it("should create reservation for authenticated user", async () => {
      if (!databaseAvailable) {
      }

      const startTime = new Date(Date.now() + 86400000);
      const endTime = new Date(startTime.getTime() + 3600000);

      const token = generateToken(testUser.id, testUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: testUser.id, email: testUser.email },
        body: {
          roomId: testRoom.id,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await createReservation(req, res);

      const createdRes = json.mock.calls[0][0];
      expect(createdRes.userId).toBe(testUser.id);
    });

    it("should use authenticated user's ID, not one from body", async () => {
      if (!databaseAvailable) {
      }

      const otherUser = await createTestUser(`other-${Date.now()}@example.com`);

      try {
        const startTime = new Date(Date.now() + 86400000);
        const endTime = new Date(startTime.getTime() + 3600000);

        const token = generateToken(testUser.id, testUser.email, jwtSecret);

        const req: any = {
          headers: { authorization: `Bearer ${token}` },
          user: { id: testUser.id, email: testUser.email },
          body: {
            roomId: testRoom.id,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            userId: otherUser.id, // Attempt to override userId
          },
        };

        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const res: any = { status, json };

        await createReservation(req, res);

        const createdRes = json.mock.calls[0][0];
        // Should use authenticated user's ID, not the one from body
        expect(createdRes.userId).toBe(testUser.id);
        expect(createdRes.userId).not.toBe(otherUser.id);
      } finally {
        await prisma.user.delete({
          where: { id: otherUser.id },
        }).catch(() => {});
      }
    });
  });
});
