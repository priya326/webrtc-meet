const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 8080 });

const clients = [];

console.log("WebSocket server started on ws://localhost:8080");

wss.on("connection", (socket) => {
    console.log("Client connected");

    clients.push(socket);

    socket.on("message", (message) => {
        // Node's ws library gives us the message directly.
        // Convert it to a normal string.
        const text = message.toString();

        console.log("Server received:", text);

        clients.forEach((client) => {
            if (client !== socket && client.readyState === WebSocket.OPEN) {
                client.send(text);
            }
        });
    });

    socket.on("close", () => {
        const index = clients.indexOf(socket);

        if (index !== -1) {
            clients.splice(index, 1);
        }

        console.log("Client disconnected");
    });
});