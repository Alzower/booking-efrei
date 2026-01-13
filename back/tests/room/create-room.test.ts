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

import { createRoom } from "../../controller/room/create-room.ts";
import { isAdmin } from "../../middleware/admin.ts";

describe("createRoom controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create room successfully with valid data", async () => {
    const req: any = {
      body: {
        name: "Conference Room A",
        capacity: 20,
        equipment: ["projector", "whiteboard", "screen"],
      },
    };

    const createdRoom = {
      id: "room1",
      name: "Conference Room A",
      capacity: 20,
      equipment: ["projector", "whiteboard", "screen"],
      createdAt: new Date(),
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { json, status };

    const prismaCreateMock = prismaMock.room.create as Mock;
    prismaCreateMock.mockResolvedValue(createdRoom);

    await createRoom(req, res);

    expect(prismaCreateMock).toHaveBeenCalledWith({
      data: {
        name: "Conference Room A",
        capacity: 20,
        equipment: ["projector", "whiteboard", "screen"],
      },
    });
    expect(status).toHaveBeenCalledWith(201);
    expect(json).toHaveBeenCalledWith(createdRoom);
  });

  it("should trim whitespace from room name", async () => {
    const req: any = {
      body: {
        name: "  Conference Room B  ",
        capacity: 15,
        equipment: ["screen"],
      },
    };

    const createdRoom = {
      id: "room2",
      name: "Conference Room B",
      capacity: 15,
      equipment: ["screen"],
      createdAt: new Date(),
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { json, status };

    const prismaCreateMock = prismaMock.room.create as Mock;
    prismaCreateMock.mockResolvedValue(createdRoom);

    await createRoom(req, res);

    expect(prismaCreateMock).toHaveBeenCalledWith({
      data: {
        name: "Conference Room B",
        capacity: 15,
        equipment: ["screen"],
      },
    });
    expect(status).toHaveBeenCalledWith(201);
  });

  it("should return 400 when room name is empty", async () => {
    const req: any = {
      body: {
        name: "",
        capacity: 20,
        equipment: ["projector"],
      },
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status, json };

    await createRoom(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({ error: "Nom de salle invalide" });
    expect(prismaMock.room.create).not.toHaveBeenCalled();
  });

  it("should return 400 when room name is only whitespace", async () => {
    const req: any = {
      body: {
        name: "   ",
        capacity: 20,
        equipment: ["projector"],
      },
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status, json };

    await createRoom(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({ error: "Nom de salle invalide" });
    expect(prismaMock.room.create).not.toHaveBeenCalled();
  });

  it("should return 400 when room name is missing", async () => {
    const req: any = {
      body: {
        capacity: 20,
        equipment: ["projector"],
      },
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status, json };

    await createRoom(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({ error: "Nom de salle invalide" });
  });

  it("should return 400 when capacity is 0", async () => {
    const req: any = {
      body: {
        name: "Conference Room",
        capacity: 0,
        equipment: ["projector"],
      },
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status, json };

    await createRoom(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      error: "Capacité de salle invalide",
    });
    expect(prismaMock.room.create).not.toHaveBeenCalled();
  });

  it("should return 400 when capacity is negative", async () => {
    const req: any = {
      body: {
        name: "Conference Room",
        capacity: -5,
        equipment: ["projector"],
      },
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status, json };

    await createRoom(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      error: "Capacité de salle invalide",
    });
  });

  it("should return 400 when capacity is missing", async () => {
    const req: any = {
      body: {
        name: "Conference Room",
        equipment: ["projector"],
      },
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status, json };

    await createRoom(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      error: "Capacité de salle invalide",
    });
  });

  it("should return 400 when equipment is not an array", async () => {
    const req: any = {
      body: {
        name: "Conference Room",
        capacity: 20,
        equipment: "projector",
      },
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status, json };

    await createRoom(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      error: "L'équipement doit être un tableau",
    });
    expect(prismaMock.room.create).not.toHaveBeenCalled();
  });

  it("should return 400 when equipment is object instead of array", async () => {
    const req: any = {
      body: {
        name: "Conference Room",
        capacity: 20,
        equipment: { projector: true },
      },
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status, json };

    await createRoom(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      error: "L'équipement doit être un tableau",
    });
  });

  it("should return 400 when equipment contains non-string items", async () => {
    const req: any = {
      body: {
        name: "Conference Room",
        capacity: 20,
        equipment: ["projector", 123, "whiteboard"],
      },
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status, json };

    await createRoom(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      error:
        "Tous les équipements doivent être des chaînes de caractères non vides",
    });
    expect(prismaMock.room.create).not.toHaveBeenCalled();
  });

  it("should return 400 when equipment contains empty strings", async () => {
    const req: any = {
      body: {
        name: "Conference Room",
        capacity: 20,
        equipment: ["projector", "", "whiteboard"],
      },
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status, json };

    await createRoom(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      error:
        "Tous les équipements doivent être des chaînes de caractères non vides",
    });
  });

  it("should return 400 when equipment contains whitespace-only strings", async () => {
    const req: any = {
      body: {
        name: "Conference Room",
        capacity: 20,
        equipment: ["projector", "   ", "whiteboard"],
      },
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status, json };

    await createRoom(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      error:
        "Tous les équipements doivent être des chaînes de caractères non vides",
    });
  });

  it("should create room with empty equipment array", async () => {
    const req: any = {
      body: {
        name: "Simple Room",
        capacity: 10,
        equipment: [],
      },
    };

    const createdRoom = {
      id: "room3",
      name: "Simple Room",
      capacity: 10,
      equipment: [],
      createdAt: new Date(),
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { json, status };

    (prismaMock.room.create as Mock).mockResolvedValue(createdRoom);

    await createRoom(req, res);

    expect(status).toHaveBeenCalledWith(201);
    expect(json).toHaveBeenCalledWith(createdRoom);
  });

  it("should return 500 when database error occurs", async () => {
    const req: any = {
      body: {
        name: "Conference Room",
        capacity: 20,
        equipment: ["projector"],
      },
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status, json };

    (prismaMock.room.create as Mock).mockRejectedValue(
      new Error("Database error")
    );

    await createRoom(req, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      error: "Erreur lors de la création de la salle",
    });
  });

  it("should handle large capacity values", async () => {
    const req: any = {
      body: {
        name: "Auditorium",
        capacity: 1000,
        equipment: ["projector", "microphone", "speaker_system"],
      },
    };

    const createdRoom = {
      id: "room4",
      name: "Auditorium",
      capacity: 1000,
      equipment: ["projector", "microphone", "speaker_system"],
      createdAt: new Date(),
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { json, status };

    (prismaMock.room.create as Mock).mockResolvedValue(createdRoom);

    await createRoom(req, res);

    expect(status).toHaveBeenCalledWith(201);
    expect(json).toHaveBeenCalledWith(createdRoom);
  });

  it("should handle room with many equipment items", async () => {
    const equipment = [
      "projector",
      "whiteboard",
      "screen",
      "conference_phone",
      "microphone",
      "speaker",
      "tv",
      "video_camera",
    ];

    const req: any = {
      body: {
        name: "Premium Meeting Room",
        capacity: 50,
        equipment: equipment,
      },
    };

    const createdRoom = {
      id: "room5",
      name: "Premium Meeting Room",
      capacity: 50,
      equipment: equipment,
      createdAt: new Date(),
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { json, status };

    (prismaMock.room.create as Mock).mockResolvedValue(createdRoom);

    await createRoom(req, res);

    expect(status).toHaveBeenCalledWith(201);
    expect(json).toHaveBeenCalledWith(createdRoom);
  });
});

