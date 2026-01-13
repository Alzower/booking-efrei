import { vi, describe, it, expect, beforeEach, Mock, afterEach } from "vitest";
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

import { getUser, getUsers } from "../../controller/user/get-user.ts";
import { userIsAuth } from "../../middleware/userIsAuth.ts";
import { isAdmin } from "../../middleware/admin.ts";



describe("getUser controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return user when user is found", async () => {
    const fakeUser = {
      id: "user123",
      email: "test@example.com",
      name: "John Doe",
      role: "USER",
      password: "hashed_password",
      createdAt: new Date(),
    };

    const req: any = { user: { id: "user123" } };

    const json = vi.fn();
    const res: any = { json, status: vi.fn(() => ({ json })) };

    const prismaFindUniqueMock = prismaMock.user.findUnique as Mock;
    prismaFindUniqueMock.mockResolvedValue(fakeUser);

    await getUser(req, res);

    expect(prismaFindUniqueMock).toHaveBeenCalledWith({
      where: { id: "user123" },
    });
    expect(res.json).toHaveBeenCalledWith(fakeUser);
  });

  it("should return 404 when user is not found", async () => {
    const req: any = { user: { id: "nonexistent" } };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status, json };

    const prismaFindUniqueMock = prismaMock.user.findUnique as Mock;
    prismaFindUniqueMock.mockResolvedValue(null);

    await getUser(req, res);

    expect(prismaFindUniqueMock).toHaveBeenCalledWith({
      where: { id: "nonexistent" },
    });
    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({ error: "Utilisateur non trouvé" });
  });

  it("should return 500 when database error occurs", async () => {
    const req: any = { user: { id: "user123" } };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status, json };

    const prismaFindUniqueMock = prismaMock.user.findUnique as Mock;
    prismaFindUniqueMock.mockRejectedValue(
      new Error("Database error")
    );

    await getUser(req, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      error: "Erreur lors de la récupération de l'utilisateur",
    });
  });

  it("should handle undefined user id gracefully", async () => {
    const req: any = { user: { id: undefined } };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status, json };

    const prismaFindUniqueMock = prismaMock.user.findUnique as Mock;
    prismaFindUniqueMock.mockResolvedValue(null);

    await getUser(req, res);

    expect(prismaFindUniqueMock).toHaveBeenCalledWith({
      where: { id: undefined },
    });
    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({ error: "Utilisateur non trouvé" });
  });

  it("should handle missing user object in request", async () => {
    const req: any = {};

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status, json };

    const prismaFindUniqueMock = prismaMock.user.findUnique as Mock;
    prismaFindUniqueMock.mockResolvedValue(null);

    await getUser(req, res);

    expect(prismaFindUniqueMock).toHaveBeenCalledWith({
      where: { id: undefined },
    });
    expect(status).toHaveBeenCalledWith(404);
  });
});

describe("userIsAuth middleware for getUser", () => {
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

describe("getUsers controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return all users when query is successful", async () => {
    const fakeUsers = [
      {
        id: "user1",
        email: "user1@example.com",
        name: "User One",
        role: "USER",
        password: "hashed1",
        createdAt: new Date(),
      },
      {
        id: "user2",
        email: "user2@example.com",
        name: "User Two",
        role: "ADMIN",
        password: "hashed2",
        createdAt: new Date(),
      },
    ];

    const req: any = {};

    const json = vi.fn();
    const res: any = { json, status: vi.fn(() => ({ json })) };

    const prismaFindManyMock = prismaMock.user.findMany as Mock;
    prismaFindManyMock.mockResolvedValue(fakeUsers);

    await getUsers(req, res);

    expect(prismaFindManyMock).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(fakeUsers);
  });

  it("should return empty array when no users exist", async () => {
    const req: any = {};

    const json = vi.fn();
    const res: any = { json, status: vi.fn(() => ({ json })) };

    const prismaFindManyMock = prismaMock.user.findMany as Mock;
    prismaFindManyMock.mockResolvedValue([]);

    await getUsers(req, res);

    expect(prismaFindManyMock).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith([]);
  });

  it("should return 500 when database error occurs", async () => {
    const req: any = {};

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status, json };

    const prismaFindManyMock = prismaMock.user.findMany as Mock;
    prismaFindManyMock.mockRejectedValue(
      new Error("Database error")
    );

    await getUsers(req, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      error: "Erreur lors de la récupération des utilisateurs",
    });
  });
});

describe("isAdmin middleware for getUsers", () => {
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
