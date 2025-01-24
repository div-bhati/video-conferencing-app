const socket = io('/')
const videoGrid = document.getElementById('video-grid')
const myPeer = new Peer(undefined, {
  path: '/peerjs',
  host: '/',
  port: '443'
})
let myVideoStream;
const myVideo = document.createElement('video')
myVideo.muted = true;
const peers = {}
navigator.mediaDevices.getUserMedia({
  video: true,
  audio: true
}).then(stream => {
  myVideoStream = stream;
  addVideoStream(myVideo, stream)
  myPeer.on('call', call => {
    call.answer(stream)
    const video = document.createElement('video')
    call.on('stream', userVideoStream => {
      addVideoStream(video, userVideoStream)
    })
  })

  socket.on('user-connected', userId => {
    connectToNewUser(userId, stream)
  })
  // input value
  let text = $("input");
  // when press enter send message
  $('html').keydown(function (e) {
    if (e.which == 13 && text.val().length !== 0) {
      socket.emit('message', text.val());
      text.val('')
    }
  });
  socket.on("createMessage", message => {
    $("ul").append(`<li class="message"><b>user</b><br/>${message}</li>`);
    scrollToBottom()
  })
})

socket.on('user-disconnected', userId => {
  if (peers[userId]) peers[userId].close()
})

myPeer.on('open', id => {
  socket.emit('join-room', ROOM_ID, id)
})

function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream)
  const video = document.createElement('video')
  call.on('stream', userVideoStream => {
    addVideoStream(video, userVideoStream)
  })
  call.on('close', () => {
    video.remove()
  })

  peers[userId] = call
}

function addVideoStream(video, stream) {
  video.srcObject = stream
  video.addEventListener('loadedmetadata', () => {
    video.play()
  })
  videoGrid.append(video)
}



const scrollToBottom = () => {
  var d = $('.main__chat_window');
  d.scrollTop(d.prop("scrollHeight"));
}


const muteUnmute = () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    setUnmuteButton();
  } else {
    setMuteButton();
    myVideoStream.getAudioTracks()[0].enabled = true;
  }
}

const playStop = () => {
  console.log('object')
  let enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    setPlayVideo()
  } else {
    setStopVideo()
    myVideoStream.getVideoTracks()[0].enabled = true;
  }
}

const setMuteButton = () => {
  const html = `
    <i class="fas fa-microphone"></i>
    <span>Mute</span>
  `
  document.querySelector('.main__mute_button').innerHTML = html;
}

const setUnmuteButton = () => {
  const html = `
    <i class="unmute fas fa-microphone-slash"></i>
    <span>Unmute</span>
  `
  document.querySelector('.main__mute_button').innerHTML = html;
}

const setStopVideo = () => {
  const html = `
    <i class="fas fa-video"></i>
    <span>Stop Video</span>
  `
  document.querySelector('.main__video_button').innerHTML = html;
}

const setPlayVideo = () => {
  const html = `
  <i class="stop fas fa-video-slash"></i>
    <span>Play Video</span>
  `
  document.querySelector('.main__video_button').innerHTML = html;
}

let screenStream;

async function shareScreen() {
   try {
      // Get the screen stream
      screenStream = await navigator.mediaDevices.getDisplayMedia({
         video: true,
         audio: true,
      });

      // Replace the video track in the peer connection
      const videoTrack = screenStream.getVideoTracks()[0];
      const sender = currentPeer.getSenders().find(s => s.track.kind === videoTrack.kind);
      sender.replaceTrack(videoTrack);

      // Display the shared screen locally
      addVideoStream(myVideo, screenStream);

      // Stop sharing when the user clicks "Stop sharing" or closes the screen sharing
      screenStream.getTracks()[0].onended = () => {
         stopScreenSharing();
      };
   } catch (err) {
      console.error("Error sharing screen:", err);
   }
}

function stopScreenSharing() {
   // Revert to the default camera stream
   const videoTrack = myStream.getVideoTracks()[0];
   const sender = currentPeer.getSenders().find(s => s.track.kind === videoTrack.kind);
   sender.replaceTrack(videoTrack);

   // Stop all tracks of the screen stream
   if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
   }
}

socket.on("screen-shared", (data) => {
  console.log(`${data.userId} is sharing their screen.`);
  // Display the shared screen (adjust the video element as needed)
  const remoteVideo = document.getElementById("remoteVideo"); // Replace with your video element ID
  remoteVideo.srcObject = data.screenStream;
});

socket.on("screen-share-stopped", (data) => {
  console.log(`${data.userId} stopped sharing their screen.`);
  // Handle stopping of the shared screen (e.g., revert to their webcam)
});
