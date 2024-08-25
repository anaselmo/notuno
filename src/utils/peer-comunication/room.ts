/* eslint-disable @typescript-eslint/no-unused-expressions */
import Peer, { DataConnection, PeerError } from "peerjs";

import { Channel } from "./channel";
import { Message } from "./types";

enum ReservedChannels {
  CONTROL = "__control",
}

enum ReservedDataCallbacks {
  NEW_CONN_2_HOST = "newConn2Host",
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
  private isReady = false;

  private constructor() {
    this.controlChannel = this.addChannel_("__control");
    console.log("created this.controlChannel.on('newConn2Host')");
    this.controlChannel.on(
      ReservedDataCallbacks.NEW_CONN_2_HOST,
      async (_hostPeerId, data: string[]) => {
        const peerIds = data.filter((id): boolean => id !== this.peerId);
        const connectionPromises = peerIds.map(async (id) => {
          if (this.peer) {
            const conn = await Room.createConnection(this.peer, id);

            conn.on("error", (err: PeerError<any>) => {
              console.error(`Error connecting to peer ${id}:`, err);
            });

            return this.handleConnection(conn).catch((err) => {
              console.error(`Failed to handle connection for peer ${id}:`, err);
            });
          }
          return Promise.resolve();
        });

        try {
          connectionPromises.length > 0 &&
            (await Promise.all(connectionPromises));
          this.isReady = true;
          console.log("CONNECTED TO ALL PEERS", peerIds);
        } catch (err) {
          console.error("Failed to establish one or more connections:", err);
          // Handle the critical error, e.g., cleanup or retry logic
        }

        console.log(
          "WE ARE FOCKING READY O QUÉ COJONES PASA POR QUÉ NO LLEGA AL PUTO ON NEWCONN2HOST",
        );
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
    newRoom.peer = await this.createPeer();

    newRoom.peer.on("connection", async (conn) => {
      await Room.openConnection(conn);
      await newRoom.handleConnection(conn);
    });

    newRoom.id_ = newRoom.peerId;
    newRoom.iAmHost_ = true;

    console.log("ROOM: new room created", newRoom.id);
    return newRoom;
  }

  static async joinRoom(id: string): Promise<Room> {
    const newRoom = new Room();
    newRoom.id_ = id;

    newRoom.peer = await this.createPeer();
    console.log("PEER: my peer", newRoom.peer.id);

    const conn = await Room.createConnection(newRoom.peer, id);
    console.log("CONNECTION: created connection to", id);

    newRoom.hostIndex = 0; //! no me convence

    await newRoom.handleConnection(conn);
    console.log("CONNECTION: handled connection to", id);

    newRoom.peer.on("connection", async (conn) => {
      console.log("CONNECTION: new connection");
      await Room.openConnection(conn);
      await newRoom.handleConnection(conn);
    });

    while (!newRoom.isReady) {
      console.log("ROOM: waiting for all connections to be ready");
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    console.log("ROOM: joined room", newRoom.id);
    return newRoom;
  }

  leaveRoom() {
    this.connections.forEach((conn) => {
      conn.close();
    });
    console.log("ROOM: left room", this.id);
    //? Consider clearing channels as well, if necessary
  }

  private static async openConnection(
    conn: DataConnection,
  ): Promise<DataConnection> {
    return new Promise((resolve, reject) => {
      conn.once("error", (err: PeerError<any>) => {
        reject(err);
      });
      conn.once("open", () => {
        resolve(conn);
      });
      if (conn.open) {
        resolve(conn);
      }
    });
  }

  private static async createConnection(
    peer: Peer,
    id: string,
  ): Promise<DataConnection> {
    return await Room.openConnection(peer.connect(id));
  }

  private static createPeer(): Promise<Peer> {
    const newPeer = new Peer();

    return new Promise((resolve, reject) => {
      newPeer.once("error", (err: PeerError<any>) => {
        reject(err);
      });
      newPeer.once("open", () => {
        newPeer.once("disconnected", this.handlePeerDisconnection);
        resolve(newPeer);
      });
    });
  }

  private static handlePeerDisconnection() {
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
    // eslint-disable-next-line no-async-promise-executor
    return new Promise<void>(async (resolve, reject) => {
      conn.once("error", (err: PeerError<any>) => {
        reject(err);
      });

      if (
        !this.connections.find((existingConn) => {
          return existingConn.peer === conn.peer;
        })
      ) {
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
            } else {
              console.log("ROOM: received data", {
                channel,
                callbackName,
                messageData,
              });
              channel.dataCallbacks.get(callbackName)?.(conn.peer, messageData);
            }
          },
        );
        conn.on("close", () => this.handleDisconnection(conn));
        conn.on("error", (err: PeerError<any>) => {
          console.log(err);
        });

        this.onConnectCallback?.(conn.peer);

        this.connections.push(conn);
        console.log("ROOM: connection added:", conn.peer);
        if (this.iAmHost) {
          const peerIds = this.connections.map(({ peer }) => peer);
          await this.controlChannel.send(
            conn.peer,
            ReservedDataCallbacks.NEW_CONN_2_HOST,
            peerIds,
          );
          console.log(
            "ROOM: new connection to host ",
            conn.peer,
            "peerIds",
            peerIds,
          );
        }
      }
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
