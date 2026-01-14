import { vi, describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from "vitest";
import prisma from "../../db/prisma.ts";
import jwt from "jsonwebtoken";
import { deleteRoom } from "../../controller/room/delete-room.ts";

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

// Helper to create admin user
async function createAdminUser(email: string) {
  const bcrypt = await import("bcrypt");
  const hashedPassword = await bcrypt.default.hash("TestPass123!", 10);

  // Delete existing user if it exists
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

describe("Delete Room Integration Tests - deleteRoom (DELETE /:id)", () => {
  const jwtSecret = "test-secret-key-integration";
  let testRoom: any;
  let adminUser: any;
  let testUser: any;
  let databaseAvailable = true;

  beforeAll(async () => {
    vi.stubEnv("JWT_SECRET", jwtSecret);
    databaseAvailable = await isDatabaseAvailable();
    if (!databaseAvailable) {
      console.warn("⚠️  DATABASE NOT AVAILABLE FOR DELETE-ROOM INTEGRATION TESTS");
    } else {
      console.log("\n✅ Database connection successful. Running delete-room integration tests...\n");
    }
  });

  afterAll(async () => {
    vi.unstubAllEnvs();
  });

  beforeEach(async () => {
    if (!databaseAvailable) return;

    // Create admin user
    adminUser = await createAdminUser(`admin-delete-${Date.now()}@example.com`);
    // Create test user
    testUser = await createTestUser(`user-delete-${Date.now()}@example.com`);
    // Create test room
    testRoom = await createTestRoom(`Test Room ${Date.now()}`, 10, ["Projector", "Whiteboard"]);
  });

  afterEach(async () => {
    if (!databaseAvailable) return;

    // Clean up
    try {
      if (testRoom?.id) {
        // Delete reservations first
        await prisma.reservation.deleteMany({
          where: { roomId: testRoom.id },
        }).catch(() => {});

        // Then delete room
        await prisma.room.delete({
          where: { id: testRoom.id },
        }).catch(() => {});
      }
    } catch (error) {
      // Room may not exist
    }

    try {
      if (adminUser?.id) {
        await prisma.user.delete({
          where: { id: adminUser.id },
        }).catch(() => {});
      }
    } catch (error) {
      // User may not exist
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

  // ==================== SUCCESSFUL DELETE TESTS ====================
  describe("Successful Room Deletion", () => {
    it("should delete room successfully", async () => {
      if (!databaseAvailable) {
      }

      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        params: { id: testRoom.id },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await deleteRoom(req, res);

      expect(status).toHaveBeenCalledWith(200);
      expect(json).toHaveBeenCalled();
      const response = json.mock.calls[0][0];
      expect(response.message).toBeDefined();
      expect(response.message.toLowerCase()).toContain("supprimée");

      // Verify room is deleted from database
      const deletedRoom = await prisma.room.findUnique({
        where: { id: testRoom.id },
      });
      expect(deletedRoom).toBeNull();
    });

    it("should delete room with reservations (cascade delete)", async () => {
      if (!databaseAvailable) {
      }

      // Create multiple reservations for the room
      const startTime = new Date("2026-02-01T10:00:00Z");
      const endTime = new Date("2026-02-01T11:00:00Z");
      const reservation1 = await createReservation(testRoom.id, testUser.id, startTime, endTime);

      const startTime2 = new Date("2026-02-02T10:00:00Z");
      const endTime2 = new Date("2026-02-02T11:00:00Z");
      const reservation2 = await createReservation(testRoom.id, testUser.id, startTime2, endTime2);

      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        params: { id: testRoom.id },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await deleteRoom(req, res);

      expect(status).toHaveBeenCalledWith(200);

      // Verify reservations are deleted
      const deletedReservations = await prisma.reservation.findMany({
        where: { roomId: testRoom.id },
      });
      expect(deletedReservations).toHaveLength(0);

      // Verify room is deleted
      const deletedRoom = await prisma.room.findUnique({
        where: { id: testRoom.id },
      });
      expect(deletedRoom).toBeNull();
    });

    it("should return HTTP 200 status on successful deletion", async () => {
      if (!databaseAvailable) {
      }

      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        params: { id: testRoom.id },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await deleteRoom(req, res);

      expect(status).toHaveBeenCalledWith(200);
    });

    it("should return success message in response", async () => {
      if (!databaseAvailable) {
      }

      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        params: { id: testRoom.id },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await deleteRoom(req, res);

      const response = json.mock.calls[0][0];
      expect(response).toHaveProperty("message");
      expect(typeof response.message).toBe("string");
    });

    it("should delete room with empty equipment array", async () => {
      if (!databaseAvailable) {
      }

      const emptyRoom = await createTestRoom("Empty Equipment Room", 5, []);

      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        params: { id: emptyRoom.id },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await deleteRoom(req, res);

      expect(status).toHaveBeenCalledWith(200);

      const deletedRoom = await prisma.room.findUnique({
        where: { id: emptyRoom.id },
      });
      expect(deletedRoom).toBeNull();
    });

    it("should delete room regardless of room properties", async () => {
      if (!databaseAvailable) {
      }

      // Create room with many properties
      const specialRoom = await createTestRoom(
        "Special Room #123",
        50,
        ["Equipment1", "Equipment2", "Equipment3", "Equipment4", "Equipment5"]
      );

      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        params: { id: specialRoom.id },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await deleteRoom(req, res);

      expect(status).toHaveBeenCalledWith(200);

      const deletedRoom = await prisma.room.findUnique({
        where: { id: specialRoom.id },
      });
      expect(deletedRoom).toBeNull();
    });
  });

  // ==================== NOT FOUND TESTS ====================
  describe("Room Not Found", () => {
    it("should return 404 when room does not exist", async () => {
      if (!databaseAvailable) {
      }

      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        params: { id: "non-existent-room-id" },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await deleteRoom(req, res);

      expect(status).toHaveBeenCalledWith(404);
      const errorResponse = json.mock.calls[0][0];
      expect(errorResponse.error).toBeDefined();
      expect(errorResponse.error.toLowerCase()).toContain("trouvée");
    });

    it("should return 404 for already deleted room", async () => {
      if (!databaseAvailable) {
      }

      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);
      const roomId = testRoom.id;

      // First delete
      let req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        params: { id: roomId },
      };

      let json = vi.fn();
      let status = vi.fn(() => ({ json }));
      let res: any = { status, json };

      await deleteRoom(req, res);
      expect(status).toHaveBeenCalledWith(200);

      // Second delete attempt
      req = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        params: { id: roomId },
      };

      json = vi.fn();
      status = vi.fn(() => ({ json }));
      res = { status, json };

      await deleteRoom(req, res);

      expect(status).toHaveBeenCalledWith(404);
      const errorResponse = json.mock.calls[0][0];
      expect(errorResponse.error).toBeDefined();
    });

    it("should return 404 with specific error message for non-existent room", async () => {
      if (!databaseAvailable) {
      }

      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        params: { id: "invalid-id-12345" },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await deleteRoom(req, res);

      expect(status).toHaveBeenCalledWith(404);
      const errorResponse = json.mock.calls[0][0];
      expect(errorResponse).toHaveProperty("error");
      expect(errorResponse.error).not.toBeNull();
    });
  });

  // ==================== CASCADE DELETE TESTS ====================
  describe("Reservation Cascade Delete", () => {
    it("should delete associated reservations when room is deleted", async () => {
      if (!databaseAvailable) {
      }

      const startTime = new Date("2026-02-01T14:00:00Z");
      const endTime = new Date("2026-02-01T15:00:00Z");
      const reservation = await createReservation(testRoom.id, testUser.id, startTime, endTime);

      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        params: { id: testRoom.id },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await deleteRoom(req, res);

      expect(status).toHaveBeenCalledWith(200);

      // Verify reservation is deleted
      const deletedRes = await prisma.reservation.findUnique({
        where: { id: reservation.id },
      });
      expect(deletedRes).toBeNull();
    });

    it("should delete multiple reservations for the same room", async () => {
      if (!databaseAvailable) {
      }

      // Create 5 reservations for the same room
      const reservations = [];
      for (let i = 0; i < 5; i++) {
        const day = String(i + 1).padStart(2, '0');
        const startTime = new Date(`2026-02-${day}T10:00:00Z`);
        const endTime = new Date(`2026-02-${day}T11:00:00Z`);
        const res = await createReservation(testRoom.id, testUser.id, startTime, endTime);
        reservations.push(res);
      }

      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        params: { id: testRoom.id },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await deleteRoom(req, res);

      expect(status).toHaveBeenCalledWith(200);

      // Verify all reservations are deleted
      const remainingReservations = await prisma.reservation.findMany({
        where: { roomId: testRoom.id },
      });
      expect(remainingReservations).toHaveLength(0);
    });

    it("should not affect reservations for other rooms", async () => {
      if (!databaseAvailable) {
      }

      // Create another room
      const otherRoom = await createTestRoom("Other Room", 20, ["TV"]);

      // Create reservations for both rooms
      const startTime = new Date("2026-02-01T10:00:00Z");
      const endTime = new Date("2026-02-01T11:00:00Z");

      const resForDeletedRoom = await createReservation(
        testRoom.id,
        testUser.id,
        startTime,
        endTime
      );
      const resForOtherRoom = await createReservation(otherRoom.id, testUser.id, startTime, endTime);

      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        params: { id: testRoom.id },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await deleteRoom(req, res);

      // Verify reservation for deleted room is gone
      const deleted = await prisma.reservation.findUnique({
        where: { id: resForDeletedRoom.id },
      });
      expect(deleted).toBeNull();

      // Verify reservation for other room still exists
      const remaining = await prisma.reservation.findUnique({
        where: { id: resForOtherRoom.id },
      });
      expect(remaining).not.toBeNull();
      expect(remaining?.roomId).toBe(otherRoom.id);

      // Clean up
      await prisma.reservation.delete({
        where: { id: resForOtherRoom.id },
      }).catch(() => {});
      await prisma.room.delete({
        where: { id: otherRoom.id },
      }).catch(() => {});
    });
  });

  // ==================== DATABASE ERROR TESTS ====================
  describe("Database Error Handling", () => {
    it("should return 500 on database error during existence check", async () => {
      if (!databaseAvailable) {
      }

      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        params: { id: testRoom.id },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      // Mock prisma to throw error
      const originalFindUnique = prisma.room.findUnique;
      (prisma.room as any).findUnique = vi
        .fn()
        .mockRejectedValueOnce(new Error("DB Error"));

      try {
        await deleteRoom(req, res);

        expect(status).toHaveBeenCalledWith(500);
        const errorResponse = json.mock.calls[0][0];
        expect(errorResponse.error).toBeDefined();
        expect(errorResponse.error.toLowerCase()).toContain("suppression");
      } finally {
        (prisma.room as any).findUnique = originalFindUnique;
      }
    });

    it("should return 500 on database error during reservation deletion", async () => {
      if (!databaseAvailable) {
      }

      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        params: { id: testRoom.id },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      // Mock prisma to throw error on deleteMany
      const originalDeleteMany = prisma.reservation.deleteMany;
      (prisma.reservation as any).deleteMany = vi
        .fn()
        .mockRejectedValueOnce(new Error("DB Error"));

      try {
        await deleteRoom(req, res);

        expect(status).toHaveBeenCalledWith(500);
        const errorResponse = json.mock.calls[0][0];
        expect(errorResponse.error).toBeDefined();
      } finally {
        (prisma.reservation as any).deleteMany = originalDeleteMany;
      }
    });

    it("should return 500 on database error during room deletion", async () => {
      if (!databaseAvailable) {
      }

      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        params: { id: testRoom.id },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      // Mock prisma to throw error on delete
      const originalDelete = prisma.room.delete;
      (prisma.room as any).delete = vi
        .fn()
        .mockRejectedValueOnce(new Error("DB Error"));

      try {
        await deleteRoom(req, res);

        expect(status).toHaveBeenCalledWith(500);
        const errorResponse = json.mock.calls[0][0];
        expect(errorResponse.error).toBeDefined();
      } finally {
        (prisma.room as any).delete = originalDelete;
      }
    });

    it("should handle generic database errors gracefully", async () => {
      if (!databaseAvailable) {
      }

      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        params: { id: "test-id" },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      // Mock prisma to throw error
      const originalFindUnique = prisma.room.findUnique;
      (prisma.room as any).findUnique = vi.fn().mockRejectedValueOnce({
        code: "P2002",
        message: "Unique constraint failed",
      });

      try {
        await deleteRoom(req, res);

        expect(status).toHaveBeenCalledWith(500);
        const errorResponse = json.mock.calls[0][0];
        expect(errorResponse).toHaveProperty("error");
      } finally {
        (prisma.room as any).findUnique = originalFindUnique;
      }
    });
  });

  // ==================== EDGE CASES ====================
  describe("Delete Room - Edge Cases", () => {
    it("should delete room with special characters in name", async () => {
      if (!databaseAvailable) {
      }

      const specialRoom = await createTestRoom("Salle de Conférence #3 - Café", 10, []);

      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        params: { id: specialRoom.id },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await deleteRoom(req, res);

      expect(status).toHaveBeenCalledWith(200);

      const deletedRoom = await prisma.room.findUnique({
        where: { id: specialRoom.id },
      });
      expect(deletedRoom).toBeNull();
    });

    it("should delete room with many equipment items", async () => {
      if (!databaseAvailable) {
      }

      const equipment = Array.from({ length: 50 }, (_, i) => `Equipment ${i + 1}`);
      const manyEquipRoom = await createTestRoom("Heavy Equipment Room", 30, equipment);

      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        params: { id: manyEquipRoom.id },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await deleteRoom(req, res);

      expect(status).toHaveBeenCalledWith(200);

      const deletedRoom = await prisma.room.findUnique({
        where: { id: manyEquipRoom.id },
      });
      expect(deletedRoom).toBeNull();
    });

    it("should delete room with minimum capacity", async () => {
      if (!databaseAvailable) {
      }

      const smallRoom = await createTestRoom("Small Room", 1, []);

      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        params: { id: smallRoom.id },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await deleteRoom(req, res);

      expect(status).toHaveBeenCalledWith(200);

      const deletedRoom = await prisma.room.findUnique({
        where: { id: smallRoom.id },
      });
      expect(deletedRoom).toBeNull();
    });

    it("should delete room with large capacity", async () => {
      if (!databaseAvailable) {
      }

      const largeRoom = await createTestRoom("Large Room", 5000, ["Audio System", "Lighting"]);

      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        params: { id: largeRoom.id },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await deleteRoom(req, res);

      expect(status).toHaveBeenCalledWith(200);

      const deletedRoom = await prisma.room.findUnique({
        where: { id: largeRoom.id },
      });
      expect(deletedRoom).toBeNull();
    });

    it("should delete room with reservations at different times", async () => {
      if (!databaseAvailable) {
      }

      // Create reservations across different dates and times
      const dates = [
        new Date("2026-02-01T10:00:00Z"),
        new Date("2026-02-15T10:00:00Z"),
        new Date("2026-03-01T10:00:00Z"),
        new Date("2026-04-01T10:00:00Z"),
      ];
      for (const date of dates) {
        const startTime = date;
        const endTime = new Date(date.getTime() + 60 * 60 * 1000); // +1 hour
        await createReservation(testRoom.id, testUser.id, startTime, endTime);
      }

      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        params: { id: testRoom.id },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await deleteRoom(req, res);

      expect(status).toHaveBeenCalledWith(200);

      // Verify room and all reservations are deleted
      const deletedRoom = await prisma.room.findUnique({
        where: { id: testRoom.id },
      });
      expect(deletedRoom).toBeNull();

      const remainingReservations = await prisma.reservation.findMany({
        where: { roomId: testRoom.id },
      });
      expect(remainingReservations).toHaveLength(0);
    });
  });

  // ==================== RESPONSE STRUCTURE TESTS ====================
  describe("Response Structure", () => {
    it("should return response with message property", async () => {
      if (!databaseAvailable) {
      }

      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        params: { id: testRoom.id },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await deleteRoom(req, res);

      const response = json.mock.calls[0][0];
      expect(response).toHaveProperty("message");
      expect(typeof response.message).toBe("string");
    });

    it("should return error response with error property on failure", async () => {
      if (!databaseAvailable) {
      }

      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        params: { id: "non-existent-id" },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await deleteRoom(req, res);

      const response = json.mock.calls[0][0];
      expect(response).toHaveProperty("error");
      expect(typeof response.error).toBe("string");
    });
  });

  // ==================== MULTIPLE DELETION TESTS ====================
  describe("Multiple Room Deletions", () => {
    it("should delete multiple different rooms", async () => {
      if (!databaseAvailable) {
      }

      const room1 = await createTestRoom("Room 1", 10, ["TV"]);
      const room2 = await createTestRoom("Room 2", 20, ["Projector"]);
      const room3 = await createTestRoom("Room 3", 30, []);

      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);

      // Delete room1
      let req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        params: { id: room1.id },
      };
      let json = vi.fn();
      let status = vi.fn(() => ({ json }));
      let res: any = { status, json };

      await deleteRoom(req, res);
      expect(status).toHaveBeenCalledWith(200);

      // Delete room2
      req = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        params: { id: room2.id },
      };
      json = vi.fn();
      status = vi.fn(() => ({ json }));
      res = { status, json };

      await deleteRoom(req, res);
      expect(status).toHaveBeenCalledWith(200);

      // Delete room3
      req = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        params: { id: room3.id },
      };
      json = vi.fn();
      status = vi.fn(() => ({ json }));
      res = { status, json };

      await deleteRoom(req, res);
      expect(status).toHaveBeenCalledWith(200);

      // Verify all are deleted
      const deleted1 = await prisma.room.findUnique({ where: { id: room1.id } });
      const deleted2 = await prisma.room.findUnique({ where: { id: room2.id } });
      const deleted3 = await prisma.room.findUnique({ where: { id: room3.id } });

      expect(deleted1).toBeNull();
      expect(deleted2).toBeNull();
      expect(deleted3).toBeNull();
    });
  });
});
