import { useState } from "react";
import Home from "./components/Home";
import Room from "./components/Room";

function App() {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  function handleJoin(room: string) {
    setMessage("");
    setRoomId(room);
  }

  function handleLeave(message?: string) {
    setRoomId(null);

    if (message) {
      setMessage(message);
    }
  }

  if (roomId === null) {
    return <Home onJoin={handleJoin} message={message} />;
  }

  return <Room roomId={roomId} onLeave={handleLeave} />;
}

export default App;
