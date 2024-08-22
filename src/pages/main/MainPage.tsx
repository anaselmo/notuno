import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Comm } from "../../utils/comm";

export const MainPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const onCreateRoom = () => {
    setIsLoading(true);

    const handleOpen = (id: string) => {
      console.log("Room opened with: " + id);
      navigate(`/${id}`);
      setIsLoading(false);
    };

    const handleError = (err: Error) => {
      console.error(err);
      setIsLoading(false);
    };

    Comm.createRoom(handleOpen, handleError);
  };

  const onJoinRoom = () => {
    const roomId = prompt("Please enter the room ID:");
    if (roomId) {
      Comm.joinRoom(roomId);
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
