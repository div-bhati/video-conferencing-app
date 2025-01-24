const express = require('express')
const app = express()
// const cors = require('cors')
// app.use(cors())
const server = require('http').Server(app)
const io = require('socket.io')(server)
const { ExpressPeerServer } = require('peer');
const peerServer = ExpressPeerServer(server, {
  debug: true
});
const { v4: uuidV4 } = require('uuid')

app.use('/peerjs', peerServer);

app.set('view engine', 'ejs')
app.use(express.static('public'))

app.get('/', (req, res) => {
  res.redirect(`/${uuidV4()}`)
})

app.get('/:room', (req, res) => {
  res.render('room', { roomId: req.params.room })
})

io.on('connection', (socket) => {
  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId)
    socket.to(roomId).emit('user-connected', userId);
    // messages
    socket.on('message', (message) => {
      //send message to the same room
      io.to(roomId).emit('createMessage', message)
  }); 

    socket.on('disconnect', () => {
      socket.to(roomId).emit('user-disconnected', userId)
    })
  })
})

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Handle start of screen sharing
  socket.on("start-screen-share", (data) => {
    console.log(`${data.userId} started sharing their screen.`);
    socket.broadcast.emit("screen-shared", data);
  });

  // Handle stop of screen sharing
  socket.on("stop-screen-share", (data) => {
    console.log(`${data.userId} stopped sharing their screen.`);
    socket.broadcast.emit("screen-share-stopped", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});


server.listen(process.env.PORT||3030)
