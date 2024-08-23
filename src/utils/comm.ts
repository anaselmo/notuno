import Peer, { DataConnection, PeerError } from "peerjs";

export type Message = {
  callback: string;
  channel: string;
  data: any;
};

export class Channel {
  readonly name: string;
  public dataCallbacks: Map<string, (data: any) => void> = new Map(); //! hay que hacerlo privado y accesible desde Room
  private room: Room;

  constructor(name: string, room: Room) {
    //!aqui tambien
    this.name = name;
    this.room = room;
  }

  on(name: string, callback: (data: any) => void): void {
    this.dataCallbacks.set(name, callback);
  }

  broadcast(data: any): void {
    this.room.connections.forEach(async (conn) => {
      conn.send({ channel: this.name, data });
    });
  }
}

export class Room {
  connections: DataConnection[] = []; //! hacerlo privado y accesible desde channel
  private channels: Map<string, Channel> = new Map();
  private peer: Peer | null = null;
  private iAmHost_: boolean = false;
  private hostIndex = -1;
  private id_: string = "";
  private controlChannel: Channel;

  constructor() {
    this.controlChannel = this.addChannel("__control");
    this.controlChannel.on("", (data: string) => {
      if (this.peer) {
        const conn = this.peer.connect(data);
        conn.on("error", (err: PeerError<any>) => {
          console.error(err);
        });
        conn.on("open", () => this.handleConnection(conn));
      }
    });
  } //!hacerlo privado y accesible desde atom o buscar alguna alternativa null

  get iAmHost(): boolean {
    return this.iAmHost_;
  }

  get peerId(): string {
    return this.peer?.id ?? "";
  }

  get id(): string {
    return this.id_;
  }

  get channelCount() {
    return this.channels.size;
  }

  addChannel(name: string): Channel {
    const newChannel = new Channel(name, this);
    this.channels.set(name, newChannel);
    return newChannel;
  }

  static joinRoom(
    id: string,
    openCallback?: (room: Room) => void,
    errorCallback?: (err: PeerError<any>) => void
  ): void {
    const newRoom = new Room();
    newRoom.id_ = id;
    newRoom.createPeer((room: Room) => {
      if (room.peer) {
        const conn = room.peer.connect(id);
        conn.on("error", (err: PeerError<any>) => {
          console.error(err);
        });
        room.hostIndex = 0; //! no me convence
        conn.on("open", () => room.handleConnection(conn));
        room.peer.on("connection", (conn) => newRoom.handleConnection(conn));
      }
      openCallback?.(room);
    }, errorCallback);
  }

  static createRoom(
    openCallback?: (room: Room) => void,
    errorCallback?: (err: PeerError<any>) => void
  ): void {
    const newRoom = new Room();
    newRoom.createPeer(() => {
      newRoom.peer?.on("connection", (conn) => newRoom.handleConnection(conn));
      newRoom.id_ = newRoom.peerId;
      openCallback?.(newRoom);
      newRoom.iAmHost_ = true;
    }, errorCallback);
  }

  leaveRoom() {
    this.connections.forEach((conn) => {
      conn.close();
    });
    //? no se si habria que borrar los channels tambien
  }

  private createPeer(
    openCallback?: (room: Room) => void,
    errorCallback?: (err: PeerError<any>) => void
  ) {
    this.peer = new Peer();

    this.peer?.once("error", (err: PeerError<any>) => errorCallback?.(err));
    this.peer?.once("open", () => {
      if (!this.peer) {
        return;
      }
      this.peer.on("disconnected", this.handlePeerDisconnection);
      openCallback?.(this);
    });
  }

  private handlePeerDisconnection() {
    console.log("ROOM: peerjs disconnected from server");
  }

  private handleDisconnection(conn: DataConnection) {
    conn.close();
    this.connections = this.connections.filter((existingConn) => {
      return existingConn.peer !== conn.peer;
    });

    conn.removeAllListeners();
    console.log(
      "ROOM: connection removed, current connections",
      this.connections.length
    );
  }

  private handleConnection(conn: DataConnection) {
    if (
      !this.connections.find((existingConn) => {
        return existingConn.peer === conn.peer;
      })
    ) {
      conn.on("data", (data) => {
        const channel = this.channels.get((data as Message).channel);
        if (!channel)
          console.log(
            "ROOM: channel",
            (data as Message).channel,
            "doesn't exist"
          );
        // else{
        //   channel
        // }
        channel?.dataCallbacks.forEach((callback) => {
          callback((data as Message).data);
        });
      });
      conn.on("close", () => this.handleDisconnection(conn));
      conn.on("error", (err: PeerError<any>) => {
        console.log(err);
      });

      if (this.iAmHost) {
        // const peerIds = [];
        // this.connections.forEach((otherConn) => {
        //   peerIds.push(otherConn.peer);
        // });
        // const peerIds = this.connections.map((conn) => conn.peer);
        this.controlChannel.broadcast(conn.peer);
        console.log("new connection to host ", conn.peer);
      }

      this.connections.push(conn);
      console.log("ROOM: connection added");
    }
  }
}
