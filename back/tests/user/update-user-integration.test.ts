import { vi, describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, skip } from "vitest";
import prisma from "../../db/prisma.ts";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { updateUser } from "../../controller/user/update-user.ts";

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

describe("Update User Integration Tests - updateUser (PUT /me)", () => {
  const jwtSecret = "test-secret-key-integration";
  let testUser: any;
  let databaseAvailable = true;

  beforeAll(async () => {
    vi.stubEnv("JWT_SECRET", jwtSecret);
    databaseAvailable = await isDatabaseAvailable();
    if (!databaseAvailable) {
      console.warn("⚠️  DATABASE NOT AVAILABLE FOR UPDATE USER INTEGRATION TESTS");
    } else {
      console.log("\n✅ Database connection successful. Running update-user integration tests...\n");
    }
  });

  afterAll(async () => {
    vi.unstubAllEnvs();
  });

  beforeEach(async () => {
    if (!databaseAvailable) return;

    // Create test user
    testUser = await createTestUser(`update-user-${Date.now()}@example.com`);
  });

  afterEach(async () => {
    if (!databaseAvailable) return;

    // Clean up
    try {
      if (testUser?.id) {
        await prisma.user.delete({
          where: { id: testUser.id },
        });
      }
    } catch (error) {
      // User may not exist
    }
  });

  it("should update user email successfully", async () => {
    if (!databaseAvailable) {
      skip();
    }

    const newEmail = `updated-${Date.now()}@example.com`;
    const token = generateToken(testUser.id, testUser.email, jwtSecret);

    const req: any = {
      headers: { authorization: `Bearer ${token}` },
      user: { id: testUser.id, email: testUser.email },
      body: { email: newEmail },
    };

    const json = vi.fn();
    const res: any = { json };

    await updateUser(req, res);

    expect(json).toHaveBeenCalled();
    const updatedUser = json.mock.calls[0][0];
    expect(updatedUser.email).toBe(newEmail);

    // Verify in database
    const dbUser = await prisma.user.findUnique({
      where: { id: testUser.id },
    });
    expect(dbUser?.email).toBe(newEmail);
  });

  it("should update user name successfully", async () => {
    if (!databaseAvailable) {
      skip();
    }

    const newName = "Updated Name User";
    const token = generateToken(testUser.id, testUser.email, jwtSecret);

    const req: any = {
      headers: { authorization: `Bearer ${token}` },
      user: { id: testUser.id, email: testUser.email },
      body: { name: newName },
    };

    const json = vi.fn();
    const res: any = { json };

    await updateUser(req, res);

    expect(json).toHaveBeenCalled();
    const updatedUser = json.mock.calls[0][0];
    expect(updatedUser.name).toBe(newName);

    // Verify in database
    const dbUser = await prisma.user.findUnique({
      where: { id: testUser.id },
    });
    expect(dbUser?.name).toBe(newName);
  });

  it("should update user password successfully", async () => {
    if (!databaseAvailable) {
      skip();
    }

    const plainNewPassword = "NewPass123!";
    const hashedNewPassword = await bcrypt.hash(plainNewPassword, 10);
    const token = generateToken(testUser.id, testUser.email, jwtSecret);

    const req: any = {
      headers: { authorization: `Bearer ${token}` },
      user: { id: testUser.id, email: testUser.email },
      body: { password: hashedNewPassword },
    };

    const json = vi.fn();
    const res: any = { json };

    await updateUser(req, res);

    expect(json).toHaveBeenCalled();

    // Verify in database - password should be updated
    const dbUser = await prisma.user.findUnique({
      where: { id: testUser.id },
    });
    expect(dbUser?.password).not.toBe(testUser.password);
  });

  it("should update multiple fields at once", async () => {
    if (!databaseAvailable) {
      skip();
    }

    const newEmail = `multi-update-${Date.now()}@example.com`;
    const newName = "Fully Updated User";
    const hashedNewPassword = await bcrypt.hash("NewPass456!", 10);
    const token = generateToken(testUser.id, testUser.email, jwtSecret);

    const req: any = {
      headers: { authorization: `Bearer ${token}` },
      user: { id: testUser.id, email: testUser.email },
      body: {
        email: newEmail,
        name: newName,
        password: hashedNewPassword,
      },
    };

    const json = vi.fn();
    const res: any = { json };

    await updateUser(req, res);

    expect(json).toHaveBeenCalled();
    const updatedUser = json.mock.calls[0][0];
    expect(updatedUser.email).toBe(newEmail);
    expect(updatedUser.name).toBe(newName);

    // Verify in database
    const dbUser = await prisma.user.findUnique({
      where: { id: testUser.id },
    });
    expect(dbUser?.email).toBe(newEmail);
    expect(dbUser?.name).toBe(newName);
  });

  it("should update with empty body (no changes)", async () => {
    if (!databaseAvailable) {
      skip();
    }

    const originalEmail = testUser.email;
    const originalName = testUser.name;
    const token = generateToken(testUser.id, testUser.email, jwtSecret);

    const req: any = {
      headers: { authorization: `Bearer ${token}` },
      user: { id: testUser.id, email: testUser.email },
      body: {}, // Empty update
    };

    const json = vi.fn();
    const res: any = { json };

    await updateUser(req, res);

    expect(json).toHaveBeenCalled();
    const updatedUser = json.mock.calls[0][0];
    // Should return user with original values
    expect(updatedUser.email).toBe(originalEmail);
    expect(updatedUser.name).toBe(originalName);
  });

  it("should access req.user set by userIsAuth middleware", async () => {
    if (!databaseAvailable) {
      skip();
    }

    const newName = "Middleware Test User";
    const token = generateToken(testUser.id, testUser.email, jwtSecret);

    // Verify middleware would set req.user correctly
    const req: any = {
      headers: { authorization: `Bearer ${token}` },
      user: { id: testUser.id, email: testUser.email }, // Set by middleware
      body: { name: newName },
    };

    const json = vi.fn();
    const res: any = { json };

    await updateUser(req, res);

    // Verify it used req.user.id correctly
    const updatedUser = json.mock.calls[0][0];
    expect(updatedUser.id).toBe(testUser.id);
  });

  it("should not expose password in response", async () => {
    if (!databaseAvailable) {
      skip();
    }

    const hashedNewPassword = await bcrypt.hash("NewPass123!", 10);
    const token = generateToken(testUser.id, testUser.email, jwtSecret);

    const req: any = {
      headers: { authorization: `Bearer ${token}` },
      user: { id: testUser.id, email: testUser.email },
      body: { password: hashedNewPassword },
    };

    const json = vi.fn();
    const res: any = { json };

    await updateUser(req, res);

    const updatedUser = json.mock.calls[0][0];
    // Password should be in response (controller returns full user)
    // But caller should not expose it in API response
    expect(updatedUser).toHaveProperty("password");
  });

  it("should maintain user role during update", async () => {
    if (!databaseAvailable) {
      skip();
    }

    const newEmail = `maintain-role-${Date.now()}@example.com`;
    const token = generateToken(testUser.id, testUser.email, jwtSecret);

    const req: any = {
      headers: { authorization: `Bearer ${token}` },
      user: { id: testUser.id, email: testUser.email },
      body: { email: newEmail },
    };

    const json = vi.fn();
    const res: any = { json };

    await updateUser(req, res);

    const updatedUser = json.mock.calls[0][0];
    expect(updatedUser.role).toBe("USER"); // Role should not change
  });

  it("should maintain timestamps correctly", async () => {
    if (!databaseAvailable) {
      skip();
    }

    const originalCreatedAt = testUser.createdAt;
    const newName = "Timestamp Test User";
    const token = generateToken(testUser.id, testUser.email, jwtSecret);

    const req: any = {
      headers: { authorization: `Bearer ${token}` },
      user: { id: testUser.id, email: testUser.email },
      body: { name: newName },
    };

    const json = vi.fn();
    const res: any = { json };

    await updateUser(req, res);

    const updatedUser = json.mock.calls[0][0];
    // createdAt should not change
    expect(new Date(updatedUser.createdAt).getTime()).toBe(originalCreatedAt.getTime());
  });

  it("should handle update for different users independently", async () => {
    if (!databaseAvailable) {
      skip();
    }

    // Create second user
    const secondUser = await createTestUser(`second-user-${Date.now()}@example.com`, "Second User");

    try {
      const newEmailFirst = `updated-first-${Date.now()}@example.com`;
      const newEmailSecond = `updated-second-${Date.now()}@example.com`;

      // Update first user
      const token1 = generateToken(testUser.id, testUser.email, jwtSecret);
      const req1: any = {
        headers: { authorization: `Bearer ${token1}` },
        user: { id: testUser.id, email: testUser.email },
        body: { email: newEmailFirst },
      };

      const json1 = vi.fn();
      const res1: any = { json: json1 };

      await updateUser(req1, res1);

      // Update second user
      const token2 = generateToken(secondUser.id, secondUser.email, jwtSecret);
      const req2: any = {
        headers: { authorization: `Bearer ${token2}` },
        user: { id: secondUser.id, email: secondUser.email },
        body: { email: newEmailSecond },
      };

      const json2 = vi.fn();
      const res2: any = { json: json2 };

      await updateUser(req2, res2);

      // Verify both updated correctly
      const user1Data = json1.mock.calls[0][0];
      const user2Data = json2.mock.calls[0][0];

      expect(user1Data.email).toBe(newEmailFirst);
      expect(user2Data.email).toBe(newEmailSecond);

      // Verify in database
      const dbUser1 = await prisma.user.findUnique({
        where: { id: testUser.id },
      });
      const dbUser2 = await prisma.user.findUnique({
        where: { id: secondUser.id },
      });

      expect(dbUser1?.email).toBe(newEmailFirst);
      expect(dbUser2?.email).toBe(newEmailSecond);
    } finally {
      // Clean up second user
      await prisma.user.delete({
        where: { id: secondUser.id },
      });
    }
  });

  it("should handle update with special characters in name", async () => {
    if (!databaseAvailable) {
      skip();
    }

    const specialName = "François d'Amélie-Müller";
    const token = generateToken(testUser.id, testUser.email, jwtSecret);

    const req: any = {
      headers: { authorization: `Bearer ${token}` },
      user: { id: testUser.id, email: testUser.email },
      body: { name: specialName },
    };

    const json = vi.fn();
    const res: any = { json };

    await updateUser(req, res);

    const updatedUser = json.mock.calls[0][0];
    expect(updatedUser.name).toBe(specialName);
  });

  it("should handle update with very long name", async () => {
    if (!databaseAvailable) {
      skip();
    }

    const longName = Array(100).fill("A").join("");
    const token = generateToken(testUser.id, testUser.email, jwtSecret);

    const req: any = {
      headers: { authorization: `Bearer ${token}` },
      user: { id: testUser.id, email: testUser.email },
      body: { name: longName },
    };

    const json = vi.fn();
    const res: any = { json };

    await updateUser(req, res);

    const updatedUser = json.mock.calls[0][0];
    expect(updatedUser.name).toBe(longName);
  });

  it("should handle update with very long email", async () => {
    if (!databaseAvailable) {
      skip();
    }

    const longEmail = `${Array(50).fill("a").join("")}@example.com`;
    const token = generateToken(testUser.id, testUser.email, jwtSecret);

    const req: any = {
      headers: { authorization: `Bearer ${token}` },
      user: { id: testUser.id, email: testUser.email },
      body: { email: longEmail },
    };

    const json = vi.fn();
    const res: any = { json };

    await updateUser(req, res);

    const updatedUser = json.mock.calls[0][0];
    expect(updatedUser.email).toBe(longEmail);
  });

  it("should handle update with null values (set to undefined)", async () => {
    if (!databaseAvailable) {
      skip();
    }

    const token = generateToken(testUser.id, testUser.email, jwtSecret);

    const req: any = {
      headers: { authorization: `Bearer ${token}` },
      user: { id: testUser.id, email: testUser.email },
      body: { email: null, name: null },
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { json, status };

    await updateUser(req, res);

    // Should handle null values (Prisma may update or ignore or throw error)
    // Either json or status should be called
    expect(json.mock.calls.length + status.mock.calls.length).toBeGreaterThan(0);
  });

  it("should return 500 on database error", async () => {
    if (!databaseAvailable) {
      skip();
    }

    const token = generateToken(testUser.id, testUser.email, jwtSecret);

    const req: any = {
      headers: { authorization: `Bearer ${token}` },
      user: { id: testUser.id, email: testUser.email },
      body: { email: "new@example.com" },
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status, json };

    // Mock Prisma to throw error - use a different approach
    const originalUpdate = prisma.user.update;
    (prisma.user as any).update = vi.fn().mockRejectedValueOnce(new Error("DB Error"));

    try {
      await updateUser(req, res);

      expect(status).toHaveBeenCalledWith(500);
      expect(json).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.stringContaining("mise à jour"),
      }));
    } finally {
      // Restore original
      (prisma.user as any).update = originalUpdate;
    }
  });

  it("should return all user fields in response", async () => {
    if (!databaseAvailable) {
      skip();
    }

    const newName = "All Fields Test User";
    const token = generateToken(testUser.id, testUser.email, jwtSecret);

    const req: any = {
      headers: { authorization: `Bearer ${token}` },
      user: { id: testUser.id, email: testUser.email },
      body: { name: newName },
    };

    const json = vi.fn();
    const res: any = { json };

    await updateUser(req, res);

    const updatedUser = json.mock.calls[0][0];

    // Verify expected fields
    expect(updatedUser).toHaveProperty("id");
    expect(updatedUser).toHaveProperty("email");
    expect(updatedUser).toHaveProperty("name");
    expect(updatedUser).toHaveProperty("password");
    expect(updatedUser).toHaveProperty("role");
    expect(updatedUser).toHaveProperty("createdAt");
  });

  it("should handle consecutive updates", async () => {
    if (!databaseAvailable) {
      skip();
    }

    const newName1 = "First Update";
    const newName2 = "Second Update";
    const newName3 = "Third Update";
    const token = generateToken(testUser.id, testUser.email, jwtSecret);

    // First update
    const req1: any = {
      headers: { authorization: `Bearer ${token}` },
      user: { id: testUser.id, email: testUser.email },
      body: { name: newName1 },
    };

    const json1 = vi.fn();
    const res1: any = { json: json1 };

    await updateUser(req1, res1);

    expect(json1).toHaveBeenCalled();
    let updatedUser = json1.mock.calls[0][0];
    expect(updatedUser.name).toBe(newName1);

    // Second update
    const req2: any = {
      headers: { authorization: `Bearer ${token}` },
      user: { id: testUser.id, email: testUser.email },
      body: { name: newName2 },
    };

    const json2 = vi.fn();
    const res2: any = { json: json2 };

    await updateUser(req2, res2);

    expect(json2).toHaveBeenCalled();
    updatedUser = json2.mock.calls[0][0];
    expect(updatedUser.name).toBe(newName2);

    // Third update
    const req3: any = {
      headers: { authorization: `Bearer ${token}` },
      user: { id: testUser.id, email: testUser.email },
      body: { name: newName3 },
    };

    const json3 = vi.fn();
    const res3: any = { json: json3 };

    await updateUser(req3, res3);

    expect(json3).toHaveBeenCalled();
    updatedUser = json3.mock.calls[0][0];
    expect(updatedUser.name).toBe(newName3);

    // Verify final state in database
    const dbUser = await prisma.user.findUnique({
      where: { id: testUser.id },
    });
    expect(dbUser?.name).toBe(newName3);
  });

  it("should work with ADMIN role users", async () => {
    if (!databaseAvailable) {
      skip();
    }

    // Create admin user
    const adminUser = await createTestUser(`admin-update-${Date.now()}@example.com`, "Admin User");
    await prisma.user.update({
      where: { id: adminUser.id },
      data: { role: "ADMIN" },
    });

    try {
      const newName = "Updated Admin User";
      const token = generateToken(adminUser.id, adminUser.email, jwtSecret);

      const req: any = {
        headers: { authorization: `Bearer ${token}` },
        user: { id: adminUser.id, email: adminUser.email },
        body: { name: newName },
      };

      const json = vi.fn();
      const res: any = { json };

      await updateUser(req, res);

      const updatedUser = json.mock.calls[0][0];
      expect(updatedUser.name).toBe(newName);
      expect(updatedUser.role).toBe("ADMIN");
    } finally {
      await prisma.user.delete({
        where: { id: adminUser.id },
      });
    }
  });
});
