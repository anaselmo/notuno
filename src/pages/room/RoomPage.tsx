import { useLayoutEffect, useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Channel } from "../../utils/comm";
import { useAtom } from "jotai";
import { atomRoom } from "../../atoms";

let chatChannel: Channel;
let logicChannel: Channel;

export const RoomPage = () => {
  const [room] = useAtom(atomRoom);

  const { id } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<string[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const lastMessageRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (room) {
      chatChannel = room.addChannel("chat");
      logicChannel = room.addChannel("logic");
    }

    chatChannel.on("msg", (data) => {
      setMessages((prevMessages) => [...prevMessages, `Other: ${data}`]);
    });
    logicChannel.on("", () => {
      console.log("uwu");
    });

    const handleBeforeUnload = (event: BeforeUnloadEvent) =>
      event.preventDefault();

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  useLayoutEffect(() => {
    window.history.replaceState(null, "", "/lobby");
  }, [navigate]);

  const sendChatMessage = () => {
    setMessages((prevMessages) => [...prevMessages, `Me: ${newMessage}`]);
    chatChannel.broadcast("msg", newMessage);
    setNewMessage("");
  };

  const copyIdToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(id!);
      console.log("ID copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
        }}
      >
        <h2>Room ID: {id}</h2>
        <button onClick={copyIdToClipboard}>Copy ID</button>
      </div>
      <div
        className="chatBox"
        style={{
          border: "1px solid #ccc",
          padding: "10px",
          maxHeight: "300px",
          overflowY: "auto",
        }}
      >
        {messages.map((msg, index) => (
          <p
            key={index}
            ref={index === messages.length - 1 ? lastMessageRef : null}
          >
            {msg}
          </p>
        ))}
      </div>
      <div className="chatInput" style={{ marginTop: "10px" }}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && sendChatMessage()}
          style={{ width: "80%", marginRight: "10px" }}
        />
        <button onClick={sendChatMessage} style={{ width: "15%" }}>
          Send
        </button>
      </div>
      <button
        onClick={() => {
          navigate("..");
          room?.leaveRoom();
        }}
      >
        Back to main page
      </button>
    </div>
  );
};
