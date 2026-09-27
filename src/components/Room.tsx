import { useEffect, useRef, useState } from "react";

interface RoomProps {
  roomId: string;
  onLeave: (message?: string) => void;
}

function Room({ roomId, onLeave }: RoomProps) {
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    createPeerConnection();

    const socket = new WebSocket("wss://webrtc-meet-oyyj.onrender.com");
    socketRef.current = socket;
    socket.onopen = () => {
      console.log("Connected to signaling server");

      socket.send(
        JSON.stringify({
          type: "join",
          room: roomId,
        })
      );
    };

    socket.onmessage = async (message) => {
      const data = JSON.parse(message.data);

      console.log("Received from server:", data);
      if (data.type === "ice-candidate") {
        const peerConnection = peerConnectionRef.current;

        if (!peerConnection) {
          pendingCandidatesRef.current.push(data.candidate);
          return;
        }

        if (!peerConnection.remoteDescription) {
          pendingCandidatesRef.current.push(data.candidate);
          return;
        }

        await peerConnection.addIceCandidate(data.candidate);
      }
      if (data.type === "joined") {
        console.log("Joined room:", data.room);
      }
      if (data.type === "peer-left") {
        console.log("Peer left the room");

        const peerConnection = peerConnectionRef.current;

        if (peerConnection) {
          peerConnection.close();
          peerConnectionRef.current = null;
        }

        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = null;
        }
        onLeave("Peer left the room.");
      }
      if (data.type === "answer") {
        console.log("Received answer");

        const peerConnection = peerConnectionRef.current;

        if (!peerConnection) {
          return;
        }

        await peerConnection.setRemoteDescription(data.answer);
        for (const candidate of pendingCandidatesRef.current) {
          await peerConnection.addIceCandidate(candidate);
        }

        pendingCandidatesRef.current = [];

        console.log("Remote description set from answer");
      }

      if (data.type === "peer-joined") {
        console.log("A peer joined the room");
        await maybeStartCall();
      }
      if (data.type === "offer") {
        console.log("Received offer");

        const peerConnection = peerConnectionRef.current;

        if (!peerConnection) {
          return;
        }

        await peerConnection.setRemoteDescription(data.offer);
        for (const candidate of pendingCandidatesRef.current) {
          await peerConnection.addIceCandidate(candidate);
        }

        pendingCandidatesRef.current = [];
        console.log("Remote description set");
        const answer = await peerConnection.createAnswer();

        await peerConnection.setLocalDescription(answer);

        console.log("Answer created");
        const socket = socketRef.current;

        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(
            JSON.stringify({
              type: "answer",
              answer: peerConnection.localDescription,
            })
          );

          console.log("Answer sent");
        }
      }
      if (data.type === "error") {
        console.log("Server error:", data.message);
      }
    };

    socket.onclose = () => {
      console.log("Disconnected from signaling server");
    };

    return () => {
      if (
        socket.readyState === WebSocket.OPEN ||
        socket.readyState === WebSocket.CONNECTING
      ) {
        socket.close();
      }
    };
  }, [roomId]);
  function leaveRoom() {
    const stream = localStreamRef.current;

    if (stream) {
      stream.getTracks().forEach((track) => {
        track.stop();
      });

      localStreamRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    console.log("Left room");

    onLeave();
  }
  async function maybeStartCall() {
    const peerConnection = peerConnectionRef.current;

    if (!peerConnection) {
      return;
    }

    if (!localStreamRef.current) {
      console.log("No local stream yet");
      return;
    }

    const socket = socketRef.current;

    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return;
    }

    console.log("Creating offer...");

    const offer = await peerConnection.createOffer();

    await peerConnection.setLocalDescription(offer);

    socket.send(
      JSON.stringify({
        type: "offer",
        offer: peerConnection.localDescription,
      })
    );

    console.log("Offer sent");
  }
  function createPeerConnection() {
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        {
          urls: "stun:stun.l.google.com:19302",
        },
      ],
    });
    peerConnection.onconnectionstatechange = () => {
      console.log("Connection state:", peerConnection.connectionState);
    };
    peerConnectionRef.current = peerConnection;
    peerConnection.ontrack = (event) => {
      console.log("Received remote track");

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("My ICE candidate:", event.candidate);

        socketRef.current?.send(
          JSON.stringify({
            type: "ice-candidate",
            candidate: event.candidate,
          })
        );
      }
    };
    console.log("RTCPeerConnection created");
  }
  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      const peerConnection = peerConnectionRef.current;

      if (peerConnection) {
        stream.getTracks().forEach((track) => {
          peerConnection.addTrack(track, stream);
        });
      }
      await maybeStartCall();

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      console.log("Camera started");
    } catch (error) {
      console.error("Could not access camera:", error);
    }
  }

  return (
    <div className="container">
      <header>
        <h1>MiniMeet</h1>
        <p className="subtitle">WebRTC video call</p>
        <p>Room: {roomId}</p>
      </header>

      <div className="video-grid">
        <div className="video-card">
          <h2>My Video</h2>

          <div className="video-wrapper">
            <video ref={localVideoRef} autoPlay playsInline muted />
          </div>
        </div>

        <div className="video-card">
          <h2>Kucchupucchu Video</h2>

          <div className="video-wrapper">
            <video ref={remoteVideoRef} autoPlay playsInline />
          </div>
        </div>
      </div>

      <div className="controls">
        <button onClick={startCamera}>Start Camera</button>
        <button onClick={leaveRoom}>Leave Room</button>
      </div>
    </div>
  );
}

export default Room;