describe("isAdmin middleware for createRoom", () => {
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

  it("should allow admin to create room after authentication", async () => {
    const decodedUser = { id: "admin123", email: "admin@example.com" };
    const req: any = {
      headers: { authorization: "Bearer valid-token" },
      body: {
        name: "New Conference Room",
        capacity: 25,
        equipment: ["projector", "whiteboard"],
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

    // Then admin can create room
    const createdRoom = {
      id: "room6",
      name: "New Conference Room",
      capacity: 25,
      equipment: ["projector", "whiteboard"],
      createdAt: new Date(),
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res2: any = { json, status };

    (prismaMock.room.create as Mock).mockResolvedValue(createdRoom);

    await createRoom(req, res2);

    expect(prismaMock.room.create).toHaveBeenCalledWith({
      data: {
        name: "New Conference Room",
        capacity: 25,
        equipment: ["projector", "whiteboard"],
      },
    });
    expect(status).toHaveBeenCalledWith(201);
    expect(json).toHaveBeenCalledWith(createdRoom);
  });

  it("should deny non-admin user from creating room", async () => {
    const decodedUser = { id: "user456", email: "user456@example.com" };
    const req: any = {
      headers: { authorization: "Bearer user-token" },
      body: {
        name: "Unauthorized Room",
        capacity: 20,
        equipment: ["projector"],
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

    // createRoom should not be called
    expect(prismaMock.room.create).not.toHaveBeenCalled();
  });
});
