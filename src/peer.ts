import Peer from "peerjs";

// const savedPeerId = localStorage.getItem("peerId");

export const peer =
  // savedPeerId ? new Peer(savedPeerId) :
  new Peer();

peer.on("open", (id) => {
  //   localStorage.setItem("peerId", id);
  console.log("My peer ID is: " + id);
});
