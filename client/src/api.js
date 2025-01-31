import axios from 'axios';

const API_URL = 'http://localhost:8080';

export const register = (userData) => axios.post(`${API_URL}/api/auth/register`, userData);

export const login = (userData) => axios.post(`${API_URL}/api/auth/login`, userData, { headers: { 'Content-Type': 'application/json' }});

export const logout = (userData, token) => {
  axios.post(`${API_URL}/api/auth/logout`, userData, 
    { headers: { Authorization: `Bearer ${token}` }});
  }

export const sendMessage = (messageData, token) => {
  axios.post(`${API_URL}/api/messages/send`, messageData, {
    headers: { Authorization: `Bearer ${token}` },
  });}

export const getMessage = (receiverId, token) => {
  axios.get(`http://localhost:8080/api/messages/get/${receiverId}`, {
    headers: { Authorization: `Bearer ${token}` },
  }
);}
