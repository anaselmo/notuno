import { atom } from "jotai";

import { type Room } from "@/utils/peer-comunication";

export const roomAtom = atom(null as Room | null);
