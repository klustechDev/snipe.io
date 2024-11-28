// frontend/src/components/Trades.js

import { Link } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Trades.css'; // Ensure you have the corresponding CSS

const Trades = () => {
  const [trades, setTrades] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTrades = async () => {
    try {
      const response = await axios.get('/api/successful-trades');
      const data = response.data;

      if (Array.isArray(data)) {
        setTrades(data);
      } else {
        console.error('Invalid trades data format:', data);
        setTrades([]);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching trades:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrades();
    const interval = setInterval(fetchTrades, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval); // Clean up interval on unmount
  }, []);

  return (
    <div className="trades">
      <div className="navbar">
        <Link to="/">Dashboard</Link>
        <Link to="/trades">Trades</Link>
        <Link to="/settings">Settings</Link>
      </div>
      <h2>Successful Trades</h2>
      {isLoading ? (
        <p>Loading trades...</p>
      ) : trades.length > 0 ? (
        <table className="trades-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Token Address</th>
              <th>Amount In (ETH)</th>
              <th>Transaction Hash</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((trade, index) => (
              <tr key={index}>
                <td>{new Date(trade.timestamp).toLocaleString()}</td>
                <td>
                  {trade.token !== 'N/A' ? (
                    <a
                      href={`https://etherscan.io/address/${trade.token}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {trade.token.slice(0, 6)}...{trade.token.slice(-4)}
                    </a>
                  ) : (
                    'N/A'
                  )}
                </td>
                <td>{trade.amountIn} ETH</td>
                <td>
                  {trade.txHash !== 'N/A' ? (
                    <a
                      href={`https://etherscan.io/tx/${trade.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {trade.txHash.slice(0, 6)}...{trade.txHash.slice(-4)}
                    </a>
                  ) : (
                    'N/A'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No trades found.</p>
      )}
    </div>
  );
};

export default Trades;
