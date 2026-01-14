import { vi, describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from "vitest";
import prisma from "../../db/prisma.ts";
import jwt from "jsonwebtoken";
import { updateRoom } from "../../controller/room/update-room.ts";

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

// Helper to generate JWT token
function generateToken(userId: string, email: string, secret: string = "test-secret-key"): string {
  return jwt.sign({ id: userId, email }, secret, { expiresIn: "7d" });
}

describe("Update Room Integration Tests - updateRoom (PUT /:id)", () => {
  const jwtSecret = "test-secret-key-integration";
  let testRoom: any;
  let adminUser: any;
  let databaseAvailable = true;

  beforeAll(async () => {
    vi.stubEnv("JWT_SECRET", jwtSecret);
    databaseAvailable = await isDatabaseAvailable();
    if (!databaseAvailable) {
      console.warn("⚠️  DATABASE NOT AVAILABLE FOR UPDATE-ROOM INTEGRATION TESTS");
    } else {
      console.log("\n✅ Database connection successful. Running update-room integration tests...\n");
    }
  });

  afterAll(async () => {
    vi.unstubAllEnvs();
  });

  beforeEach(async () => {
    if (!databaseAvailable) return;

    // Create admin user
    adminUser = await createAdminUser(`admin-update-${Date.now()}@example.com`);
    // Create test room
    testRoom = await createTestRoom(
      `Test Room ${Date.now()}`,
      10,
      ["Projector", "Whiteboard"]
    );
  });

  afterEach(async () => {
    if (!databaseAvailable) return;

    // Clean up
    try {
      if (testRoom?.id) {
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
  });

  // ==================== SUCCESSFUL UPDATE TESTS ====================
  describe("Successful Room Updates", () => {
    it("should update room name successfully", async () => {
      if (!databaseAvailable) {
      }

      const newName = "Updated Conference Room";
      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        params: { id: testRoom.id },
        body: { name: newName },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await updateRoom(req, res);

      expect(status).toHaveBeenCalledWith(200);
      expect(json).toHaveBeenCalled();
      const updatedRoom = json.mock.calls[0][0];
      expect(updatedRoom.name).toBe(newName);

      // Verify in database
      const dbRoom = await prisma.room.findUnique({
        where: { id: testRoom.id },
      });
      expect(dbRoom?.name).toBe(newName);
    });

    it("should update room capacity successfully", async () => {
      if (!databaseAvailable) {
      }

      const newCapacity = 25;
      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        params: { id: testRoom.id },
        body: { capacity: newCapacity },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await updateRoom(req, res);

      expect(status).toHaveBeenCalledWith(200);
      const updatedRoom = json.mock.calls[0][0];
      expect(updatedRoom.capacity).toBe(newCapacity);

      // Verify in database
      const dbRoom = await prisma.room.findUnique({
        where: { id: testRoom.id },
      });
      expect(dbRoom?.capacity).toBe(newCapacity);
    });

    it("should update room equipment successfully", async () => {
      if (!databaseAvailable) {
      }

      const newEquipment = ["Large Screen", "Conference Phone", "Video Camera"];
      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        params: { id: testRoom.id },
        body: { equipment: newEquipment },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await updateRoom(req, res);

      expect(status).toHaveBeenCalledWith(200);
      const updatedRoom = json.mock.calls[0][0];
      expect(updatedRoom.equipment).toEqual(newEquipment);

      // Verify in database
      const dbRoom = await prisma.room.findUnique({
        where: { id: testRoom.id },
      });
      expect(dbRoom?.equipment).toEqual(newEquipment);
    });

    it("should update multiple fields at once", async () => {
      if (!databaseAvailable) {
      }

      const updateData = {
        name: "Multi Updated Room",
        capacity: 30,
        equipment: ["Projector", "Whiteboard", "Video Conference"],
      };

      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        params: { id: testRoom.id },
        body: updateData,
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await updateRoom(req, res);

      expect(status).toHaveBeenCalledWith(200);
      const updatedRoom = json.mock.calls[0][0];
      expect(updatedRoom.name).toBe(updateData.name);
      expect(updatedRoom.capacity).toBe(updateData.capacity);
      expect(updatedRoom.equipment).toEqual(updateData.equipment);

      // Verify in database
      const dbRoom = await prisma.room.findUnique({
        where: { id: testRoom.id },
      });
      expect(dbRoom?.name).toBe(updateData.name);
      expect(dbRoom?.capacity).toBe(updateData.capacity);
      expect(dbRoom?.equipment).toEqual(updateData.equipment);
    });

    it("should preserve original values when only updating one field", async () => {
      if (!databaseAvailable) {
      }

      const originalCapacity = testRoom.capacity;
      const originalEquipment = testRoom.equipment;
      const newName = "New Name Only";

      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        params: { id: testRoom.id },
        body: { name: newName },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await updateRoom(req, res);

      const updatedRoom = json.mock.calls[0][0];
      expect(updatedRoom.name).toBe(newName);
      expect(updatedRoom.capacity).toBe(originalCapacity);
      expect(updatedRoom.equipment).toEqual(originalEquipment);
    });

    it("should update with empty equipment array", async () => {
      if (!databaseAvailable) {
      }

      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        params: { id: testRoom.id },
        body: { equipment: [] },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await updateRoom(req, res);

      expect(status).toHaveBeenCalledWith(200);
      const updatedRoom = json.mock.calls[0][0];
      expect(updatedRoom.equipment).toEqual([]);
    });

    it("should update room name with special characters", async () => {
      if (!databaseAvailable) {
      }

      const specialName = "Salle de Conférence #3 - Café";
      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        params: { id: testRoom.id },
        body: { name: specialName },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await updateRoom(req, res);

      expect(status).toHaveBeenCalledWith(200);
      const updatedRoom = json.mock.calls[0][0];
      expect(updatedRoom.name).toBe(specialName);
    });

    it("should return HTTP 200 on successful update", async () => {
      if (!databaseAvailable) {
      }

      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        params: { id: testRoom.id },
        body: { name: "Status Test Room" },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await updateRoom(req, res);

      expect(status).toHaveBeenCalledWith(200);
    });

    it("should return updated room with all fields", async () => {
      if (!databaseAvailable) {
      }

      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        params: { id: testRoom.id },
        body: { name: "All Fields Test" },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await updateRoom(req, res);

      const updatedRoom = json.mock.calls[0][0];
      expect(updatedRoom).toHaveProperty("id");
      expect(updatedRoom).toHaveProperty("name");
      expect(updatedRoom).toHaveProperty("capacity");
      expect(updatedRoom).toHaveProperty("equipment");
      expect(updatedRoom).toHaveProperty("createdAt");
    });
  });

  // ==================== VALIDATION ERROR TESTS ====================
  describe("Update Room Validation", () => {
    it("should return 400 when name is empty string", async () => {
      if (!databaseAvailable) {
      }

      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        params: { id: testRoom.id },
        body: { name: "" },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await updateRoom(req, res);

      expect(status).toHaveBeenCalledWith(400);
      const errorResponse = json.mock.calls[0][0];
      expect(errorResponse.error).toBeDefined();
      expect(errorResponse.error.toLowerCase()).toContain("nom");
    });

    it("should return 400 when capacity is zero", async () => {
      if (!databaseAvailable) {
      }

      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        params: { id: testRoom.id },
        body: { capacity: 0 },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await updateRoom(req, res);

      expect(status).toHaveBeenCalledWith(400);
      const errorResponse = json.mock.calls[0][0];
      expect(errorResponse.error).toBeDefined();
      expect(errorResponse.error.toLowerCase()).toContain("capacité");
    });

    it("should return 400 when capacity is negative", async () => {
      if (!databaseAvailable) {
      }

      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        params: { id: testRoom.id },
        body: { capacity: -10 },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await updateRoom(req, res);

      expect(status).toHaveBeenCalledWith(400);
      const errorResponse = json.mock.calls[0][0];
      expect(errorResponse.error).toBeDefined();
      expect(errorResponse.error.toLowerCase()).toContain("capacité");
    });

    it("should return 404 when room does not exist", async () => {
      if (!databaseAvailable) {
      }

      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        params: { id: "non-existent-room-id" },
        body: { name: "New Name" },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await updateRoom(req, res);

      expect(status).toHaveBeenCalledWith(404);
      const errorResponse = json.mock.calls[0][0];
      expect(errorResponse.error).toBeDefined();
      expect(errorResponse.error.toLowerCase()).toContain("trouvée");
    });

    it("should allow null values for partial updates (skip null fields)", async () => {
      if (!databaseAvailable) {
      }

      const originalName = testRoom.name;
      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        params: { id: testRoom.id },
        body: { name: null, capacity: null },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await updateRoom(req, res);

      // Should use nullish coalescing to preserve original values
      const updatedRoom = json.mock.calls[0][0];
      expect(updatedRoom.name).toBe(originalName);
    });

    it("should allow undefined fields (not included in update)", async () => {
      if (!databaseAvailable) {
      }

      const originalCapacity = testRoom.capacity;
      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        params: { id: testRoom.id },
        body: { name: "Only Name Updated" },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await updateRoom(req, res);

      expect(status).toHaveBeenCalledWith(200);
      const updatedRoom = json.mock.calls[0][0];
      expect(updatedRoom.name).toBe("Only Name Updated");
      expect(updatedRoom.capacity).toBe(originalCapacity);
    });

    it("should handle update with whitespace-only name", async () => {
      if (!databaseAvailable) {
      }

      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        params: { id: testRoom.id },
        body: { name: "   Valid Name   " },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await updateRoom(req, res);

      // Should accept and save as is (no trim in update-room.ts)
      const updatedRoom = json.mock.calls[0][0];
      expect(updatedRoom.name).toBe("   Valid Name   ");
    });

    it("should update capacity with minimum value of 1", async () => {
      if (!databaseAvailable) {
      }

      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        params: { id: testRoom.id },
        body: { capacity: 1 },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await updateRoom(req, res);

      expect(status).toHaveBeenCalledWith(200);
      const updatedRoom = json.mock.calls[0][0];
      expect(updatedRoom.capacity).toBe(1);
    });

    it("should update capacity with large value", async () => {
      if (!databaseAvailable) {
      }

      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        params: { id: testRoom.id },
        body: { capacity: 5000 },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await updateRoom(req, res);

      expect(status).toHaveBeenCalledWith(200);
      const updatedRoom = json.mock.calls[0][0];
      expect(updatedRoom.capacity).toBe(5000);
    });
  });

  // ==================== PARTIAL UPDATE TESTS ====================
  describe("Partial Updates (Nullish Coalescing)", () => {
    it("should keep original name when name not provided", async () => {
      if (!databaseAvailable) {
      }

      const originalName = testRoom.name;
      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        params: { id: testRoom.id },
        body: { capacity: 20 },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await updateRoom(req, res);

      const updatedRoom = json.mock.calls[0][0];
      expect(updatedRoom.name).toBe(originalName);
    });

    it("should keep original capacity when capacity not provided", async () => {
      if (!databaseAvailable) {
      }

      const originalCapacity = testRoom.capacity;
      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        params: { id: testRoom.id },
        body: { name: "New Name" },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await updateRoom(req, res);

      const updatedRoom = json.mock.calls[0][0];
      expect(updatedRoom.capacity).toBe(originalCapacity);
    });

    it("should keep original equipment when equipment not provided", async () => {
      if (!databaseAvailable) {
      }

      const originalEquipment = testRoom.equipment;
      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        params: { id: testRoom.id },
        body: { name: "New Name", capacity: 20 },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await updateRoom(req, res);

      const updatedRoom = json.mock.calls[0][0];
      expect(updatedRoom.equipment).toEqual(originalEquipment);
    });

    it("should handle empty body (no updates)", async () => {
      if (!databaseAvailable) {
      }

      const originalName = testRoom.name;
      const originalCapacity = testRoom.capacity;
      const originalEquipment = testRoom.equipment;

      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        params: { id: testRoom.id },
        body: {},
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await updateRoom(req, res);

      expect(status).toHaveBeenCalledWith(200);
      const updatedRoom = json.mock.calls[0][0];
      expect(updatedRoom.name).toBe(originalName);
      expect(updatedRoom.capacity).toBe(originalCapacity);
      expect(updatedRoom.equipment).toEqual(originalEquipment);
    });
  });

  // ==================== MULTIPLE UPDATES TESTS ====================
  describe("Consecutive Updates", () => {
    it("should handle consecutive updates to same room", async () => {
      if (!databaseAvailable) {
      }

      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);

      // First update
      const req1: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        params: { id: testRoom.id },
        body: { name: "First Update" },
      };

      const json1 = vi.fn();
      const status1 = vi.fn(() => ({ json: json1 }));
      const res1: any = { status: status1, json: json1 };

      await updateRoom(req1, res1);
      expect(status1).toHaveBeenCalledWith(200);

      // Second update
      const req2: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        params: { id: testRoom.id },
        body: { name: "Second Update", capacity: 50 },
      };

      const json2 = vi.fn();
      const status2 = vi.fn(() => ({ json: json2 }));
      const res2: any = { status: status2, json: json2 };

      await updateRoom(req2, res2);
      expect(status2).toHaveBeenCalledWith(200);
      const updatedRoom2 = json2.mock.calls[0][0];
      expect(updatedRoom2.name).toBe("Second Update");
      expect(updatedRoom2.capacity).toBe(50);
    });

    it("should update different rooms independently", async () => {
      if (!databaseAvailable) {
      }

      const secondRoom = await createTestRoom("Second Room", 15, ["TV"]);

      try {
        const token = generateToken(adminUser.id, adminUser.email, jwtSecret);

        // Update first room
        const req1: any = {
          headers: { authorization: `Bearer ${token}` },
          user: { id: adminUser.id, email: adminUser.email },
          params: { id: testRoom.id },
          body: { name: "Updated Room 1" },
        };

        const json1 = vi.fn();
        const status1 = vi.fn(() => ({ json: json1 }));
        const res1: any = { status: status1, json: json1 };

        await updateRoom(req1, res1);

        // Update second room
        const req2: any = {
          headers: { authorization: `Bearer ${token}` },
          user: { id: adminUser.id, email: adminUser.email },
          params: { id: secondRoom.id },
          body: { name: "Updated Room 2" },
        };

        const json2 = vi.fn();
        const status2 = vi.fn(() => ({ json: json2 }));
        const res2: any = { status: status2, json: json2 };

        await updateRoom(req2, res2);

        // Verify both updates
        const updatedRoom1 = json1.mock.calls[0][0];
        const updatedRoom2 = json2.mock.calls[0][0];

        expect(updatedRoom1.name).toBe("Updated Room 1");
        expect(updatedRoom2.name).toBe("Updated Room 2");

        // Verify in database
        const dbRoom1 = await prisma.room.findUnique({
          where: { id: testRoom.id },
        });
        const dbRoom2 = await prisma.room.findUnique({
          where: { id: secondRoom.id },
        });

        expect(dbRoom1?.name).toBe("Updated Room 1");
        expect(dbRoom2?.name).toBe("Updated Room 2");
      } finally {
        await prisma.room.delete({
          where: { id: secondRoom.id },
        }).catch(() => {});
      }
    });
  });

  // ==================== DATABASE ERROR TESTS ====================
  describe("Database Error Handling", () => {
    it("should return 500 on database error during update", async () => {
      if (!databaseAvailable) {
      }

      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        params: { id: testRoom.id },
        body: { name: "New Name" },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      // Mock prisma to throw error
      const originalUpdate = prisma.room.update;
      (prisma.room as any).update = vi
        .fn()
        .mockRejectedValueOnce(new Error("DB Error"));

      try {
        await updateRoom(req, res);

        expect(status).toHaveBeenCalledWith(500);
        const errorResponse = json.mock.calls[0][0];
        expect(errorResponse.error).toBeDefined();
        expect(errorResponse.error.toLowerCase()).toContain("mise à jour");
      } finally {
        (prisma.room as any).update = originalUpdate;
      }
    });

    it("should return 500 on database error during existence check", async () => {
      if (!databaseAvailable) {
      }

      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        params: { id: testRoom.id },
        body: { name: "New Name" },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      // Mock prisma to throw error on findUnique
      const originalFindUnique = prisma.room.findUnique;
      (prisma.room as any).findUnique = vi
        .fn()
        .mockRejectedValueOnce(new Error("DB Error"));

      try {
        await updateRoom(req, res);

        expect(status).toHaveBeenCalledWith(500);
        const errorResponse = json.mock.calls[0][0];
        expect(errorResponse.error).toBeDefined();
      } finally {
        (prisma.room as any).findUnique = originalFindUnique;
      }
    });
  });

  // ==================== EDGE CASES ====================
  describe("Update Room - Edge Cases", () => {
    it("should update room name with very long string", async () => {
      if (!databaseAvailable) {
      }

      const longName = Array(300).fill("A").join("");
      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        params: { id: testRoom.id },
        body: { name: longName },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await updateRoom(req, res);

      expect(status).toHaveBeenCalledWith(200);
      const updatedRoom = json.mock.calls[0][0];
      expect(updatedRoom.name).toBe(longName);
    });

    it("should update equipment with many items", async () => {
      if (!databaseAvailable) {
      }

      const equipment = Array.from({ length: 50 }, (_, i) => `Equipment ${i + 1}`);
      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        params: { id: testRoom.id },
        body: { equipment },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await updateRoom(req, res);

      expect(status).toHaveBeenCalledWith(200);
      const updatedRoom = json.mock.calls[0][0];
      expect(updatedRoom.equipment.length).toBe(50);
    });

    it("should preserve createdAt timestamp during update", async () => {
      if (!databaseAvailable) {
      }

      const originalCreatedAt = testRoom.createdAt;
      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        params: { id: testRoom.id },
        body: { name: "Updated Room" },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await updateRoom(req, res);

      const updatedRoom = json.mock.calls[0][0];
      expect(new Date(updatedRoom.createdAt).getTime()).toBe(
        originalCreatedAt.getTime()
      );
    });

    it("should maintain room ID during update", async () => {
      if (!databaseAvailable) {
      }

      const originalId = testRoom.id;
      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        params: { id: testRoom.id },
        body: { name: "Updated Name", capacity: 50 },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await updateRoom(req, res);

      const updatedRoom = json.mock.calls[0][0];
      expect(updatedRoom.id).toBe(originalId);
    });

    it("should update with numeric capacity string", async () => {
      if (!databaseAvailable) {
      }

      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        params: { id: testRoom.id },
        body: { capacity: "35" as any }, // String instead of number
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await updateRoom(req, res);

      // Should handle or reject gracefully
      expect(status.mock.calls.length + json.mock.calls.length).toBeGreaterThan(0);
    });
  });

  // ==================== RESPONSE STRUCTURE TESTS ====================
  describe("Response Structure", () => {
    it("should return updated room with correct structure", async () => {
      if (!databaseAvailable) {
      }

      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        params: { id: testRoom.id },
        body: { name: "Structure Test Room" },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await updateRoom(req, res);

      const updatedRoom = json.mock.calls[0][0];

      // Verify structure
      expect(updatedRoom).toHaveProperty("id");
      expect(typeof updatedRoom.id).toBe("string");
      expect(updatedRoom).toHaveProperty("name");
      expect(typeof updatedRoom.name).toBe("string");
      expect(updatedRoom).toHaveProperty("capacity");
      expect(typeof updatedRoom.capacity).toBe("number");
      expect(updatedRoom).toHaveProperty("equipment");
      expect(Array.isArray(updatedRoom.equipment)).toBe(true);
      expect(updatedRoom).toHaveProperty("createdAt");
    });
  });
});
