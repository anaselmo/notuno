import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Room } from "../../utils/comm";
import { useAtom } from "jotai";
import { atomRoom } from "../../atoms";
import { PeerError } from "peerjs";

export const MainPage = () => {
  const [room, setRoom] = useAtom(atomRoom);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const onCreateRoom = () => {
    setIsLoading(true);

    const handleOpen = (newRoom: Room) => {
      setRoom(newRoom);
      console.log("Room opened with: " + newRoom.peerId);
      navigate(`/${newRoom.peerId}`);
      setIsLoading(false);
    };

    const handleError = (err: PeerError<any>) => {
      console.error(err);
      setIsLoading(false);
    };

    Room.createRoom(handleOpen, handleError);
  };

  const onJoinRoom = () => {
    const roomId = prompt("Please enter the room ID:");

    const handleOpen = (newRoom: Room) => {
      setRoom(newRoom);
      console.log("Room", newRoom.id, "joined and my id is " + newRoom.peerId);
      navigate(`/${roomId}`);
    };

    const handleError = (err: PeerError<any>) => {
      console.error(err.type);
      setIsLoading(false);
    };

    if (roomId) {
      Room.joinRoom(roomId, handleOpen, handleError);
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
