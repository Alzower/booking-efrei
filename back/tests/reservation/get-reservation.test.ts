import { vi, describe, it, expect, beforeEach, Mock } from "vitest";
import { prismaMock } from "../../db/prisma-mocks.ts";

// Mock prisma before importing controller
vi.mock("../../db/prisma.ts", () => ({
    default: prismaMock,
}));

// Mock jsonwebtoken
const { mockedVerify } = vi.hoisted(() => {
    return {
        mockedVerify: vi.fn(),
    };
});

vi.mock("jsonwebtoken", () => ({
    default: {
        verify: mockedVerify,
    },
}));

import {
    getReservationsByUser,
    getReservationAfterDate,
    getAllReservationsByRoomId,
} from "../../controller/reservation/get-reservation.ts";
import { isAdmin } from "../../middleware/admin.ts";

describe("getReservationsByUser controller", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should return reservations for user", async () => {
        const reservations = [
            {
                id: "res1",
                userId: "user1",
                roomId: "room1",
                startTime: new Date("2026-01-15"),
                endTime: new Date("2026-01-15T02:00:00"),
                createdAt: new Date(),
            },
            {
                id: "res2",
                userId: "user1",
                roomId: "room2",
                startTime: new Date("2026-01-20"),
                endTime: new Date("2026-01-20T02:00:00"),
                createdAt: new Date(),
            },
        ];

        const req: any = {
            user: { id: "user1", email: "user@example.com" },
        };

        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const res: any = { status, json };

        const prismaReservationFindManyMock = prismaMock.reservation.findMany as Mock;
        prismaReservationFindManyMock.mockResolvedValue(reservations);

        await getReservationsByUser(req, res);

        expect(prismaReservationFindManyMock).toHaveBeenCalledWith({
            where: { userId: "user1" },
        });
        expect(status).toHaveBeenCalledWith(200);
        expect(json).toHaveBeenCalledWith(reservations);
    });

    it("should return empty array when user has no reservations", async () => {
        const req: any = {
            user: { id: "user2", email: "user2@example.com" },
        };

        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const res: any = { status, json };

        const prismaReservationFindManyMock = prismaMock.reservation.findMany as Mock;
        prismaReservationFindManyMock.mockResolvedValue([]);

        await getReservationsByUser(req, res);

        expect(prismaReservationFindManyMock).toHaveBeenCalledWith({
            where: { userId: "user2" },
        });
        expect(status).toHaveBeenCalledWith(200);
        expect(json).toHaveBeenCalledWith([]);
    });

    it("should return 400 when user id is missing", async () => {
        const req: any = {
            user: undefined,
        };

        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const res: any = { status, json };

        await getReservationsByUser(req, res);

        expect(status).toHaveBeenCalledWith(400);
        expect(json).toHaveBeenCalledWith({
            error: "ID utilisateur invalide",
        });
        expect(prismaMock.reservation.findMany).not.toHaveBeenCalled();
    });

    it("should return 400 when user.id is null", async () => {
        const req: any = {
            user: { id: null, email: "user@example.com" },
        };

        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const res: any = { status, json };

        await getReservationsByUser(req, res);

        expect(status).toHaveBeenCalledWith(400);
        expect(json).toHaveBeenCalledWith({
            error: "ID utilisateur invalide",
        });
    });

    it("should return 500 when database error occurs", async () => {
        const req: any = {
            user: { id: "user1", email: "user@example.com" },
        };

        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const res: any = { status, json };

        (prismaMock.reservation.findMany as Mock).mockRejectedValue(
            new Error("Database connection error")
        );

        await getReservationsByUser(req, res);

        expect(status).toHaveBeenCalledWith(500);
        expect(json).toHaveBeenCalledWith({
            error: "Erreur lors de la récupération des réservations",
        });
    });

    it("should handle multiple reservations for user", async () => {
        const reservations = Array.from({ length: 5 }, (_, i) => ({
            id: `res${i}`,
            userId: "user1",
            roomId: `room${i}`,
            startTime: new Date(`2026-01-${15 + i}`),
            endTime: new Date(`2026-01-${15 + i}T02:00:00`),
            createdAt: new Date(),
        }));

        const req: any = {
            user: { id: "user1", email: "user@example.com" },
        };

        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const res: any = { status, json };

        (prismaMock.reservation.findMany as Mock).mockResolvedValue(reservations);

        await getReservationsByUser(req, res);

        expect(json).toHaveBeenCalledWith(reservations);
        expect(reservations).toHaveLength(5);
    });
});

