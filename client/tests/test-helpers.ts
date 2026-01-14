import { nanoid } from "nanoid";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SHARED_DATA_FILE = path.join(__dirname, ".shared-test-data.json");

interface SharedTestData {
  email: string;
  password: string;
  roomId: string;
  roomName: string;
  roomTestId: string;
}

let sharedData: SharedTestData;

if (fs.existsSync(SHARED_DATA_FILE)) {
  // Lire le fichier existant
  sharedData = JSON.parse(fs.readFileSync(SHARED_DATA_FILE, "utf-8"));
} else {
  // Créer de nouvelles données
  const idRoom = nanoid(10);
  sharedData = {
    email: `${nanoid(10)}@example.com`,
    password: `${nanoid(50)}25!?$*Aa`,
    roomId: idRoom,
    roomName: `Salle Test ${idRoom}`,
    roomTestId: `room-label-salle-${idRoom}`,
  };
  fs.writeFileSync(SHARED_DATA_FILE, JSON.stringify(sharedData, null, 2));
}

export const sharedTestCredentials = {
  email: sharedData.email,
  password: sharedData.password,
};

export const sharedRoomName = sharedData.roomName;
export const sharedRoomTestId = sharedData.roomTestId;
