import { vi, describe, it, expect, beforeEach, Mock } from "vitest";
import { prismaMock } from "../../db/prisma-mocks.ts";

// Mock prisma before importing controller
vi.mock("../../db/prisma.ts", () => ({
  default: prismaMock,
}));

import {
  getRooms,
  getRoomById,
  getRoomAvailableByIdAndDate,
} from "../../controller/room/get-room.ts";

describe("getRooms controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return all rooms successfully", async () => {
    const fakeRooms = [
      {
        id: "room1",
        name: "Conference Room A",
        capacity: 20,
        equipment: ["projector", "whiteboard"],
        createdAt: new Date(),
      },
      {
        id: "room2",
        name: "Conference Room B",
        capacity: 15,
        equipment: ["screen"],
        createdAt: new Date(),
      },
    ];

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const req: any = {};
    const res: any = { json, status };

    const prismaRoomFindManyMock = prismaMock.room.findMany as Mock;
    prismaRoomFindManyMock.mockResolvedValue(fakeRooms);

    await getRooms(req, res);

    expect(prismaRoomFindManyMock).toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith(fakeRooms);
  });

  it("should return empty array when no rooms exist", async () => {
    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const req: any = {};
    const res: any = { json, status };

    const prismaRoomFindManyMock = prismaMock.room.findMany as Mock;
    prismaRoomFindManyMock.mockResolvedValue([]);

    await getRooms(req, res);

    expect(prismaRoomFindManyMock).toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith([]);
  });

  it("should return 500 when database error occurs", async () => {
    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const req: any = {};
    const res: any = { status, json };

    const prismaRoomFindManyMock = prismaMock.room.findMany as Mock;
    prismaRoomFindManyMock.mockRejectedValue(
      new Error("Database error")
    );

    await getRooms(req, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      error: "Erreur lors de la récupération des salles",
    });
  });
});

describe("getRoomById controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return room successfully when found", async () => {
    const fakeRoom = {
      id: "room1",
      name: "Conference Room A",
      capacity: 20,
      equipment: ["projector", "whiteboard"],
      createdAt: new Date(),
    };

    const req: any = { params: { id: "room1" } };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { json, status };

    const prismaRoomFindUniqueMock = prismaMock.room.findUnique as Mock;
    prismaRoomFindUniqueMock.mockResolvedValue(fakeRoom);

    await getRoomById(req, res);

    expect(prismaRoomFindUniqueMock).toHaveBeenCalledWith({
      where: { id: "room1" },
    });
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith(fakeRoom);
  });

  it("should return 404 when room is not found", async () => {
    const req: any = { params: { id: "nonexistent" } };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status, json };

    const prismaRoomFindUniqueMock = prismaMock.room.findUnique as Mock;
    prismaRoomFindUniqueMock.mockResolvedValue(null);

    await getRoomById(req, res);

    expect(prismaRoomFindUniqueMock).toHaveBeenCalledWith({
      where: { id: "nonexistent" },
    });
    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({ error: "Salle non trouvée" });
  });

  it("should return 500 when database error occurs", async () => {
    const req: any = { params: { id: "room1" } };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status, json };

    const prismaRoomFindUniqueMock = prismaMock.room.findUnique as Mock;
    prismaRoomFindUniqueMock.mockRejectedValue(
      new Error("Database error")
    );

    await getRoomById(req, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      error: "Erreur lors de la récupération de la salle",
    });
  });

  it("should handle different room types with various equipment", async () => {
    const fakeRoom = {
      id: "room2",
      name: "Meeting Room",
      capacity: 10,
      equipment: ["tv", "conference_phone", "whiteboard"],
      createdAt: new Date(),
    };

    const req: any = { params: { id: "room2" } };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { json, status };

    const prismaRoomFindUniqueMock = prismaMock.room.findUnique as Mock;
    prismaRoomFindUniqueMock.mockResolvedValue(fakeRoom);

    await getRoomById(req, res);

    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith(fakeRoom);
  });
});

