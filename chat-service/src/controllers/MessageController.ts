import { Request, Response } from "express";
import { AuthRequest } from "../middleware";
import { Message } from "../database";
import { ApiError, UserStatusStore } from "../utils";
import { rabbitMQService } from "../services/RabbitMQService";

enum Status {
    NotDelivered = "NotDelivered",
    Delivered = "Delivered",
    Seen = "Seen",
}
const userStatusStore = UserStatusStore.getInstance();

const send = async (req: AuthRequest, res: Response) => {
    try {
        const { receiverId, message } = req.body;
        const { _id, email, name } = req.user;

        validateReceiver(_id, receiverId);

        const receiverIsOffline = !userStatusStore.isUserOnline(receiverId);

        const newMessage = await Message.create({
            senderId: _id,
            receiverId,
            message,
            status: receiverIsOffline == true ? Status.NotDelivered : Status.Delivered,
        });

        //send notification in rabbitMQ if user is online
        if (!receiverIsOffline) {
            await rabbitMQService.notifyReceiver(receiverId, message, email, _id, name);
        }

        return res.json({
            status: 200,
            message: "Message sent successfully!",
            data: newMessage,
        });
    } catch (error: any) {
        return res.json({
            status: 500,
            message: error.message,
        });
    }
};
const validateReceiver = (senderId: string, receiverId: string) => {
    if (!receiverId) {
        throw new ApiError(404, "Receiver ID is required.");
    }

    if (senderId == receiverId) {
        throw new ApiError(400, "Sender and receiver cannot be the same.");
    }
};


const markMessagesAsSeen = async (req: AuthRequest, res: Response) => {
    try {
        const { senderId } = req.body; //from who received the messages the current user
        const { _id, email, name } = req.user; //current user (receiver)

        validateReceiver(_id, senderId);

        await rabbitMQService.notifySeenMessages(senderId, _id);

        const updatedMessages = await Message.updateMany(
            { "receiverId": _id, "senderId": senderId },
            { $set: { "status": Status.Seen } }
        );

        return res.json({
            status: 200,
            message: "Message successfully marked as seen!",
            data: updatedMessages,
        });
    } catch (error: any) {
        return res.json({
            status: 500,
            message: error.message,
        });
    }
};

const getUnreadCounts = async (req: AuthRequest, res: Response) => {
    try {
        const receiverId = req.user._id;


        const counts = await Message.aggregate([
            { $match: { "receiverId": receiverId, "status": { $in: [Status.Delivered, Status.NotDelivered] } } },
            { $group: { _id: "$senderId", count: { $sum: 1 } } },
        ]);

        let countMap: { [key: string]: number } = {};

        counts.forEach(({ _id, count }) => {
            countMap[_id.toString()] = count;
        });


        return res.json({
            status: 200,
            message: "Message successfully marked as seen!",
            data: countMap,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Error fetching unread counts" });
    }
};

const getConversation = async (req: AuthRequest, res: Response) => {
    try {
        const { receiverId } = req.params;
        const senderId = req.user._id;

        const messages = await Message.find({
            $or: [
                { senderId, receiverId },
                { senderId: receiverId, receiverId: senderId },
            ],
        });

        return res.json({
            status: 200,
            message: "Messages retrieved successfully!",
            data: messages,
        });
    } catch (error: any) {
        return res.json({
            status: 500,
            message: error.message,
        });
    }
};


const getSendersNotDeliveredForReceiver = async (receiverId: string) => {

    try {
        const undeliveredMessages = await Message.find({
            receiverId: receiverId,
            status: Status.NotDelivered,
        });

        // Extract unique sender IDs
        const senderIds = [...new Set(undeliveredMessages.map(msg => msg.senderId))];

        const senderEmails = await Promise.all(
            senderIds.map(async (id) => {
                return new Promise<string>((resolve) => {
                    rabbitMQService.requestUserDetails(id, async (sender: any) => {
                        if (sender.email) {
                            resolve(sender.email);
                        } else {
                            resolve(""); // Handle cases where email is missing
                        }
                    });
                });
            })
        );

        // Remove empty email entries
        const validSenderEmails = senderEmails.filter(email => email !== "");
        console.log(`emails: ${validSenderEmails}`);
        return validSenderEmails;
    } catch (error) {
        console.error("Error fetching undelivered senders:", error);
        return [];
    }
};

export default {
    send,
    getConversation,
    markMessagesAsSeen,
    getUnreadCounts,
    getSendersNotDeliveredForReciever: getSendersNotDeliveredForReceiver,
};