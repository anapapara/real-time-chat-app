import express from "express";
import proxy from "express-http-proxy";
import cors from "cors";
import { WebSocket, WebSocketServer } from "ws";
import http from "http"


const app = express();
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const auth = proxy("http://localhost:8081");
const messages = proxy("http://localhost:8082");
const notifications = proxy("http://localhost:8083");

app.use("/api/auth", auth);
app.use("/api/messages", messages);
app.use("/api/notifications", notifications);

const server = http.createServer(app);
const wss = new WebSocketServer({ server })

const clients = new Map<string, WebSocket>();
let notificationServiceSocket: WebSocket | null = null;

// Handling WebSocket connections
wss.on("connection", (ws, req) => {
    console.log("New WebSocket connection");

    ws.on("message", (message) => {
        console.log(`Received message: ${message}`);
        try {
            const data = JSON.parse(message.toString());
            //message from notification service
            if (data.type === "IDENTIFY" && data.source === "NOTIFICATION_SERVICE") {
                notificationServiceSocket = ws;
                console.log("Notification Service connected via WebSocket");
            }

            //message from clients- registration for notification
            else if (data.type === "REGISTER" && data.userId) {
                clients.set(data.userId, ws);
                console.log(`User ${data.userId} registered for WebSocket notifications.`);
            }

            //message from notification service for new message and updated messages
            else if (data.type === "NOTIFY" && data.receiverEmail) {
                const client = clients.get(data.receiverEmail);
                console.log(`message from ws: ${data.senderName} -> ${data.receiverName}: ${data.message}`);

                if (client && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: "NOTIFY",
                        receiverId: data.receiverId,
                        receiverName: data.receiverName,
                        receiverEmail: data.receiverEmail,
                        senderEmail: data.senderEmail,
                        senderName: data.senderName,
                        senderId: data.senderId,
                        message: data.message,
                    }));
                    console.log(`Sent notification to user ${data.receiverEmail}`);
                } else {
                    console.log(`websocket is closed`);
                }
            }
            else if (data.type === "SEEN_MESSAGES") {
                const { type, receiverId, senderId, senderEmail } = JSON.parse(message.toString());
                const client = clients.get(senderEmail);
                if (client && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: "SEEN_MESSAGES",
                        receiverId: receiverId,
                        senderEmail: senderEmail,
                        senderId: senderId
                    }));
                    console.log(`Sent SEEN notification to user ${data.senderEmail}`);
                } else {
                    console.log(`websocket is closed`);
                }
            }
            else if (data.type === "DELIVERED_MESSAGES" && data.receiverId) {
                const { type, receiverId, senders } = JSON.parse(message.toString());
                senders.forEach(senderEmail => {
                    const client = clients.get(senderEmail);
                    if (client && client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            type: "DELIVERED_MESSAGES",
                            receiverId: receiverId,
                            senderEmail: senderEmail,
                        }));
                        console.log(`Sent DELIV notification to user ${senderEmail}`);
                    } else {
                        console.log(`websocket is closed`);
                    }
                });
            }
        } catch (err) {
            console.error("Error parsing WebSocket message:", err);
        }
    });

    ws.on("close", () => {
        console.log("WebSocket connection closed");
        clients.forEach((value, key) => {
            if (value === ws) clients.delete(key);
        });

        if (ws === notificationServiceSocket) {
            notificationServiceSocket = null;
            console.log("Notification Service WebSocket disconnected.");
        }
    });

    // Send a message to the WebSocket client
    ws.send(JSON.stringify({ message: "Welcome to the WebSocket server!" }));
});

server.listen(8080, () => {
    console.log("Gateway running on port 8080");
});



const exitHandler = () => {
    if (server) {
        server.close(() => {
            console.info("Server closed");
            process.exit(1);
        });
    } else {
        process.exit(1);
    }
};

const unexpectedErrorHandler = (error: unknown) => {
    console.error(error);
    exitHandler();
};

process.on("uncaughtException", unexpectedErrorHandler);
process.on("unhandledRejection", unexpectedErrorHandler);









// const server = app.listen(8080, () => {
//     console.log("Gateway is Listening to Port 8080");
// });

// const exitHandler = () => {
//     if (server) {
//         server.close(() => {
//             console.info("Server closed");
//             process.exit(1);
//         });
//     } else {
//         process.exit(1);
//     }
// };

// const unexpectedErrorHandler = (error: unknown) => {
//     console.error(error);
//     exitHandler();
// };

// process.on("uncaughtException", unexpectedErrorHandler);
// process.on("unhandledRejection", unexpectedErrorHandler);