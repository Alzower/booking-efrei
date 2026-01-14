import { vi, describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from "vitest";
import prisma from "../../db/prisma.ts";
import bcrypt from "bcrypt";
import { createUser } from "../../controller/user/create-user.ts";
import { isMailValid } from "../../../helper/mail-helper.ts";
import { passwordIsValid } from "../../../helper/password-helper.ts";

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

describe("Create User Integration Tests - createUser (POST /)", () => {
  const testEmails: string[] = [];
  let databaseAvailable = true;

  beforeAll(async () => {
    databaseAvailable = await isDatabaseAvailable();
    if (!databaseAvailable) {
      console.warn("⚠️  DATABASE NOT AVAILABLE FOR CREATE USER INTEGRATION TESTS");
    } else {
      console.log("\n✅ Database connection successful. Running create-user integration tests...\n");
    }
  });

  afterEach(async () => {
    if (!databaseAvailable) return;

    // Clean up test users
    for (const email of testEmails) {
      try {
        await prisma.user.delete({
          where: { email },
        });
      } catch (error) {
        // User may not exist
      }
    }
    testEmails.length = 0;
  });

  it("should create user successfully with valid email and password", async () => {
    const testEmail = `create-valid-${Date.now()}@example.com`;
    testEmails.push(testEmail);

    const req: any = {
      body: {
        email: testEmail,
        name: "Valid Test User",
        password: "ValidPass123!",
      },
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status };

    await createUser(req, res);

    expect(status).toHaveBeenCalledWith(201);
    const userData = json.mock.calls[0][0];
    expect(userData).toHaveProperty("id");
    expect(userData).toHaveProperty("email", testEmail);
    expect(userData).toHaveProperty("name", "Valid Test User");
    expect(userData).not.toHaveProperty("password"); // Password should be excluded
    expect(userData).toHaveProperty("role", "USER"); // Default role
  });

  it("should reject user creation with invalid email", async () => {
    const req: any = {
      body: {
        email: "invalid-email-format",
        name: "Invalid Email User",
        password: "ValidPass123!",
      },
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status };

    await createUser(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({
      error: "Adresse email invalide",
    }));
  });

  it("should reject user creation with weak password (less than 12 characters)", async () => {
    const testEmail = `weak-pass-${Date.now()}@example.com`;

    const req: any = {
      body: {
        email: testEmail,
        name: "Weak Password User",
        password: "Weak1!",
      },
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status };

    await createUser(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.stringContaining("Mot de passe invalide"),
    }));
  });

  it("should reject password without uppercase letter", async () => {
    const testEmail = `no-upper-${Date.now()}@example.com`;

    const req: any = {
      body: {
        email: testEmail,
        name: "No Uppercase User",
        password: "nouppercase123!@#",
      },
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status };

    await createUser(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.stringContaining("Mot de passe invalide"),
    }));
  });

  it("should reject password without lowercase letter", async () => {
    const testEmail = `no-lower-${Date.now()}@example.com`;

    const req: any = {
      body: {
        email: testEmail,
        name: "No Lowercase User",
        password: "NOLOWERCASE123!@#",
      },
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status };

    await createUser(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.stringContaining("Mot de passe invalide"),
    }));
  });

  it("should reject password without number", async () => {
    const testEmail = `no-number-${Date.now()}@example.com`;

    const req: any = {
      body: {
        email: testEmail,
        name: "No Number User",
        password: "NoNumberPass!@#",
      },
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status };

    await createUser(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.stringContaining("Mot de passe invalide"),
    }));
  });

  it("should reject password without special character", async () => {
    const testEmail = `no-special-${Date.now()}@example.com`;

    const req: any = {
      body: {
        email: testEmail,
        name: "No Special Char User",
        password: "NoSpecialChar123",
      },
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status };

    await createUser(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.stringContaining("Mot de passe invalide"),
    }));
  });

  it("should reject invalid role (only ADMIN allowed when specified)", async () => {
    const testEmail = `invalid-role-${Date.now()}@example.com`;

    const req: any = {
      body: {
        email: testEmail,
        name: "Invalid Role User",
        password: "ValidPass123!",
        role: "SUPERADMIN",
      },
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status };

    await createUser(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({
      error: "Rôle utilisateur invalide",
    }));
  });

  it("should allow role to be omitted (defaults to USER)", async () => {
    const testEmail = `no-role-${Date.now()}@example.com`;
    testEmails.push(testEmail);

    const req: any = {
      body: {
        email: testEmail,
        name: "No Role User",
        password: "ValidPass123!",
        // No role specified
      },
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status };

    await createUser(req, res);

    expect(status).toHaveBeenCalledWith(201);
    const userData = json.mock.calls[0][0];
    expect(userData.role).toBe("USER");
  });

  it("should hash password before storing in database", async () => {
    const testEmail = `hash-test-${Date.now()}@example.com`;
    testEmails.push(testEmail);

    const plainPassword = "HashedPass123!";

    const req: any = {
      body: {
        email: testEmail,
        name: "Hash Test User",
        password: plainPassword,
      },
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status };

    await createUser(req, res);

    // Verify in database
    const user = await prisma.user.findUnique({
      where: { email: testEmail },
    });

    expect(user).toBeDefined();
    // Verify password is hashed
    expect(user?.password).not.toBe(plainPassword);
    // Verify it's actually a bcrypt hash
    const isPasswordMatch = await bcrypt.compare(plainPassword, user?.password || "");
    expect(isPasswordMatch).toBe(true);
  });

  it("should reject duplicate email addresses", async () => {
    const testEmail = `duplicate-${Date.now()}@example.com`;
    testEmails.push(testEmail);

    // Create first user
    const req1: any = {
      body: {
        email: testEmail,
        name: "First User",
        password: "ValidPass123!",
      },
    };

    const json1 = vi.fn();
    const status1 = vi.fn(() => ({ json: json1 }));
    const res1: any = { status: status1, json: json1 };

    await createUser(req1, res1);

    expect(status1).toHaveBeenCalledWith(201);

    // Try to create second user with same email
    const req2: any = {
      body: {
        email: testEmail,
        name: "Second User",
        password: "AnotherPass123!",
      },
    };

    const json2 = vi.fn();
    const status2 = vi.fn(() => ({ json: json2 }));
    const res2: any = { status: status2, json: json2 };

    await createUser(req2, res2);

    // Should fail with 500 (database error due to unique constraint)
    expect(status2).toHaveBeenCalledWith(500);
    expect(json2).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.stringContaining("création"),
    }));
  });

  it("should exclude password from response", async () => {
    const testEmail = `no-password-${Date.now()}@example.com`;
    testEmails.push(testEmail);

    const req: any = {
      body: {
        email: testEmail,
        name: "No Password Response User",
        password: "SecurePass123!",
      },
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status };

    await createUser(req, res);

    const userData = json.mock.calls[0][0];
    expect(userData).not.toHaveProperty("password");
    expect(Object.keys(userData)).toEqual(expect.not.arrayContaining(["password"]));
  });

  it("should handle missing email field", async () => {
    const req: any = {
      body: {
        name: "No Email User",
        password: "ValidPass123!",
        // Missing email
      },
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status };

    await createUser(req, res);

    // Should return error (email validation will fail)
    expect([400, 500]).toContain(status.mock.calls[0][0]);
  });

  it("should handle missing password field", async () => {
    const testEmail = `no-password-field-${Date.now()}@example.com`;

    const req: any = {
      body: {
        email: testEmail,
        name: "No Password Field User",
        // Missing password
      },
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status };

    await createUser(req, res);

    // Should return error (password validation will fail)
    expect([400, 500]).toContain(status.mock.calls[0][0]);
  });

  it("should handle missing name field", async () => {
    const testEmail = `no-name-${Date.now()}@example.com`;

    const req: any = {
      body: {
        email: testEmail,
        password: "ValidPass123!",
        // Missing name
      },
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status };

    await createUser(req, res);

    // Name can be null/undefined, but creation might still succeed or fail
    // depending on database schema
    const statusCode = status.mock.calls[0][0];
    expect([201, 500]).toContain(statusCode);
  });

  it("should accept special characters in name", async () => {
    const testEmail = `special-name-${Date.now()}@example.com`;
    testEmails.push(testEmail);

    const req: any = {
      body: {
        email: testEmail,
        name: "Jean-Pierre O'Connor Müller",
        password: "ValidPass123!",
      },
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status };

    await createUser(req, res);

    expect(status).toHaveBeenCalledWith(201);
    const userData = json.mock.calls[0][0];
    expect(userData.name).toBe("Jean-Pierre O'Connor Müller");
  });

  it("should handle very long email addresses", async () => {
    const testEmail = `${Array(50).fill("a").join("")}@example.com`;
    testEmails.push(testEmail);

    const req: any = {
      body: {
        email: testEmail,
        name: "Long Email User",
        password: "ValidPass123!",
      },
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status };

    await createUser(req, res);

    expect(status).toHaveBeenCalledWith(201);
    const userData = json.mock.calls[0][0];
    expect(userData.email).toBe(testEmail);
  });

  it("should handle email with plus addressing", async () => {
    const testEmail = `user+tag-${Date.now()}@example.com`;
    testEmails.push(testEmail);

    const req: any = {
      body: {
        email: testEmail,
        name: "Plus Addressing User",
        password: "ValidPass123!",
      },
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status };

    await createUser(req, res);

    expect(status).toHaveBeenCalledWith(201);
    const userData = json.mock.calls[0][0];
    expect(userData.email).toBe(testEmail);
  });

  it("should validate password requirements comprehensively", async () => {
    const validPasswords = [
      "ValidPass123!",
      "ComplexPass777!",
      "MyPass2024Test!",
      "SecurePass999!",
    ];

    for (const password of validPasswords) {
      const testEmail = `pwd-valid-${Date.now()}-${Math.random()}@example.com`;
      testEmails.push(testEmail);

      const req: any = {
        body: {
          email: testEmail,
          name: "Password Test User",
          password,
        },
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status };

      await createUser(req, res);

      expect(status).toHaveBeenCalledWith(201);
    }
  });

  it("should return user with all expected fields", async () => {
    const testEmail = `full-fields-${Date.now()}@example.com`;
    testEmails.push(testEmail);

    const req: any = {
      body: {
        email: testEmail,
        name: "Full Fields User",
        password: "ValidPass123!",
      },
    };

    const json = vi.fn();
    const status = vi.fn(() => ({ json }));
    const res: any = { status };

    await createUser(req, res);

    const userData = json.mock.calls[0][0];

    // Check all expected fields
    expect(userData).toHaveProperty("id");
    expect(userData).toHaveProperty("email");
    expect(userData).toHaveProperty("name");
    expect(userData).toHaveProperty("role");
    expect(userData).toHaveProperty("createdAt");
    expect(userData).not.toHaveProperty("password");

    // Verify types
    expect(typeof userData.id).toBe("string");
    expect(typeof userData.email).toBe("string");
    expect(typeof userData.name).toBe("string");
    expect(typeof userData.role).toBe("string");
  });

  it("should create multiple users independently", async () => {
    const users = [
      { email: `multi1-${Date.now()}@example.com`, name: "User 1", password: "ValidPass123!" },
      { email: `multi2-${Date.now()}@example.com`, name: "User 2", password: "AnotherPass456!" },
      { email: `multi3-${Date.now()}@example.com`, name: "User 3", password: "ThirdPass789!" },
    ];

    for (const userData of users) {
      testEmails.push(userData.email);

      const req: any = {
        body: userData,
      };

      const json = vi.fn();
      const status = vi.fn(() => ({ json }));
      const res: any = { status };

      await createUser(req, res);

      expect(status).toHaveBeenCalledWith(201);
      const createdUser = json.mock.calls[0][0];
      expect(createdUser.email).toBe(userData.email);
      expect(createdUser.name).toBe(userData.name);
    }

    // Verify all users exist in database
    for (const userData of users) {
      const user = await prisma.user.findUnique({
        where: { email: userData.email },
      });
      expect(user).toBeDefined();
      expect(user?.email).toBe(userData.email);
    }
  });
});
