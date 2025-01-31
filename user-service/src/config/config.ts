import { config } from "dotenv";

const configFile = `./.env`;
config({ path: configFile });

const { MONGO_URI, PORT, JWT_SECRET, NODE_ENV, MESSAGE_BROKER_URL, KAFKA_BROKER_URL } =
    process.env;

const queue = {statuses:"USER_STATUS"}

export default {
    MONGO_URI,
    PORT,
    JWT_SECRET,
    env: NODE_ENV,
    msgBrokerURL: MESSAGE_BROKER_URL,
    kafkaBRokerURL: KAFKA_BROKER_URL,
    queue
};