import { Router } from "express";
import AuthController from "../controllers/AuthControler"
import { authMiddleware } from "../middleware";


const userRouter = Router();

userRouter.post("/register", AuthController.register);
userRouter.post("/login", AuthController.login);
userRouter.get("/users", 
    // @ts-ignore
    authMiddleware, AuthController.getUsers);
    

userRouter.get("/user/:email", 
    // @ts-ignore
    authMiddleware, AuthController.getUserByEmail);

userRouter.post("/logout", 
        // @ts-ignore
        authMiddleware, AuthController.logout);

export default userRouter;