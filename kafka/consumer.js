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

const consumer = kafka.consumer({ groupId: "chat-group" });

async function kafkaConsumer() {
  try {
    console.log("Connecting to Kafka consumer...");
    await consumer.connect();
    console.log("✅ Kafka consumer connected successfully");

    await consumer.subscribe({ topic: "chat-messages", fromBeginning: true });
    console.log("✅ Subscribed to chat-messages topic");

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          console.log({
            topic,
            partition,
            offset: message.offset,
            value: message.value.toString(),
          });
        } catch (error) {
          console.error("Error processing message:", error);
        }
      },
    });
  } catch (error) {
    console.error("❌ Kafka consumer error:", error);
    throw error;
  }
}

export default kafkaConsumer;
