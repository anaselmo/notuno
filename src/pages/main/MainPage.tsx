import { useSetAtom } from "jotai";
import { PeerError } from "peerjs";
import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import { roomAtom } from "@/atoms";
import { Button } from "@/components/Button";
import { Room } from "@/utils/peer-comunication";

export const MainPage = () => {
  const setRoom = useSetAtom(roomAtom);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingJoin, setIsLoadingJoin] = useState(false);
  const navigate = useNavigate();

  const onCreateRoom = async () => {
    setIsLoading(true);
    try {
      const newRoom = await Room.createRoom();
      setRoom(newRoom);
      console.log("Room opened with: " + newRoom.peerId);
      navigate(`/${newRoom.peerId}`);
    } catch (err) {
      console.error(err);
      toast.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const onJoinRoom = async () => {
    const roomId = prompt("Please enter the room ID:");

    if (!roomId) {
      toast.error("Room ID is required");
      return;
    }

    const handleJoinRoom = (room: Room) => {
      setRoom(room);
      console.log("Room", room.id, "joined and my id is " + room.peerId);
      // room.onReady(() => {
      console.log("IM READY");
      console.log("Connections", room.connections);
      navigate(`/${roomId}`);
      // });
    };

    try {
      setIsLoadingJoin(true);
      const roomToJoin = await Room.joinRoom(roomId);
      handleJoinRoom(roomToJoin);
    } catch (err) {
      if (err instanceof PeerError) {
        toast.error(err.type);
        return;
      }
      toast.error(err);
    } finally {
      setIsLoadingJoin(false);
    }
  };

  return (
    <div className="container">
      <h1>NOTUNO</h1>
      <div className="buttonWrapper">
        <Button onClick={onJoinRoom} loading={isLoadingJoin}>
          Join Room
        </Button>
        <Button onClick={onCreateRoom} loading={isLoading}>
          Create Room
        </Button>
      </div>
    </div>
  );
};
