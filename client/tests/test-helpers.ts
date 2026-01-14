import { nanoid } from "nanoid";

export const sharedTestCredentials = {
  email: `${nanoid(10)}@example.com`,
  password: `${nanoid(50)}25!?$*Aa`,
};

export const sharedRoomName = "Salle Test E2E";
export const sharedRoomTestId = "room-label-salle-test-e2e";
