import "./App.css";
import { Routes, Route } from "react-router-dom";
import { RoomPage } from "./pages/room";
import { MainPage } from "./pages/main";

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainPage />} />
      <Route path="/:id" element={<RoomPage />} />
    </Routes>
  );
}

export default App;
