import { vi, describe, it, expect, beforeEach, Mock } from "vitest";
import { prismaMock } from "../../db/prisma-mocks.ts";

// Mock prisma before importing controller
vi.mock("../../db/prisma.ts", () => ({
  default: prismaMock,
}));

import { deleteReservation } from "../../controller/reservation/delete-reservation.ts";

describe("deleteReservation controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should delete reservation successfully", async () => {
    const existingReservation = {
      id: "res1",
      userId: "user1",
      roomId: "room1",
      startTime: new Date("2026-01-15"),
      endTime: new Date("2026-01-15T02:00:00"),
      createdAt: new Date(),
    };

    const req: any = {
      user: { id: "user1", email: "user@example.com" },
      params: { reservationId: "res1" },
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status, json };

    const prismaReservationFindUniqueMock = prismaMock.reservation.findUnique as Mock;
    const prismaReservationDeleteMock = prismaMock.reservation.delete as Mock;

    prismaReservationFindUniqueMock.mockResolvedValue(
      existingReservation
    );
    prismaReservationDeleteMock.mockResolvedValue(
      existingReservation
    );

    await deleteReservation(req, res);

    expect(prismaReservationFindUniqueMock).toHaveBeenCalledWith({
      where: { id: "res1" },
    });
    expect(prismaReservationDeleteMock).toHaveBeenCalledWith({
      where: { id: "res1" },
    });
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({
      message: "Réservation supprimée avec succès",
    });
  });

  it("should return 400 when reservationId is missing", async () => {
    const req: any = {
      user: { id: "user1", email: "user@example.com" },
      params: {},
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status, json };

    await deleteReservation(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      error: "ID de réservation invalide",
    });
    expect(prismaMock.reservation.findUnique).not.toHaveBeenCalled();
  });

  it("should return 400 when reservationId is empty string", async () => {
    const req: any = {
      user: { id: "user1", email: "user@example.com" },
      params: { reservationId: "" },
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status, json };

    await deleteReservation(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      error: "ID de réservation invalide",
    });
    expect(prismaMock.reservation.findUnique).not.toHaveBeenCalled();
  });

  it("should return 404 when reservation does not exist", async () => {
    const req: any = {
      user: { id: "user1", email: "user@example.com" },
      params: { reservationId: "nonexistent" },
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status, json };

    const prismaReservationFindUniqueMock = prismaMock.reservation.findUnique as Mock;
    prismaReservationFindUniqueMock.mockResolvedValue(null);

    await deleteReservation(req, res);

    expect(prismaReservationFindUniqueMock).toHaveBeenCalledWith({
      where: { id: "nonexistent" },
    });
    expect(prismaMock.reservation.delete).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      error: "Réservation non trouvée avec cet ID",
    });
  });

  it("should return 403 when user is not the owner of reservation", async () => {
    const existingReservation = {
      id: "res1",
      userId: "user2",
      roomId: "room1",
      startTime: new Date("2026-01-15"),
      endTime: new Date("2026-01-15T02:00:00"),
      createdAt: new Date(),
    };

    const req: any = {
      user: { id: "user1", email: "user1@example.com" },
      params: { reservationId: "res1" },
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status, json };

    (prismaMock.reservation.findUnique as Mock).mockResolvedValue(
      existingReservation
    );

    await deleteReservation(req, res);

    expect(prismaMock.reservation.delete).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(403);
    expect(json).toHaveBeenCalledWith({
      error: "Vous n'êtes pas autorisé à supprimer cette réservation",
    });
  });

  it("should return 500 when database findUnique error occurs", async () => {
    const req: any = {
      user: { id: "user1", email: "user@example.com" },
      params: { reservationId: "res1" },
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status, json };

    (prismaMock.reservation.findUnique as Mock).mockRejectedValue(
      new Error("Database connection error")
    );

    await deleteReservation(req, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      error: "Erreur lors de la suppression de la réservation",
    });
    expect(prismaMock.reservation.delete).not.toHaveBeenCalled();
  });

  it("should return 500 when database delete error occurs", async () => {
    const existingReservation = {
      id: "res1",
      userId: "user1",
      roomId: "room1",
      startTime: new Date("2026-01-15"),
      endTime: new Date("2026-01-15T02:00:00"),
      createdAt: new Date(),
    };

    const req: any = {
      user: { id: "user1", email: "user@example.com" },
      params: { reservationId: "res1" },
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status, json };

    (prismaMock.reservation.findUnique as Mock).mockResolvedValue(
      existingReservation
    );
    (prismaMock.reservation.delete as Mock).mockRejectedValue(
      new Error("Database error during delete")
    );

    await deleteReservation(req, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      error: "Erreur lors de la suppression de la réservation",
    });
  });

  it("should delete reservation with valid UUID", async () => {
    const reservationId = "123e4567-e89b-12d3-a456-426614174000";
    const existingReservation = {
      id: reservationId,
      userId: "user1",
      roomId: "room1",
      startTime: new Date("2026-01-15"),
      endTime: new Date("2026-01-15T02:00:00"),
      createdAt: new Date(),
    };

    const req: any = {
      user: { id: "user1", email: "user@example.com" },
      params: { reservationId },
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status, json };

    const prismaReservationFindUniqueMock = prismaMock.reservation.findUnique as Mock;
    const prismaReservationDeleteMock = prismaMock.reservation.delete as Mock;

    prismaReservationFindUniqueMock.mockResolvedValue(
      existingReservation
    );
    prismaReservationDeleteMock.mockResolvedValue(
      existingReservation
    );

    await deleteReservation(req, res);

    expect(prismaReservationFindUniqueMock).toHaveBeenCalledWith({
      where: { id: reservationId },
    });
    expect(status).toHaveBeenCalledWith(200);
  });

  it("should handle user deletion of their own reservation", async () => {
    const existingReservation = {
      id: "res-user-2",
      userId: "user-abc-123",
      roomId: "room-xyz",
      startTime: new Date("2026-02-20"),
      endTime: new Date("2026-02-20T03:00:00"),
      createdAt: new Date(),
    };

    const req: any = {
      user: { id: "user-abc-123", email: "usermail@example.com" },
      params: { reservationId: "res-user-2" },
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status, json };

    const prismaReservationFindUniqueMock = prismaMock.reservation.findUnique as Mock;
    const prismaReservationDeleteMock = prismaMock.reservation.delete as Mock;

    prismaReservationFindUniqueMock.mockResolvedValue(
      existingReservation
    );
    prismaReservationDeleteMock.mockResolvedValue(
      existingReservation
    );

    await deleteReservation(req, res);

    expect(prismaReservationDeleteMock).toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(200);
  });

  it("should verify ownership before deletion", async () => {
    const existingReservation = {
      id: "res1",
      userId: "owner-user",
      roomId: "room1",
      startTime: new Date("2026-01-15"),
      endTime: new Date("2026-01-15T02:00:00"),
      createdAt: new Date(),
    };

    const req: any = {
      user: { id: "different-user", email: "different@example.com" },
      params: { reservationId: "res1" },
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status, json };

    const prismaReservationFindUniqueMock = prismaMock.reservation.findUnique as Mock;
    prismaReservationFindUniqueMock.mockResolvedValue(
      existingReservation
    );

    await deleteReservation(req, res);

    // Verify findUnique was called to get reservation
    expect(prismaReservationFindUniqueMock).toHaveBeenCalledWith({
      where: { id: "res1" },
    });

    // Verify delete was NOT called due to ownership check
    expect(prismaMock.reservation.delete).not.toHaveBeenCalled();

    // Verify 403 was returned
    expect(status).toHaveBeenCalledWith(403);
  });

  it("should handle multiple deletion attempts by same user", async () => {
    const existingReservation = {
      id: "res1",
      userId: "user1",
      roomId: "room1",
      startTime: new Date("2026-01-15"),
      endTime: new Date("2026-01-15T02:00:00"),
      createdAt: new Date(),
    };

    const req: any = {
      user: { id: "user1", email: "user@example.com" },
      params: { reservationId: "res1" },
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status, json };

    const prismaReservationFindUniqueMock = prismaMock.reservation.findUnique as Mock;
    const prismaReservationDeleteMock = prismaMock.reservation.delete as Mock;

    // First deletion - succeeds
    prismaReservationFindUniqueMock.mockResolvedValueOnce(
      existingReservation
    );
    prismaReservationDeleteMock.mockResolvedValueOnce(
      existingReservation
    );

    await deleteReservation(req, res);

    expect(status).toHaveBeenCalledWith(200);

    // Reset mocks
    vi.clearAllMocks();

    // Second deletion attempt - reservation no longer exists
    prismaReservationFindUniqueMock.mockResolvedValueOnce(null);

    await deleteReservation(req, res);

    expect(status).toHaveBeenLastCalledWith(404);
  });

  it("should allow different users to delete their own reservations", async () => {
    const res1 = {
      id: "res1",
      userId: "user1",
      roomId: "room1",
      startTime: new Date("2026-01-15"),
      endTime: new Date("2026-01-15T02:00:00"),
      createdAt: new Date(),
    };

    const res2 = {
      id: "res2",
      userId: "user2",
      roomId: "room1",
      startTime: new Date("2026-01-20"),
      endTime: new Date("2026-01-20T02:00:00"),
      createdAt: new Date(),
    };

    // User1 deletes their reservation
    const req1: any = {
      user: { id: "user1", email: "user1@example.com" },
      params: { reservationId: "res1" },
    };

    const json1 = vi.fn();
    const status1 = vi.fn(() => ({ json: json1 }));
    const res: any = { status: status1, json: json1 };

    const prismaReservationFindUniqueMock = prismaMock.reservation.findUnique as Mock;
    const prismaReservationDeleteMock = prismaMock.reservation.delete as Mock;

    prismaReservationFindUniqueMock.mockResolvedValueOnce(res1);
    prismaReservationDeleteMock.mockResolvedValueOnce(res1);

    await deleteReservation(req1, res);

    expect(status1).toHaveBeenCalledWith(200);

    // Reset mocks
    vi.clearAllMocks();

    // User2 deletes their reservation
    const req2: any = {
      user: { id: "user2", email: "user2@example.com" },
      params: { reservationId: "res2" },
    };

    const json2 = vi.fn();
    const status2 = vi.fn(() => ({ json: json2 }));
    const res2obj: any = { status: status2, json: json2 };

    prismaReservationFindUniqueMock.mockResolvedValueOnce(res2);
    prismaReservationDeleteMock.mockResolvedValueOnce(res2);

    await deleteReservation(req2, res2obj);

    expect(status2).toHaveBeenCalledWith(200);
  });
});
