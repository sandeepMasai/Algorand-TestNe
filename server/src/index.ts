import "dotenv/config";
import mongoose from "mongoose";
import app from "./app.js";
import { env } from "./env.js";

async function start() {
  /* eslint-disable no-console */
  try {
    await mongoose.connect(env.MONGO_URI);
    console.log("Connected to MongoDB");
  }
  catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }

  const port = env.PORT;
  const server = app.listen(port, () => {
    console.log(`Listening: http://localhost:${port}`);
  });

  server.on("error", (err) => {
    if ("code" in err && err.code === "EADDRINUSE") {
      console.error(`Port ${env.PORT} is already in use. Please choose another port or stop the process using it.`);
    }
    else {
      console.error("Failed to start server:", err);
    }
    process.exit(1);
  });
}

start();
