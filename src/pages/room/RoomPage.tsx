/* eslint-disable react-hooks/exhaustive-deps */
import { useAtomValue } from "jotai";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { roomAtom } from "@/atoms";
import { useBeforeUnloadConfirmation } from "@/hooks/useBeforeUnloadConfirmation";
import { Channel } from "@/utils/peer-comunication/channel";

let chatChannel: Channel;
let logicChannel: Channel;

export const RoomPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const room = useAtomValue(roomAtom);

  const [messages, setMessages] = useState<string[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const lastMessageRef = useRef<HTMLParagraphElement>(null);

  useBeforeUnloadConfirmation();

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
  }, []);

  // Change URL pathname to `/lobby` to redirect to the lobby page if the user refreshes the page
  useLayoutEffect(() => {
    window.history.replaceState(null, "", "/lobby");
  }, []);

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
          onKeyDown={(e) => e.key === "Enter" && sendChatMessage()}
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
