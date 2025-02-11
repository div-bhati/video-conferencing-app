const socket = io("/");
const videoGrid = document.getElementById("video-grid");

const myPeer = new Peer(undefined, {
  path: "/peerjs",
  host: "/",
  port: "443",
});

const myVideo = document.createElement("video");
myVideo.muted = true;
const peers = {};
let myVideoStream;

navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream);

    myPeer.on("call", (call) => {
      call.answer(stream);
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });
    });

    socket.on("user-connected", (userId) => {
      connectToNewUser(userId, stream);
    });

    let text = $("input");

    $("html").keydown(function (e) {
      if (e.which == 13 && text.val().length !== 0) {
        socket.emit("message", text.val());
        text.val("");
      }
    });

    socket.on("createMessage", (message) => {
      $("ul").append(`<li class="message"><b>user</b><br/>${message}</li>`);
      scrollToBottom();
    });
  });

socket.on("user-disconnected", (userId) => {
  if (peers[userId]) peers[userId].close();
});

myPeer.on("open", (id) => {
  socket.emit("join-room", ROOM_ID, id);
});

function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream);
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  });
  call.on("close", () => {
    video.remove();
  });

  peers[userId] = call;
}

function addVideoStream(video, stream) {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  videoGrid.append(video);
}

const scrollToBottom = () => {
  var d = $(".main__chat_window");
  d.scrollTop(d.prop("scrollHeight"));
};

// Mute/Unmute Audio
const muteUnmute = () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    setUnmuteButton();
  } else {
    myVideoStream.getAudioTracks()[0].enabled = true;
    setMuteButton();
  }
};

// Play/Stop Video
const playStop = () => {
  let enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    setPlayVideo();
  } else {
    myVideoStream.getVideoTracks()[0].enabled = true;
    setStopVideo();
  }
};

const setMuteButton = () => {
  document.querySelector(".main__mute_button").innerHTML = `
    <i class="fas fa-microphone"></i>
    <span>Mute</span>`;
};

const setUnmuteButton = () => {
  document.querySelector(".main__mute_button").innerHTML = `
    <i class="unmute fas fa-microphone-slash"></i>
    <span>Unmute</span>`;
};

const setStopVideo = () => {
  document.querySelector(".main__video_button").innerHTML = `
    <i class="fas fa-video"></i>
    <span>Stop Video</span>`;
};

const setPlayVideo = () => {
  document.querySelector(".main__video_button").innerHTML = `
    <i class="stop fas fa-video-slash"></i>
    <span>Play Video</span>`;
};

// ================ SCREEN SHARING FIXED ================

let screenStream;
let currentSender;

async function shareScreen() {
  try {
    screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: false, // Disable audio to prevent permission issues
    });

    const videoTrack = screenStream.getVideoTracks()[0];

    for (let peerId in peers) {
      const sender = peers[peerId]?.peerConnection
        ?.getSenders()
        .find((s) => s.track.kind === "video");

      if (sender) {
        sender.replaceTrack(videoTrack);
        currentSender = sender;
      }
    }

    addVideoStream(myVideo, screenStream);
    socket.emit("start-screen-share", { userId: myPeer.id });

    videoTrack.onended = stopScreenSharing;
  } catch (err) {
    console.error("Error sharing screen:", err);
  }
}

function stopScreenSharing() {
  if (currentSender && myVideoStream) {
    currentSender.replaceTrack(myVideoStream.getVideoTracks()[0]);
  }

  if (screenStream) {
    screenStream.getTracks().forEach((track) => track.stop());
  }

  socket.emit("stop-screen-share", { userId: myPeer.id });
  addVideoStream(myVideo, myVideoStream);
}

// Handling screen share events
socket.on("screen-shared", (data) => {
  console.log(`${data.userId} is sharing their screen.`);
});

socket.on("screen-share-stopped", (data) => {
  console.log(`${data.userId} stopped sharing their screen.`);
});
