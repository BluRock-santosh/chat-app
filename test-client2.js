import WebSocket from 'ws';

// Create WebSocket connection
const ws = new WebSocket('ws://localhost:8080');

// Connection opened
ws.on('open', () => {
    console.log('✅ Connected to WebSocket server');
    
    // Login as user2
    const loginMessage = {
        type: 'login',
        userId: 'user2'
    };
    ws.send(JSON.stringify(loginMessage));
    console.log('🔑 Sent login message');
});

// Listen for messages
ws.on('message', (data) => {
    const message = JSON.parse(data);
    console.log('📨 Received message:', message);
    
    // If we receive a message, respond to it
    if (message.type === 'private_message' && message.userId === 'user1') {
        const responseMessage = {
            type: 'private_message',
            userId: 'user2',
            recipientId: 'user1',
            message: 'Hi user1! This is user2 responding.'
        };
        ws.send(JSON.stringify(responseMessage));
        console.log('📤 Sent response message');
    }
});

// Handle errors
ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
});

// Handle connection close
ws.on('close', () => {
    console.log('❌ Connection closed');
}); 