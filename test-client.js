import WebSocket from 'ws';

// Create WebSocket connection
const ws = new WebSocket('ws://localhost:8080');

// Connection opened
ws.on('open', () => {
    console.log('✅ Connected to WebSocket server');
    
    // Login as user1
    const loginMessage = {
        type: 'login',
        userId: 'user1'
    };
    ws.send(JSON.stringify(loginMessage));
    console.log('🔑 Sent login message');
});

// Listen for messages
ws.on('message', (data) => {
    const message = JSON.parse(data);
    console.log('📨 Received message:', message);
});

// Handle errors
ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
});

// Handle connection close
ws.on('close', () => {
    console.log('❌ Connection closed');
});

// Send a test message after 2 seconds
setTimeout(() => {
    const testMessage = {
        type: 'private_message',
        userId: 'user1',
        recipientId: 'user2',
        message: 'Hello from user1!'
    };
    ws.send(JSON.stringify(testMessage));
    console.log('📤 Sent test message');
}, 2000); 