// frontend/src/components/LogsViewer.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './LogsViewer.css'; // Ensure this CSS file is in place

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
    const interval = setInterval(fetchLogs, 5000); // Refresh logs every 5 seconds
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
      ) : logs.length > 0 ? (
        <div className="logs-table-container">
          <div className="logs-table">
            <div className="logs-table-header">
              <div className="logs-header-cell">Timestamp</div>
              <div className="logs-header-cell">Level</div>
              <div className="logs-header-cell">Message</div>
            </div>
            {logs.map((log, index) => (
              <div key={index} className={`logs-table-row logs-${log.level.toLowerCase()}`}>
                <div className="logs-cell">{new Date(log.timestamp).toLocaleString()}</div>
                <div className="logs-cell">{log.level.toUpperCase()}</div>
                <div className="logs-cell">
                  {log.message.includes('0x') || log.message.includes('ETH')
                    ? <pre>{log.message}</pre> // Preserve formatting for long addresses and WETH amounts
                    : log.message}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p>No logs available yet.</p>
      )}
    </div>
  );
};

export default LogsViewer;
