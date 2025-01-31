import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "../css/chat-style.css"; // Add your CSS styles here
import { useNavigate } from "react-router-dom";
const API_URL = 'http://localhost:8080';


const Chat = () => {
  const [users, setUsers] = useState([]); // All users
  const [selectedUser, setSelectedUser] = useState(null); // Active conversation
  const [messages, setMessages] = useState([]); // Current conversation
  const [message, setMessage] = useState(""); // Input for new message
  const [unreadCounts, setUnreadCounts] = useState({}); // Unread message counts

  const navigate = useNavigate()

  const token = sessionStorage.getItem('token');
  const loggedEmail = sessionStorage.getItem('userEmail');
  const selectedUserRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get("http://localhost:8080/api/auth/users", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const filteredUsers = response.data.filter(
          (user) => user.email !== loggedEmail);
        setUsers(filteredUsers);

        const unreadResponse = await axios.get("http://localhost:8080/api/messages/unreadCounts", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (unreadResponse.status === 200) {
          setUnreadCounts(unreadResponse.data.data);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
    connectToWebSocket(loggedEmail);
  }, [token]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const connectToWebSocket = (loggedEmail) => {
    const socket = new WebSocket("ws://localhost:8080");

    socket.onopen = () => {
      console.log("WebSocket connected");
      socket.send(JSON.stringify({ type: "REGISTER", userId: loggedEmail })); // Send userId for identification
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("data:", event.data)
      if (data.type === "NOTIFY") { //NEW_MESSAGE
        const new_msg = {
          senderId: data.senderId,
          receiverId: data.userId,
          message: data.message,
        };
        setMessages((prevMessages) => [...prevMessages, new_msg]);
        setTimeout(() => {
          alert(`New message from ${data.senderName}`);
        }, 100);

        //notify the sender that the message is seen
        //or simpler, mark it as seen in chat service so from there it starts the notifications
        axios.post(
          "http://localhost:8080/api/messages/markAsSeen",
          { senderId: data.senderId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      else if (data.type === "SEEN_MESSAGES") {
        if (data.receiverId && selectedUserRef && data.receiverId === selectedUserRef.current) {
          fetchMessages(selectedUserRef.current);
        }
      }
      else if (data.type === "DELIVERED_MESSAGES") {
        console.log(`current user ref: ${selectedUserRef.current}`);
        if (data.receiverId && selectedUserRef && data.receiverId === selectedUserRef.current) {
          fetchMessages(selectedUserRef.current);
        }
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    socket.onclose = () => {
      console.log("WebSocket disconnected");
      setTimeout(() => {
        // socket = new WebSocket("ws://localhost:8080");
        connectToWebSocket(loggedEmail);
      }, 3000);
    };
  }

  const fetchMessages = async (userId) => {
    selectedUserRef.current = userId;
    try {
      const response = await axios.get(`http://localhost:8080/api/messages/get/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      }
      );

      setMessages(response.data.data);

      if (unreadCounts[userId] > 0) {
        await axios.post(
          "http://localhost:8080/api/messages/markAsSeen",
          { senderId: userId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      setUnreadCounts((prev) => ({ ...prev, [userId]: 0 })); // Clear unread count

    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const handleLogout = async () => {

    sessionStorage.removeItem("token");
    sessionStorage.removeItem("userEmail");
    await axios.post(`${API_URL}/api/auth/logout`, { email: loggedEmail },
      { headers: { Authorization: `Bearer ${token}` } });

    navigate("/");
  };


  const handleSend = async () => {
    if (!message.trim()) return;

    try {
      const response = await axios.post(
        "http://localhost:8080/api/messages/send",
        { receiverId: selectedUser._id, message },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const msg = response.data.data;

      const formattedMessage = {
        senderId: msg.senderId,
        receiverId: msg.receiverId,
        message: msg.message,
        status: msg.status
      };
      setMessages((prev) => [...prev, formattedMessage]);
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className="chat-container">
      {/* User List */}
      <div className="user-list">
        <h3>Users</h3>
        {users.map((user) => (
          <div
            key={user._id}
            className={`user-item ${selectedUser?._id === user._id ? "active" : ""}`}
            onClick={() => {
              setSelectedUser(user);
              fetchMessages(user._id);
            }}
          >
            {user.name}
            {unreadCounts[user._id] > 0 && (
              <span className="unread-count">{unreadCounts[user._id]}</span>
            )}
          </div>
        ))}


        {/* Logout Button */}
        <div className="logout-container">
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </div>

      {/* Chat Window */}
      <div className="chat-window">
        {selectedUser ? (
          <>
            <div className="chat-header">
              <h3>Chat with {selectedUser.name}</h3>
            </div>
            <div className="chat-messages">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`message-item ${msg.senderId === selectedUser._id ? "received" : "sent"
                    }`}
                >
                  <p>{msg.message}</p>
                  {msg.senderId !== selectedUser._id && (
                    <span className="message-status">
                      {msg.status === "NotDelivered" && "❌"}
                      {msg.status === "Delivered" && "✅"}
                      {msg.status === "Seen" && "👀"}
                    </span>
                  )}
                </div>
              ))}
              { }
              <div ref={messagesEndRef} />
            </div>
            {/* Compose Message */}
            <div className="compose-message">
              <input
                type="text"
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <button onClick={handleSend}>Send</button>
            </div>
          </>
        ) : (
          <div className="no-selection">
            <h3>Select a user to start chatting</h3>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;