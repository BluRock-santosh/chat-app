import { Kafka } from "kafkajs";
import dotenv from "dotenv";
dotenv.config();

const kafka = new Kafka({
  clientId: "chat-app",
  brokers: [process.env.KAFKA_BROKER],
  retry: {
    initialRetryTime: 100,
    retries: 8
  },
  connectionTimeout: 3000
});

const producer = kafka.producer({
  allowAutoTopicCreation: true,
  transactionTimeout: 30000
});

export async function startProducer() {
  try {
    console.log("Connecting to Kafka producer...");
    await producer.connect();
    console.log("✅ Kafka producer connected successfully");
  } catch (error) {
    console.error("❌ Kafka producer connection error:", error);
    throw error;
  }
}

export async function sendMessage(topic, message) {
  try {
    await producer.send({
      topic,
      messages: [
        { value: JSON.stringify(message) }
      ],
    });
    console.log(`✅ Message sent to topic ${topic}`);
  } catch (error) {
    console.error("❌ Error sending message:", error);
    throw error;
  }
}

export async function disconnectProducer() {
  try {
    await producer.disconnect();
    console.log("✅ Kafka producer disconnected");
  } catch (error) {
    console.error("❌ Error disconnecting producer:", error);
    throw error;
  }
}
