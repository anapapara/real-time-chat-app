# **Real-time Chat App**

🚀 This a real-time messaging application built with **React, Node.js, WebSockets, and RabbitMQ/Kafka** for instant and seamless communication.

## **🔹 Features**
* **Real-time messaging** with WebSocket  
* **User authentication** (JWT-based)  
* **Message status indicators** (Delivered, Seen)  
* **Unread message counts**  
* **Automatic WebSocket reconnection**  
* **Scalable architecture with RabbitMQ/Kafka**  

---

## **Tech Stack**
### **Frontend (React)**
- React + Hooks
- Axios for API requests
- WebSockets for real-time communication
- CSS for styling  

### **Backend (Node.js)**
- Express.js (REST API)
- WebSocket (ws) for real-time messaging
- MongoDB (Mongoose) for data storage
- RabbitMQ/Kafka for message queuing
- JWT for authentication  

---

## **Installation & Setup**

### **Prerequisites**
- **Node.js** (v16+)
- **MongoDB** (local or Atlas)
- **RabbitMQ or Kafka** (for message queuing)
- **Redis** (for WebSocket sessions)


 ## **API Endpoints**
 
|Method	| Endpoint	             | Description             | 
|-------|-----------------------|-------------------------|
|POST  	| /api/auth/register	   | Register a new user     | 
|POST  	| /api/auth/login	      | Login and get JWT token | 
|GET	   | /api/auth/users	      | Get all users           |  
|GET	   | /api/messages/:userId | Fetch messages by user  | 
|POST	  | /api/messages/send    | Send a new message      |   

TO RUN:
start docker image for rabbitmq
start mongodb connection

## User service 
    - run on port 8081 
    - to run: <npm run dev>
    - APIs :    -/register POST {name, email, password}
                -/login POST {email, password} 
                -/users GET  

## Chat service 
    - run on port 8082 
    - to run: <npm run dev>
    - APIs :    -POST /send  {receiverId, message} + token
                -GET /get/{idUser} + token : get conversations for current user with idUser 

## Notification service 
    - run on port 8083 
    - to run: <npm run dev>

## Gateway
    - connect all microservices ports to one gateway : 8080
    - to run: < npx tsx index.ts>
    - APIs: -http://localhost:8080//api/auth/register
            -http://localhost:8080/api/auth/login
            -http://localhost:8080/api/messages/send

## Client
    - to run: npm run start
