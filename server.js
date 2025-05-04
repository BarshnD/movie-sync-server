const WebSocket = require('ws');
const http = require('http');
const url = require('url');

// Create an HTTP server with a response handler
const server = http.createServer((req, res) => {
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('✅ WebSocket server is running');
  }
});

const wss = new WebSocket.Server({ server });
const PORT = process.env.PORT || 8080;
const rooms = {};

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
    } catch {
      return;
    }

    for (const client of rooms[room]) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    }
  });

  ws.on('close', () => {
    rooms[room].delete(ws);
    if (rooms[room].size === 0) delete rooms[room];
  });
});

server.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});
