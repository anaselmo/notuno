import { useSetAtom } from "jotai";
import { PeerError } from "peerjs";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { roomAtom } from "@/atoms";
import { Button } from "@/components/Button";
import { Room } from "@/utils/peer-comunication";

export const MainPage = () => {
  const setRoom = useSetAtom(roomAtom);
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
        <Button onClick={onJoinRoom}>Join Room</Button>
        <Button onClick={onCreateRoom} loading={isLoading}>
          Create Room
        </Button>
      </div>
    </div>
  );
};
