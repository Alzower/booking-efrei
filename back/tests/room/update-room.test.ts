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

import { updateRoom } from "../../controller/room/update-room.ts";
import { isAdmin } from "../../middleware/admin.ts";

describe("updateRoom controller", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should update room successfully with all fields", async () => {
        const existingRoom = {
            id: "room1",
            name: "Old Conference Room",
            capacity: 15,
            equipment: ["projector"],
            createdAt: new Date(),
        };

        const updatedRoom = {
            id: "room1",
            name: "New Conference Room",
            capacity: 20,
            equipment: ["projector", "whiteboard"],
            createdAt: new Date(),
        };

        const req: any = {
            params: { id: "room1" },
            body: {
                name: "New Conference Room",
                capacity: 20,
                equipment: ["projector", "whiteboard"],
            },
        };

        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const res: any = { status, json };

        const prismaRoomFindUniqueMock = prismaMock.room.findUnique as Mock;
        const prismaRoomUpdateMock = prismaMock.room.update as Mock;
        prismaRoomFindUniqueMock.mockResolvedValue(existingRoom);
        prismaRoomUpdateMock.mockResolvedValue(updatedRoom);

        await updateRoom(req, res);

        expect(prismaRoomFindUniqueMock).toHaveBeenCalledWith({
            where: { id: "room1" },
        });
        expect(prismaRoomUpdateMock).toHaveBeenCalledWith({
            where: { id: "room1" },
            data: {
                name: "New Conference Room",
                capacity: 20,
                equipment: ["projector", "whiteboard"],
            },
        });
        expect(status).toHaveBeenCalledWith(200);
        expect(json).toHaveBeenCalledWith(updatedRoom);
    });

    it("should update room with only name", async () => {
        const existingRoom = {
            id: "room1",
            name: "Old Room",
            capacity: 15,
            equipment: ["projector"],
            createdAt: new Date(),
        };

        const updatedRoom = {
            id: "room1",
            name: "New Room Name",
            capacity: 15,
            equipment: ["projector"],
            createdAt: new Date(),
        };

        const req: any = {
            params: { id: "room1" },
            body: {
                name: "New Room Name",
            },
        };

        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const res: any = { status, json };

        const prismaRoomFindUniqueMock = prismaMock.room.findUnique as Mock;
        const prismaRoomUpdateMock = prismaMock.room.update as Mock;
        prismaRoomFindUniqueMock.mockResolvedValue(existingRoom);
        prismaRoomUpdateMock.mockResolvedValue(updatedRoom);

        await updateRoom(req, res);

        expect(prismaRoomUpdateMock).toHaveBeenCalledWith({
            where: { id: "room1" },
            data: {
                name: "New Room Name",
                capacity: 15,
                equipment: ["projector"],
            },
        });
        expect(status).toHaveBeenCalledWith(200);
    });

    it("should update room with only capacity", async () => {
        const existingRoom = {
            id: "room1",
            name: "Conference Room",
            capacity: 15,
            equipment: ["projector"],
            createdAt: new Date(),
        };

        const updatedRoom = {
            id: "room1",
            name: "Conference Room",
            capacity: 25,
            equipment: ["projector"],
            createdAt: new Date(),
        };

        const req: any = {
            params: { id: "room1" },
            body: {
                capacity: 25,
            },
        };

        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const res: any = { status, json };

        const prismaRoomFindUniqueMock = prismaMock.room.findUnique as Mock;
        const prismaRoomUpdateMock = prismaMock.room.update as Mock;
        prismaRoomFindUniqueMock.mockResolvedValue(existingRoom);
        prismaRoomUpdateMock.mockResolvedValue(updatedRoom);

        await updateRoom(req, res);

        expect(prismaRoomUpdateMock).toHaveBeenCalledWith({
            where: { id: "room1" },
            data: {
                name: "Conference Room",
                capacity: 25,
                equipment: ["projector"],
            },
        });
        expect(status).toHaveBeenCalledWith(200);
    });

    it("should update room with only equipment", async () => {
        const existingRoom = {
            id: "room1",
            name: "Conference Room",
            capacity: 15,
            equipment: ["projector"],
            createdAt: new Date(),
        };

        const updatedRoom = {
            id: "room1",
            name: "Conference Room",
            capacity: 15,
            equipment: ["projector", "whiteboard", "screen"],
            createdAt: new Date(),
        };

        const req: any = {
            params: { id: "room1" },
            body: {
                equipment: ["projector", "whiteboard", "screen"],
            },
        };

        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const res: any = { status, json };

        const prismaRoomFindUniqueMock = prismaMock.room.findUnique as Mock;
        const prismaRoomUpdateMock = prismaMock.room.update as Mock;
        prismaRoomFindUniqueMock.mockResolvedValue(existingRoom);
        prismaRoomUpdateMock.mockResolvedValue(updatedRoom);

        await updateRoom(req, res);

        expect(prismaRoomUpdateMock).toHaveBeenCalledWith({
            where: { id: "room1" },
            data: {
                name: "Conference Room",
                capacity: 15,
                equipment: ["projector", "whiteboard", "screen"],
            },
        });
        expect(status).toHaveBeenCalledWith(200);
    });

    it("should return 400 when room name is empty string", async () => {
        const req: any = {
            params: { id: "room1" },
            body: {
                name: "",
                capacity: 20,
            },
        };

        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const res: any = { status, json };

        await updateRoom(req, res);

        expect(status).toHaveBeenCalledWith(400);
        expect(json).toHaveBeenCalledWith({ error: "Nom de salle invalide" });
        expect(prismaMock.room.findUnique).not.toHaveBeenCalled();
    });

    it("should update capacity to 0 (validation allows 0, coalescing uses 0)", async () => {
        const existingRoom = {
            id: "room1",
            name: "Conference Room",
            capacity: 15,
            equipment: ["projector"],
            createdAt: new Date(),
        };

        const updatedRoom = {
            id: "room1",
            name: "Conference Room",
            capacity: 0,
            equipment: ["projector"],
            createdAt: new Date(),
        };

        const req: any = {
            params: { id: "room1" },
            body: {
                capacity: 0,
            },
        };

        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const res: any = { status, json };

        const prismaRoomFindUniqueMock = prismaMock.room.findUnique as Mock;
        const prismaRoomUpdateMock = prismaMock.room.update as Mock;
        prismaRoomFindUniqueMock.mockResolvedValue(existingRoom);
        prismaRoomUpdateMock.mockResolvedValue(updatedRoom);

        await updateRoom(req, res);

        // capacity = 0 is falsy so "capacity && capacity <= 0" is false - no validation error
        // But 0 ?? 15 coalesces to 0 (0 is not null/undefined), so capacity becomes 0
        expect(prismaRoomUpdateMock).toHaveBeenCalledWith({
            where: { id: "room1" },
            data: {
                name: "Conference Room",
                capacity: 0,
                equipment: ["projector"],
            },
        });
        expect(status).toHaveBeenCalledWith(200);
        expect(json).toHaveBeenCalledWith(updatedRoom);
    });

    it("should return 400 when capacity is negative", async () => {
        const req: any = {
            params: { id: "room1" },
            body: {
                capacity: -5,
            },
        };

        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const res: any = { status, json };

        await updateRoom(req, res);

        expect(status).toHaveBeenCalledWith(400);
        expect(json).toHaveBeenCalledWith({
            error: "Capacité de salle invalide",
        });
    });

    it("should return 404 when room does not exist", async () => {
        const req: any = {
            params: { id: "nonexistent" },
            body: {
                name: "New Room",
            },
        };

        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const res: any = { status, json };

        const prismaRoomFindUniqueMock = prismaMock.room.findUnique as Mock;
        prismaRoomFindUniqueMock.mockResolvedValue(null);

        await updateRoom(req, res);

        expect(status).toHaveBeenCalledWith(404);
        expect(json).toHaveBeenCalledWith({ error: "Salle non trouvée" });
        expect(prismaMock.room.update).not.toHaveBeenCalled();
    });

    it("should return 500 when database update error occurs", async () => {
        const existingRoom = {
            id: "room1",
            name: "Conference Room",
            capacity: 15,
            equipment: ["projector"],
            createdAt: new Date(),
        };

        const req: any = {
            params: { id: "room1" },
            body: {
                name: "New Name",
            },
        };

        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const res: any = { status, json };

        (prismaMock.room.findUnique as Mock).mockResolvedValue(existingRoom);
        (prismaMock.room.update as Mock).mockRejectedValue(
            new Error("Database error")
        );

        await updateRoom(req, res);

        expect(status).toHaveBeenCalledWith(500);
        expect(json).toHaveBeenCalledWith({
            error: "Erreur lors de la mise à jour de la salle",
        });
    });

    it("should handle empty request body", async () => {
        const existingRoom = {
            id: "room1",
            name: "Conference Room",
            capacity: 15,
            equipment: ["projector"],
            createdAt: new Date(),
        };

        const updatedRoom = {
            id: "room1",
            name: "Conference Room",
            capacity: 15,
            equipment: ["projector"],
            createdAt: new Date(),
        };

        const req: any = {
            params: { id: "room1" },
            body: {},
        };

        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const res: any = { status, json };

        const prismaRoomFindUniqueMock = prismaMock.room.findUnique as Mock;
        const prismaRoomUpdateMock = prismaMock.room.update as Mock;
        prismaRoomFindUniqueMock.mockResolvedValue(existingRoom);
        prismaRoomUpdateMock.mockResolvedValue(updatedRoom);

        await updateRoom(req, res);

        expect(prismaRoomUpdateMock).toHaveBeenCalledWith({
            where: { id: "room1" },
            data: {
                name: "Conference Room",
                capacity: 15,
                equipment: ["projector"],
            },
        });
        expect(status).toHaveBeenCalledWith(200);
    });

    it("should handle update with capacity = 1", async () => {
        const existingRoom = {
            id: "room1",
            name: "Single Person Room",
            capacity: 1,
            equipment: [],
            createdAt: new Date(),
        };

        const updatedRoom = {
            id: "room1",
            name: "Single Person Room",
            capacity: 1,
            equipment: [],
            createdAt: new Date(),
        };

        const req: any = {
            params: { id: "room1" },
            body: {
                capacity: 1,
            },
        };

        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const res: any = { status, json };

        (prismaMock.room.findUnique as Mock).mockResolvedValue(existingRoom);
        (prismaMock.room.update as Mock).mockResolvedValue(updatedRoom);

        await updateRoom(req, res);

        expect(status).toHaveBeenCalledWith(200);
    });

    it("should handle update with large capacity", async () => {
        const existingRoom = {
            id: "room1",
            name: "Auditorium",
            capacity: 500,
            equipment: ["projector"],
            createdAt: new Date(),
        };

        const updatedRoom = {
            id: "room1",
            name: "Auditorium",
            capacity: 2000,
            equipment: ["projector", "microphone"],
            createdAt: new Date(),
        };

        const req: any = {
            params: { id: "room1" },
            body: {
                capacity: 2000,
            },
        };

        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const res: any = { status, json };

        (prismaMock.room.findUnique as Mock).mockResolvedValue(existingRoom);
        (prismaMock.room.update as Mock).mockResolvedValue(updatedRoom);

        await updateRoom(req, res);

        expect(status).toHaveBeenCalledWith(200);
    });

    it("should update equipment to empty array", async () => {
        const existingRoom = {
            id: "room1",
            name: "Simple Room",
            capacity: 10,
            equipment: ["projector", "whiteboard"],
            createdAt: new Date(),
        };

        const updatedRoom = {
            id: "room1",
            name: "Simple Room",
            capacity: 10,
            equipment: [],
            createdAt: new Date(),
        };

        const req: any = {
            params: { id: "room1" },
            body: {
                equipment: [],
            },
        };

        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const res: any = { status, json };

        const prismaRoomFindUniqueMock = prismaMock.room.findUnique as Mock;
        const prismaRoomUpdateMock = prismaMock.room.update as Mock;
        prismaRoomFindUniqueMock.mockResolvedValue(existingRoom);
        prismaRoomUpdateMock.mockResolvedValue(updatedRoom);

        await updateRoom(req, res);

        expect(prismaRoomUpdateMock).toHaveBeenCalledWith({
            where: { id: "room1" },
            data: {
                name: "Simple Room",
                capacity: 10,
                equipment: [],
            },
        });
        expect(status).toHaveBeenCalledWith(200);
    });
});

