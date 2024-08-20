import { createContext, useContext, useEffect } from "react";
import { peer } from "../peer";
import Peer from "peerjs";

interface PeerContextType {
  peer: Peer;
}

const PeerContext = createContext<PeerContextType>({ peer });

export const PeerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  useEffect(() => {
    console.log("context peer", peer);
  }, []);

  return (
    <PeerContext.Provider value={{ peer }}>{children}</PeerContext.Provider>
  );
};

export const usePeer = () => {
  const context = useContext(PeerContext);
  if (!context) {
    throw new Error("usePeer must be used within a PeerProvider");
  }
  return context;
};
