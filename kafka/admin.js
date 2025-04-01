import { kafkaClient } from "../services/kafkaClient.js";

const kafkaAdmin = async () => {
  try {
    const admin = kafkaClient.admin();
    await admin.connect();

    await admin.createTopics({
      topics: [
        { topic: "private_message", numPartitions: 1,replicationFactor:1},
      ],
    });

    await admin.disconnect();
    console.log("Kafka Admin Disconnected");
  } catch (err) {
    console.error("Kafka Admin Error:", err);
  }
};

export default kafkaAdmin;
