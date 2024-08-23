import { Route, Routes } from "react-router-dom";

import "@/App.css";
import { LobbyPage } from "@/pages/lobby";
import { MainPage } from "@/pages/main";
import { RoomPage } from "@/pages/room";

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainPage />} />
      <Route path="/:id" element={<RoomPage />} />
      <Route path="/lobby" element={<LobbyPage />} />
    </Routes>
  );
}

export default App;
