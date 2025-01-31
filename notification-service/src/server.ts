import express, { Express } from "express";
import { Server } from "http";
import { errorConverter, errorHandler } from "./middleware";
import config from "./config/config";
import WebSocket from "ws";
import { RabbitMQService } from "./services/RabbitMQService";
import { KafkaService } from "./services/KafkaService"

const app: Express = express();
let server: Server;
let ws: WebSocket;
let rabbitService: RabbitMQService;
let kafkaService: KafkaService;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(errorConverter);
app.use(errorHandler);

server = app.listen(config.PORT, () => {
    console.log(`Server is running on port ${config.PORT}`);
});

const connectWebSocket = () => {
    if (ws && ws.readyState === WebSocket.OPEN) return;
    ws = new WebSocket("ws://localhost:8080");

    ws.on("open", () => {
        ws.send(JSON.stringify({
            type: "IDENTIFY",
            source: "NOTIFICATION_SERVICE"
        }));
        console.log("Connected to Gateway WebSocket");
    });

    ws.on("close", () => {
        console.log("Disconnected from Gateway");
        setTimeout(() => connectWebSocket(), 3000); // Reconnect on disconnect
    });

    ws.on("error", (err: any) => {
        console.error("WebSocket error:", err);
    });
}

const initializeServices = async () => {
    connectWebSocket();
    rabbitService = new RabbitMQService(ws);
    kafkaService = new KafkaService(ws);
};

initializeServices();

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
process.on("SIGTERM", exitHandler);
process.on("SIGINT", exitHandler);