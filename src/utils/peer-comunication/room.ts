import Peer, { DataConnection, PeerError } from "peerjs";

import { Channel } from "./channel";
import { Message } from "./types";

const reservedChannels = {
  CONTROL: {
    name: "__control",
    callbacks: {
      NEW_CONN_2_HOST: "newConn2Host" as const,
      VOTING_HOST: "votingHost" as const,
      VOTE_ANSWER: "voteAnswer" as const,
      IM_NEW_HOST: "imNewHost" as const,
    },
  },
};

export class Room {
  public connections: DataConnection[] = [];
  private channels: Map<string, Channel<any>> = new Map();
  private peer: Peer | null = null;

  private id_: string = "";
  private controlChannel: Channel<{
    [reservedChannels.CONTROL.callbacks.NEW_CONN_2_HOST]: {peers: string[],hPreference:number};
    [reservedChannels.CONTROL.callbacks.VOTING_HOST]: number;
    [reservedChannels.CONTROL.callbacks.VOTE_ANSWER]: string;
    [reservedChannels.CONTROL.callbacks.IM_NEW_HOST]: number;
  }>;
  private onConnectCallback: (peerId: string) => void;
  private onDisconnectCallback: (peerId: string) => void;
  private onNewHostCallback: (hostId: string) => void;
  private isReady = false;

  private iAmHost_: boolean = false;
  private hostPreferenceCount = 0;
  private hostPreference = -1;
  private receivedVotes: Set<string> = new Set();

  private constructor() {
    this.controlChannel = this.addChannel_(reservedChannels.CONTROL.name);
    console.log("created this.controlChannel.on('newConn2Host')");
    this.controlChannel.on(
      reservedChannels.CONTROL.callbacks.NEW_CONN_2_HOST,
      async (_hostPeerId, data) => {
        this.hostPreference = data.hPreference;
        const peerIds = data.peers.filter((id): boolean => id !== this.myId);
        const connectionPromises = peerIds.map(async (id) => {
          if (this.peer) {
            const conn = await Room.createConnection(this.peer, id);

            conn.on("error", (err: PeerError<any>) => {
              console.error(`ROOM: Error connecting to peer ${id}:`, err);
            });

            return this.handleConnection(conn).catch((err) => {
              console.error(
                `ROOM: Failed to handle connection for peer ${id}:`,
                err,
              );
            });
          }
          return Promise.resolve();
        });

        try {
          if (connectionPromises.length > 0)
            await Promise.all(connectionPromises);
          this.isReady = true;
          console.log("ROOM: CONNECTED TO ALL PEERS", peerIds);
        } catch (err) {
          console.error(
            "ROOM:Failed to establish one or more connections:",
            err,
          );
          // Handle the critical error, e.g., cleanup or retry logic
        }
      },
    );
    this.controlChannel.on(reservedChannels.CONTROL.callbacks.VOTING_HOST,
      async (_senderPeerId, data) => {
        if(data<this.hostPreference){
          this.controlChannel.send(_senderPeerId,reservedChannels.CONTROL.callbacks.VOTE_ANSWER,_senderPeerId)
        }else{
          this.controlChannel.send(_senderPeerId,reservedChannels.CONTROL.callbacks.VOTE_ANSWER,this.myId)
        }

      });
    this.controlChannel.on(reservedChannels.CONTROL.callbacks.VOTE_ANSWER,async (_senderPeerId, data) => {
        if(data === this.myId){
          this.receivedVotes.add(_senderPeerId)
          if(this.receivedVotes.size == this.connections.length){
            console.log("ROOM: I am the new host")
            this.onNewHostCallback?.(this.myId)
            this.receivedVotes.clear()
            this.iAmHost_ = true
            this.id_ = this.myId
            this.connections.forEach((conn)=>{
              this.controlChannel.send(conn.peer,reservedChannels.CONTROL.callbacks.IM_NEW_HOST,this.hostPreferenceCount)
              this.hostPreferenceCount++
            })
          }
          
        }
    });
    this.controlChannel.on(reservedChannels.CONTROL.callbacks.IM_NEW_HOST,async(_senderPeerId, data) => {
      console.log("ROOM:",_senderPeerId,"is the new host")
      this.onNewHostCallback?.(_senderPeerId)
      this.id_ = _senderPeerId
      this
      this.hostPreference = data;
      this.receivedVotes.clear()
    })
  }

  get iAmHost(): boolean {
    return this.iAmHost_;
  }

  get myId(): string {
    return this.peer?.id ?? "";
  }

  get id(): string {
    return this.id_;
  }

  get channelCount() {
    return this.channels.size;
  }

  private addChannel_<T>(name: string): Channel<T> {
    const newChannel = new Channel<T>(name, this);
    this.channels.set(name, newChannel);
    return newChannel;
  }

  addChannel<T>(name: string): Channel<T> {
    if (
      Object.values(reservedChannels).some((channel) => channel.name === name)
    ) {
      throw new Error(`ROOM: ${name} channel is reserved`);
    }
    return this.addChannel_<T>(name);
  }

  static async createRoom(): Promise<Room> {
    const newRoom = new Room();
    newRoom.peer = await this.createPeer();

    newRoom.peer.on("connection", async (conn) => {
      await Room.openConnection(conn);
      await newRoom.handleConnection(conn);
    });

    newRoom.id_ = newRoom.myId;
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
    // conn.close();
    
    this.connections = this.connections.filter((existingConn) => {
      return existingConn.peer !== conn.peer;
    });

    this.onDisconnectCallback?.(conn.peer);

    conn.removeAllListeners();
    console.log(
      "ROOM: connection removed, current connections",
      this.connections.length,
    );
    if(conn.peer == this.id){
      console.log(
        "ROOM: host lost, voting new host"
      );
      if(this.connections.length == 0){
        this.id_ = this.myId;
        this.iAmHost_ = true
        this.onNewHostCallback(this.myId)
      }else{
        this.controlChannel.broadcast(reservedChannels.CONTROL.callbacks.VOTING_HOST,this.hostPreference)
      }
    }
  }

  private async handleConnection(conn: DataConnection): Promise<void> {
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
          const hPreference = this.hostPreferenceCount;
          const peerIds = this.connections.map(({ peer }) => peer);
          await this.controlChannel.send(
            conn.peer,
            reservedChannels.CONTROL.callbacks.NEW_CONN_2_HOST,
            {peers:peerIds, hPreference:hPreference},
          );
          this.hostPreferenceCount++;
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

  onNewHost(callback: (peerId: string) => void) {
    this.onNewHostCallback = callback;
  }
}