describe("getRoomAvailableByIdAndDate controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 400 when date query parameter is missing", async () => {
    const req: any = { params: { id: "room1" }, query: {} };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status, json };

    await getRoomAvailableByIdAndDate(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({ error: "La date est requise" });
  });

  it("should return 404 when room is not found", async () => {
    const req: any = {
      params: { id: "nonexistent" },
      query: { date: "2026-01-15" },
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status, json };

    const prismaRoomFindUniqueMock = prismaMock.room.findUnique as Mock;
    prismaRoomFindUniqueMock.mockResolvedValue(null);

    await getRoomAvailableByIdAndDate(req, res);

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({ error: "Salle non trouvée" });
  });

  it("should return full day available when no reservations exist", async () => {
    const fakeRoom = {
      id: "room1",
      name: "Conference Room",
      capacity: 20,
      equipment: ["projector"],
      createdAt: new Date(),
    };

    const req: any = {
      params: { id: "room1" },
      query: { date: "2026-01-15" },
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status, json };

    const prismaRoomFindUniqueMock = prismaMock.room.findUnique as Mock;
    const prismaReservationFindManyMock = prismaMock.reservation.findMany as Mock;
    prismaRoomFindUniqueMock.mockResolvedValue(fakeRoom);
    prismaReservationFindManyMock.mockResolvedValue([]);

    await getRoomAvailableByIdAndDate(req, res);

    expect(status).toHaveBeenCalledWith(200);
    const response = (json as Mock).mock.calls[0][0];
    expect(response.message).toBe("La salle est disponible toute la journée");
    expect(response.availableTimes).toHaveLength(1);
    expect(response.availableTimes[0]).toHaveProperty("startTime");
    expect(response.availableTimes[0]).toHaveProperty("endTime");
  });

  it("should return available time slots with one reservation in the middle", async () => {
    const fakeRoom = {
      id: "room1",
      name: "Conference Room",
      capacity: 20,
      equipment: ["projector"],
      createdAt: new Date(),
    };

    // Using Date constructor without timezone specifics
    const targetDate = new Date("2026-01-15");
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const reservationStart = new Date(targetDate);
    reservationStart.setHours(10, 0, 0, 0);
    const reservationEnd = new Date(targetDate);
    reservationEnd.setHours(12, 0, 0, 0);

    const fakeReservations = [
      {
        id: "res1",
        roomId: "room1",
        userId: "user1",
        startTime: reservationStart,
        endTime: reservationEnd,
        status: "confirmed",
        createdAt: new Date(),
      },
    ];

    const req: any = {
      params: { id: "room1" },
      query: { date: "2026-01-15" },
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status, json };

    const prismaRoomFindUniqueMock = prismaMock.room.findUnique as Mock;
    const prismaReservationFindManyMock = prismaMock.reservation.findMany as Mock;
    prismaRoomFindUniqueMock.mockResolvedValue(fakeRoom);
    prismaReservationFindManyMock.mockResolvedValue(
      fakeReservations
    );

    await getRoomAvailableByIdAndDate(req, res);

    expect(status).toHaveBeenCalledWith(200);
    const response = (json as Mock).mock.calls[0][0];
    expect(response.availableTimes).toHaveLength(2);
    // First slot: from day start to reservation start
    expect(response.availableTimes[0].startTime.getHours()).toBe(0);
    expect(response.availableTimes[0].endTime.getHours()).toBe(10);
    // Second slot: from reservation end to day end
    expect(response.availableTimes[1].startTime.getHours()).toBe(12);
    expect(response.availableTimes[1].endTime.getHours()).toBe(23);
  });

  it("should return available time slots with multiple reservations", async () => {
    const fakeRoom = {
      id: "room1",
      name: "Conference Room",
      capacity: 20,
      equipment: ["projector"],
      createdAt: new Date(),
    };

    const fakeReservations = [
      {
        id: "res1",
        roomId: "room1",
        userId: "user1",
        startTime: new Date("2026-01-15T09:00:00.000Z"),
        endTime: new Date("2026-01-15T11:00:00.000Z"),
        status: "confirmed",
        createdAt: new Date(),
      },
      {
        id: "res2",
        roomId: "room1",
        userId: "user2",
        startTime: new Date("2026-01-15T14:00:00.000Z"),
        endTime: new Date("2026-01-15T16:00:00.000Z"),
        status: "confirmed",
        createdAt: new Date(),
      },
    ];

    const req: any = {
      params: { id: "room1" },
      query: { date: "2026-01-15" },
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status, json };

    const prismaRoomFindUniqueMock = prismaMock.room.findUnique as Mock;
    const prismaReservationFindManyMock = prismaMock.reservation.findMany as Mock;
    prismaRoomFindUniqueMock.mockResolvedValue(fakeRoom);
    prismaReservationFindManyMock.mockResolvedValue(
      fakeReservations
    );

    await getRoomAvailableByIdAndDate(req, res);

    expect(status).toHaveBeenCalledWith(200);
    const response = (json as Mock).mock.calls[0][0];
    // Three slots: before first reservation, between reservations, after last reservation
    expect(response.availableTimes).toHaveLength(3);
  });

  it("should not include gaps between consecutive reservations", async () => {
    const fakeRoom = {
      id: "room1",
      name: "Conference Room",
      capacity: 20,
      equipment: ["projector"],
      createdAt: new Date(),
    };

    const fakeReservations = [
      {
        id: "res1",
        roomId: "room1",
        userId: "user1",
        startTime: new Date("2026-01-15T09:00:00.000Z"),
        endTime: new Date("2026-01-15T11:00:00.000Z"),
        status: "confirmed",
        createdAt: new Date(),
      },
      {
        id: "res2",
        roomId: "room1",
        userId: "user2",
        startTime: new Date("2026-01-15T11:00:00.000Z"),
        endTime: new Date("2026-01-15T13:00:00.000Z"),
        status: "confirmed",
        createdAt: new Date(),
      },
    ];

    const req: any = {
      params: { id: "room1" },
      query: { date: "2026-01-15" },
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status, json };

    const prismaRoomFindUniqueMock = prismaMock.room.findUnique as Mock;
    const prismaReservationFindManyMock = prismaMock.reservation.findMany as Mock;
    prismaRoomFindUniqueMock.mockResolvedValue(fakeRoom);
    prismaReservationFindManyMock.mockResolvedValue(
      fakeReservations
    );

    await getRoomAvailableByIdAndDate(req, res);

    const response = (json as Mock).mock.calls[0][0];
    // Only two slots: before first reservation and after last reservation
    // No gap between consecutive reservations
    const gaps = response.availableTimes.filter((slot: any) => {
      return (
        slot.startTime.getTime() === new Date("2026-01-15T11:00:00.000Z").getTime() &&
        slot.endTime.getTime() === new Date("2026-01-15T11:00:00.000Z").getTime()
      );
    });
    expect(gaps).toHaveLength(0);
  });

  it("should handle reservation that starts at beginning of day", async () => {
    const fakeRoom = {
      id: "room1",
      name: "Conference Room",
      capacity: 20,
      equipment: ["projector"],
      createdAt: new Date(),
    };

    const targetDate = new Date("2026-01-15");
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const reservationEnd = new Date(targetDate);
    reservationEnd.setHours(10, 0, 0, 0);

    const fakeReservations = [
      {
        id: "res1",
        roomId: "room1",
        userId: "user1",
        startTime: startOfDay,
        endTime: reservationEnd,
        status: "confirmed",
        createdAt: new Date(),
      },
    ];

    const req: any = {
      params: { id: "room1" },
      query: { date: "2026-01-15" },
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status, json };

    const prismaRoomFindUniqueMock = prismaMock.room.findUnique as Mock;
    const prismaReservationFindManyMock = prismaMock.reservation.findMany as Mock;
    prismaRoomFindUniqueMock.mockResolvedValue(fakeRoom);
    prismaReservationFindManyMock.mockResolvedValue(
      fakeReservations
    );

    await getRoomAvailableByIdAndDate(req, res);

    const response = (json as Mock).mock.calls[0][0];
    // Should only have one slot: from end of reservation to end of day
    expect(response.availableTimes).toHaveLength(1);
    expect(response.availableTimes[0].startTime.getHours()).toBe(10);
    expect(response.availableTimes[0].endTime.getHours()).toBe(23);
  });

  it("should return 500 when database error occurs", async () => {
    const req: any = {
      params: { id: "room1" },
      query: { date: "2026-01-15" },
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status, json };

    (prismaMock.room.findUnique as Mock).mockRejectedValue(
      new Error("Database error")
    );

    await getRoomAvailableByIdAndDate(req, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      error: "Erreur lors de la récupération de la salle",
    });
  });

  it("should handle invalid date format", async () => {
    const fakeRoom = {
      id: "room1",
      name: "Conference Room",
      capacity: 20,
      equipment: ["projector"],
      createdAt: new Date(),
    };

    const req: any = {
      params: { id: "room1" },
      query: { date: "invalid-date" },
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status, json };

    const prismaRoomFindUniqueMock = prismaMock.room.findUnique as Mock;
    const prismaReservationFindManyMock = prismaMock.reservation.findMany as Mock;

    prismaRoomFindUniqueMock.mockResolvedValue(fakeRoom);
    // When invalid date is passed, it creates an Invalid Date object
    // which doesn't match any reservations
    prismaReservationFindManyMock.mockResolvedValue([]);

    await getRoomAvailableByIdAndDate(req, res);

    expect(status).toHaveBeenCalledWith(200);
  });
});
