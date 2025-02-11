const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const { ExpressPeerServer } = require('peer');
const { v4: uuidV4 } = require('uuid');

const peerServer = ExpressPeerServer(server, {
  debug: true
});

app.use('/peerjs', peerServer);
app.set('view engine', 'ejs');
app.use(express.static('public'));

// Redirect to a unique room
app.get('/', (req, res) => {
  res.redirect(`/${uuidV4()}`);
});

// Render room page
app.get('/:room', (req, res) => {
  res.render('room', { roomId: req.params.room });
});

io.on('connection', (socket) => {
  console.log("User connected:", socket.id);

  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).emit('user-connected', userId);

    // Handle messages
    socket.on('message', (message) => {
      io.to(roomId).emit('createMessage', message);
    });

    socket.on('disconnect', () => {
      socket.to(roomId).emit('user-disconnected', userId);
    });
  });

  // Screen sharing events
  socket.on("start-screen-share", (data) => {
    console.log(`${data.userId} started sharing their screen.`);
    socket.to(data.roomId).emit("screen-shared", data);
  });

  socket.on("stop-screen-share", (data) => {
    console.log(`${data.userId} stopped sharing their screen.`);
    socket.to(data.roomId).emit("screen-share-stopped", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

server.listen(process.env.PORT || 3030, () => {
  console.log("Server is running on port 3030");
});
