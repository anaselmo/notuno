/* eslint-disable react-hooks/exhaustive-deps */
import { useAtomValue } from "jotai";
import { ArrowLeftIcon, ClipboardIcon } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";

import { roomAtom } from "@/atoms";
import { Button } from "@/components/Button";
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

  // Change URL pathname to `/lobby` to redirect to the lobby page if the user refreshes the page
  useLayoutEffect(() => {
    window.history.replaceState(null, "", "/lobby");
  }, []);

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

  const sendChatMessage = () => {
    if (!newMessage.trim()) return;
    setMessages((prevMessages) => [...prevMessages, `Me: ${newMessage}`]);
    chatChannel.broadcast("msg", newMessage);
    setNewMessage("");
  };

  const backToMainPage = () => {
    navigate("..");
    room?.leaveRoom();
  };

  const copyIdToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(id!);
      toast.success("ID copied to clipboard!", {
        position: "bottom-right",
      });
    } catch {
      toast.error("Failed to copy ID to clipboard", {
        position: "bottom-right",
      });
    }
  };

  return (
    <div style={{ padding: 40 }}>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <h2>Room ID: {id}</h2>
        <Button onClick={copyIdToClipboard}>
          <ClipboardIcon size={20} /> Copy ID
        </Button>
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
        <Button onClick={sendChatMessage}>Send</Button>
      </div>
      <Button onClick={backToMainPage} loading={false}>
        <ArrowLeftIcon /> Back to main page
      </Button>
    </div>
  );
};
