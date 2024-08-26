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
  const [isLoadingCreate, setIsLoadingCreate] = useState(false);
  const [isLoadingJoin, setIsLoadingJoin] = useState(false);

  const navigate = useNavigate();

  const onCreateRoom = async () => {
    setIsLoadingCreate(true);
    try {
      const newRoom = await Room.createRoom();
      setRoom(newRoom);
      navigate(`/${newRoom.myId}`);
    } catch (err) {
      console.error(err);
      toast.error(err);
    } finally {
      setIsLoadingCreate(false);
    }
  };

  const onJoinRoom = async () => {
    const roomId = prompt("Please enter the room ID:");
    if (!roomId) {
      toast.error("Room ID is required");
      return;
    }

    setIsLoadingJoin(true);
    try {
      const roomToJoin = await Room.joinRoom(roomId);
      setRoom(roomToJoin);
      navigate(`/${roomId}`);
    } catch (err) {
      if (err instanceof PeerError) {
        toast.error(err.type);
        return;
      }
      toast.error(err);
      console.log(err);
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
        <Button onClick={onCreateRoom} loading={isLoadingCreate}>
          Create Room
        </Button>
      </div>
    </div>
  );
};
