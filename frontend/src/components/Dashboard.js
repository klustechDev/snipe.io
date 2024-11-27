// frontend/src/components/Dashboard.js

import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const [status, setStatus] = useState("Stopped");
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const response = await axios.get("/api/status");
      setStatus(response.data.status);
    } catch (error) {
      console.error("Error fetching status:", error);
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await axios.get("/api/logs");
      const data = response.data;

      // Ensure logs are valid
      if (Array.isArray(data)) {
        setLogs(data);
      } else {
        console.error("Invalid log data format received:", data);
        setLogs([]);
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching logs:", error);
      setIsLoading(false);
    }
  };

  const handleStart = async () => {
    try {
      const response = await axios.post("/api/start");
      alert(response.data.status);
      fetchStatus();
    } catch (error) {
      console.error("Error starting bot:", error);
    }
  };

  const handleStop = async () => {
    try {
      const response = await axios.post("/api/stop");
      alert(response.data.status);
      fetchStatus();
    } catch (error) {
      console.error("Error stopping bot:", error);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000); // Refresh logs every 5 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="content">
      <div className="navbar">
        <Link to="/">Dashboard</Link>
        <Link to="/logs">Trades</Link>
        <Link to="/settings">Settings</Link>
      </div>
      <h2>Dashboard</h2>
      <div className="status">
        <p>Status: {status}</p>
        <button className="button" onClick={fetchStatus}>
          Refresh Status
        </button>
        <button className="button" onClick={handleStart}>
          Start Bot
        </button>
        <button className="button" onClick={handleStop}>
          Stop Bot
        </button>
      </div>
      <div className="detected-pairs">
        <h3>Detected Pairs</h3>
        {isLoading ? (
          <p>Loading detected pairs...</p>
        ) : logs.length > 0 ? (
          <table className="pairs-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Token Address</th>
                <th>Pair Address</th>
                <th>Liquidity (ETH)</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, index) => (
                <tr key={index}>
                  <td>{new Date(log.timestamp).toLocaleString()}</td>
                  <td>
                    {log.tokenAddress ? (
                      <a
                        href={`https://etherscan.io/address/${log.tokenAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {log.tokenAddress.slice(0, 6)}...{log.tokenAddress.slice(-4)}
                      </a>
                    ) : (
                      "N/A"
                    )}
                  </td>
                  <td>
                    {log.pairAddress ? (
                      <a
                        href={`https://etherscan.io/address/${log.pairAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {log.pairAddress.slice(0, 6)}...{log.pairAddress.slice(-4)}
                      </a>
                    ) : (
                      "N/A"
                    )}
                  </td>
                  <td>{log.liquidity ? `${log.liquidity} ETH` : "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No detected pairs yet.</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
