// Simple WebSocket server for Movie Sync
const WebSocket = require('ws');
const url = require('url');

const PORT = process.env.PORT || 3001;
const wss = new WebSocket.Server({ port: PORT });

const rooms = {}; // { roomCode: Set of clients }

wss.on('connection', (ws, req) => {
  const { query } = url.parse(req.url, true);
  const room = query.room;

  if (!room) {
    ws.close(1008, "Missing room code");
    return;
  }

  if (!rooms[room]) rooms[room] = new Set();
  rooms[room].add(ws);

  console.log(`Client joined room: ${room}`);

  ws.on('message', (message) => {
    let data;
    try {
      data = JSON.parse(message);
    } catch (err) {
      console.error("Invalid JSON");
      return;
    }

    // Broadcast to all clients in the same room
    for (const client of rooms[room]) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    }
  });

  ws.on('close', () => {
    rooms[room].delete(ws);
    if (rooms[room].size === 0) {
      delete rooms[room];
      console.log(`Room deleted: ${room}`);
    }
  });
});

console.log(`✅ WebSocket server listening on ws://localhost:${PORT}`);