describe("getReservationAfterDate controller", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should return reservations after specified date", async () => {
        const reservations = [
            {
                id: "res1",
                userId: "user1",
                roomId: "room1",
                startTime: new Date("2026-02-01"),
                endTime: new Date("2026-02-01T02:00:00"),
                createdAt: new Date(),
            },
            {
                id: "res2",
                userId: "user1",
                roomId: "room2",
                startTime: new Date("2026-02-15"),
                endTime: new Date("2026-02-15T02:00:00"),
                createdAt: new Date(),
            },
        ];

        const req: any = {
            user: { id: "user1", email: "user@example.com" },
            params: { date: "2026-01-20" },
        };

        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const res: any = { status, json };

        const prismaReservationFindManyMock = prismaMock.reservation.findMany as Mock;
        prismaReservationFindManyMock.mockResolvedValue(reservations);

        await getReservationAfterDate(req, res);

        expect(prismaReservationFindManyMock).toHaveBeenCalledWith({
            where: {
                userId: "user1",
                startTime: {
                    gte: new Date("2026-01-20"),
                },
            },
        });
        expect(status).toHaveBeenCalledWith(200);
        expect(json).toHaveBeenCalledWith(reservations);
    });

    it("should return empty array when no reservations after date", async () => {
        const req: any = {
            user: { id: "user1", email: "user@example.com" },
            params: { date: "2026-12-31" },
        };

        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const res: any = { status, json };

        (prismaMock.reservation.findMany as Mock).mockResolvedValue([]);

        await getReservationAfterDate(req, res);

        expect(status).toHaveBeenCalledWith(200);
        expect(json).toHaveBeenCalledWith([]);
    });

    it("should return 400 when user id is missing", async () => {
        const req: any = {
            user: undefined,
            params: { date: "2026-01-20" },
        };

        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const res: any = { status, json };

        await getReservationAfterDate(req, res);

        expect(status).toHaveBeenCalledWith(400);
        expect(json).toHaveBeenCalledWith({
            error: "ID utilisateur invalide",
        });
        expect(prismaMock.reservation.findMany).not.toHaveBeenCalled();
    });

    it("should return 400 when date format is invalid", async () => {
        const req: any = {
            user: { id: "user1", email: "user@example.com" },
            params: { date: "invalid-date" },
        };

        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const res: any = { status, json };

        await getReservationAfterDate(req, res);

        expect(status).toHaveBeenCalledWith(400);
        expect(json).toHaveBeenCalledWith({
            error: "Date invalide",
        });
        expect(prismaMock.reservation.findMany).not.toHaveBeenCalled();
    });

    it("should return 400 when date is empty string", async () => {
        const req: any = {
            user: { id: "user1", email: "user@example.com" },
            params: { date: "" },
        };

        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const res: any = { status, json };

        await getReservationAfterDate(req, res);

        expect(status).toHaveBeenCalledWith(400);
        expect(json).toHaveBeenCalledWith({
            error: "Date invalide",
        });
    });

    it("should handle ISO date format correctly", async () => {
        const isoDate = "2026-01-20T10:30:00.000Z";
        const reservations = [
            {
                id: "res1",
                userId: "user1",
                roomId: "room1",
                startTime: new Date("2026-02-01"),
                endTime: new Date("2026-02-01T02:00:00"),
                createdAt: new Date(),
            },
        ];

        const req: any = {
            user: { id: "user1", email: "user@example.com" },
            params: { date: isoDate },
        };

        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const res: any = { status, json };

        (prismaMock.reservation.findMany as Mock).mockResolvedValue(reservations);

        await getReservationAfterDate(req, res);

        expect(status).toHaveBeenCalledWith(200);
        expect(json).toHaveBeenCalledWith(reservations);
    });

    it("should return 500 when database error occurs", async () => {
        const req: any = {
            user: { id: "user1", email: "user@example.com" },
            params: { date: "2026-01-20" },
        };

        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const res: any = { status, json };

        (prismaMock.reservation.findMany as Mock).mockRejectedValue(
            new Error("Database error")
        );

        await getReservationAfterDate(req, res);

        expect(status).toHaveBeenCalledWith(500);
        expect(json).toHaveBeenCalledWith({
            error: "Erreur lors de la récupération des réservations",
        });
    });
});

