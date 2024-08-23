import { atom } from "jotai";
import { Room } from "./utils/comm";
export const atomRoom = atom<Room | null>(null);
