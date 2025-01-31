import { KafkaClient, Consumer } from "kafka-node";
import config from "../config/config"
import { UserStatusStore } from "../utils/userStatusStore";
import { Message } from "../database";
import { rabbitMQService } from "./RabbitMQService";

enum Status {
    NotDelivered = "NotDelivered",
    Delivered = "Delivered",
    Seen = "Seen",
}


class KafkaService {
    private client: KafkaClient;
    private userStatusStore = UserStatusStore.getInstance();

    constructor() {
        const brokerURL = config.kafkaBrokerURL;
        this.client = new KafkaClient({ kafkaHost: brokerURL });
    }

    startConsuming() {
        const consumer = new Consumer(
            this.client,
            [{ topic: "user-status", partition: 0 }],//, offset: 1 
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

                    await rabbitMQService.notifyDeliveredMessages(event.userId);

                    //mark messages as delivered
                    const updatedMessages = await Message.updateMany(
                        { "receiverId": event.userId, "status": Status.NotDelivered },
                        { $set: { "status": Status.Delivered } }
                    );


                } else if (event.eventType === "USER_LOGGED_OUT") {
                    this.userStatusStore.setUserOffline(event.userId);
                }


                consumer.commit((err, data) => {
                    if (err) {
                        console.error("Error committing Kafka offset:", err);
                    } else {
                        console.log("Offset committed successfully:", data);
                    }
                });

            } catch (err) {
                console.error("Error processing Kafka message in chat-service:", err);
            }
        });

        consumer.on("error", (err) => {
            console.error("Kafka Consumer error in chat-service:", err);
        });


    }
}

export const kafkaService = new KafkaService();