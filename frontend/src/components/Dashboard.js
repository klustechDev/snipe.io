// frontend/src/components/Dashboard.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './Dashboard.css'; // Ensure you have the corresponding CSS

const Dashboard = () => {
  const [status, setStatus] = useState('Stopped');
  const [detectedPairs, setDetectedPairs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const response = await axios.get('/api/status');
      setStatus(response.data.status);
    } catch (error) {
      console.error('Error fetching status:', error);
    }
  };

  const fetchDetectedPairs = async () => {
    try {
      const response = await axios.get('/api/detected-pairs');
      const data = response.data;

      if (Array.isArray(data)) {
        setDetectedPairs(data);
      } else {
        console.error('Invalid detected pairs data format:', data);
        setDetectedPairs([]);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching detected pairs:', error);
      setIsLoading(false);
    }
  };

  const handleStart = async () => {
    try {
      const response = await axios.post('/api/start');
      alert(response.data.status);
      fetchStatus();
    } catch (error) {
      console.error('Error starting bot:', error);
    }
  };

  const handleStop = async () => {
    try {
      const response = await axios.post('/api/stop');
      alert(response.data.status);
      fetchStatus();
    } catch (error) {
      console.error('Error stopping bot:', error);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchDetectedPairs();
    const interval = setInterval(fetchDetectedPairs, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval); // Clean up interval on unmount
  }, []);

  return (
    <div className="dashboard">
      <div className="navbar">
        <Link to="/">Dashboard</Link>
        <Link to="/trades">Trades</Link>
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
        ) : detectedPairs.length > 0 ? (
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
              {detectedPairs.map((pair, index) => (
                <tr key={index}>
                  <td>{new Date(pair.timestamp).toLocaleString()}</td>
                  <td>
                    {pair.tokenAddress !== 'N/A' ? (
                      <a
                        href={`https://etherscan.io/address/${pair.tokenAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {pair.tokenAddress.slice(0, 6)}...{pair.tokenAddress.slice(-4)}
                      </a>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td>
                    {pair.pairAddress !== 'N/A' ? (
                      <a
                        href={`https://etherscan.io/address/${pair.pairAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {pair.pairAddress.slice(0, 6)}...{pair.pairAddress.slice(-4)}
                      </a>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td>
                    {pair.liquidity !== 'N/A' ? `${pair.liquidity} ETH` : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No detected pairs found.</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
