/* eslint-disable react-hooks/exhaustive-deps */
import { useAtomValue } from "jotai";
import { ArrowLeftIcon, ClipboardIcon } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";

import { roomAtom } from "@/atoms";
import { Button } from "@/components/Button";
import { useBeforeUnloadConfirmation } from "@/hooks/useBeforeUnloadConfirmation";
import { User } from "@/types";
import { Channel } from "@/utils/peer-comunication/channel";
import { UniqueNameGenerator } from "@/utils/unique-name-generator";

let userChannel: Channel;
let chatChannel: Channel;

const playerNameGenerator = new UniqueNameGenerator("Player");

export const RoomPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const room = useAtomValue(roomAtom);

  const [myName, setMyName] = useState("");
  const [usersInfo, setUsersInfo] = useState<User[]>([] as User[]);
  const [messages, setMessages] = useState<string[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const lastMessageRef = useRef<HTMLParagraphElement>(null);

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
        console.log(prevUsers);
        return [...prevUsers];
      } else {
        console.log([...prevUsers, { id: peerId, name }]);
        return [...prevUsers, { id: peerId, name }];
      }
    });
  };

  console.log("in component", usersInfo);

  useEffect(() => {
    if (room) {
      userChannel = room.addChannel("user");
      chatChannel = room.addChannel("chat");
    }

    // room.onConnect((peerId) => {
    //   if (room.iAmHost) {
    //     console.log("host!!!!!!!!");
    //     userChannel.send(peerId, "nameDecidedByHost", `Player XXXXXXXXXXXXX`);
    //   }
    // });

    room.onDisconnect((peerId) => {
      setUsersInfo((prevUsers) =>
        prevUsers.filter((user) => user.id !== peerId),
      );
    });
  }, []);

  useEffect(() => {
    userChannel.on("name", (peerId, data) => {
      handleName(peerId, data);
    });
    userChannel.on("nameDecidedByHost", (_, data) => {
      handleName(room.peerId, data);
      console.log("name decided by host", data);
      userChannel.broadcast("name", data);
    });
    userChannel.on("iAmReady", (peerId) => {
      if (room.iAmHost) {
        const newName = playerNameGenerator.generateName();
        console.log("sending name to", peerId);
        userChannel.send(peerId, "nameDecidedByHost", newName);
        handleName(peerId, newName);
      }
      userChannel.send(peerId, "name", myName);
    });
    chatChannel.on("msg", (peerId, data) => {
      setMessages((prevMessages) => [
        ...prevMessages,
        `${usersInfo.find((user) => user.id === peerId).name}: ${data}`,
      ]);
    });
  }, [usersInfo]);

  useEffect(() => {
    if (!room.iAmHost) {
      console.log("i am ready");
      userChannel.send(room.id, "iAmReady");
    } else {
      setMyName(playerNameGenerator.generateName());
    }
  }, []);

  useEffect(() => {
    handleName(room.peerId, myName);
  }, [myName]);

  const setName = () => {
    const name = prompt("Enter your name:");
    if (name) {
      userChannel.broadcast("name", name);
      handleName(room.peerId, name);
      setMyName(name);
    }
  };

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
                width: 10,
                height: 10,
                borderRadius: "50%",
                backgroundColor: "green",
              }}
            />
            <p>{user.name}</p>
          </div>
        ))}
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
      <Button onClick={setName}> Set Name </Button>
      <Button onClick={backToMainPage} loading={false}>
        <ArrowLeftIcon /> Back to main page
      </Button>
    </div>
  );
};
