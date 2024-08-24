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

  broadcast(callbackName: string, data?: any): void {
    this.room.connections.forEach(async (conn) => {
      conn.send({ callback: callbackName, channel: this.name, data });
    });
  }

  send(peerId: string, callbackName: string, data?: any): void {
    this.room.connections
      .find((conn) => conn.peer === peerId)
      ?.send({ callback: callbackName, channel: this.name, data });
  }
}
