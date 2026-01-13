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

import { updateUser } from "../../controller/user/update-user.ts";
import { userIsAuth } from "../../middleware/userIsAuth.ts";

describe("updateUser controller", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should update user successfully with all fields", async () => {
        const req: any = {
            user: { id: "user123" },
            body: {
                email: "newemail@example.com",
                name: "Updated Name",
                password: "NewHashedPassword123",
            },
        };

        const updatedUser = {
            id: "user123",
            email: "newemail@example.com",
            name: "Updated Name",
            role: "USER",
            password: "NewHashedPassword123",
            createdAt: new Date(),
        };

        const json = vi.fn();
        const res: any = { json, status: vi.fn(() => ({ json })) };

        const prismaUpdateMock = prismaMock.user.update as Mock;
        prismaUpdateMock.mockResolvedValue(updatedUser);

        await updateUser(req, res);

        expect(prismaUpdateMock).toHaveBeenCalledWith({
            where: { id: "user123" },
            data: {
                email: "newemail@example.com",
                name: "Updated Name",
                password: "NewHashedPassword123",
            },
        });
        expect(res.json).toHaveBeenCalledWith(updatedUser);
    });

    it("should update user with only email", async () => {
        const req: any = {
            user: { id: "user123" },
            body: {
                email: "newemail@example.com",
            },
        };

        const updatedUser = {
            id: "user123",
            email: "newemail@example.com",
            name: "John Doe",
            role: "USER",
            password: "hashed_password",
            createdAt: new Date(),
        };

        const json = vi.fn();
        const res: any = { json, status: vi.fn(() => ({ json })) };

        const prismaUpdateMock = prismaMock.user.update as Mock;
        prismaUpdateMock.mockResolvedValue(updatedUser);

        await updateUser(req, res);

        expect(prismaUpdateMock).toHaveBeenCalledWith({
            where: { id: "user123" },
            data: {
                email: "newemail@example.com",
                name: undefined,
                password: undefined,
            },
        });
        expect(res.json).toHaveBeenCalledWith(updatedUser);
    });

    it("should update user with only name", async () => {
        const req: any = {
            user: { id: "user123" },
            body: {
                name: "New Name",
            },
        };

        const updatedUser = {
            id: "user123",
            email: "test@example.com",
            name: "New Name",
            role: "USER",
            password: "hashed_password",
            createdAt: new Date(),
        };

        const json = vi.fn();
        const res: any = { json, status: vi.fn(() => ({ json })) };

        const prismaUpdateMock = prismaMock.user.update as Mock;
        prismaUpdateMock.mockResolvedValue(updatedUser);

        await updateUser(req, res);

        expect(prismaUpdateMock).toHaveBeenCalledWith({
            where: { id: "user123" },
            data: {
                email: undefined,
                name: "New Name",
                password: undefined,
            },
        });
        expect(res.json).toHaveBeenCalledWith(updatedUser);
    });

    it("should update user with only password", async () => {
        const req: any = {
            user: { id: "user123" },
            body: {
                password: "NewHashedPassword123",
            },
        };

        const updatedUser = {
            id: "user123",
            email: "test@example.com",
            name: "John Doe",
            role: "USER",
            password: "NewHashedPassword123",
            createdAt: new Date(),
        };

        const json = vi.fn();
        const res: any = { json, status: vi.fn(() => ({ json })) };

        const prismaUpdateMock = prismaMock.user.update as Mock;
        prismaUpdateMock.mockResolvedValue(updatedUser);

        await updateUser(req, res);

        expect(prismaUpdateMock).toHaveBeenCalledWith({
            where: { id: "user123" },
            data: {
                email: undefined,
                name: undefined,
                password: "NewHashedPassword123",
            },
        });
        expect(res.json).toHaveBeenCalledWith(updatedUser);
    });

    it("should return 500 when database update error occurs", async () => {
        const req: any = {
            user: { id: "user123" },
            body: {
                email: "newemail@example.com",
                name: "Updated Name",
                password: "NewHashedPassword123",
            },
        };

        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const res: any = { status, json };

        const prismaUpdateMock = prismaMock.user.update as Mock;
        prismaUpdateMock.mockRejectedValue(
            new Error("Database error")
        );

        await updateUser(req, res);

        expect(status).toHaveBeenCalledWith(500);
        expect(json).toHaveBeenCalledWith({
            error: "Erreur lors de la mise à jour de l'utilisateur",
        });
    });

    it("should handle missing user id gracefully", async () => {
        const req: any = {
            user: {},
            body: {
                email: "newemail@example.com",
                name: "Updated Name",
            },
        };

        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const res: any = { status, json };

        const prismaUpdateMock = prismaMock.user.update as Mock;
        prismaUpdateMock.mockRejectedValue(
            new Error("User not found")
        );

        await updateUser(req, res);

        expect(status).toHaveBeenCalledWith(500);
        expect(json).toHaveBeenCalledWith({
            error: "Erreur lors de la mise à jour de l'utilisateur",
        });
    });

    it("should handle empty request body", async () => {
        const req: any = {
            user: { id: "user123" },
            body: {},
        };

        const updatedUser = {
            id: "user123",
            email: "test@example.com",
            name: "John Doe",
            role: "USER",
            password: "hashed_password",
            createdAt: new Date(),
        };

        const json = vi.fn();
        const res: any = { json, status: vi.fn(() => ({ json })) };

        const prismaUpdateMock = prismaMock.user.update as Mock;
        prismaUpdateMock.mockResolvedValue(updatedUser);

        await updateUser(req, res);

        expect(prismaUpdateMock).toHaveBeenCalledWith({
            where: { id: "user123" },
            data: {
                email: undefined,
                name: undefined,
                password: undefined,
            },
        });
        expect(res.json).toHaveBeenCalledWith(updatedUser);
    });

    it("should update user email and name together", async () => {
        const req: any = {
            user: { id: "user123" },
            body: {
                email: "newemail@example.com",
                name: "New Full Name",
            },
        };

        const updatedUser = {
            id: "user123",
            email: "newemail@example.com",
            name: "New Full Name",
            role: "USER",
            password: "hashed_password",
            createdAt: new Date(),
        };

        const json = vi.fn();
        const res: any = { json, status: vi.fn(() => ({ json })) };

        const prismaUpdateMock = prismaMock.user.update as Mock;
        prismaUpdateMock.mockResolvedValue(updatedUser);

        await updateUser(req, res);

        expect(prismaUpdateMock).toHaveBeenCalledWith({
            where: { id: "user123" },
            data: {
                email: "newemail@example.com",
                name: "New Full Name",
                password: undefined,
            },
        });
        expect(res.json).toHaveBeenCalledWith(updatedUser);
    });
});

describe("userIsAuth middleware for updateUser", () => {
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

        await userIsAuth(req, res, next);

        expect(status).toHaveBeenCalledWith(401);
        expect(json).toHaveBeenCalledWith({
            error: "Format du token invalide. Utilisez 'Bearer <token>'",
        });
        expect(next).not.toHaveBeenCalled();
    });

    it("should return 401 when bearer token format is invalid", async () => {
        const req: any = { headers: { authorization: "InvalidFormat token" } };

        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const next = vi.fn();
        const res: any = { status, json };

        await userIsAuth(req, res, next);

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

        await userIsAuth(req, res, next);

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

        await userIsAuth(req, res, next);

        expect(status).toHaveBeenCalledWith(401);
        expect(json).toHaveBeenCalledWith({ error: "Token invalide" });
        expect(next).not.toHaveBeenCalled();
    });
});
