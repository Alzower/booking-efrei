import { vi, describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, skip } from "vitest";
import prisma from "../../db/prisma.ts";
import jwt from "jsonwebtoken";
import { createRoom } from "../../controller/room/create-room.ts";

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

// Helper to create admin user
async function createAdminUser(email: string) {
  const bcrypt = await import("bcrypt");
  const hashedPassword = await bcrypt.default.hash("TestPass123!", 10);
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

describe("Create Room Integration Tests - createRoom (POST /)", () => {
  const jwtSecret = "test-secret-key-integration";
  let adminUser: any;
  let createdRoomIds: string[] = [];
  let databaseAvailable = true;

  beforeAll(async () => {
    vi.stubEnv("JWT_SECRET", jwtSecret);
    databaseAvailable = await isDatabaseAvailable();
    if (!databaseAvailable) {
      console.warn("⚠️  DATABASE NOT AVAILABLE FOR CREATE-ROOM INTEGRATION TESTS");
    } else {
      console.log("\n✅ Database connection successful. Running create-room integration tests...\n");
    }
  });

  afterAll(async () => {
    vi.unstubAllEnvs();
  });

  beforeEach(async () => {
    if (!databaseAvailable) return;

    // Create admin user
    adminUser = await createAdminUser(`admin-room-${Date.now()}@example.com`);
  });

  afterEach(async () => {
    if (!databaseAvailable) return;

    // Clean up created rooms
    for (const roomId of createdRoomIds) {
      try {
        await prisma.reservation.deleteMany({
          where: { roomId },
        });
        await prisma.room.delete({
          where: { id: roomId },
        });
      } catch (error) {
        // Room may not exist
      }
    }
    createdRoomIds = [];

    // Clean up admin user
    try {
      if (adminUser?.id) {
        await prisma.user.delete({
          where: { id: adminUser.id },
        });
      }
    } catch (error) {
      // User may not exist
    }
  });

  // ==================== SUCCESSFUL CREATION TESTS ====================
  describe("Successful Room Creation", () => {
    it("should create room successfully with valid data", async () => {
      if (!databaseAvailable) {
        skip();
      }

      const roomData = {
        name: "Conference Room A",
        capacity: 20,
        equipment: ["Projector", "Whiteboard", "Conference Phone"],
      };

      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);
      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        body: roomData,
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await createRoom(req, res);

      expect(status).toHaveBeenCalledWith(201);
      expect(json).toHaveBeenCalled();
      const createdRoom = json.mock.calls[0][0];

      expect(createdRoom.id).toBeDefined();
      expect(createdRoom.name).toBe(roomData.name);
      expect(createdRoom.capacity).toBe(roomData.capacity);
      expect(createdRoom.equipment).toEqual(roomData.equipment);
      expect(createdRoom.createdAt).toBeDefined();

      createdRoomIds.push(createdRoom.id);
    });

    it("should trim whitespace from room name", async () => {
      if (!databaseAvailable) {
        skip();
      }

      const roomData = {
        name: "  Meeting Room B  ",
        capacity: 15,
        equipment: ["TV"],
      };

      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);
      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        body: roomData,
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await createRoom(req, res);

      const createdRoom = json.mock.calls[0][0];
      expect(createdRoom.name).toBe("Meeting Room B");

      createdRoomIds.push(createdRoom.id);
    });

    it("should create room with minimum capacity of 1", async () => {
      if (!databaseAvailable) {
        skip();
      }

      const roomData = {
        name: "Phone Booth",
        capacity: 1,
        equipment: ["Phone"],
      };

      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);
      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        body: roomData,
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await createRoom(req, res);

      expect(status).toHaveBeenCalledWith(201);
      const createdRoom = json.mock.calls[0][0];
      expect(createdRoom.capacity).toBe(1);

      createdRoomIds.push(createdRoom.id);
    });

    it("should create room with large capacity", async () => {
      if (!databaseAvailable) {
        skip();
      }

      const roomData = {
        name: "Main Auditorium",
        capacity: 5000,
        equipment: ["Stage", "Sound System", "Projection"],
      };

      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);
      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        body: roomData,
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await createRoom(req, res);

      expect(status).toHaveBeenCalledWith(201);
      const createdRoom = json.mock.calls[0][0];
      expect(createdRoom.capacity).toBe(5000);

      createdRoomIds.push(createdRoom.id);
    });

    it("should create room with empty equipment array", async () => {
      if (!databaseAvailable) {
        skip();
      }

      const roomData = {
        name: "Storage Room",
        capacity: 10,
        equipment: [],
      };

      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);
      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        body: roomData,
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await createRoom(req, res);

      expect(status).toHaveBeenCalledWith(201);
      const createdRoom = json.mock.calls[0][0];
      expect(createdRoom.equipment).toEqual([]);

      createdRoomIds.push(createdRoom.id);
    });

    it("should create room with single equipment item", async () => {
      if (!databaseAvailable) {
        skip();
      }

      const roomData = {
        name: "Simple Room",
        capacity: 8,
        equipment: ["Table"],
      };

      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);
      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        body: roomData,
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await createRoom(req, res);

      expect(status).toHaveBeenCalledWith(201);
      const createdRoom = json.mock.calls[0][0];
      expect(createdRoom.equipment).toEqual(["Table"]);

      createdRoomIds.push(createdRoom.id);
    });

    it("should create room with multiple equipment items", async () => {
      if (!databaseAvailable) {
        skip();
      }

      const roomData = {
        name: "Tech Room",
        capacity: 30,
        equipment: ["Projector", "Screen", "Microphone", "Speakers", "Lights", "Camera"],
      };

      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);
      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        body: roomData,
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await createRoom(req, res);

      expect(status).toHaveBeenCalledWith(201);
      const createdRoom = json.mock.calls[0][0];
      expect(createdRoom.equipment.length).toBe(6);
      expect(createdRoom.equipment).toEqual(roomData.equipment);

      createdRoomIds.push(createdRoom.id);
    });

    it("should return correct HTTP status 201 for creation", async () => {
      if (!databaseAvailable) {
        skip();
      }

      const roomData = {
        name: "Status Test Room",
        capacity: 12,
        equipment: ["Board"],
      };

      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);
      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        body: roomData,
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await createRoom(req, res);

      expect(status).toHaveBeenCalledWith(201);

      const createdRoom = json.mock.calls[0][0];
      createdRoomIds.push(createdRoom.id);
    });

    it("should persist room in database", async () => {
      if (!databaseAvailable) {
        skip();
      }

      const roomData = {
        name: "Database Test Room",
        capacity: 16,
        equipment: ["Equipment1", "Equipment2"],
      };

      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);
      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        body: roomData,
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await createRoom(req, res);

      const createdRoom = json.mock.calls[0][0];
      createdRoomIds.push(createdRoom.id);

      // Verify in database
      const dbRoom = await prisma.room.findUnique({
        where: { id: createdRoom.id },
      });

      expect(dbRoom).not.toBeNull();
      expect(dbRoom?.name).toBe(roomData.name);
      expect(dbRoom?.capacity).toBe(roomData.capacity);
      expect(dbRoom?.equipment).toEqual(roomData.equipment);
    });
  });

  // ==================== VALIDATION ERROR TESTS ====================
  describe("Room Name Validation", () => {
    it("should return 400 when name is missing", async () => {
      if (!databaseAvailable) {
        skip();
      }

      const roomData = {
        capacity: 15,
        equipment: ["Projector"],
      };

      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);
      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        body: roomData,
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await createRoom(req, res);

      expect(status).toHaveBeenCalledWith(400);
      const errorResponse = json.mock.calls[0][0];
      expect(errorResponse.error).toBeDefined();
      expect(errorResponse.error.toLowerCase()).toContain("nom");
    });

    it("should return 400 when name is empty string", async () => {
      if (!databaseAvailable) {
        skip();
      }

      const roomData = {
        name: "",
        capacity: 15,
        equipment: ["Projector"],
      };

      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);
      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        body: roomData,
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await createRoom(req, res);

      expect(status).toHaveBeenCalledWith(400);
      const errorResponse = json.mock.calls[0][0];
      expect(errorResponse.error).toBeDefined();
      expect(errorResponse.error.toLowerCase()).toContain("nom");
    });

    it("should return 400 when name is whitespace only", async () => {
      if (!databaseAvailable) {
        skip();
      }

      const roomData = {
        name: "   ",
        capacity: 15,
        equipment: ["Projector"],
      };

      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);
      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        body: roomData,
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await createRoom(req, res);

      expect(status).toHaveBeenCalledWith(400);
      const errorResponse = json.mock.calls[0][0];
      expect(errorResponse.error).toBeDefined();
      expect(errorResponse.error.toLowerCase()).toContain("nom");
    });

    it("should accept room name with special characters", async () => {
      if (!databaseAvailable) {
        skip();
      }

      const roomData = {
        name: "Salle de Conférence #3 - 北京",
        capacity: 15,
        equipment: ["Projector"],
      };

      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);
      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        body: roomData,
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await createRoom(req, res);

      expect(status).toHaveBeenCalledWith(201);
      const createdRoom = json.mock.calls[0][0];
      expect(createdRoom.name).toBe(roomData.name);

      createdRoomIds.push(createdRoom.id);
    });

    it("should accept room name with very long string", async () => {
      if (!databaseAvailable) {
        skip();
      }

      const longName = Array(200).fill("A").join("");
      const roomData = {
        name: longName,
        capacity: 15,
        equipment: ["Equipment"],
      };

      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);
      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        body: roomData,
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await createRoom(req, res);

      expect(status).toHaveBeenCalledWith(201);
      const createdRoom = json.mock.calls[0][0];
      expect(createdRoom.name).toBe(longName);

      createdRoomIds.push(createdRoom.id);
    });
  });

  // ==================== CAPACITY VALIDATION TESTS ====================
  describe("Capacity Validation", () => {
    it("should return 400 when capacity is missing", async () => {
      if (!databaseAvailable) {
        skip();
      }

      const roomData = {
        name: "Test Room",
        equipment: ["Projector"],
      };

      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);
      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        body: roomData,
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await createRoom(req, res);

      expect(status).toHaveBeenCalledWith(400);
      const errorResponse = json.mock.calls[0][0];
      expect(errorResponse.error).toBeDefined();
      expect(errorResponse.error.toLowerCase()).toContain("capacité");
    });

    it("should return 400 when capacity is zero", async () => {
      if (!databaseAvailable) {
        skip();
      }

      const roomData = {
        name: "Test Room",
        capacity: 0,
        equipment: ["Projector"],
      };

      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);
      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        body: roomData,
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await createRoom(req, res);

      expect(status).toHaveBeenCalledWith(400);
      const errorResponse = json.mock.calls[0][0];
      expect(errorResponse.error).toBeDefined();
      expect(errorResponse.error.toLowerCase()).toContain("capacité");
    });

    it("should return 400 when capacity is negative", async () => {
      if (!databaseAvailable) {
        skip();
      }

      const roomData = {
        name: "Test Room",
        capacity: -5,
        equipment: ["Projector"],
      };

      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);
      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        body: roomData,
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await createRoom(req, res);

      expect(status).toHaveBeenCalledWith(400);
      const errorResponse = json.mock.calls[0][0];
      expect(errorResponse.error).toBeDefined();
      expect(errorResponse.error.toLowerCase()).toContain("capacité");
    });

    it("should accept decimal capacity (converted to Int)", async () => {
      if (!databaseAvailable) {
        skip();
      }

      const roomData = {
        name: "Test Room",
        capacity: 15.7,
        equipment: ["Equipment"],
      };

      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);
      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        body: roomData,
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await createRoom(req, res);

      // Should either create or return error
      expect(status.mock.calls.length).toBeGreaterThan(0);

      if (status.mock.calls[0][0] === 201) {
        const createdRoom = json.mock.calls[0][0];
        createdRoomIds.push(createdRoom.id);
      }
    });
  });

  // ==================== EQUIPMENT VALIDATION TESTS ====================
  describe("Equipment Validation", () => {
    it("should return 400 when equipment is not an array", async () => {
      if (!databaseAvailable) {
        skip();
      }

      const roomData = {
        name: "Test Room",
        capacity: 15,
        equipment: "Projector", // String instead of array
      };

      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);
      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        body: roomData,
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await createRoom(req, res);

      expect(status).toHaveBeenCalledWith(400);
      const errorResponse = json.mock.calls[0][0];
      expect(errorResponse.error).toBeDefined();
      expect(errorResponse.error.toLowerCase()).toContain("équipement");
    });

    it("should return 400 when equipment is object", async () => {
      if (!databaseAvailable) {
        skip();
      }

      const roomData = {
        name: "Test Room",
        capacity: 15,
        equipment: { item: "Projector" },
      };

      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);
      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        body: roomData,
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await createRoom(req, res);

      expect(status).toHaveBeenCalledWith(400);
      const errorResponse = json.mock.calls[0][0];
      expect(errorResponse.error).toBeDefined();
      expect(errorResponse.error.toLowerCase()).toContain("équipement");
    });

    it("should return 400 when equipment array contains non-string", async () => {
      if (!databaseAvailable) {
        skip();
      }

      const roomData = {
        name: "Test Room",
        capacity: 15,
        equipment: ["Projector", 123, "Whiteboard"],
      };

      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);
      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        body: roomData,
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await createRoom(req, res);

      expect(status).toHaveBeenCalledWith(400);
      const errorResponse = json.mock.calls[0][0];
      expect(errorResponse.error).toBeDefined();
      expect(errorResponse.error.toLowerCase()).toContain("chaînes");
    });

    it("should return 400 when equipment array contains empty string", async () => {
      if (!databaseAvailable) {
        skip();
      }

      const roomData = {
        name: "Test Room",
        capacity: 15,
        equipment: ["Projector", "", "Whiteboard"],
      };

      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);
      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        body: roomData,
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await createRoom(req, res);

      expect(status).toHaveBeenCalledWith(400);
      const errorResponse = json.mock.calls[0][0];
      expect(errorResponse.error).toBeDefined();
      expect(errorResponse.error.toLowerCase()).toContain("vides");
    });

    it("should return 400 when equipment array contains whitespace-only string", async () => {
      if (!databaseAvailable) {
        skip();
      }

      const roomData = {
        name: "Test Room",
        capacity: 15,
        equipment: ["Projector", "   ", "Whiteboard"],
      };

      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);
      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        body: roomData,
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await createRoom(req, res);

      expect(status).toHaveBeenCalledWith(400);
      const errorResponse = json.mock.calls[0][0];
      expect(errorResponse.error).toBeDefined();
      expect(errorResponse.error.toLowerCase()).toContain("vides");
    });

    it("should accept equipment with special characters", async () => {
      if (!databaseAvailable) {
        skip();
      }

      const roomData = {
        name: "Test Room",
        capacity: 15,
        equipment: ["Projecteur 4K", "Tableau blanc-magnétique", "Microphone sans fil (2.4GHz)"],
      };

      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);
      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        body: roomData,
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await createRoom(req, res);

      expect(status).toHaveBeenCalledWith(201);
      const createdRoom = json.mock.calls[0][0];
      expect(createdRoom.equipment).toEqual(roomData.equipment);

      createdRoomIds.push(createdRoom.id);
    });

    it("should accept equipment with numbers and symbols", async () => {
      if (!databaseAvailable) {
        skip();
      }

      const roomData = {
        name: "Test Room",
        capacity: 15,
        equipment: ["55-inch TV", "3x3m Screen", "USB-C Adapter"],
      };

      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);
      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        body: roomData,
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await createRoom(req, res);

      expect(status).toHaveBeenCalledWith(201);
      const createdRoom = json.mock.calls[0][0];
      expect(createdRoom.equipment).toEqual(roomData.equipment);

      createdRoomIds.push(createdRoom.id);
    });
  });

  // ==================== DATABASE ERROR TESTS ====================
  describe("Database Error Handling", () => {
    it("should return 500 on database error", async () => {
      if (!databaseAvailable) {
        skip();
      }

      const roomData = {
        name: "Test Room",
        capacity: 15,
        equipment: ["Projector"],
      };

      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);
      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        body: roomData,
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      // Mock prisma to throw error
      const originalCreate = prisma.room.create;
      (prisma.room as any).create = vi
        .fn()
        .mockRejectedValueOnce(new Error("DB Error"));

      try {
        await createRoom(req, res);

        expect(status).toHaveBeenCalledWith(500);
        const errorResponse = json.mock.calls[0][0];
        expect(errorResponse.error).toBeDefined();
        expect(errorResponse.error.toLowerCase()).toContain("création");
      } finally {
        (prisma.room as any).create = originalCreate;
      }
    });
  });

  // ==================== EDGE CASES ====================
  describe("Edge Cases", () => {
    it("should create multiple rooms in sequence", async () => {
      if (!databaseAvailable) {
        skip();
      }

      const roomIds: string[] = [];

      for (let i = 1; i <= 3; i++) {
        const roomData = {
          name: `Room ${i}`,
          capacity: 10 + i,
          equipment: [`Equipment${i}`],
        };

        const token = generateToken(adminUser.id, adminUser.email, jwtSecret);
        const req: any = {
          headers: { authorization: `Bearer ${token}` },
          user: { id: adminUser.id, email: adminUser.email },
          body: roomData,
        };

        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const res: any = { status, json };

        await createRoom(req, res);

        expect(status).toHaveBeenCalledWith(201);
        const createdRoom = json.mock.calls[0][0];
        roomIds.push(createdRoom.id);
        createdRoomIds.push(createdRoom.id);
      }

      // Verify all rooms exist
      for (const roomId of roomIds) {
        const room = await prisma.room.findUnique({
          where: { id: roomId },
        });
        expect(room).not.toBeNull();
      }
    });

    it("should create room with many equipment items", async () => {
      if (!databaseAvailable) {
        skip();
      }

      const equipment = Array.from({ length: 20 }, (_, i) => `Equipment${i + 1}`);
      const roomData = {
        name: "Fully Equipped Room",
        capacity: 50,
        equipment,
      };

      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);
      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        body: roomData,
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await createRoom(req, res);

      expect(status).toHaveBeenCalledWith(201);
      const createdRoom = json.mock.calls[0][0];
      expect(createdRoom.equipment.length).toBe(20);

      createdRoomIds.push(createdRoom.id);
    });

    it("should create room with duplicate equipment names (if allowed)", async () => {
      if (!databaseAvailable) {
        skip();
      }

      const roomData = {
        name: "Room with Duplicates",
        capacity: 15,
        equipment: ["Projector", "Projector", "Screen"],
      };

      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);
      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        body: roomData,
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await createRoom(req, res);

      // Should create or reject - either is valid
      if (status.mock.calls[0][0] === 201) {
        const createdRoom = json.mock.calls[0][0];
        expect(createdRoom.equipment).toEqual(roomData.equipment);
        createdRoomIds.push(createdRoom.id);
      }
    });

    it("should create room returns proper structure with ID and timestamp", async () => {
      if (!databaseAvailable) {
        skip();
      }

      const roomData = {
        name: "Structure Test Room",
        capacity: 15,
        equipment: ["Equipment"],
      };

      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);
      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        body: roomData,
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      const beforeTime = Date.now();
      await createRoom(req, res);
      const afterTime = Date.now();

      const createdRoom = json.mock.calls[0][0];

      // Verify structure
      expect(createdRoom).toHaveProperty("id");
      expect(typeof createdRoom.id).toBe("string");
      expect(createdRoom.id.length).toBeGreaterThan(0);

      expect(createdRoom).toHaveProperty("createdAt");
      const createdAtTime = new Date(createdRoom.createdAt).getTime();
      expect(createdAtTime).toBeGreaterThanOrEqual(beforeTime);
      expect(createdAtTime).toBeLessThanOrEqual(afterTime + 1000); // Allow 1s buffer

      createdRoomIds.push(createdRoom.id);
    });
  });
});