describe("isAdmin middleware for updateRoom", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubEnv('JWT_SECRET', 'test-secret-key');
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
        const req: any = { headers: { authorization: "InvalidFormat token" } };

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
        const decodedUser = { id: "user123", email: "test@example.com" };
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
            email: "test@example.com",
            name: "John Doe",
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
        const decodedUser = { id: "admin123", email: "admin@example.com" };
        const req: any = {
            headers: { authorization: "Bearer valid-token" },
        };

        const next = vi.fn();
        const res: any = {};

        mockedVerify.mockReturnValue(decodedUser);
        (prismaMock.user.findUnique as Mock).mockResolvedValue({
            id: "admin123",
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

    it("should allow admin to update room after authentication", async () => {
        const decodedUser = { id: "admin123", email: "admin@example.com" };
        const req: any = {
            headers: { authorization: "Bearer valid-token" },
            params: { id: "room1" },
            body: {
                name: "Updated Room",
                capacity: 30,
            },
        };

        const next = vi.fn();
        const res: any = {};

        mockedVerify.mockReturnValue(decodedUser);
        (prismaMock.user.findUnique as Mock).mockResolvedValue({
            id: "admin123",
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

        // Then admin can update room
        const existingRoom = {
            id: "room1",
            name: "Old Room",
            capacity: 20,
            equipment: ["projector"],
            createdAt: new Date(),
        };

        const updatedRoom = {
            id: "room1",
            name: "Updated Room",
            capacity: 30,
            equipment: ["projector"],
            createdAt: new Date(),
        };

        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const res2: any = { json, status };

        (prismaMock.room.findUnique as Mock).mockResolvedValue(existingRoom);
        (prismaMock.room.update as Mock).mockResolvedValue(updatedRoom);

        await updateRoom(req, res2);

        expect(prismaMock.room.update).toHaveBeenCalledWith({
            where: { id: "room1" },
            data: {
                name: "Updated Room",
                capacity: 30,
                equipment: ["projector"],
            },
        });
        expect(status).toHaveBeenCalledWith(200);
        expect(json).toHaveBeenCalledWith(updatedRoom);
    });

    it("should deny non-admin user from updating room", async () => {
        const decodedUser = { id: "user456", email: "user456@example.com" };
        const req: any = {
            headers: { authorization: "Bearer user-token" },
            params: { id: "room1" },
            body: {
                name: "Unauthorized Update",
                capacity: 20,
            },
        };

        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const next = vi.fn();
        const res: any = { status, json };

        mockedVerify.mockReturnValue(decodedUser);
        (prismaMock.user.findUnique as Mock).mockResolvedValue({
            id: "user456",
            email: "user456@example.com",
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

        // updateRoom should not be called
        expect(prismaMock.room.update).not.toHaveBeenCalled();
    });
});
