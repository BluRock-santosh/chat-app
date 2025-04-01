import { kafkaClient } from "../services/kafkaClient.js";

const consumer = kafkaClient.consumer({
  groupId: process.env.KAFKA_GROUP_ID || "websocket-group",
});

const kafkaConsumer = async (topic, handleMessage) => {
  await consumer.connect();
  await consumer.subscribe({ topic, fromBeginning: true });

  consumer.run({
    eachMessage: async ({ topic, message, partition }) => {
      console.log(`🔄 Received message from "${topic}":`, msg);
    },
  });
};

export default kafkaConsumer;
