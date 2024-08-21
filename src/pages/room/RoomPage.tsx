import { useLayoutEffect, useState, useRef, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { DataConnection } from "peerjs";
import { usePeer } from "../../contexts/PeerProvider";

export const RoomPage = () => {
  console.log("renderizando COÑOOOOOOOOOSSSSSS");
  const location = useLocation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { peer } = usePeer();
  const [messages, setMessages] = useState<string[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [connections, setConnections] = useState<DataConnection[]>([]);
  const iAmHost = peer.id === id;
  console.log("length:", connections.length);
  const lastMessageRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
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

  const sendMessage = () => {
    if (newMessage.trim() !== "") {
      console.log("sending: ", newMessage);
      connections.forEach((conn) => {
        conn.send(newMessage);
        console.log("sent to:", conn);
      });
      setMessages((prevMessages) => [...prevMessages, `Me: ${newMessage}`]);
      setNewMessage("");
    }
  };

  useLayoutEffect(() => {
    const handleConnection = (conn: DataConnection) => {
      console.log("handling connection ", connections.length);
      if (
        !connections.find((existingConn) => {
          console.log(
            "existing ",
            existingConn.peer,
            " conn ",
            conn.peer,
            " compare ",
            existingConn.peer === conn.peer
          );
          return existingConn.peer === conn.peer;
        })
      ) {
        conn.on("data", (data) => {
          setMessages((prevMessages) => [
            ...prevMessages,
            `${iAmHost ? "Guest" : "Host"}: ${data}`,
          ]);
        });
        setConnections((prevConnections) => [...prevConnections, conn]);
        console.log("connection added ", conn);
      }
    };

    if (iAmHost) {
      peer.on("connection", handleConnection);
    } else {
      const conn = peer.connect(id as string);
      conn.on("open", () => handleConnection(conn));
    }
  }, [location.pathname]);

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
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
          style={{ width: "80%", marginRight: "10px" }}
        />
        <button onClick={sendMessage} style={{ width: "15%" }}>
          Send
        </button>
      </div>
      <button
        onClick={() => {
          navigate("..");
          peer.destroy();
        }}
      >
        Back to main page
      </button>
    </div>
  );
};
