import React, { useState } from "react";
import axios from "axios";

const ControlPanel = () => {
  const [status, setStatus] = useState(null);

  const fetchStatus = async () => {
    try {
      const response = await axios.get("/api/status");
      setStatus(response.data.status);
    } catch (error) {
      console.error("Error fetching status:", error);
    }
  };

  const handleStart = async () => {
    try {
      const response = await axios.post("/api/start");
      alert(response.data.message);
      fetchStatus();
    } catch (error) {
      console.error("Error starting bot:", error);
    }
  };

  const handleStop = async () => {
    try {
      const response = await axios.post("/api/stop");
      alert(response.data.message);
      fetchStatus();
    } catch (error) {
      console.error("Error stopping bot:", error);
    }
  };

  return (
    <div>
      <h1>Control Panel</h1>
      <button onClick={fetchStatus}>Get Status</button>
      <button onClick={handleStart}>Start Bot</button>
      <button onClick={handleStop}>Stop Bot</button>
      {status && <p>Status: {status}</p>}
    </div>
  );
};

export default ControlPanel;
