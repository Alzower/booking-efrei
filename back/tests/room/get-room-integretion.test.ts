import { vi, describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, skip } from "vitest";
import prisma from "../../db/prisma.ts";
import { getRooms, getRoomById, getRoomAvailableByIdAndDate } from "../../controller/room/get-room.ts";

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

// Helper to create test user for reservations
async function createTestUser(email: string) {
  const bcrypt = await import("bcrypt");
  const hashedPassword = await bcrypt.default.hash("TestPass123!", 10);
  return await prisma.user.create({
    data: {
      email,
      name: "Test User",
      password: hashedPassword,
      role: "USER",
    },
  });
}

// Helper to create test reservation
async function createTestReservation(
  roomId: string,
  userId: string,
  startTime: Date,
  endTime: Date,
  status: string = "confirmed"
) {
  return await prisma.reservation.create({
    data: {
      roomId,
      userId,
      startTime,
      endTime,
      status,
    },
  });
}

describe("Get Room Integration Tests", () => {
  let testRoom: any;
  let testRoom2: any;
  let testUser: any;
  let databaseAvailable = true;

  beforeAll(async () => {
    databaseAvailable = await isDatabaseAvailable();
    if (!databaseAvailable) {
      console.warn("⚠️  DATABASE NOT AVAILABLE FOR GET-ROOM INTEGRATION TESTS");
    } else {
      console.log("\n✅ Database connection successful. Running get-room integration tests...\n");
    }
  });

  beforeEach(async () => {
    if (!databaseAvailable) return;

    // Create test rooms
    testRoom = await createTestRoom(`Room ${Date.now()}`, 10, ["Projector", "Whiteboard"]);
    testRoom2 = await createTestRoom(`Room2 ${Date.now()}`, 20, ["TV", "Microphone"]);
    
    // Create test user for reservations
    testUser = await createTestUser(`user-${Date.now()}@example.com`);
  });

  afterEach(async () => {
    if (!databaseAvailable) return;

    // Clean up
    try {
      if (testRoom?.id) {
        await prisma.reservation.deleteMany({
          where: { roomId: testRoom.id },
        });
        await prisma.room.delete({
          where: { id: testRoom.id },
        }).catch(() => {});
      }
    } catch (error) {
      // Ignore
    }

    try {
      if (testRoom2?.id) {
        await prisma.reservation.deleteMany({
          where: { roomId: testRoom2.id },
        });
        await prisma.room.delete({
          where: { id: testRoom2.id },
        }).catch(() => {});
      }
    } catch (error) {
      // Ignore
    }

    try {
      if (testUser?.id) {
        await prisma.user.delete({
          where: { id: testUser.id },
        }).catch(() => {});
      }
    } catch (error) {
      // Ignore
    }
  });

  // ==================== getRooms() Tests ====================
  describe("getRooms (GET /)", () => {
    it("should return all rooms successfully", async () => {
      if (!databaseAvailable) {
        skip();
      }

      const req: any = { query: {} };
      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await getRooms(req, res);

      expect(status).toHaveBeenCalledWith(200);
      expect(json).toHaveBeenCalled();
      const rooms = json.mock.calls[0][0];
      expect(Array.isArray(rooms)).toBe(true);
      expect(rooms.length).toBeGreaterThanOrEqual(2); // At least 2 test rooms
    });

    it("should return array with correct room properties", async () => {
      if (!databaseAvailable) {
        skip();
      }

      const req: any = { query: {} };
      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await getRooms(req, res);

      const rooms = json.mock.calls[0][0];
      expect(rooms.length).toBeGreaterThan(0);

      const room = rooms[0];
      expect(room).toHaveProperty("id");
      expect(room).toHaveProperty("name");
      expect(room).toHaveProperty("capacity");
      expect(room).toHaveProperty("equipment");
      expect(room).toHaveProperty("createdAt");
    });

    it("should include both test rooms in results", async () => {
      if (!databaseAvailable) {
        skip();
      }

      const req: any = { query: {} };
      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await getRooms(req, res);

      const rooms = json.mock.calls[0][0];
      const foundRoom1 = rooms.find((r: any) => r.id === testRoom.id);
      const foundRoom2 = rooms.find((r: any) => r.id === testRoom2.id);

      expect(foundRoom1).toBeDefined();
      expect(foundRoom2).toBeDefined();
      expect(foundRoom1.name).toBe(testRoom.name);
      expect(foundRoom2.name).toBe(testRoom2.name);
    });

    it("should return correct equipment arrays for each room", async () => {
      if (!databaseAvailable) {
        skip();
      }

      const req: any = { query: {} };
      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await getRooms(req, res);

      const rooms = json.mock.calls[0][0];
      const foundRoom1 = rooms.find((r: any) => r.id === testRoom.id);
      const foundRoom2 = rooms.find((r: any) => r.id === testRoom2.id);

      expect(foundRoom1.equipment).toEqual(["Projector", "Whiteboard"]);
      expect(foundRoom2.equipment).toEqual(["TV", "Microphone"]);
    });

    it("should return correct capacity for each room", async () => {
      if (!databaseAvailable) {
        skip();
      }

      const req: any = { query: {} };
      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await getRooms(req, res);

      const rooms = json.mock.calls[0][0];
      const foundRoom1 = rooms.find((r: any) => r.id === testRoom.id);
      const foundRoom2 = rooms.find((r: any) => r.id === testRoom2.id);

      expect(foundRoom1.capacity).toBe(10);
      expect(foundRoom2.capacity).toBe(20);
    });

    it("should return rooms with proper createdAt timestamps", async () => {
      if (!databaseAvailable) {
        skip();
      }

      const req: any = { query: {} };
      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await getRooms(req, res);

      const rooms = json.mock.calls[0][0];
      const foundRoom = rooms.find((r: any) => r.id === testRoom.id);

      expect(foundRoom.createdAt).toBeDefined();
      const createdDate = new Date(foundRoom.createdAt);
      expect(createdDate.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it("should handle database error gracefully", async () => {
      if (!databaseAvailable) {
        skip();
      }

      const req: any = { query: {} };
      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      // Mock prisma to throw error
      const originalFindMany = prisma.room.findMany;
      (prisma.room as any).findMany = vi.fn().mockRejectedValueOnce(new Error("DB Error"));

      try {
        await getRooms(req, res);

        expect(status).toHaveBeenCalledWith(500);
        expect(json).toHaveBeenCalledWith(
          expect.objectContaining({
            error: expect.stringContaining("récupération"),
          })
        );
      } finally {
        (prisma.room as any).findMany = originalFindMany;
      }
    });
  });

  // ==================== getRoomById() Tests ====================
  describe("getRoomById (GET /:id)", () => {
    it("should return room by id successfully", async () => {
      if (!databaseAvailable) {
        skip();
      }

      const req: any = { params: { id: testRoom.id } };
      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await getRoomById(req, res);

      expect(status).toHaveBeenCalledWith(200);
      expect(json).toHaveBeenCalled();
      const room = json.mock.calls[0][0];
      expect(room.id).toBe(testRoom.id);
      expect(room.name).toBe(testRoom.name);
    });

    it("should return room with all correct fields", async () => {
      if (!databaseAvailable) {
        skip();
      }

      const req: any = { params: { id: testRoom.id } };
      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await getRoomById(req, res);

      const room = json.mock.calls[0][0];
      expect(room).toHaveProperty("id");
      expect(room).toHaveProperty("name");
      expect(room).toHaveProperty("capacity");
      expect(room).toHaveProperty("equipment");
      expect(room).toHaveProperty("createdAt");
      expect(room.capacity).toBe(10);
      expect(room.equipment).toEqual(["Projector", "Whiteboard"]);
    });

    it("should return 404 for non-existent room", async () => {
      if (!databaseAvailable) {
        skip();
      }

      const req: any = { params: { id: "non-existent-id-12345" } };
      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await getRoomById(req, res);

      expect(status).toHaveBeenCalledWith(404);
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining("non trouvée"),
        })
      );
    });

    it("should return correct room among multiple rooms", async () => {
      if (!databaseAvailable) {
        skip();
      }

      const req: any = { params: { id: testRoom2.id } };
      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await getRoomById(req, res);

      const room = json.mock.calls[0][0];
      expect(room.id).toBe(testRoom2.id);
      expect(room.name).toBe(testRoom2.name);
      expect(room.capacity).toBe(20);
      expect(room.equipment).toEqual(["TV", "Microphone"]);
    });

    it("should handle database error for getRoomById", async () => {
      if (!databaseAvailable) {
        skip();
      }

      const req: any = { params: { id: testRoom.id } };
      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      // Mock prisma to throw error
      const originalFindUnique = prisma.room.findUnique;
      (prisma.room as any).findUnique = vi.fn().mockRejectedValueOnce(new Error("DB Error"));

      try {
        await getRoomById(req, res);

        expect(status).toHaveBeenCalledWith(500);
        expect(json).toHaveBeenCalledWith(
          expect.objectContaining({
            error: expect.stringContaining("récupération"),
          })
        );
      } finally {
        (prisma.room as any).findUnique = originalFindUnique;
      }
    });
  });

  // ==================== getRoomAvailableByIdAndDate() Tests ====================
  describe("getRoomAvailableByIdAndDate (GET /:id/availability?date=...)", () => {
    it("should return available time slots when room is fully available", async () => {
      if (!databaseAvailable) {
        skip();
      }

      const date = new Date();
      const dateString = date.toISOString();

      const req: any = {
        params: { id: testRoom.id },
        query: { date: dateString },
      };
      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await getRoomAvailableByIdAndDate(req, res);

      expect(status).toHaveBeenCalledWith(200);
      expect(json).toHaveBeenCalled();
      const response = json.mock.calls[0][0];

      expect(response).toHaveProperty("message");
      expect(response.message).toContain("disponible");
      expect(response).toHaveProperty("availableTimes");
      expect(Array.isArray(response.availableTimes)).toBe(true);
      expect(response.availableTimes.length).toBe(1); // Entire day available
    });

    it("should return available time slots with correct start and end times", async () => {
      if (!databaseAvailable) {
        skip();
      }

      const date = new Date();
      const dateString = date.toISOString();

      const req: any = {
        params: { id: testRoom.id },
        query: { date: dateString },
      };
      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await getRoomAvailableByIdAndDate(req, res);

      const response = json.mock.calls[0][0];
      const availableTimes = response.availableTimes;

      expect(availableTimes.length).toBeGreaterThan(0);
      for (const slot of availableTimes) {
        expect(slot).toHaveProperty("startTime");
        expect(slot).toHaveProperty("endTime");
        const startDate = new Date(slot.startTime);
        const endDate = new Date(slot.endTime);
        expect(startDate.getTime()).toBeLessThan(endDate.getTime());
      }
    });

    it("should return 400 when date parameter is missing", async () => {
      if (!databaseAvailable) {
        skip();
      }

      const req: any = {
        params: { id: testRoom.id },
        query: {}, // No date parameter
      };
      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await getRoomAvailableByIdAndDate(req, res);

      expect(status).toHaveBeenCalledWith(400);
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining("date"),
        })
      );
    });

    it("should return 404 for non-existent room", async () => {
      if (!databaseAvailable) {
        skip();
      }

      const date = new Date();
      const dateString = date.toISOString();

      const req: any = {
        params: { id: "non-existent-id-12345" },
        query: { date: dateString },
      };
      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await getRoomAvailableByIdAndDate(req, res);

      expect(status).toHaveBeenCalledWith(404);
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining("non trouvée"),
        })
      );
    });

    it("should exclude reserved time slots from availability", async () => {
      if (!databaseAvailable) {
        skip();
      }

      const date = new Date();
      date.setHours(0, 0, 0, 0);

      // Create reservation for 10:00 - 12:00
      const reservationStart = new Date(date);
      reservationStart.setHours(10, 0, 0, 0);
      const reservationEnd = new Date(date);
      reservationEnd.setHours(12, 0, 0, 0);

      await createTestReservation(
        testRoom.id,
        testUser.id,
        reservationStart,
        reservationEnd
      );

      const req: any = {
        params: { id: testRoom.id },
        query: { date: date.toISOString() },
      };
      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await getRoomAvailableByIdAndDate(req, res);

      expect(status).toHaveBeenCalledWith(200);
      const response = json.mock.calls[0][0];
      const availableTimes = response.availableTimes;

      // Should have time slots before and after the reservation
      expect(availableTimes.length).toBeGreaterThan(1);

      // Verify no available slot overlaps with reservation
      for (const slot of availableTimes) {
        const slotStart = new Date(slot.startTime);
        const slotEnd = new Date(slot.endTime);

        const hasOverlap =
          slotStart < reservationEnd && slotEnd > reservationStart;
        expect(hasOverlap).toBe(false);
      }
    });

    it("should handle multiple reservations correctly", async () => {
      if (!databaseAvailable) {
        skip();
      }

      const date = new Date();
      date.setHours(0, 0, 0, 0);

      // Create multiple reservations
      const reservation1Start = new Date(date);
      reservation1Start.setHours(8, 0, 0, 0);
      const reservation1End = new Date(date);
      reservation1End.setHours(10, 0, 0, 0);

      const reservation2Start = new Date(date);
      reservation2Start.setHours(12, 0, 0, 0);
      const reservation2End = new Date(date);
      reservation2End.setHours(14, 0, 0, 0);

      const reservation3Start = new Date(date);
      reservation3Start.setHours(16, 0, 0, 0);
      const reservation3End = new Date(date);
      reservation3End.setHours(18, 0, 0, 0);

      await createTestReservation(
        testRoom.id,
        testUser.id,
        reservation1Start,
        reservation1End
      );
      await createTestReservation(
        testRoom.id,
        testUser.id,
        reservation2Start,
        reservation2End
      );
      await createTestReservation(
        testRoom.id,
        testUser.id,
        reservation3Start,
        reservation3End
      );

      const req: any = {
        params: { id: testRoom.id },
        query: { date: date.toISOString() },
      };
      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await getRoomAvailableByIdAndDate(req, res);

      const response = json.mock.calls[0][0];
      const availableTimes = response.availableTimes;

      // Should have available slots: 00:00-08:00, 10:00-12:00, 14:00-16:00, 18:00-23:59
      expect(availableTimes.length).toBe(4);
    });

    it("should handle room fully booked", async () => {
      if (!databaseAvailable) {
        skip();
      }

      const date = new Date();
      date.setHours(0, 0, 0, 0);

      // Create reservation for entire day
      const reservationStart = new Date(date);
      reservationStart.setHours(0, 0, 0, 0);
      const reservationEnd = new Date(date);
      reservationEnd.setHours(23, 59, 59, 999);

      await createTestReservation(
        testRoom.id,
        testUser.id,
        reservationStart,
        reservationEnd
      );

      const req: any = {
        params: { id: testRoom.id },
        query: { date: date.toISOString() },
      };
      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      await getRoomAvailableByIdAndDate(req, res);

      const response = json.mock.calls[0][0];
      const availableTimes = response.availableTimes;

      // Should have no available time slots
      expect(availableTimes.length).toBe(0);
    });

    it("should handle availability check for different dates", async () => {
      if (!databaseAvailable) {
        skip();
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Create reservation today
      const todayStart = new Date(today);
      todayStart.setHours(10, 0, 0, 0);
      const todayEnd = new Date(today);
      todayEnd.setHours(12, 0, 0, 0);

      await createTestReservation(
        testRoom.id,
        testUser.id,
        todayStart,
        todayEnd
      );

      // Check availability for today
      const req1: any = {
        params: { id: testRoom.id },
        query: { date: today.toISOString() },
      };
      const json1 = vi.fn();
      const status1 = vi.fn(() => ({ json: json1 }));
      const res1: any = { status: status1, json: json1 };

      await getRoomAvailableByIdAndDate(req1, res1);

      const response1 = json1.mock.calls[0][0];
      expect(response1.availableTimes.length).toBeGreaterThan(0); // Has available slots

      // Check availability for tomorrow
      const req2: any = {
        params: { id: testRoom.id },
        query: { date: tomorrow.toISOString() },
      };
      const json2 = vi.fn();
      const status2 = vi.fn(() => ({ json: json2 }));
      const res2: any = { status: status2, json: json2 };

      await getRoomAvailableByIdAndDate(req2, res2);

      const response2 = json2.mock.calls[0][0];
      expect(response2.availableTimes.length).toBe(1); // Entire day available (no reservations)
    });

    it("should handle database error gracefully", async () => {
      if (!databaseAvailable) {
        skip();
      }

      const date = new Date();
      const dateString = date.toISOString();

      const req: any = {
        params: { id: testRoom.id },
        query: { date: dateString },
      };
      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      // Mock prisma to throw error
      const originalFindUnique = prisma.room.findUnique;
      (prisma.room as any).findUnique = vi.fn().mockRejectedValueOnce(new Error("DB Error"));

      try {
        await getRoomAvailableByIdAndDate(req, res);

        expect(status).toHaveBeenCalledWith(500);
        expect(json).toHaveBeenCalledWith(
          expect.objectContaining({
            error: expect.stringContaining("récupération"),
          })
        );
      } finally {
        (prisma.room as any).findUnique = originalFindUnique;
      }
    });
  });

  // ==================== Edge Cases ====================
  describe("Get Room - Edge Cases", () => {
    it("should handle room with no equipment", async () => {
      if (!databaseAvailable) {
        skip();
      }

      const emptyEquipmentRoom = await createTestRoom("Empty Room", 5, []);

      try {
        const req: any = { params: { id: emptyEquipmentRoom.id } };
        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const res: any = { status, json };

        await getRoomById(req, res);

        const room = json.mock.calls[0][0];
        expect(room.equipment).toEqual([]);
      } finally {
        await prisma.room.delete({
          where: { id: emptyEquipmentRoom.id },
        }).catch(() => {});
      }
    });

    it("should handle room with capacity of 1", async () => {
      if (!databaseAvailable) {
        skip();
      }

      const smallRoom = await createTestRoom("Phone Booth", 1, ["Phone"]);

      try {
        const req: any = { params: { id: smallRoom.id } };
        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const res: any = { status, json };

        await getRoomById(req, res);

        const room = json.mock.calls[0][0];
        expect(room.capacity).toBe(1);
      } finally {
        await prisma.room.delete({
          where: { id: smallRoom.id },
        }).catch(() => {});
      }
    });

    it("should handle room with very large capacity", async () => {
      if (!databaseAvailable) {
        skip();
      }

      const largeRoom = await createTestRoom("Auditorium", 5000, ["Projection", "Sound"]);

      try {
        const req: any = { params: { id: largeRoom.id } };
        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const res: any = { status, json };

        await getRoomById(req, res);

        const room = json.mock.calls[0][0];
        expect(room.capacity).toBe(5000);
      } finally {
        await prisma.room.delete({
          where: { id: largeRoom.id },
        }).catch(() => {});
      }
    });

    it("should handle invalid date format for availability", async () => {
      if (!databaseAvailable) {
        skip();
      }

      const req: any = {
        params: { id: testRoom.id },
        query: { date: "invalid-date-format" },
      };
      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status, json };

      // Should handle gracefully (may throw error or return empty)
      await getRoomAvailableByIdAndDate(req, res);

      // Either returns 500 error or handles it
      expect(status.mock.calls.length + json.mock.calls.length).toBeGreaterThan(0);
    });
  });
});
