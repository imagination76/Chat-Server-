const WebSocket = require('ws');
const express = require('express');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const clients = new Set();



wss.on('connection', (ws) => {
  console.log('New client connected');
  clients.add(ws);
  
  ws.send(JSON.stringify({ type: 'info', message: 'Welcome to the chat!' }));

  ws.on('message', (message) => {
    console.log(`Received: ${message}`);
    broadcastMessage(message, ws);
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    clients.delete(ws);
    broadcastMessage(JSON.stringify({ type: 'info', message: 'A user has left the chat' }), ws);
  });

  ws.on('error', (err) => {
    console.error(`Error: ${err.message}`);
  });
});

function broadcastMessage(message, sender) {
  for (const client of clients) {
    if (client !== sender && client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

app.get('/', (req, res) => {
  res.send(`
    <h1>WebSocket Chat</h1>
    <script>
      const ws = new WebSocket('ws://' + location.host);
      ws.onopen = () => console.log('Connected to server');
      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        const el = document.createElement('div');
        el.innerText = msg.message;
        document.body.appendChild(el);
      };
      ws.onerror = (err) => console.error('WebSocket error:', err);
      
      function sendMessage() {
        const input = document.getElementById('msg');
        if (input.value) {
          ws.send(JSON.stringify({ type: 'message', message: input.value }));
          input.value = '';
        }
      }
    </script>
    <input id="msg" type="text" placeholder="Type a message" />
    <button onclick="sendMessage()">Send</button>
  `);
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
