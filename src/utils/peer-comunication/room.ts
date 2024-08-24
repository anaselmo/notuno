import Peer, { DataConnection, PeerError } from "peerjs";

import { Channel } from "./channel";
import { Message } from "./types";

export class Room {
  connections: DataConnection[] = []; //! hacerlo privado y accesible desde channel
  private channels: Map<string, Channel> = new Map();
  private peer: Peer | null = null;
  private iAmHost_: boolean = false;
  private hostIndex = -1;
  private id_: string = "";
  private controlChannel: Channel;
  private onConnectCallback: (peerId: string) => void;
  private onDisconnectCallback: (peerId: string) => void;

  private constructor() {
    this.controlChannel = this.addChannel_("__control");
    this.controlChannel.on("newConn2Host", (_hostPeerId, data: string) => {
      console.log("newConn2Host", data);
      if (this.peer) {
        const conn = this.peer.connect(data);
        conn.on("error", (err: PeerError<any>) => {
          console.error(err);
        });
        conn.on("open", () => this.handleConnection(conn));
      }
    });
  }

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

  private addChannel_(name: string): Channel {
    const newChannel = new Channel(name, this);
    this.channels.set(name, newChannel);
    return newChannel;
  }

  addChannel(name: string): Channel {
    if (name === "__control") {
      throw new Error("__control channel is reserved");
    }

    return this.addChannel_(name);
  }

  static createRoom(
    onOpen?: (room: Room) => void,
    onError?: (err: PeerError<any>) => void,
  ): void {
    const newRoom = new Room();
    newRoom.createPeer(() => {
      newRoom.peer?.on("connection", (conn) => newRoom.handleConnection(conn));
      newRoom.id_ = newRoom.peerId;
      onOpen?.(newRoom);
      newRoom.iAmHost_ = true;
    }, onError);
  }

  static joinRoom(
    id: string,
    onOpen?: (room: Room) => void,
    onError?: (err: PeerError<any>) => void,
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
        conn.on("open", () => {
          room.handleConnection(conn);
          onOpen?.(room);
        });
        room.peer.on("connection", (conn) => newRoom.handleConnection(conn));
      }
    }, onError);
  }

  leaveRoom() {
    this.connections.forEach((conn) => {
      conn.close();
    });
    //? no se si habria que borrar los channels tambien
  }

  private createPeer(
    onOpen?: (room: Room) => void,
    onError?: (err: PeerError<any>) => void,
  ) {
    this.peer = new Peer();

    this.peer?.once("error", (err: PeerError<any>) => onError?.(err));
    this.peer?.once("open", () => {
      if (!this.peer) {
        return;
      }
      this.peer.on("disconnected", this.handlePeerDisconnection);
      onOpen?.(this);
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

    this.onDisconnectCallback?.(conn.peer);

    conn.removeAllListeners();
    console.log(
      "ROOM: connection removed, current connections",
      this.connections.length,
    );
  }

  private handleConnection(conn: DataConnection) {
    if (
      !this.connections.find((existingConn) => {
        return existingConn.peer === conn.peer;
      })
    ) {
      conn.on("data", (data) => {
        const {
          channel: channelName,
          callback: callbackName,
          data: messageData,
        } = data as Message;

        const channel = this.channels.get(channelName);
        if (!channel)
          console.log("ROOM: channel", channelName, "doesn't exist");
        else {
          channel.dataCallbacks.get(callbackName)?.(conn.peer, messageData);
        }
        // channel?.dataCallbacks.forEach((callback) => {
        //   callback((data as Message).data);
        // });
      });
      conn.on("close", () => this.handleDisconnection(conn));
      conn.on("error", (err: PeerError<any>) => {
        console.log(err);
      });

      this.onConnectCallback?.(conn.peer);

      if (this.iAmHost) {
        // const peerIds = [];
        // this.connections.forEach((otherConn) => {
        //   peerIds.push(otherConn.peer);
        // });
        // const peerIds = this.connections.map((conn) => conn.peer);
        this.controlChannel.broadcast("newConn2Host", conn.peer);
        console.log("new connection to host ", conn.peer);
      }

      this.connections.push(conn);
      console.log("ROOM: connection added");
    }
  }

  onConnect(callback: (peerId: string) => void) {
    this.onConnectCallback = callback;
  }

  onDisconnect(callback: (peerId: string) => void) {
    this.onDisconnectCallback = callback;
  }
}
