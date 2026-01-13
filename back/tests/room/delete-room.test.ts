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

import { deleteRoom } from "../../controller/room/delete-room.ts";
import { isAdmin } from "../../middleware/admin.ts";

describe("deleteRoom controller", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should delete room successfully", async () => {
        const existingRoom = {
            id: "room1",
            name: "Conference Room",
            capacity: 20,
            equipment: ["projector"],
            createdAt: new Date(),
        };

        const req: any = {
            params: { id: "room1" },
        };

        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const res: any = { status, json };

        const prismaRoomFindUniqueMock = prismaMock.room.findUnique as Mock;
        const prismaDeleteMock = prismaMock.room.delete as Mock;
        prismaRoomFindUniqueMock.mockResolvedValue(existingRoom);
        prismaDeleteMock.mockResolvedValue(existingRoom);

        await deleteRoom(req, res);

        expect(prismaRoomFindUniqueMock).toHaveBeenCalledWith({
            where: { id: "room1" },
        });
        expect(prismaDeleteMock).toHaveBeenCalledWith({
            where: { id: "room1" },
        });
        expect(status).toHaveBeenCalledWith(200);
        expect(json).toHaveBeenCalledWith({
            message: "Salle supprimée avec succès",
        });
    });

    it("should return 404 when room does not exist", async () => {
        const req: any = {
            params: { id: "nonexistent" },
        };

        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const res: any = { status, json };

        const prismaRoomFindUniqueMock = prismaMock.room.findUnique as Mock;
        prismaRoomFindUniqueMock.mockResolvedValue(null);

        await deleteRoom(req, res);

        expect(prismaRoomFindUniqueMock).toHaveBeenCalledWith({
            where: { id: "nonexistent" },
        });
        expect(prismaMock.room.delete).not.toHaveBeenCalled();
        expect(status).toHaveBeenCalledWith(404);
        expect(json).toHaveBeenCalledWith({ error: "Salle non trouvée" });
    });

    it("should return 500 when database findUnique error occurs", async () => {
        const req: any = {
            params: { id: "room1" },
        };

        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const res: any = { status, json };

        (prismaMock.room.findUnique as Mock).mockRejectedValue(
            new Error("Database connection error")
        );

        await deleteRoom(req, res);

        expect(status).toHaveBeenCalledWith(500);
        expect(json).toHaveBeenCalledWith({
            error: "Erreur lors de la suppression de la salle",
        });
        expect(prismaMock.room.delete).not.toHaveBeenCalled();
    });

    it("should return 500 when database delete error occurs", async () => {
        const existingRoom = {
            id: "room1",
            name: "Conference Room",
            capacity: 20,
            equipment: ["projector"],
            createdAt: new Date(),
        };

        const req: any = {
            params: { id: "room1" },
        };

        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const res: any = { status, json };

        (prismaMock.room.findUnique as Mock).mockResolvedValue(existingRoom);
        (prismaMock.room.delete as Mock).mockRejectedValue(
            new Error("Database error during delete")
        );

        await deleteRoom(req, res);

        expect(status).toHaveBeenCalledWith(500);
        expect(json).toHaveBeenCalledWith({
            error: "Erreur lors de la suppression de la salle",
        });
    });

    it("should delete room with valid id parameter", async () => {
        const existingRoom = {
            id: "room-uuid-123456",
            name: "Meeting Room",
            capacity: 15,
            equipment: ["whiteboard"],
            createdAt: new Date(),
        };

        const req: any = {
            params: { id: "room-uuid-123456" },
        };

        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const res: any = { status, json };

        const prismaRoomFindUniqueMock = prismaMock.room.findUnique as Mock;
        const prismaDeleteMock = prismaMock.room.delete as Mock;
        prismaRoomFindUniqueMock.mockResolvedValue(existingRoom);
        prismaDeleteMock.mockResolvedValue(existingRoom);

        await deleteRoom(req, res);

        expect(prismaRoomFindUniqueMock).toHaveBeenCalledWith({
            where: { id: "room-uuid-123456" },
        });
        expect(status).toHaveBeenCalledWith(200);
        expect(json).toHaveBeenCalledWith({
            message: "Salle supprimée avec succès",
        });
    });

    it("should handle deletion of room with complex equipment list", async () => {
        const existingRoom = {
            id: "room-complex",
            name: "Advanced Conference Room",
            capacity: 50,
            equipment: [
                "projector",
                "whiteboard",
                "screen",
                "microphone",
                "camera",
            ],
            createdAt: new Date(),
        };

        const req: any = {
            params: { id: "room-complex" },
        };

        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const res: any = { status, json };

        const prismaRoomFindUniqueMock = prismaMock.room.findUnique as Mock;
        const prismaDeleteMock = prismaMock.room.delete as Mock;
        prismaRoomFindUniqueMock.mockResolvedValue(existingRoom);
        prismaDeleteMock.mockResolvedValue(existingRoom);

        await deleteRoom(req, res);

        expect(prismaDeleteMock).toHaveBeenCalledWith({
            where: { id: "room-complex" },
        });
        expect(status).toHaveBeenCalledWith(200);
    });
});

describe("isAdmin middleware for deleteRoom", () => {
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

    it("should allow admin to delete room after authentication", async () => {
        const decodedUser = { id: "admin456", email: "admin@example.com" };
        const req: any = {
            headers: { authorization: "Bearer admin-token" },
            params: { id: "room1" },
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

        // Then admin can delete room
        const existingRoom = {
            id: "room1",
            name: "Conference Room",
            capacity: 20,
            equipment: ["projector"],
            createdAt: new Date(),
        };

        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const res2: any = { json, status };

        (prismaMock.room.findUnique as Mock).mockResolvedValue(existingRoom);
        (prismaMock.room.delete as Mock).mockResolvedValue(existingRoom);

        await deleteRoom(req, res2);

        expect(prismaMock.room.findUnique).toHaveBeenCalledWith({
            where: { id: "room1" },
        });
        expect(prismaMock.room.delete).toHaveBeenCalledWith({
            where: { id: "room1" },
        });
        expect(status).toHaveBeenCalledWith(200);
        expect(json).toHaveBeenCalledWith({
            message: "Salle supprimée avec succès",
        });
    });

    it("should deny non-admin user from deleting room", async () => {
        const decodedUser = { id: "user789", email: "user789@example.com" };
        const req: any = {
            headers: { authorization: "Bearer user-token" },
            params: { id: "room1" },
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

        // deleteRoom should not be called
        expect(prismaMock.room.delete).not.toHaveBeenCalled();
    });

    it("should verify admin role check uses database lookup", async () => {
        const decodedUser = { id: "user999", email: "user999@example.com" };
        const req: any = {
            headers: { authorization: "Bearer token" },
        };

        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const next = vi.fn();
        const res: any = { status, json };

        mockedVerify.mockReturnValue(decodedUser);
        (prismaMock.user.findUnique as Mock).mockResolvedValue({
            id: "user999",
            email: "user999@example.com",
            name: "User",
            role: "USER",
            password: "hashed",
            createdAt: new Date(),
        });

        await isAdmin(req, res, next);

        // Should have fetched user from database to check role
        expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
            where: { id: "user999" },
        });
        expect(status).toHaveBeenCalledWith(403);
    });
});
