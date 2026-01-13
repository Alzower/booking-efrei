import { vi, describe, it, expect, beforeEach, Mock } from "vitest";
import { prismaMock } from "../../db/prisma-mocks.ts";

// Mock prisma before importing controller
vi.mock("../../db/prisma.ts", () => ({
  default: prismaMock,
}));

// Mock bcrypt
const { mockedHash } = vi.hoisted(() => {
  return {
    mockedHash: vi.fn(),
  };
});

vi.mock("bcrypt", () => ({
  default: {
    hash: mockedHash,
  },
}));

// Mock helpers
vi.mock("../../../helper/mail-helper.ts", () => ({
  isMailValid: vi.fn(),
}));

vi.mock("../../../helper/password-helper.ts", () => ({
  passwordIsValid: vi.fn(),
}));

import { createUser } from "../../controller/user/create-user.ts";
import { isMailValid } from "../../../helper/mail-helper.ts";
import { passwordIsValid } from "../../../helper/password-helper.ts";

describe("createUser controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedHash.mockResolvedValue("hashed_password_12345");
  });

  it("should create user successfully with valid email and password", async () => {
    const req: any = {
      body: {
        email: "newuser@example.com",
        name: "New User",
        password: "SecurePass123!",
      },
    };

    const fakeCreatedUser = {
      id: "user456",
      email: "newuser@example.com",
      name: "New User",
      role: "USER",
      password: "hashed_password_12345",
      createdAt: new Date(),
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status, json };

    const isValidMailMock = isMailValid as Mock;
    const isValidPasswordMock = passwordIsValid as Mock;
    const prismaCreateMock = prismaMock.user.create as Mock;

    isValidMailMock.mockReturnValue(true);
    isValidPasswordMock.mockReturnValue(true);
    prismaCreateMock.mockResolvedValue(fakeCreatedUser);

    await createUser(req, res);

    expect(mockedHash).toHaveBeenCalledWith("SecurePass123!", 10);
    expect(isValidMailMock).toHaveBeenCalledWith("newuser@example.com");
    expect(isValidPasswordMock).toHaveBeenCalledWith("SecurePass123!");
    expect(prismaCreateMock).toHaveBeenCalledWith({
      data: {
        email: "newuser@example.com",
        name: "New User",
        password: "hashed_password_12345",
      },
    });
    expect(status).toHaveBeenCalledWith(201);
    expect(json).toHaveBeenCalledWith({
      id: "user456",
      email: "newuser@example.com",
      name: "New User",
      role: "USER",
      createdAt: fakeCreatedUser.createdAt,
    });
  });

  it("should return 400 when invalid role is provided", async () => {
    const req: any = {
      body: {
        email: "newuser@example.com",
        name: "New User",
        password: "SecurePass123!",
        role: "SUPERUSER",
      },
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status, json };

    await createUser(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({ error: "Rôle utilisateur invalide" });
    expect(mockedHash).not.toHaveBeenCalled();
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it("should return 400 when email is invalid", async () => {
    const req: any = {
      body: {
        email: "invalid-email",
        name: "New User",
        password: "SecurePass123!",
      },
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status, json };

    const isValidMailMock = isMailValid as Mock;
    const isValidPasswordMock = passwordIsValid as Mock;
    const prismaCreateMock = prismaMock.user.create as Mock;

    isValidMailMock.mockReturnValue(false);
    isValidPasswordMock.mockReturnValue(true);
    mockedHash.mockResolvedValue("hashed_password_12345");

    await createUser(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({ error: "Adresse email invalide" });
    expect(prismaCreateMock).not.toHaveBeenCalled();
  });

  it("should return 400 when password is too short", async () => {
    const req: any = {
      body: {
        email: "newuser@example.com",
        name: "New User",
        password: "short",
      },
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status, json };

    const isValidMailMock = isMailValid as Mock;
    const isValidPasswordMock = passwordIsValid as Mock;
    const prismaCreateMock = prismaMock.user.create as Mock;

    isValidMailMock.mockReturnValue(true);
    isValidPasswordMock.mockReturnValue(false);
    mockedHash.mockResolvedValue("hashed_password_12345");

    await createUser(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      error:
        "Mot de passe invalide. Il doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.",
    });
    expect(prismaCreateMock).not.toHaveBeenCalled();
  });

  it("should return 400 when password is missing uppercase letter", async () => {
    const req: any = {
      body: {
        email: "newuser@example.com",
        name: "New User",
        password: "securepass123!",
      },
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status, json };

    const isValidMailMock = isMailValid as Mock;
    const isValidPasswordMock = passwordIsValid as Mock;
    const prismaCreateMock = prismaMock.user.create as Mock;

    isValidMailMock.mockReturnValue(true);
    isValidPasswordMock.mockReturnValue(false);
    mockedHash.mockResolvedValue("hashed_password_12345");

    await createUser(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      error:
        "Mot de passe invalide. Il doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.",
    });
    expect(prismaCreateMock).not.toHaveBeenCalled();
  });

  it("should return 400 when password is missing special character", async () => {
    const req: any = {
      body: {
        email: "newuser@example.com",
        name: "New User",
        password: "SecurePass123",
      },
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status, json };

    const isValidMailMock = isMailValid as Mock;
    const isValidPasswordMock = passwordIsValid as Mock;
    const prismaCreateMock = prismaMock.user.create as Mock;

    isValidMailMock.mockReturnValue(true);
    isValidPasswordMock.mockReturnValue(false);
    mockedHash.mockResolvedValue("hashed_password_12345");

    await createUser(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      error:
        "Mot de passe invalide. Il doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.",
    });
    expect(prismaCreateMock).not.toHaveBeenCalled();
  });

  it("should hash password with bcrypt before creating user", async () => {
    const req: any = {
      body: {
        email: "newuser@example.com",
        name: "New User",
        password: "SecurePass123!",
      },
    };

    const fakeCreatedUser = {
      id: "user456",
      email: "newuser@example.com",
      name: "New User",
      role: "USER",
      password: "hashed_password_12345",
      createdAt: new Date(),
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status, json };

    const isValidMailMock = isMailValid as Mock;
    const isValidPasswordMock = passwordIsValid as Mock;
    const prismaCreateMock = prismaMock.user.create as Mock;

    isValidMailMock.mockReturnValue(true);
    isValidPasswordMock.mockReturnValue(true);
    mockedHash.mockResolvedValue("hashed_password_12345");
    prismaCreateMock.mockResolvedValue(fakeCreatedUser);

    await createUser(req, res);

    expect(mockedHash).toHaveBeenCalledWith("SecurePass123!", 10);
    expect(prismaCreateMock).toHaveBeenCalledWith({
      data: {
        email: "newuser@example.com",
        name: "New User",
        password: "hashed_password_12345",
      },
    });
  });

  it("should not return password in response", async () => {
    const req: any = {
      body: {
        email: "newuser@example.com",
        name: "New User",
        password: "SecurePass123!",
      },
    };

    const fakeCreatedUser = {
      id: "user456",
      email: "newuser@example.com",
      name: "New User",
      role: "USER",
      password: "hashed_password_12345",
      createdAt: new Date(),
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status, json };

    const isValidMailMock = isMailValid as Mock;
    const isValidPasswordMock = passwordIsValid as Mock;
    const prismaCreateMock = prismaMock.user.create as Mock;

    isValidMailMock.mockReturnValue(true);
    isValidPasswordMock.mockReturnValue(true);
    mockedHash.mockResolvedValue("hashed_password_12345");
    prismaCreateMock.mockResolvedValue(fakeCreatedUser);

    await createUser(req, res);

    const callArgs = (json as Mock).mock.calls[0][0];
    expect(callArgs).not.toHaveProperty("password");
    expect(callArgs).toHaveProperty("id");
    expect(callArgs).toHaveProperty("email");
    expect(callArgs).toHaveProperty("name");
    expect(callArgs).toHaveProperty("role");
  });

  it("should return 500 when database error occurs", async () => {
    const req: any = {
      body: {
        email: "newuser@example.com",
        name: "New User",
        password: "SecurePass123!",
      },
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status, json };

    const isValidMailMock = isMailValid as Mock;
    const isValidPasswordMock = passwordIsValid as Mock;
    const prismaCreateMock = prismaMock.user.create as Mock;

    isValidMailMock.mockReturnValue(true);
    isValidPasswordMock.mockReturnValue(true);
    mockedHash.mockResolvedValue("hashed_password_12345");
    prismaCreateMock.mockRejectedValue(
      new Error("Database error")
    );

    await createUser(req, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      error: "Erreur lors de la création de l'utilisateur",
    });
  });

  it("should handle bcrypt hash error gracefully", async () => {
    const req: any = {
      body: {
        email: "newuser@example.com",
        name: "New User",
        password: "SecurePass123!",
      },
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status, json };

    const isValidMailMock = isMailValid as Mock;
    const isValidPasswordMock = passwordIsValid as Mock;

    isValidMailMock.mockReturnValue(true);
    isValidPasswordMock.mockReturnValue(true);
    mockedHash.mockRejectedValue(new Error("Hash error"));

    await createUser(req, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      error: "Erreur lors de la création de l'utilisateur",
    });
  });

  it("should accept ADMIN role when valid", async () => {
    const req: any = {
      body: {
        email: "admin@example.com",
        name: "Admin User",
        password: "SecurePass123!",
        role: "ADMIN",
      },
    };

    const fakeCreatedUser = {
      id: "admin123",
      email: "admin@example.com",
      name: "Admin User",
      role: "ADMIN",
      password: "hashed_password_12345",
      createdAt: new Date(),
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status, json };

    const isValidMailMock = isMailValid as Mock;
    const isValidPasswordMock = passwordIsValid as Mock;
    const prismaCreateMock = prismaMock.user.create as Mock;
    
    isValidMailMock.mockReturnValue(true);
    isValidPasswordMock.mockReturnValue(true);
    mockedHash.mockResolvedValue("hashed_password_12345");
    prismaCreateMock.mockResolvedValue(fakeCreatedUser);

    await createUser(req, res);

    expect(status).toHaveBeenCalledWith(201);
    expect(prismaCreateMock).toHaveBeenCalled();
  });
});
