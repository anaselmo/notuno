import { Room } from "./room";

export class Channel {
  readonly name: string;
  public dataCallbacks: Map<string, (peerId: string, data: any) => void> =
    new Map(); //! hay que hacerlo privado y accesible desde Room
  private room: Room;

  constructor(name: string, room: Room) {
    //!aqui tambien
    this.name = name;
    this.room = room;
  }

  on(name: string, callback: (peerId: string, data: any) => void): void {
    this.dataCallbacks.set(name, callback);
  }

  broadcast(callbackName: string, data?: any): Promise<void> {
    const sendPromises = this.room.connections.map((conn) =>
      conn.send({ callback: callbackName, channel: this.name, data }),
    );

    return Promise.all(sendPromises).then(() => undefined);
  }

  send(peerId: string, callbackName: string, data?: any): Promise<void> {
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
