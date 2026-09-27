import { useState } from "react";

interface HomeProps {
  onJoin: (roomId: string) => void;
  message: string;
}

function Home({ onJoin, message }: HomeProps) {
  const [roomInput, setRoomInput] = useState("");

  function handleJoin() {
    const room = roomInput.trim();

    if (!room) {
      alert("Please enter a room ID");
      return;
    }

    onJoin(room);
  }

  return (
    <div className="container">
      <header>
        <h1>MiniMeet</h1>
        <p className="subtitle">A WebRTC video calling experiment</p>
      </header>

      <div className="room-controls">
        <input
          type="text"
          placeholder="Enter room ID"
          value={roomInput}
          onChange={(event) => setRoomInput(event.target.value)}
        />

        <button onClick={handleJoin}>Join Room</button>
      </div>

      <div className="status">WebRTC • STUN • ICE • WebSocket Signaling</div>
      {message && <p className="status">{message}</p>}
    </div>
  );
}

export default Home;
