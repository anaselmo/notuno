import { Room } from "./room";

type ChannelDataMap = {
  [channelName: string]: any;
};

export class Channel<T extends ChannelDataMap> {
  readonly name: string;
  public dataCallbacks: Map<
    keyof T,
    (peerId: string, data: T[keyof T]) => void
  > = new Map();
  private room: Room;

  constructor(name: string, room: Room) {
    this.name = name;
    this.room = room;
  }

  on<K extends keyof T>(
    name: K,
    callback: (peerId: string, data: T[K]) => void,
  ): void {
    this.dataCallbacks.set(name, callback);
  }

  broadcast<K extends keyof T>(callbackName: K, data?: T[K]): Promise<void> {
    const sendPromises = this.room.connections.map((conn) =>
      conn.send({ callback: callbackName, channel: this.name, data }),
    );

    return Promise.all(sendPromises).then(() => undefined);
  }

  send<K extends keyof T>(
    peerId: string,
    callbackName: K,
    data?: T[K],
  ): Promise<void> {
    const connection = this.room.connections.find(
      (conn) => conn.peer === peerId,
    );
    return new Promise((resolve, reject) => {
      if (!connection) {
        return reject(new Error(`Connection with peerId ${peerId} not found`));
      }

      return resolve(
        connection.send({
          callback: callbackName,
          channel: this.name,
          data,
        }),
      );
    });
  }
}