describe("getAllReservationsByRoomId controller", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should return all reservations for a room", async () => {
        const reservations = [
            {
                id: "res1",
                userId: "user1",
                roomId: "room1",
                startTime: new Date("2026-01-15"),
                endTime: new Date("2026-01-15T02:00:00"),
                createdAt: new Date(),
            },
            {
                id: "res2",
                userId: "user2",
                roomId: "room1",
                startTime: new Date("2026-01-20"),
                endTime: new Date("2026-01-20T02:00:00"),
                createdAt: new Date(),
            },
        ];

        const req: any = {
            params: { roomId: "room1" },
        };

        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const res: any = { status, json };

        const prismaReservationFindManyMock = prismaMock.reservation.findMany as Mock;
        prismaReservationFindManyMock.mockResolvedValue(reservations);

        await getAllReservationsByRoomId(req, res);

        expect(prismaReservationFindManyMock).toHaveBeenCalledWith({
            where: { id: "room1" },
        });
        expect(status).toHaveBeenCalledWith(200);
        expect(json).toHaveBeenCalledWith(reservations);
    });

    it("should return empty array when room has no reservations", async () => {
        const req: any = {
            params: { roomId: "empty-room" },
        };

        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const res: any = { status, json };

        (prismaMock.reservation.findMany as Mock).mockResolvedValue([]);

        await getAllReservationsByRoomId(req, res);

        expect(status).toHaveBeenCalledWith(200);
        expect(json).toHaveBeenCalledWith([]);
    });

    it("should return 400 when roomId is missing", async () => {
        const req: any = {
            params: {},
        };

        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const res: any = { status, json };

        await getAllReservationsByRoomId(req, res);

        expect(status).toHaveBeenCalledWith(400);
        expect(json).toHaveBeenCalledWith({
            error: "ID de salle invalide",
        });
        expect(prismaMock.reservation.findMany).not.toHaveBeenCalled();
    });

    it("should return 400 when roomId is empty string", async () => {
        const req: any = {
            params: { roomId: "" },
        };

        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const res: any = { status, json };

        await getAllReservationsByRoomId(req, res);

        expect(status).toHaveBeenCalledWith(400);
        expect(json).toHaveBeenCalledWith({
            error: "ID de salle invalide",
        });
    });

    it("should return 500 when database error occurs", async () => {
        const req: any = {
            params: { roomId: "room1" },
        };

        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const res: any = { status, json };

        (prismaMock.reservation.findMany as Mock).mockRejectedValue(
            new Error("Database error")
        );

        await getAllReservationsByRoomId(req, res);

        expect(status).toHaveBeenCalledWith(500);
        expect(json).toHaveBeenCalledWith({
            error: "Erreur lors de la récupération des réservations",
        });
    });

    it("should handle multiple reservations from different users", async () => {
        const reservations = Array.from({ length: 3 }, (_, i) => ({
            id: `res${i}`,
            userId: `user${i}`,
            roomId: "room1",
            startTime: new Date(`2026-01-${15 + i}`),
            endTime: new Date(`2026-01-${15 + i}T02:00:00`),
            createdAt: new Date(),
        }));

        const req: any = {
            params: { roomId: "room1" },
        };

        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const res: any = { status, json };

        (prismaMock.reservation.findMany as Mock).mockResolvedValue(reservations);

        await getAllReservationsByRoomId(req, res);

        expect(json).toHaveBeenCalledWith(reservations);
        expect(reservations).toHaveLength(3);
    });
});

