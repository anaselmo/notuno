import "./App.css";
import { Routes, Route } from "react-router-dom";
import { RoomPage } from "./pages/room";
import { MainPage } from "./pages/main";
import { LobbyPage } from "./pages/lobby";

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
