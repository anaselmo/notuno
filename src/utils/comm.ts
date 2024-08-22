import Peer, { DataConnection } from "peerjs";

export type Message = {
  channel: string;
  data: any;
};

export class Comm {
  readonly name: string;
  private dataCallbacks: Map<string, (data: any) => void> = new Map();

  private static connections: DataConnection[] = [];
  private static channels: Map<string, Comm> = new Map();
  private static peer: Peer | null = null;
  private static iAmHost_: boolean = false;

  static get iAmHost(): boolean {
    return Comm.iAmHost_;
  }

  static get peerId(): string {
    return Comm.peer?.id ?? "";
  }

  constructor(name: string) {
    this.name = name;
    Comm.channels.set(name, this);
  }

  static destroyChannel(name: string) {
    Comm.channels.delete(name);
  }

  static createRoom(
    openCallback?: (id: string) => void,
    errorCallback?: (err: Error) => void
  ) {
    this.createPeer((id: string) => {
      openCallback?.(id);
      Comm.iAmHost_ = true;
      console.log("created room", Comm.peerId);
      Comm.peer?.off("error", errorCallback);
      Comm.peer?.on("connection", Comm.handleConnection);
      Comm.peer?.on("disconnected", Comm.handlePeerDisconnection);
    });

    Comm.peer?.on("error", (err: Error) => {
      errorCallback?.(err);
      Comm.peer?.off("error", errorCallback);
    });
  }

  static joinRoom(id: string) {
    this.createPeer(() => {
      if (Comm.peer) {
        const conn = Comm.peer.connect(id);
        conn.on("error", (err: Error) => {
          console.error(err);
        });
        conn.on("open", () => Comm.handleConnection(conn));

        console.log("joined room", id);
      }
    });
  }

  static leaveRoom() {
    Comm.peer?.destroy();
    Comm.channels.clear();
    Comm.connections.forEach((conn) => {
      conn.close();
    });
    Comm.connections = [];
    console.log("room left");
  }

  broadcast(data: any): void {
    console.log(
      "sending data",
      data,
      "to ",
      Comm.connections.length,
      " connections"
    );
    Comm.connections.forEach(async (conn) => {
      try {
        await conn.send({ channel: this.name, data });
        console.log("sent to", conn.peer);
      } catch (error) {
        console.error(error);
      }
    });
  }

  private static handleConnection(conn: DataConnection) {
    console.log("handling connection", Comm.connections.length);
    if (
      !Comm.connections.find((existingConn) => {
        return existingConn.peer === conn.peer;
      })
    ) {
      conn.on("data", (data) => {
        const channel = Comm.channels.get((data as Message).channel);
        channel?.dataCallbacks.forEach((callback) => {
          callback((data as Message).data);
        });
      });
      conn.on("close", () => Comm.handleDisconnection(conn));
      conn.on("error", (err: Error) => {
        console.log(err);
      });
      Comm.connections.push(conn);
      console.log("connection added");
    }
    console.log("connection handled", Comm.connections);
    console.log("current total conections", Comm.peer?.connections);
  }

  private static handleDisconnection(conn: DataConnection) {
    conn.close();
    Comm.connections = Comm.connections.filter((existingConn) => {
      return existingConn.peer !== conn.peer;
    });

    conn.removeAllListeners();
    console.log(
      "connection removed, current connections",
      Comm.connections.length
    );
  }

  private static handlePeerDisconnection() {
    console.log("peerjs disconnected from server");
  }

  private static createPeer(callback: (id: string) => void) {
    if (Comm.peer) {
      Comm.peer.destroy();
    }
    Comm.peer = new Peer();
    Comm.peer?.once("open", (id: string) => {
      if (!Comm.peer) {
        console.log("Peer doesnt exist");
        return;
      }
      Comm.peer.on("disconnected", Comm.handlePeerDisconnection);
      console.log("my new peer id", Comm.peerId);
      callback(id);
      // Comm.peer?.off("open", openCallback);
      // Comm.peer?.off("error", errorCallback);
    });
  }

  on(name: string, callback: (data: any) => void): void {
    this.dataCallbacks.set(name, callback);
  }
}
