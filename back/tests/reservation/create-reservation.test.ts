import { vi, describe, it, expect, beforeEach, Mock } from "vitest";
import { prismaMock } from "../../db/prisma-mocks.ts";

// Mock the reservation helper with inline function
vi.mock("../../../helper/reservation-helper.ts", () => ({
  reservationDateIsValid: vi.fn().mockReturnValue(true),
}));

// Mock prisma before importing controller
vi.mock("../../db/prisma.ts", () => ({
  default: prismaMock,
}));

import { createReservation } from "../../controller/reservation/create-reservation.ts";
import { reservationDateIsValid as mockedReservationDateIsValid } from "../../../helper/reservation-helper.ts";

describe("createReservation controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock to default valid behavior
    mockedReservationDateIsValid.mockReturnValue(true);
  });

  it("should create reservation successfully", async () => {
    const startTime = new Date(Date.now() + 86400000); // tomorrow
    const endTime = new Date(startTime.getTime() + 3600000); // 1 hour later

    const req: any = {
      user: { id: "user1", email: "user@example.com" },
      body: {
        roomId: "room1",
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      },
    };

    const booking = {
      id: "res1",
      userId: "user1",
      roomId: "room1",
      startTime,
      endTime,
      createdAt: new Date(),
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status, json };

    const prismaReservationFindManyMock = prismaMock.reservation.findMany as Mock;
    const prismaCreateMock = prismaMock.reservation.create as Mock;
    prismaReservationFindManyMock.mockResolvedValue([]);
    prismaCreateMock.mockResolvedValue(booking);

    await createReservation(req, res);

    expect(prismaCreateMock).toHaveBeenCalledWith({
      data: {
        userId: "user1",
        roomId: "room1",
        startTime,
        endTime,
      },
    });
    expect(status).toHaveBeenCalledWith(201);
    expect(json).toHaveBeenCalledWith(booking);
  });

  it("should return 400 when user id is missing", async () => {
    const startTime = new Date(Date.now() + 86400000);
    const endTime = new Date(startTime.getTime() + 3600000);

    const req: any = {
      user: undefined,
      body: {
        roomId: "room1",
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      },
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status, json };

    await createReservation(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      error: "ID utilisateur invalide",
    });
    expect(prismaMock.reservation.findMany).not.toHaveBeenCalled();
  });

  it("should return 400 when user.id is null", async () => {
    const startTime = new Date(Date.now() + 86400000);
    const endTime = new Date(startTime.getTime() + 3600000);

    const req: any = {
      user: { id: null, email: "user@example.com" },
      body: {
        roomId: "room1",
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      },
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status, json };

    await createReservation(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      error: "ID utilisateur invalide",
    });
  });

  it("should return 400 when roomId is missing", async () => {
    const startTime = new Date(Date.now() + 86400000);
    const endTime = new Date(startTime.getTime() + 3600000);

    const req: any = {
      user: { id: "user1", email: "user@example.com" },
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
    expect(json).toHaveBeenCalledWith({
      error: "ID de salle invalide",
    });
    expect(prismaMock.reservation.findMany).not.toHaveBeenCalled();
  });

  it("should return 400 when roomId is empty string", async () => {
    const startTime = new Date(Date.now() + 86400000);
    const endTime = new Date(startTime.getTime() + 3600000);

    const req: any = {
      user: { id: "user1", email: "user@example.com" },
      body: {
        roomId: "",
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      },
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status, json };

    await createReservation(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      error: "ID de salle invalide",
    });
  });

  it("should return 400 when date range is invalid", async () => {
    const startTime = new Date(Date.now() + 86400000);
    const endTime = new Date(startTime.getTime() + 3600000);

    const req: any = {
      user: { id: "user1", email: "user@example.com" },
      body: {
        roomId: "room1",
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      },
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status, json };

    mockedReservationDateIsValid.mockReturnValue(false);

    await createReservation(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      error: "Plage horaire invalide",
    });
    expect(prismaMock.reservation.findMany).not.toHaveBeenCalled();
  });

  it("should return 400 when room is already booked for time slot", async () => {
    const startTime = new Date(Date.now() + 86400000);
    const endTime = new Date(startTime.getTime() + 3600000);

    const req: any = {
      user: { id: "user1", email: "user@example.com" },
      body: {
        roomId: "room1",
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      },
    };

    const overlappingBooking = {
      id: "res-existing",
      userId: "user2",
      roomId: "room1",
      startTime: new Date(startTime.getTime() + 1800000), // 30 minutes after start
      endTime: new Date(endTime.getTime() + 1800000),
      createdAt: new Date(),
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status, json };

    (prismaMock.reservation.findMany as Mock).mockResolvedValue([
      overlappingBooking,
    ]);

    await createReservation(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      error: "La salle est déjà réservée pour cette plage horaire",
    });
    expect(prismaMock.reservation.create).not.toHaveBeenCalled();
  });

  it("should check for overlapping bookings correctly", async () => {
    const startTime = new Date(Date.now() + 86400000);
    const endTime = new Date(startTime.getTime() + 3600000);

    const req: any = {
      user: { id: "user1", email: "user@example.com" },
      body: {
        roomId: "room1",
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      },
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status, json };

    const prismaReservationFindManyMock = prismaMock.reservation.findMany as Mock;
    const prismaCreateMock = prismaMock.reservation.create as Mock;
    prismaReservationFindManyMock.mockResolvedValue([]);
    prismaCreateMock.mockResolvedValue({
      id: "res1",
      userId: "user1",
      roomId: "room1",
      startTime,
      endTime,
      createdAt: new Date(),
    });

    await createReservation(req, res);

    // Verify the overlap query was called correctly
    expect(prismaReservationFindManyMock).toHaveBeenCalledWith({
      where: {
        roomId: "room1",
        OR: [
          {
            startTime: {
              lt: endTime,
            },
            endTime: {
              gt: startTime,
            },
          },
        ],
      },
    });
  });

  it("should return 500 when database error occurs during findMany", async () => {
    const startTime = new Date(Date.now() + 86400000);
    const endTime = new Date(startTime.getTime() + 3600000);

    const req: any = {
      user: { id: "user1", email: "user@example.com" },
      body: {
        roomId: "room1",
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      },
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status, json };

    (prismaMock.reservation.findMany as Mock).mockRejectedValue(
      new Error("Database error")
    );

    await createReservation(req, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      error: "Erreur lors de la création de la réservation",
    });
  });

  it("should return 500 when database error occurs during create", async () => {
    const startTime = new Date(Date.now() + 86400000);
    const endTime = new Date(startTime.getTime() + 3600000);

    const req: any = {
      user: { id: "user1", email: "user@example.com" },
      body: {
        roomId: "room1",
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      },
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status, json };

    (prismaMock.reservation.findMany as Mock).mockResolvedValue([]);
    (prismaMock.reservation.create as Mock).mockRejectedValue(
      new Error("Database error")
    );

    await createReservation(req, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      error: "Erreur lors de la création de la réservation",
    });
  });

  it("should handle multiple overlapping bookings", async () => {
    const startTime = new Date(Date.now() + 86400000);
    const endTime = new Date(startTime.getTime() + 3600000);

    const req: any = {
      user: { id: "user1", email: "user@example.com" },
      body: {
        roomId: "room1",
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      },
    };

    const overlappingBookings = [
      {
        id: "res1",
        userId: "user2",
        roomId: "room1",
        startTime: new Date(startTime.getTime() - 1800000),
        endTime: new Date(startTime.getTime() + 1800000),
        createdAt: new Date(),
      },
      {
        id: "res2",
        userId: "user3",
        roomId: "room1",
        startTime: new Date(endTime.getTime() - 1800000),
        endTime: new Date(endTime.getTime() + 1800000),
        createdAt: new Date(),
      },
    ];

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status, json };

    (prismaMock.reservation.findMany as Mock).mockResolvedValue(
      overlappingBookings
    );

    await createReservation(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      error: "La salle est déjà réservée pour cette plage horaire",
    });
    expect(prismaMock.reservation.create).not.toHaveBeenCalled();
  });

  it("should create reservation with different user and same room", async () => {
    const startTime = new Date(Date.now() + 86400000);
    const endTime = new Date(startTime.getTime() + 3600000);

    const req: any = {
      user: { id: "user2", email: "user2@example.com" },
      body: {
        roomId: "room1",
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      },
    };

    const booking = {
      id: "res2",
      userId: "user2",
      roomId: "room1",
      startTime,
      endTime,
      createdAt: new Date(),
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status, json };

    const prismaReservationFindManyMock = prismaMock.reservation.findMany as Mock;
    const prismaCreateMock = prismaMock.reservation.create as Mock;
    prismaReservationFindManyMock.mockResolvedValue([]);
    prismaCreateMock.mockResolvedValue(booking);

    await createReservation(req, res);

    expect(prismaCreateMock).toHaveBeenCalledWith({
      data: {
        userId: "user2",
        roomId: "room1",
        startTime,
        endTime,
      },
    });
    expect(status).toHaveBeenCalledWith(201);
  });

  it("should create reservation with long duration", async () => {
    const startTime = new Date(Date.now() + 86400000);
    const endTime = new Date(startTime.getTime() + 14400000); // 4 hours later

    const req: any = {
      user: { id: "user1", email: "user@example.com" },
      body: {
        roomId: "room1",
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      },
    };

    const booking = {
      id: "res1",
      userId: "user1",
      roomId: "room1",
      startTime,
      endTime,
      createdAt: new Date(),
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status, json };

    (prismaMock.reservation.findMany as Mock).mockResolvedValue([]);
    (prismaMock.reservation.create as Mock).mockResolvedValue(booking);

    await createReservation(req, res);

    expect(status).toHaveBeenCalledWith(201);
    expect(json).toHaveBeenCalledWith(booking);
  });

  it("should create reservation with short duration (15 minutes)", async () => {
    const startTime = new Date(Date.now() + 86400000);
    const endTime = new Date(startTime.getTime() + 900000); // 15 minutes later

    const req: any = {
      user: { id: "user1", email: "user@example.com" },
      body: {
        roomId: "room1",
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      },
    };

    const booking = {
      id: "res1",
      userId: "user1",
      roomId: "room1",
      startTime,
      endTime,
      createdAt: new Date(),
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status, json };

    (prismaMock.reservation.findMany as Mock).mockResolvedValue([]);
    (prismaMock.reservation.create as Mock).mockResolvedValue(booking);

    await createReservation(req, res);

    expect(status).toHaveBeenCalledWith(201);
  });

  it("should parse ISO date strings correctly", async () => {
    const startTime = new Date(Date.now() + 86400000);
    const endTime = new Date(startTime.getTime() + 3600000);

    const req: any = {
      user: { id: "user1", email: "user@example.com" },
      body: {
        roomId: "room1",
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      },
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status, json };

    (prismaMock.reservation.findMany as Mock).mockResolvedValue([]);
    (prismaMock.reservation.create as Mock).mockResolvedValue({
      id: "res1",
      userId: "user1",
      roomId: "room1",
      startTime,
      endTime,
      createdAt: new Date(),
    });

    await createReservation(req, res);

    expect(mockedReservationDateIsValid).toHaveBeenCalledWith(startTime, endTime);
  });
});
