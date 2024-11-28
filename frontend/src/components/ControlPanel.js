// frontend/src/components/ControlPanel.js

import React from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const ControlPanel = () => {
  const handleStart = async () => {
    try {
      const response = await axios.post('/api/start');
      alert(response.data.status);
    } catch (error) {
      console.error('Error starting bot:', error);
    }
  };

  const handleStop = async () => {
    try {
      const response = await axios.post('/api/stop');
      alert(response.data.status);
    } catch (error) {
      console.error('Error stopping bot:', error);
    }
  };

  return (
    <div className="control-panel">
      <div className="navbar">
        <Link to="/">Control Panel</Link>
        <Link to="/logs">Logs</Link>
        <Link to="/settings">Settings</Link>
      </div>
      <h2>Control Panel</h2>
      <button className="button" onClick={handleStart}>Start Bot</button>
      <button className="button" onClick={handleStop}>Stop Bot</button>
    </div>
  );
};

export default ControlPanel;
