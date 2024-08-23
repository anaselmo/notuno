import { createRoot } from "react-dom/client";
import { Toaster } from "react-hot-toast";
import { RouterProvider, createBrowserRouter } from "react-router-dom";

import App from "./App";
import "./index.css";
import { MainPage } from "./pages/main";
import { RoomPage } from "./pages/room";

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

createRoot(document.getElementById("root")!).render(
  <>
    <RouterProvider router={router} />
    <Toaster
      toastOptions={{
        style: { backgroundColor: "#696969F0", color: "#f0f0f0" },
        success: {
          duration: 1500,
          style: { backgroundColor: "#46b029ee" },
          iconTheme: { primary: "#f0f0f0", secondary: "#4CAF50" },
        },
        error: {
          duration: 2500,
          style: { backgroundColor: "#DF4336F0" },
          iconTheme: { primary: "#f0f0f0", secondary: "#F44336" },
        },
      }}
    />
  </>,
);
