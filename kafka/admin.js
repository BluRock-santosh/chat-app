import { kafkaClient } from "../services/kafkaClient.js";

const kafkaAdmin = async () => {
  try {
    const admin = kafkaClient.admin();
    await admin.connect();
    console.log("✅ Kafka Admin Connected");

    // ✅ Create Topics if they don't exist
    await admin.createTopics({
      topics: [
        {
          topic: "private_message",
          numPartitions: 1,
          replicationFactor: 1,
        },
      ],
    });

    console.log("✅ Kafka topics ensured");
  } catch (err) {
    if (err.message.includes("already exists")) {
      console.warn("⚠️ Kafka Topic already exists, skipping creation.");
    } else {
      console.error("❌ Kafka Admin Error:", err);
    }
  }
};

export default kafkaAdmin;
