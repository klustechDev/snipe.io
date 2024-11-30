// frontend/src/components/InitializationLogs.js

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './InitializationLogs.css'; // Ensure you have the corresponding CSS

const InitializationLogs = () => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await axios.get('http://localhost:3001/api/init-logs');
        setLogs(response.data);
      } catch (error) {
        console.error('Error fetching initialization logs:', error);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="initialization-logs">
      <h2>Initialization Logs</h2>
      <ul>
        {logs.length > 0 ? (
          logs.map((log, index) => (
            <li key={index}>
              <span className="timestamp">{new Date(log.timestamp).toLocaleString()}:</span>
              <span className="message">{log.message}</span>
            </li>
          ))
        ) : (
          <p>No logs available yet.</p>
        )}
      </ul>
    </div>
  );
};

export default InitializationLogs;
