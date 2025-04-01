import Redis from "ioredis";
import dotenv from "dotenv";
dotenv.config();
import { WebSocketServer } from "ws";
import run from "./services/dbConnect.js";
import kafkaConsumer from "./kafka/consumer.js";
import kafkaAdmin from "./kafka/admin.js";
import kafkaProducer from "./kafka/producer.js";

async function main() {
  try {
    // MongoDB Connection
    await run();
    console.log("MongoDB connected.");

    // Redis Connection
    const redis = new Redis({
      host: process.env.REDIS_HOST || "localhost",
      port: process.env.REDIS_PORT || 6379,
    });
    await kafkaAdmin();
    await kafkaConsumer();
    await kafkaProducer();
    console.log("Kafka Consumer & Producer started.");

    redis.on("connect", () => {
      console.log("Redis connected.");
    });

    redis.on("error", (err) => {
      console.error("Redis error:", err);
    });

    // WebSocket Server
    const wss = new WebSocketServer({ port: 8080 });

    wss.on("listening", () => {
      console.log("Websocket server listening on port 8080");
    });

    wss.on("error", (err) => {
      console.error("Websocket error:", err);
    });
  } catch (err) {
    console.error("Application error:", err);
  }
}

main();
