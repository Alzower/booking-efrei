import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SHARED_DATA_FILE = path.join(__dirname, ".shared-test-data.json");

export default async function globalTeardown() {
  if (fs.existsSync(SHARED_DATA_FILE)) {
    fs.unlinkSync(SHARED_DATA_FILE);
    console.log("Fichier de test partagé supprimé");
  }
}
