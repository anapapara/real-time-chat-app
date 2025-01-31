import { KafkaClient, Consumer } from "kafka-node";
import { UserStatusStore } from "../utils/userStatusStore";
import config from "../config/config"
import WebSocket from 'ws';


export class KafkaService {
    private client: KafkaClient;
    private userStatusStore = UserStatusStore.getInstance();
    private ws: WebSocket;


    constructor(ws: WebSocket) {
        this.ws = ws;
        const brokerURL = config.kafkaBrokerURL;
        this.client = new KafkaClient({ kafkaHost: brokerURL });
        this.startConsuming();
    }

    startConsuming() {
        const consumer = new Consumer(
            this.client,
            [{ topic: "user-status", partition: 0 }],
            {
                groupId: "kafka-user-status-id",
                autoCommit: true,
                fromOffset: false,
            }
        );

        consumer.on("message", async (message) => {
            try {
                const event = JSON.parse(message.value?.toString() || "{}");

                if (event.eventType === "USER_LOGGED_IN") {
                    this.userStatusStore.setUserOnline(event.userId);
                    // console.log(`User ${event.userId} is now online in Notification Service.`);

                } else if (event.eventType === "USER_LOGGED_OUT") {
                    this.userStatusStore.setUserOffline(event.userId);
                    // console.log(`User ${event.userId} is now offline in Notification Service.`);
                }

                consumer.commit((err, data) => {
                    if (err) {
                        console.error("Error committing Kafka offset:", err);
                    } else {
                        console.log("Offset committed successfully:", data);
                    }
                });
            } catch (err) {
                console.error("Error processing Kafka message in notification-service:", err);
            }
        });

        consumer.on("error", (err) => {
            console.error("Kafka Consumer error in notification-service:", err);
        });
    }
}

// export const kafkaService = new KafkaService();