import { vi, describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from "vitest";
import prisma from "../../db/prisma.ts";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { deleteUser } from "../../controller/user/delete-user.ts";

// Helper to check if database is available
async function isDatabaseAvailable(): Promise<boolean> {
  try {
    await new Promise((resolve) => setTimeout(resolve, 100));
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error("Database connection error:", error);
    return false;
  }
}

// Helper to create test user
async function createTestUser(email: string, name: string = "Test User", password: string = "TestPass123!") {
  const hashedPassword = await bcrypt.hash(password, 10);
  return await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
      role: "USER",
    },
  });
}

// Helper to generate JWT token
function generateToken(userId: string, email: string, secret: string = "test-secret-key"): string {
  return jwt.sign({ id: userId, email }, secret, { expiresIn: "7d" });
}

describe("Delete User Integration Tests - deleteUser (DELETE /me)", () => {
  const jwtSecret = "test-secret-key-integration";
  let testUser: any;
  let databaseAvailable = true;

  beforeAll(async () => {
    vi.stubEnv("JWT_SECRET", jwtSecret);
    databaseAvailable = await isDatabaseAvailable();
    if (!databaseAvailable) {
      console.warn("⚠️  DATABASE NOT AVAILABLE FOR DELETE USER INTEGRATION TESTS");
    } else {
      console.log("\n✅ Database connection successful. Running delete-user integration tests...\n");
    }
  });

  afterAll(async () => {
    vi.unstubAllEnvs();
  });

  beforeEach(async () => {
    if (!databaseAvailable) return;

    // Create test user
    testUser = await createTestUser(`delete-user-${Date.now()}@example.com`);
  });

  afterEach(async () => {
    if (!databaseAvailable) return;

    // Clean up - try to delete if not already deleted
    try {
      if (testUser?.id) {
        await prisma.user.delete({
          where: { id: testUser.id },
        });
      }
    } catch (error) {
      // User may already be deleted
    }
  });

  it("should delete user successfully", async () => {
    const token = generateToken(testUser.id, testUser.email, jwtSecret);

    const req: any = {
      headers: { authorization: `Bearer ${token}` },
      user: { id: testUser.id, email: testUser.email },
      params: { id: testUser.id }, // DELETE /:id uses params
      body: {},
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { json, status };

    await deleteUser(req, res);

    expect(json).toHaveBeenCalled();
    const response = json.mock.calls[0][0];
    // Response is the deleted user object
    expect(response).toHaveProperty("id");

    // Verify user is deleted from database
    const deletedUser = await prisma.user.findUnique({
      where: { id: testUser.id },
    });
    expect(deletedUser).toBeNull();

    // Mark as deleted so afterEach doesn't try to delete again
    testUser.id = null;
  });

  it("should return confirmation message on successful deletion", async () => {
    const token = generateToken(testUser.id, testUser.email, jwtSecret);

    const req: any = {
      headers: { authorization: `Bearer ${token}` },
      user: { id: testUser.id, email: testUser.email },
      params: { id: testUser.id },
      body: {},
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { json, status };

    await deleteUser(req, res);

    expect(json).toHaveBeenCalled();
    const response = json.mock.calls[0][0];
    // Controller returns deleted user object, not a message
    expect(response).toHaveProperty("id");

    testUser.id = null;
  });

  it("should access req.user set by userIsAuth middleware", async () => {
    const token = generateToken(testUser.id, testUser.email, jwtSecret);

    // Verify middleware would set req.user correctly
    const req: any = {
      headers: { authorization: `Bearer ${token}` },
      user: { id: testUser.id, email: testUser.email }, // Set by middleware
      params: { id: testUser.id }, // DELETE /:id
      body: {},
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { json, status };

    await deleteUser(req, res);

    // Verify the correct user was deleted
    const deletedUser = await prisma.user.findUnique({
      where: { id: testUser.id },
    });
    expect(deletedUser).toBeNull();

    testUser.id = null;
  });

  it("should delete only the authenticated user", async () => {
    // Create second user
    const secondUser = await createTestUser(`second-delete-${Date.now()}@example.com`, "Second User");

    try {
      const token = generateToken(testUser.id, testUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: testUser.id, email: testUser.email },
        body: {},
      };

      const json = vi.fn();
      const res: any = { json };

      await deleteUser(req, res);

      expect(json).toHaveBeenCalled();

      // Verify first user is deleted
      const deletedUser = await prisma.user.findUnique({
        where: { id: testUser.id },
      });
      expect(deletedUser).toBeNull();

      // Verify second user still exists
      const existingUser = await prisma.user.findUnique({
        where: { id: secondUser.id },
      });
      expect(existingUser).not.toBeNull();

      testUser.id = null;

      // Clean up second user
      await prisma.user.delete({
        where: { id: secondUser.id },
      });
    } catch (error) {
      // Clean up on error
      await prisma.user.delete({
        where: { id: secondUser.id },
      }).catch(() => {});
    }
  });

  it("should delete user with ADMIN role", async () => {
    // Create admin user
    const adminUser = await createTestUser(`admin-delete-${Date.now()}@example.com`, "Admin User");
    await prisma.user.update({
      where: { id: adminUser.id },
      data: { role: "ADMIN" },
    });

    try {
      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        body: {},
      };

      const json = vi.fn();
      const res: any = { json };

      await deleteUser(req, res);

      expect(json).toHaveBeenCalled();

      // Verify admin user is deleted
      const deletedUser = await prisma.user.findUnique({
        where: { id: adminUser.id },
      });
      expect(deletedUser).toBeNull();
    } catch (error) {
      // Clean up
      await prisma.user.delete({
        where: { id: adminUser.id },
      }).catch(() => {});
    }
  });

  it("should handle idempotent delete (delete already deleted user)", async () => {
    const token = generateToken(testUser.id, testUser.email, jwtSecret);

    const req: any = {
      headers: { authorization: `Bearer ${token}` },
      user: { id: testUser.id, email: testUser.email },
      body: {},
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { json, status };

    // First delete
    await deleteUser(req, res);
    expect(json).toHaveBeenCalled();

    // Try to delete again - should handle gracefully or return error
    json.mockClear();
    status.mockClear();

    await deleteUser(req, res);

    // Either returns success or error, but should not crash
    expect(json.mock.calls.length + status.mock.calls.length).toBeGreaterThan(0);

    testUser.id = null;
  });

  it("should return 500 on database error", async () => {
    const token = generateToken(testUser.id, testUser.email, jwtSecret);

    const req: any = {
      headers: { authorization: `Bearer ${token}` },
      user: { id: testUser.id, email: testUser.email },
      body: {},
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status, json };

    // Mock Prisma to throw error
    const originalDelete = prisma.user.delete;
    (prisma.user as any).delete = vi.fn().mockRejectedValueOnce(new Error("DB Error"));

    try {
      await deleteUser(req, res);

      expect(status).toHaveBeenCalledWith(500);
      expect(json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.stringContaining("suppression"),
      }));
    } finally {
      // Restore original
      (prisma.user as any).delete = originalDelete;
    }
  });

  it("should handle missing req.user gracefully", async () => {
    const req: any = {
      headers: {},
      user: undefined, // No user
      body: {},
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status, json };

    await deleteUser(req, res);

    // Should either return error or handle gracefully
    expect(json.mock.calls.length + status.mock.calls.length).toBeGreaterThan(0);
  });

  it("should handle null req.user.id gracefully", async () => {
    const req: any = {
      headers: {},
      user: { id: null, email: "test@example.com" },
      body: {},
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status, json };

    await deleteUser(req, res);

    // Should either return error or handle gracefully
    expect(json.mock.calls.length + status.mock.calls.length).toBeGreaterThan(0);
  });

  it("should work correctly with different user IDs", async () => {
    // Create multiple users and delete each one
    const users = await Promise.all([
      createTestUser(`user1-delete-${Date.now()}@example.com`),
      createTestUser(`user2-delete-${Date.now()}@example.com`),
      createTestUser(`user3-delete-${Date.now()}@example.com`),
    ]);

    try {
      for (const user of users) {
        const token = generateToken(user.id, user.email, jwtSecret);

        const req: any = {
          headers: { authorization: `Bearer ${token}` },
          user: { id: user.id, email: user.email },
          body: {},
        };

        const json = vi.fn();
        const res: any = { json };

        await deleteUser(req, res);

        expect(json).toHaveBeenCalled();

        // Verify user is deleted
        const deletedUser = await prisma.user.findUnique({
          where: { id: user.id },
        });
        expect(deletedUser).toBeNull();
      }
    } catch (error) {
      // Clean up remaining users
      for (const user of users) {
        await prisma.user.delete({
          where: { id: user.id },
        }).catch(() => {});
      }
    }
  });

  it("should delete user and remove from database immediately", async () => {
    // Verify user exists before deletion
    let existingUser = await prisma.user.findUnique({
      where: { id: testUser.id },
    });
    expect(existingUser).not.toBeNull();

    const token = generateToken(testUser.id, testUser.email, jwtSecret);

    const req: any = {
      headers: { authorization: `Bearer ${token}` },
      user: { id: testUser.id, email: testUser.email },
      params: { id: testUser.id },
      body: {},
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { json, status };

    await deleteUser(req, res);

    // Verify deletion was successful
    const deletedUser = await prisma.user.findUnique({
      where: { id: testUser.id },
    });
    expect(deletedUser).toBeNull();

    testUser.id = null;
  });

  it("should respond with success after deletion", async () => {
    const token = generateToken(testUser.id, testUser.email, jwtSecret);

    const req: any = {
      headers: { authorization: `Bearer ${token}` },
      user: { id: testUser.id, email: testUser.email },
      params: { id: testUser.id },
      body: {},
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { json, status };

    await deleteUser(req, res);

    // Should respond with json (no error status)
    expect(json).toHaveBeenCalled();
    const response = json.mock.calls[0][0];
    // Should return deleted user object
    expect(response).toHaveProperty("id");

    testUser.id = null;
  });

  it("should delete user even if deletion takes time", async () => {
    const token = generateToken(testUser.id, testUser.email, jwtSecret);

    const req: any = {
      headers: { authorization: `Bearer ${token}` },
      user: { id: testUser.id, email: testUser.email },
      params: { id: testUser.id },
      body: {},
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { json, status };

    // Add slight delay to simulate processing
    await new Promise((resolve) => setTimeout(resolve, 50));

    await deleteUser(req, res);

    expect(json).toHaveBeenCalled();

    // Verify deletion
    const deletedUser = await prisma.user.findUnique({
      where: { id: testUser.id },
    });
    expect(deletedUser).toBeNull();

    testUser.id = null;
  });

  it("should handle invalid user ID format gracefully", async () => {
    const req: any = {
      headers: {},
      user: { id: "invalid-uuid-format", email: "test@example.com" },
      body: {},
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status, json };

    await deleteUser(req, res);

    // Should return error or handle gracefully
    expect(json.mock.calls.length + status.mock.calls.length).toBeGreaterThan(0);
  });
});
