import { Kafka } from "kafkajs";

export const kafkaClient = new Kafka({
    clientId: "websocket-server",
    brokers: [process.env.KAFKA_BROKER || "localhost:9094"],
    connectionTimeout: 5000,
    retry: { retries: 5 }
});


