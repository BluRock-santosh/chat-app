import { kafkaClient } from "../services/kafkaClient.js";

const producer = kafkaClient.producer();

const kafkaProducer = async (topic, message) => {
  await producer.connect();
  producer.send({
    topic,
    messages: [{ value: JSON.stringify(message) }],
  });

  console.log(`message send  to topic ${topic}`, message);
  await producer.disconnect();
};

export default kafkaProducer