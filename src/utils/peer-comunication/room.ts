import Peer, { DataConnection, PeerError } from "peerjs";

import { Channel } from "./channel";
import { Message } from "./types";

enum ReservedChannels {
  CONTROL = "__control",
}

enum ReservedDataCallbacks {
  NEW_CONN_2_HOST = "newConn2Host",
}

async function connectToPeer(
  peer: Peer,
  peerId: string,
): Promise<DataConnection> {
  const conn = peer.connect(peerId);
  return new Promise((resolve, reject) => {
    conn.once("error", (err: PeerError<any>) => {
      reject(err);
    });
    conn.once("open", () => {
      resolve(conn);
    });
  });
}

export class Room {
  public connections: DataConnection[] = [];
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
    console.log("created this.controlChannel.on('newConn2Host')");
    this.controlChannel.on(
      ReservedDataCallbacks.NEW_CONN_2_HOST,
      async (_hostPeerId, data: string[]) => {
        console.log("first");
        data = data.filter((id): boolean => id !== this.peerId);
        console.log("data", data);
        const objectiveConnections = data.length;
        const connectionPromises = data.map(async (id) => {
          if (this.peer) {
            const conn = this.peer.connect(id);
            conn.on("error", (err: PeerError<any>) => {
              console.error(err);
            });
            console.log("heelodvfodsfjdsofjdsfodjfodfjdofjsdfosdjfosfjo");
            await this.handleConnection(conn);
          }
        });

        await Promise.all(connectionPromises);

        console.log(
          "WE ARE FOCKING READY O QUÉ COJONES PASA POR QUÉ NO LLEGA AL PUTO ON NEWCONN2HOST",
        );
        if (objectiveConnections === 0) {
          return;
        }
      },
    );
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
    if (Object.values(ReservedChannels).some((channel) => channel === name)) {
      throw new Error(`${name} channel is reserved`);
    }
    return this.addChannel_(name);
  }

  static async createRoom(): Promise<Room> {
    const newRoom = new Room();
    await newRoom.createPeer();
    newRoom.peer?.on(
      "connection",
      async (conn) => await newRoom.handleConnection(conn),
    );

    console.log("ROOM: peer id", newRoom.peerId);
    newRoom.id_ = newRoom.peerId;
    newRoom.iAmHost_ = true;

    console.log("new room created", newRoom);
    return newRoom;
  }

  static async joinRoom(id: string): Promise<Room> {
    const newRoom = new Room();
    newRoom.id_ = id;

    await newRoom.createPeer();
    const conn = await connectToPeer(newRoom.peer, id);
    newRoom.hostIndex = 0; //! no me convence
    console.log("before handle connection");
    await newRoom.handleConnection(conn);
    console.log("after handle connection");
    newRoom.peer.on("connection", async (conn) => {
      console.log("f");
      await newRoom.handleConnection(conn);
    });
    return newRoom;
  }

  leaveRoom() {
    this.connections.forEach((conn) => {
      conn.close();
    });
    //? Consider clearing channels as well, if necessary
  }

  private createPeer() {
    this.peer = new Peer();

    return new Promise<void>((resolve, reject) => {
      this.peer.once("error", (err: PeerError<any>) => {
        reject(err);
      });
      this.peer?.once("open", () => {
        if (!this.peer) {
          return;
        }
        this.peer.on("disconnected", this.handlePeerDisconnection);
        resolve();
      });
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

  private async handleConnection(conn: DataConnection): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      console.log("first line in handleConnection");

      conn.once("error", (err: PeerError<any>) => {
        reject(err);
      });

      conn.on("open", async () => {
        if (
          !this.connections.find((existingConn) => {
            return existingConn.peer === conn.peer;
          })
        ) {
          console.log("state", conn.open);
          conn.on(
            "data",
            ({
              channel: channelName,
              callback: callbackName,
              data: messageData,
            }: Message) => {
              const channel = this.channels.get(channelName);
              if (!channel) {
                console.log("ROOM: channel", channelName, "doesn't exist");
                reject(`ROOM: channel ${channelName} doesn't exist`);
              } else {
                channel.dataCallbacks.get(callbackName)?.(
                  conn.peer,
                  messageData,
                );
              }
            },
          );
          conn.on("close", () => this.handleDisconnection(conn));
          conn.on("error", (err: PeerError<any>) => {
            console.log(err);
            reject(err.type);
          });

          this.onConnectCallback?.(conn.peer);

          this.connections.push(conn);
          if (this.iAmHost) {
            const peerIds = this.connections.map(({ peer }) => peer);
            await this.controlChannel.send(
              conn.peer,
              ReservedDataCallbacks.NEW_CONN_2_HOST,
              peerIds,
            );
            console.log(
              "new connection to host ",
              conn.peer,
              "peerIds",
              peerIds,
            );
          }
          console.log("ROOM: connection added:", conn.peer, "state", conn.open);
        }
      });
      resolve();
    });
  }

  onConnect(callback: (peerId: string) => void) {
    this.onConnectCallback = callback;
  }

  onDisconnect(callback: (peerId: string) => void) {
    this.onDisconnectCallback = callback;
  }
}
