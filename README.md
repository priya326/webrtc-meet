# MiniMeet

A simple 1-to-1 video calling experiment built to understand how WebRTC works under the hood.

## About

MiniMeet is a small WebRTC project that establishes a peer-to-peer video/audio connection between two browser tabs.

The project was built as a hands-on way to learn:

- WebRTC
- RTCPeerConnection
- SDP offer/answer
- ICE candidates
- STUN
- WebSocket signaling
- MediaStream and MediaStreamTrack

## How It Works

The connection follows this basic flow:

1. User grants access to the camera and microphone.
2. A `RTCPeerConnection` is created.
3. The caller creates an SDP offer.
4. The offer is sent to the other browser through a WebSocket signaling server.
5. The receiver sets the offer as its remote description and creates an SDP answer.
6. ICE candidates are exchanged through the signaling server.
7. ICE attempts to find a network path between the two peers.
8. Once a connection is established, audio/video flows directly between the peers.

```text
Browser A
   │
   │  SDP Offer
   ▼
WebSocket Signaling Server
   │
   │  SDP Offer
   ▼
Browser B

Browser A ◄──── ICE Candidates ────► Browser B

Browser A ◄════ WebRTC Media ════► Browser B
             Audio / Video
```
