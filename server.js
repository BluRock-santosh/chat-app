import Redis from "ioredis";
import dotenv from "dotenv";
import express from "express";
dotenv.config();

import connectMongo from "./services/dbConnect.js";
import kafkaConsumer from "./kafka/consumer.js";
import kafkaAdmin from "./kafka/admin.js";
import {startProducer} from "./kafka/producer.js";


const app = express();

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Start Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});

async function connectRedis() {
  return new Promise((resolve, reject) => {
    const redis = new Redis({
      host: process.env.REDIS_HOST || 'redis',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      retryStrategy: function(times) {
        const delay = Math.min(times * 50, 2000);
        console.log(`Retrying Redis connection in ${delay}ms...`);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      connectTimeout: 10000
    });

    redis.on("connect", () => {
      console.log("✅ Redis connected successfully");
      resolve(redis);
    });

    redis.on("error", (err) => {
      console.error("❌ Redis connection error:", err);
      reject(err);
    });

    redis.on("ready", () => {
      console.log("✅ Redis is ready to accept commands");
    });
  });
}

async function main() {
  try {
    console.log("Starting application...");
    console.log("Environment:", {
      REDIS_HOST: process.env.REDIS_HOST,
      REDIS_PORT: process.env.REDIS_PORT,
      KAFKA_BROKER: process.env.KAFKA_BROKER,
      DB_URI: process.env.DB_URI
    });

    // MongoDB Connection
    await connectMongo();
    console.log("✅ MongoDB connected successfully");

    // Redis Connection
    const redis = await connectRedis();

    // Initialize Kafka
    console.log("Initializing Kafka...");
    await kafkaAdmin();
    await kafkaConsumer();
    await startProducer();
    console.log("✅ Kafka services started successfully");

    // WebSocket Server is already initialized in wss.js
    console.log(`✅ WebSocket server started on port ${process.env.WS_PORT || 8080}`);

  } catch (err) {
    console.error("❌ Application error:", err);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

main();
