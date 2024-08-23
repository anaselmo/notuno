import { atom } from "jotai";
import { Room } from "./utils/comm";
export const atomRoom = atom(new Room());
