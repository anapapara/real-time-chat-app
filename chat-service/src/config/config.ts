import { config } from "dotenv";

const configFile = `./.env`;
config({ path: configFile });

const { MONGO_URI, PORT, JWT_SECRET, NODE_ENV, MESSAGE_BROKER_URL, KAFKA_BROKER_URL } =
    process.env;

const queue = { notifications: "NOTIFICATIONS", statuses: "USER_STATUS", statuses_notif: "USER_STATUS_NOTIF", 
    messages: "MESSAGES" };

export default {
    MONGO_URI,
    PORT,
    JWT_SECRET,
    env: NODE_ENV,
    msgBrokerURL: MESSAGE_BROKER_URL,
    kafkaBrokerURL: KAFKA_BROKER_URL,
    queue,
};