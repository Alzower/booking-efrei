import app from "./app";
import prisma from "./db/prisma";

const port = 3000;

async function main() {
  try {
    await prisma.$connect();
    console.log("✅ Connected to Database");

    app.listen(port, () => {
      console.log("Server Listening on PORT:", port);
    });
  } catch (error) {
    console.log("❌ DB Connection Error", error);
    process.exit(1);
  }
}

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

main();
