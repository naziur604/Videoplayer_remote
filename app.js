const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Store the session data in sessions object (You might want to use a proper database in production)
const sessions = {};

// Serve the static HTML file for the frontend
app.use(express.static(__dirname + '/public'));

io.on('connection', (socket) => {
  let sessionData;

  socket.on('join', (sessionId) => {
    if (sessionId in sessions) {
      sessionData = sessions[sessionId];
      socket.join(sessionId);
      socket.emit('url', sessionData.url);
    } else {
      socket.emit('session_not_found');
    }
  });

  socket.on('host', (videoUrl) => {
    const sessionId = uuidv4(); // Generate a random session ID
    sessionData = {
      sessionId: sessionId,
      url: videoUrl,
      hostId: socket.id,
      syncTime: 0
    };
    sessions[sessionId] = sessionData;
    socket.join(sessionId);
    socket.emit('session_created', sessionId); // Send the session ID to the host
    io.to(sessionId).emit('url', videoUrl);
  });

  socket.on('sync', (sessionId, time) => {
    if (sessionData && sessionData.hostId === socket.id) {
      sessionData.syncTime = time;
      io.to(sessionId).emit('sync', time);
    }
  });

  socket.on('disconnect', () => {
    if (sessionData && sessionData.hostId === socket.id) {
      const sessionId = Object.keys(sessions).find((key) => sessions[key] === sessionData);
      if (sessionId) {
        delete sessions[sessionId];
        io.to(sessionId).emit('session_closed');
      }
    }
  });
});

const port = 3000;
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
