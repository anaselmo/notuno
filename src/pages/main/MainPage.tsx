import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePeer } from "../../contexts/PeerProvider";

export const MainPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { peer } = usePeer();

  const onCreateRoom = () => {
    console.log("peer when button is clicked", peer);
    setIsLoading(true);

    if (peer.open) {
      console.log("My peer ID is: " + peer.id);
      navigate(`/${peer.id}`);
      setIsLoading(false);
      return;
    }

    const handleOpen = (id: string) => {
      console.log("My peer ID is: " + id);
      navigate(`/${id}`);
      setIsLoading(false);
      peer.off("open", handleOpen);
      peer.off("error", handleError);
    };

    const handleError = (err: Error) => {
      console.error(err);
      setIsLoading(false);
      peer.off("open", handleOpen);
      peer.off("error", handleError);
    };

    peer.on("open", handleOpen);
    peer.on("error", handleError);
  };

  const onJoinRoom = () => {
    const roomId = prompt("Please enter the room ID:");
    if (roomId) {
      navigate(`/${roomId}`);
    } else {
      alert("Room ID cannot be empty.");
    }
  };

  return (
    <div className="container">
      <h1>NOTUNO</h1>
      <div className="buttonWrapper">
        <button onClick={onJoinRoom}>Join Room</button>
        <button onClick={onCreateRoom} disabled={isLoading}>
          {isLoading ? "Creating Room..." : "Create Room"}
        </button>
      </div>
    </div>
  );
};
