import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { User } from "../database";
import { ApiError, encryptPassword, isPasswordMatch } from "../utils";
import config from "../config/config";
import { IUser } from "../database";
import { AuthRequest } from "../middleware";
import { kafkaService } from "../services/KafkaService";

const jwtSecret = config.JWT_SECRET as string;
const COOKIE_EXPIRATION_DAYS = 90; // cookie expiration in days
const expirationDate = new Date(
    Date.now() + COOKIE_EXPIRATION_DAYS * 24 * 60 * 60 * 1000
);
const cookieOptions = {
    expires: expirationDate,
    secure: false,
    httpOnly: true,
};

const register = async (req: Request, res: Response) => {
    try {
        const { name, email, password } = req.body;
        const userExists = await User.findOne({ email });
        if (userExists) {
            throw new ApiError(400, "User already exists!");
        }

        const user = await User.create({
            name,
            email,
            password: await encryptPassword(password),
        });

        const userData = {
            id: user._id,
            name: user.name,
            email: user.email,
        };
        res.status(200).json({ success: true, message: "User registered successfully!", data: userData });
        return;
    } catch (error: any) {
        res.status(500).json({ message: "Internal server error" });
    }
};

const createSendToken = async (user: IUser, res: Response) => {
    const { name, email, id } = user;
    const token = jwt.sign({ name, email, id }, jwtSecret, {
        expiresIn: "1d",
    });
    if (config.env === "production") cookieOptions.secure = true;
    res.cookie("jwt", token, cookieOptions);

    return token;
};

const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email }).select("+password+id");
        if (
            !user ||
            !(await isPasswordMatch(password, user.password as string))
        ) {
            throw new ApiError(400, "Incorrect email or password");
        }

        const token = await createSendToken(user!, res);

        kafkaService.publishUserStatus("USER_LOGGED_IN", user.id, user.name, user.email);

        res.status(200).json({ success: true, message: "User logged in successfully!", data: token });
        return;
    } catch (error: any) {
        res.status(500).json({ message: "Internal server error" + error });
    }
};


const logout = async (req: Request, res: Response) => {
    try {
        const email = req.body.email;
        const user = await User.findOne({ email }).select("+id");
        if (user) {

            kafkaService.publishUserStatus("USER_LOGGED_OUT", user.id, "", "");

            res.status(200).json({ success: true, message: "User loggeout!" });
        }

        return;
    } catch (error: any) {
        res.status(500).json({ message: "Internal server error: ", error });
    }
};

const getUsers = async (req: AuthRequest, res: Response) => {
    try {
        const users = await User.find().select('name email');
        res.status(200).json(users);
    }
    catch (error: any) {
        res.status(500).json({ message: "Internal server error" });
    }
}

const getUserByEmail = async (req: AuthRequest, res: Response) => {
    try {
        const { email } = req.params;
        const user = await User.findOne({ email }).select('_id name email');
        res.status(200).json(user);
    }
    catch (error: any) {
        res.status(500).json({ message: "Internal server error: cannot find user by email" });
    }
}

export default {
    register,
    login,
    getUsers,
    getUserByEmail,
    logout,
};