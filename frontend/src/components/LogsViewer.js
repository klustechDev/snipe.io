// frontend/src/components/LogsViewer.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './LogsViewer.css'; // Ensure you have the corresponding CSS

const LogsViewer = () => {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const response = await axios.get('/api/logs');
      setLogs(response.data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching logs:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="logs-viewer">
      <div className="navbar">
        <Link to="/">Dashboard</Link>
        <Link to="/trades">Trades</Link>
        <Link to="/settings">Settings</Link>
        <Link to="/logs">Logs</Link>
      </div>
      <h2>General Logs</h2>
      {isLoading ? (
        <p>Loading logs...</p>
      ) : (
        logs.length > 0 ? (
          <div className="logs">
            <ul>
              {logs.map((log, index) => (
                <li key={index}>
                  <span className="timestamp">
                    {new Date(log.timestamp).toLocaleString()}:
                  </span>{' '}
                  <span className="message">{log.message}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p>No logs available yet.</p>
        )
      )}
    </div>
  );
};

export default LogsViewer;
