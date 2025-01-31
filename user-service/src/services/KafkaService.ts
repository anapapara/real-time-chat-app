import  config  from "../config/config"
import { KafkaClient, Producer } from "kafka-node";

class KafkaService {
    private client: KafkaClient;
    private producer: Producer;

    constructor() {
        const brokerURL = config.kafkaBRokerURL;
        this.client = new KafkaClient({ kafkaHost: brokerURL });
        this.producer = new Producer(this.client);

        this.producer.on("ready", () => {
            console.log("Kafka Producer in user-service is ready");
        });

        this.producer.on("error", (err) => {
            console.error("Kafka Producer error in user-service:", err);
        });
    }

    async publishUserStatus(eventType: string, userId: string, userName: string, userEmail: string) {
        const payload = [
            {
                topic: "user-status",
                messages: JSON.stringify({
                    eventType,
                    userId,
                    userName,
                    userEmail,
                    timestamp: new Date().toISOString(),
                }),
            },
        ];

        this.producer.send(payload, (err, data) => {
            if (err) {
                console.error(`Error publishing user-status event: ${err}`);
            } else {
                console.log(`Published user-status event: ${data}`);
            }
        });
    }
}

export const kafkaService = new KafkaService();