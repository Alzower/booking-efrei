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

import { deleteUser } from "../../controller/user/delete-user.ts";
import { isAdmin } from "../../middleware/admin.ts";

describe("deleteUser controller", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should delete user successfully", async () => {
        const req: any = {
            params: { id: "user123" },
        };

        const deletedUser = {
            id: "user123",
            email: "test@example.com",
            name: "John Doe",
            role: "USER",
            password: "hashed_password",
            createdAt: new Date(),
        };

        const json = vi.fn();
        const res: any = { json, status: vi.fn(() => ({ json })) };

        const prismaDeleteMock = prismaMock.user.delete as Mock;
        prismaDeleteMock.mockResolvedValue(deletedUser);

        await deleteUser(req, res);

        expect(prismaDeleteMock).toHaveBeenCalledWith({
            where: { id: "user123" },
        });
        expect(res.json).toHaveBeenCalledWith(deletedUser);
    });

    it("should return 500 when user not found", async () => {
        const req: any = {
            params: { id: "nonexistent" },
        };

        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const res: any = { status, json };

        const prismaDeleteMock = prismaMock.user.delete as Mock;
        prismaDeleteMock.mockRejectedValue(
            new Error("User not found")
        );

        await deleteUser(req, res);

        expect(status).toHaveBeenCalledWith(500);
        expect(json).toHaveBeenCalledWith({
            error: "Erreur lors de la suppression de l'utilisateur",
        });
    });

    it("should return 500 when database delete error occurs", async () => {
        const req: any = {
            params: { id: "user123" },
        };

        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const res: any = { status, json };

        const prismaDeleteMock = prismaMock.user.delete as Mock;
        prismaDeleteMock.mockRejectedValue(
            new Error("Database error")
        );

        await deleteUser(req, res);

        expect(status).toHaveBeenCalledWith(500);
        expect(json).toHaveBeenCalledWith({
            error: "Erreur lors de la suppression de l'utilisateur",
        });
    });

    it("should handle missing user id parameter", async () => {
        const req: any = {
            params: {},
        };

        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const res: any = { status, json };

        const prismaDeleteMock = prismaMock.user.delete as Mock;
        prismaDeleteMock.mockRejectedValue(
            new Error("Invalid id")
        );

        await deleteUser(req, res);

        expect(status).toHaveBeenCalledWith(500);
        expect(json).toHaveBeenCalledWith({
            error: "Erreur lors de la suppression de l'utilisateur",
        });
    });

    it("should return deleted user data after successful deletion", async () => {
        const req: any = {
            params: { id: "user456" },
        };

        const deletedUser = {
            id: "user456",
            email: "user456@example.com",
            name: "User To Delete",
            role: "ADMIN",
            password: "hashed_password",
            createdAt: new Date(),
        };

        const json = vi.fn();
        const res: any = { json, status: vi.fn(() => ({ json })) };

        const prismaDeleteMock = prismaMock.user.delete as Mock;
        prismaDeleteMock.mockResolvedValue(deletedUser);

        await deleteUser(req, res);

        expect(res.json).toHaveBeenCalledWith(deletedUser);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                id: "user456",
                email: "user456@example.com",
                name: "User To Delete",
            })
        );
    });
});

describe("isAdmin middleware for deleteUser", () => {
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
        expect(json).toHaveBeenCalledWith({
            error: "Token invalide",
        });
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

    it("should return 401 when token is missing after Bearer", async () => {
        const req: any = { headers: { authorization: "Bearer " } };

        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const next = vi.fn();
        const res: any = { status, json };

        await isAdmin(req, res, next);

        expect(status).toHaveBeenCalledWith(401);
        expect(json).toHaveBeenCalledWith({ error: "Token manquant" });
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
});
