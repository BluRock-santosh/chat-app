import { WebSocketServer, WebSocket } from 'ws';
import { sendMessage } from '../kafka/producer.js';
import { v4 as uuidv4 } from 'uuid';
import Redis from 'ioredis';
import { MessageModel } from '../helper/helper.js';

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

const streamConsumer = new Redis({
  host: process.env.REDIS_HOST || 'redis',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  retryStrategy: function(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

const wss = new WebSocketServer({ port: 8080 });
const instanceId = uuidv4();

// Map userId -> Set of WebSocket connections
const localClients = new Map();

wss.on('listening', () => {
  console.log('✅ WebSocket server listening on port 8080');
});

wss.on('connection', (ws) => {
  let currentUserId = null;

  ws.on('message', async (message) => {
    try {
      const parsedMessage = JSON.parse(message.toString());
      const { type, recipientId, userId, message: msg } = parsedMessage;

      if (type === 'login' && userId) {
        currentUserId = userId;
        console.log(`🔗 Client authenticated: ${userId} on ${instanceId}`);

        // Add ws to the Set for this userId
        if (!localClients.has(userId)) {
          localClients.set(userId, new Set());
        }
        localClients.get(userId).add(ws);

        await redis.hset('websocket_clients', userId, instanceId);

        // Retrieve undelivered messages from Redis Stream
        const pendingMessages = await redis.xrange(
          'messages_stream', '-', '+', 'COUNT', 100
        );

        if (pendingMessages.length > 0) {
          console.log(`📤 Delivering ${pendingMessages.length} pending messages to ${userId}`);
          for (const msg of pendingMessages) {
            const [id, fields] = msg;
            const messageData = JSON.parse(fields[1]);

            if (messageData.recipientId === userId) {
              ws.send(JSON.stringify(messageData));

              // Update DB status to "delivered"
              await MessageModel.updateOne({ _id: messageData._id }, { status: 'delivered' });

              // Produce Kafka event
              await sendMessage('message', { ...messageData, status: 'delivered' });

              // Acknowledge message (remove from stream)
              await redis.xdel('messages_stream', id);
            }
          }
        }
      }

      if (type === 'private_message') {
        const recipientInstance = await redis.hget('websocket_clients', recipientId);
        const recipientSockets = localClients.get(recipientId);

        if (recipientInstance === instanceId && recipientSockets) {
          for (const recipientWs of recipientSockets) {
            if (recipientWs.readyState === WebSocket.OPEN) {
              recipientWs.send(JSON.stringify(parsedMessage));
            }
          }

          // Produce Kafka event
          await sendMessage('message', { ...parsedMessage, status: 'delivered' });

          console.log(`📨 Message delivered to ${recipientId}`);
        } else {
          // Store message in Redis Stream instead of List
          await redis.xadd('messages_stream', 'MAXLEN', '1000', '*',
            'message', JSON.stringify(parsedMessage)
          );

          // Produce Kafka event
          await sendMessage('message', { ...parsedMessage, status: 'pending' });

          console.log(`⏳ Message queued for offline user ${recipientId}`);
        }
      }
    } catch (error) {
      console.error('❌ Error parsing message:', error);
    }
  });

  ws.on('close', () => {
    if (currentUserId) {
      const userSockets = localClients.get(currentUserId);
      if (userSockets) {
        userSockets.delete(ws);
        if (userSockets.size === 0) {
          localClients.delete(currentUserId);
        }
      }
    }
    console.log('❌ Client disconnected');
  });
});

wss.on('error', (err) => {
  console.error('❌ WebSocket error:', err);
});

export default wss;
