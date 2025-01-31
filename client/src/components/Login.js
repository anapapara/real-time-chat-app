import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await login({ email, password });

      sessionStorage.setItem('token', response.data.data);
      sessionStorage.setItem('userEmail', email);
      
      navigate('/chat', { replace: true });

    } catch (error) {
      alert('Login failed. Please check your credentials.');
      console.log(error)
    }
  };

  

  // const initializeOneSignal = (userId) => {
  //   console.log("initializing one signal...")

  //   if (!window.OneSignal) {
  //     console.error("OneSignal SDK is not loaded!");
  //     return;
  //   }

  //     window.OneSignal = window.OneSignal || []

  //     window.OneSignal.push(function () {
  //       console.log("Inside OneSignal.push for initialization...");
  //       window.OneSignal.init({
  //         appId: "d82e1cab-f457-4b05-9f65-ee8802d9e485",
  //         notifyButton: { enable: true },
  //       });
  //       console.log("OneSignal initialized");
  //     });
  // };

  // useEffect(() => {
  //   const script = document.createElement("script");
  //   script.src = "https://cdn.onesignal.com/sdks/OneSignalSDK.js";
  //   script.async = true;
  //   script.onload = () => {
  //     console.log("OneSignal SDK script loaded.");
  //     // initializeOneSignal();
  //   };
  //   script.onerror = () => { console.error("Failed to load OneSignal SDK script."); };
  //   document.body.appendChild(script);
  // }, []); // Run only once when the component mounts


  return (

    <div>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
      </form>
    </div>

  );
}

export default Login;