import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import "./index.css";
import { MainPage } from "./pages/main";
import { RoomPage } from "./pages/room";
import Peer from "peerjs";
import { PeerProvider } from "./contexts/PeerProvider.tsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "/",
        element: <MainPage />,
      },
      {
        path: "/:id",
        element: <RoomPage />,
      },
    ],
  },
]);

export const peer = new Peer();

createRoot(document.getElementById("root")!).render(
  // <StrictMode>
  <PeerProvider>
    <RouterProvider router={router} />
  </PeerProvider>
  // </StrictMode>
);