describe("isAdmin middleware for getAllReservationsByRoomId", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubEnv("JWT_SECRET", "test-secret-key");
    });

    it("should return 401 when authorization header is missing", async () => {
        const req: any = { headers: {} };

        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const next = vi.fn();
        const res: any = { status, json };

        await isAdmin(req, res, next);

        expect(status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });

    it("should return 401 when bearer token format is invalid", async () => {
        const req: any = {
            headers: { authorization: "InvalidFormat token" },
        };

        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const next = vi.fn();
        const res: any = { status, json };

        await isAdmin(req, res, next);

        expect(status).toHaveBeenCalledWith(401);
        expect(json).toHaveBeenCalledWith({
            error: "Format du token invalide. Utilisez 'Bearer <token>'",
        });
        expect(next).not.toHaveBeenCalled();
    });

    it("should return 401 when token is invalid", async () => {
        const req: any = {
            headers: { authorization: "Bearer invalid-token" },
        };

        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const next = vi.fn();
        const res: any = { status, json };

        mockedVerify.mockImplementation(() => {
            throw new Error("Invalid token");
        });

        await isAdmin(req, res, next);

        expect(status).toHaveBeenCalledWith(401);
        expect(json).toHaveBeenCalledWith({ error: "Token invalide" });
        expect(next).not.toHaveBeenCalled();
    });

    it("should return 403 when user is not admin", async () => {
        const decodedUser = { id: "user123", email: "user@example.com" };
        const req: any = {
            headers: { authorization: "Bearer valid-token" },
        };

        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const next = vi.fn();
        const res: any = { status, json };

        mockedVerify.mockReturnValue(decodedUser);
        (prismaMock.user.findUnique as Mock).mockResolvedValue({
            id: "user123",
            email: "user@example.com",
            name: "Regular User",
            role: "USER",
            password: "hashed",
            createdAt: new Date(),
        });

        await isAdmin(req, res, next);

        expect(status).toHaveBeenCalledWith(403);
        expect(json).toHaveBeenCalledWith({
            error: "Accès interdit - Admin requis",
        });
        expect(next).not.toHaveBeenCalled();
    });

    it("should call next and set req.user when user is admin", async () => {
        const decodedUser = { id: "admin456", email: "admin@example.com" };
        const req: any = {
            headers: { authorization: "Bearer admin-token" },
        };

        const next = vi.fn();
        const res: any = {};

        mockedVerify.mockReturnValue(decodedUser);
        (prismaMock.user.findUnique as Mock).mockResolvedValue({
            id: "admin456",
            email: "admin@example.com",
            name: "Admin User",
            role: "ADMIN",
            password: "hashed",
            createdAt: new Date(),
        });

        await isAdmin(req, res, next);

        expect(req.user).toEqual(decodedUser);
        expect(next).toHaveBeenCalled();
    });

    it("should allow admin to get room reservations after authentication", async () => {
        const decodedUser = { id: "admin456", email: "admin@example.com" };
        const req: any = {
            headers: { authorization: "Bearer admin-token" },
            params: { roomId: "room1" },
        };

        const next = vi.fn();
        const res: any = {};

        mockedVerify.mockReturnValue(decodedUser);
        (prismaMock.user.findUnique as Mock).mockResolvedValue({
            id: "admin456",
            email: "admin@example.com",
            name: "Admin User",
            role: "ADMIN",
            password: "hashed",
            createdAt: new Date(),
        });

        // First, authenticate as admin
        await isAdmin(req, res, next);

        // Verify admin is authenticated
        expect(req.user).toEqual(decodedUser);
        expect(next).toHaveBeenCalled();

        // Then admin can get all room reservations
        const reservations = [
            {
                id: "res1",
                userId: "user1",
                roomId: "room1",
                startTime: new Date("2026-01-15"),
                endTime: new Date("2026-01-15T02:00:00"),
                createdAt: new Date(),
            },
            {
                id: "res2",
                userId: "user2",
                roomId: "room1",
                startTime: new Date("2026-01-20"),
                endTime: new Date("2026-01-20T02:00:00"),
                createdAt: new Date(),
            },
        ];

        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const res2: any = { json, status };

        const prismaReservationFindManyMock = prismaMock.reservation.findMany as Mock;
        prismaReservationFindManyMock.mockResolvedValue(reservations);

        await getAllReservationsByRoomId(req, res2);

        expect(prismaReservationFindManyMock).toHaveBeenCalledWith({
            where: { id: "room1" },
        });
        expect(status).toHaveBeenCalledWith(200);
        expect(json).toHaveBeenCalledWith(reservations);
    });

    it("should deny non-admin user from getting all room reservations", async () => {
        const decodedUser = { id: "user789", email: "user789@example.com" };
        const req: any = {
            headers: { authorization: "Bearer user-token" },
            params: { roomId: "room1" },
        };

        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const next = vi.fn();
        const res: any = { status, json };

        mockedVerify.mockReturnValue(decodedUser);
        (prismaMock.user.findUnique as Mock).mockResolvedValue({
            id: "user789",
            email: "user789@example.com",
            name: "Regular User",
            role: "USER",
            password: "hashed",
            createdAt: new Date(),
        });

        await isAdmin(req, res, next);

        // Non-admin should not be able to proceed
        expect(status).toHaveBeenCalledWith(403);
        expect(json).toHaveBeenCalledWith({
            error: "Accès interdit - Admin requis",
        });
        expect(next).not.toHaveBeenCalled();

        // getAllReservationsByRoomId should not be called
        expect(prismaMock.reservation.findMany).not.toHaveBeenCalled();
    });
});
