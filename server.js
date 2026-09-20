const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 8080 });

const rooms = new Map();

console.log("WebSocket server started on ws://localhost:8080");

wss.on("connection", (socket) => {
    console.log("Client connected");

    socket.on("message", (message) => {
        const data = JSON.parse(message.toString());

        if (data.type === "join") {
            const roomId = data.room;

            if (!rooms.has(roomId)) {
                rooms.set(roomId, []);
            }

            const room = rooms.get(roomId);

            if (room.length >= 2) {
                socket.send(
                    JSON.stringify({
                        type: "error",
                        message: "Room is full",
                    })
                );

                return;
            }

            room.push(socket);
            socket.roomId = roomId;
            if (room.length === 2) {
                room[0].send(
                    JSON.stringify({
                        type: "peer-joined",
                    })
                )
            }
            console.log(`Client joined room: ${roomId}`);

            socket.send(
                JSON.stringify({
                    type: "joined",
                    room: roomId,
                })
            );

            return;
        }

        // Everything below this point is a signaling message

        const roomId = socket.roomId;

        if (!roomId || !rooms.has(roomId)) {
            return;
        }

        const room = rooms.get(roomId);

        room.forEach((client) => {
            if (
                client !== socket &&
                client.readyState === WebSocket.OPEN
            ) {
                client.send(JSON.stringify(data));
            }
        });
    });

    socket.on("close", () => {
        const roomId = socket.roomId;

        if (!roomId || !rooms.has(roomId)) {
            return;
        }

        const room = rooms.get(roomId);

        const index = room.indexOf(socket);

        if (index !== -1) {
            room.splice(index, 1);
        }

        if (room.length === 0) {
            rooms.delete(roomId);
        }

        console.log(`Client left room: ${roomId}`);
    });
});