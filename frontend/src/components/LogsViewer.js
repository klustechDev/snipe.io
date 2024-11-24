// frontend/src/components/LogsViewer.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';

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
      <h2>Activity Logs</h2>
      {isLoading ? (
        <p>Loading logs...</p>
      ) : (
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
      )}
    </div>
  );
};

export default LogsViewer;
