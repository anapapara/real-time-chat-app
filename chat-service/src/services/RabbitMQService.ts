import amqp, { Channel } from "amqplib";
import { v4 as uuidv4 } from "uuid";
import config from "../config/config";
import { UserStatusStore } from "../utils";
import MessageController from "../controllers/MessageController";

class RabbitMQService {

    private requestQueue = "USER_DETAILS_REQUEST";
    private responseQueue = "USER_DETAILS_RESPONSE";
    private correlationMap = new Map();
    private channel!: Channel;

    userStatusStore = UserStatusStore.getInstance();

    constructor() {
        this.init();
    }

    async init() {
        const connection = await amqp.connect(config.msgBrokerURL!);
        this.channel = await connection.createChannel();
        await this.channel.assertQueue(this.requestQueue);
        await this.channel.assertQueue(this.responseQueue);

        this.channel.consume(
            this.responseQueue,
            (msg) => {
                if (msg) {
                    const correlationId = msg.properties.correlationId;
                    const user = JSON.parse(msg.content.toString());

                    const callback = this.correlationMap.get(correlationId);
                    if (callback) {
                        callback(user);
                        this.correlationMap.delete(correlationId);
                    }
                }
            },
            { noAck: true }
        );

        this.channel.consume(config.queue.statuses, (msg) => {
            if (msg) {
                const { userId, isOnline } = JSON.parse(msg.content.toString());


                if (isOnline) {
                    this.userStatusStore.setUserOnline(userId);
                    //console.log("---amqp:USER_STATUS : " + userId + " logged in.");
                    this.publishUserStatus(userId, isOnline);
                } else {
                    this.userStatusStore.setUserOffline(userId);
                    //console.log("---amqp:USER_STATUS: " + userId + " logged out.");
                    this.publishUserStatus(userId, isOnline);

                }
                this.channel.ack(msg);
            }
        });
    }

    async requestUserDetails(userId: string, callback: Function) {
        const correlationId = uuidv4();
        this.correlationMap.set(correlationId, callback);
        this.channel.sendToQueue(
            this.requestQueue,
            Buffer.from(JSON.stringify({ userId })),
            { correlationId }
        );
    }

    async notifySeenMessages(senderId: string, receiverId: string) {
        await this.requestUserDetails(senderId, async (sender: any) => {
            const payload = {
                type: "SEEN_MESSAGES",
                receiverId: receiverId,
                senderId: senderId,
                senderEmail: sender.email,
            };
            try {
                await this.channel.assertQueue(config.queue.messages);
                this.channel.sendToQueue(
                    config.queue.messages,
                    Buffer.from(JSON.stringify(payload))
                );
                console.log("Sent SEEN_MESSAGES in rabbitmq");
            } catch (error) {
                console.error(error);
            }
        });
    }

    async notifyDeliveredMessages(receiverId: string) {
        const senders = await MessageController.getSendersNotDeliveredForReciever(receiverId);
        const payload = {
            type: "DELIVERED_MESSAGES",
            receiverId: receiverId,
            senders: senders,
        };
        // console.log(payload);
        try {
            await this.channel.assertQueue(config.queue.messages);
            this.channel.sendToQueue(
                config.queue.messages,
                Buffer.from(JSON.stringify(payload))
            );
            console.log("Sent DELIVERED_MESSAGES in rabbitmq");

        } catch (error) {
            console.error(error);
        }

    }

    async notifyReceiver(receiverId: string, message: string, senderEmail: string, senderId: string, senderName: string) {
        await this.requestUserDetails(receiverId, async (user: any) => {
            const notificationPayload = {
                type: "MESSAGE_RECEIVED",
                receiverId: receiverId,
                receiverEmail: user.email,
                message: message,
                senderId: senderId,
                senderEmail: senderEmail,
                senderName: senderName,
                receiverName: user.name
            };

            try {
                await this.channel.assertQueue(config.queue.notifications);
                this.channel.sendToQueue(
                    config.queue.notifications,
                    Buffer.from(JSON.stringify(notificationPayload))
                );
                console.log("Sent NOTIFY in rabbitmq");
            } catch (error) {
                console.error(error);
            }
        });
    }


    async publishUserStatus(userId: string, isOnline: boolean) {
        const statusUpdate = {
            userId,
            isOnline,
        };
        try {
            await this.channel.assertQueue(config.queue.statuses_notif);
            this.channel.sendToQueue(
                config.queue.statuses_notif,
                Buffer.from(JSON.stringify(statusUpdate))
            );
            console.log("Sent USER_STATUS_NOTIF in rabbitmq");
        } catch (error) {
            console.error("Failed to publish user status:", error);
        }
    }


}

export const rabbitMQService = new RabbitMQService();