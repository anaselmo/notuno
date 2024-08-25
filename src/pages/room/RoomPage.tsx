import { useAtom } from "jotai";
import { ArrowLeftIcon, ClipboardIcon, CrownIcon } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { BeatLoader } from "react-spinners";

import { roomAtom } from "@/atoms";
import { Button } from "@/components/Button";
import { useBeforeUnloadConfirmation } from "@/hooks/useBeforeUnloadConfirmation";
import { User } from "@/types";
import { Room } from "@/utils/peer-comunication";
import { Channel } from "@/utils/peer-comunication/channel";
import { UniqueNameGenerator } from "@/utils/unique-name-generator";

let userChannel: Channel<{
  name: string;
  nameDecidedByHost: string;
  iAmReady: undefined;
}>;

let chatChannel: Channel<{
  msg: string;
}>;

const playerNameGenerator = new UniqueNameGenerator("Player");

export const RoomPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useAtom(roomAtom);

  const [myName, setMyName] = useState("");
  const [usersInfo, setUsersInfo] = useState<User[]>([] as User[]);
  const [messages, setMessages] = useState<string[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const lastMessageRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const initializeRoom = async () => {
      if (room) {
        !room.iAmHost && toast.success("Successfully joined the room");
        return;
      }

      try {
        setIsLoading(true);
        const newRoom = await Room.joinRoom(id);
        setRoom(newRoom);
        toast.success("Successfully joined the room");
      } catch {
        toast.error("Failed to join the room");
        navigate("..");
        setIsLoading(false);
      }
    };

    initializeRoom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useBeforeUnloadConfirmation();

  // Change URL pathname to `/lobby` to redirect to the lobby page if the user refreshes the page
  useLayoutEffect(() => {
    window.history.replaceState(null, "", "/lobby");
  }, []);

  const handleName = (peerId: string, name: string) => {
    setUsersInfo((prevUsers) => {
      const existingUserIndex = prevUsers.findIndex(
        (user) => user.id === peerId,
      );

      if (existingUserIndex !== -1) {
        prevUsers[existingUserIndex].name = name;
        return [...prevUsers];
      } else {
        return [...prevUsers, { id: peerId, name }];
      }
    });
  };

  useEffect(() => {
    if (!room?.iAmHost) return;

    setMyName(playerNameGenerator.generateName());
  }, [room]);

  useEffect(() => {
    if (!room) return;

    userChannel = room.addChannel("user");
    chatChannel = room.addChannel("chat");

    const broadcastIAmReady = async () =>
      await userChannel.broadcast("iAmReady");

    broadcastIAmReady();

    room.onDisconnect((peerId) => {
      setUsersInfo((prevUsers) =>
        prevUsers.filter((user) => user.id !== peerId),
      );
    });
  }, [room]);

  useEffect(() => {
    if (!room) return;

    userChannel.on("name", (peerId, data) => {
      handleName(peerId, data);
    });
    userChannel.on("nameDecidedByHost", async (_, data) => {
      handleName(room.peerId, data);
      await userChannel.broadcast("name", data);
      setIsLoading(false);
    });
    userChannel.on("iAmReady", async (peerId) => {
      if (room.iAmHost) {
        const newName = playerNameGenerator.generateName();
        await userChannel.send(peerId, "nameDecidedByHost", newName);
        handleName(peerId, newName);
      }
      await userChannel.send(peerId, "name", myName);
    });
    chatChannel.on("msg", (peerId, data) => {
      setMessages((prevMessages) => [
        ...prevMessages,
        `${usersInfo.find((user) => user.id === peerId)?.name ?? "unknown"}: ${data}`,
      ]);
    });
  }, [room, usersInfo, myName]);

  useEffect(() => {
    if (!room) return;

    handleName(room.peerId, myName);
  }, [myName, room]);

  useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const setName = async () => {
    if (!room || !userChannel) return;

    const name = prompt("Enter your name:");
    if (!name) return;

    await userChannel.broadcast("name", name);
    handleName(room.peerId, name);
    setMyName(name);
  };

  const sendChatMessage = async () => {
    if (!room || !chatChannel) return;
    if (!newMessage.trim()) return;

    setMessages((prevMessages) => [...prevMessages, `Me: ${newMessage}`]);
    await chatChannel.broadcast("msg", newMessage);
    setNewMessage("");
  };

  const backToMainPage = () => {
    if (!room) return;

    navigate("..");
    room.leaveRoom();
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

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
          height: "100%",
        }}
      >
        <BeatLoader color="white" />
      </div>
    );
  }

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
        style={{
          backgroundColor: "#f0f0f033",
          display: "flex",
          flexDirection: "column",
          borderRadius: 8,
          minHeight: 40,
          alignItems: "flex-start",
          justifyContent: "center",
          padding: 10,
          marginBottom: 10,
        }}
      >
        {usersInfo.map((user) => (
          <div
            key={user.id}
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                backgroundColor: "green",
              }}
            />
            <p>
              {room.peerId === user.id ? (
                <strong>
                  {user.name} {room.peerId === user.id && "(me)"}
                </strong>
              ) : (
                user.name
              )}
            </p>
            {user.id === id && <CrownIcon color="#eace17" />}
          </div>
        ))}
      </div>
      <div
        className="chatBox"
        style={{
          border: "1px solid #ccc",
          padding: "10px",
          height: "150px",
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
      <div
        style={{
          marginTop: 20,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 30,
        }}
      >
        <Button onClick={setName}> Set Name </Button>
        <Button onClick={backToMainPage} loading={false}>
          <ArrowLeftIcon /> Back to main page
        </Button>
      </div>
    </div>
  );
};
