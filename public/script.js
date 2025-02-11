async function shareScreen() {
   try {
      // Get the screen stream
      screenStream = await navigator.mediaDevices.getDisplayMedia({
         video: true,
         audio: false,  // Audio may cause permission issues in some browsers
      });

      const videoTrack = screenStream.getVideoTracks()[0];

      // Ensure we have a connected peer before replacing the track
      const sender = Object.values(peers).find(peer => peer.peerConnection)
                          ?.peerConnection?.getSenders()
                          .find(s => s.track.kind === 'video');

      if (sender) {
         sender.replaceTrack(videoTrack);
      }

      // Emit event for screen sharing
      socket.emit("start-screen-share", { userId: myPeer.id });

      // Handle screen share stop
      videoTrack.onended = () => stopScreenSharing();
   } catch (err) {
      console.error("Error sharing screen:", err);
   }
}

function stopScreenSharing() {
   const videoTrack = myVideoStream.getVideoTracks()[0];

   // Ensure we have a connected peer before replacing the track
   const sender = Object.values(peers).find(peer => peer.peerConnection)
                          ?.peerConnection?.getSenders()
                          .find(s => s.track.kind === 'video');

   if (sender) {
      sender.replaceTrack(videoTrack);
   }

   if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
   }

   socket.emit("stop-screen-share", { userId: myPeer.id });
}
