import { vi, describe, it, expect, beforeEach, Mock } from "vitest";
import { findUserByEmail } from "../../helper/user-helper.ts";
import bcrypt from "bcrypt";
import { loginController } from "../../controller/auth/auth-user.ts";

const { mockedSign, mockedCompare } = vi.hoisted(() => {
  return {
    mockedSign: vi.fn().mockReturnValue("fake-token"),
    mockedCompare: vi.fn(),
  };
});

// Mock helper, bcrypt and jsonwebtoken before importing the controller
vi.mock("../../helper/user-helper", () => ({
    findUserByEmail: vi.fn(),
}));
vi.mock("bcrypt", () => ({
    default: {
        compare: mockedCompare,
    },
}));
vi.mock("jsonwebtoken", () => ({
    default: {
        sign: mockedSign,
    },
}));



describe("loginController", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubEnv('JWT_SECRET', 'test-secret-key');
        mockedSign.mockReturnValue("fake-token");
    });

    it("returns 404 when user is not found", async () => {
        const mockedFindUserByEmail = findUserByEmail as Mock;
        mockedFindUserByEmail.mockResolvedValue(null);

        const req: any = { body: { email: "nouser@example.com", password: "pwd" } };

        const send = vi.fn();
        const status = vi.fn(() => ({ send }));
        const res: any = { status };

        await loginController(req, res);

        expect(status).toHaveBeenCalledWith(404);
        expect(send).toHaveBeenCalledWith("user not found");
    });

    it("returns 400 when password is invalid", async () => {
        const fakeUser = { id: "1", email: "u@e.com", password: "hashed" };
        const mockedFindUserByEmail = findUserByEmail as Mock;
        mockedFindUserByEmail.mockResolvedValue(fakeUser);

        const mockedBcryptCompare = bcrypt.compare as Mock;
        mockedBcryptCompare.mockResolvedValue(false);

        const req: any = { body: { email: "u@e.com", password: "wrong" } };

        const send = vi.fn();
        const status = vi.fn(() => ({ send }));
        const res: any = { status };

        await loginController(req, res);

        expect(status).toHaveBeenCalledWith(400);
        expect(send).toHaveBeenCalledWith("invalid password");
    });

    it("returns 200 and a token on successful login", async () => {
        const fakeUser = { id: "1", email: "u@e.com", password: "hashed" };

        const mockedFindUserByEmail = findUserByEmail as Mock;
        mockedFindUserByEmail.mockResolvedValue(fakeUser);

        const mockedBcryptCompare = bcrypt.compare as Mock;
        mockedBcryptCompare.mockResolvedValue(true);

        // Reset and configure the mock for sign
        mockedSign.mockReturnValue("fake-token");

        const req: any = { body: { email: "u@e.com", password: "right" } };

        const json = vi.fn();
        const status = vi.fn(() => ({ json }));
        const res: any = { status };

        await loginController(req, res);

        expect(status).toHaveBeenCalledWith(200);
        expect(json).toHaveBeenCalledWith({ token: "fake-token" });
        expect(mockedSign).toHaveBeenCalled();
    });
});
