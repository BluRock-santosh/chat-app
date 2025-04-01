import { Kafka } from "kafkajs";

export  const kafkaClient = new Kafka({
    clientId: "websocket-server",
    brokers: ["broker:9092"], 
    connectionTimeout: 5000,
    retry: { retries: 5 }
  });


