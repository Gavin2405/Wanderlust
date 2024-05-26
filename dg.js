const WebSocket = require('ws');

const server = new WebSocket.Server({ port: 3001 });

let calls = {};

server.on('connection', (socket) => {
  socket.on('message', (message) => {
    const data = JSON.parse(message);

    switch (data.type) {
      case 'create-call':
        const callId = Math.floor(100000 + Math.random() * 900000).toString();
        calls[callId] = [socket];
        socket.send(JSON.stringify({ type: 'call-created', callId }));
        break;
      case 'join-call':
        if (calls[data.callId]) {
          calls[data.callId].push(socket);
          socket.send(JSON.stringify({ type: 'call-joined', callId: data.callId }));
          calls[data.callId].forEach((client) => {
            if (client !== socket) {
              client.send(JSON.stringify({ type: 'new-participant' }));
            }
          });
        } else {
          socket.send(JSON.stringify({ type: 'call-not-found' }));
        }
        break;
      case 'signal':
        calls[data.callId].forEach((client) => {
          if (client !== socket) {
            client.send(JSON.stringify({ type: 'signal', signal: data.signal }));
          }
        });
        break;
      default:
        break;
    }
  });

  socket.on('close', () => {
    for (const callId in calls) {
      calls[callId] = calls[callId].filter((client) => client !== socket);
      if (calls[callId].length === 0) {
        delete calls[callId];
      }
    }
  });
});

console.log('WebSocket server is running on ws://localhost:3001');
