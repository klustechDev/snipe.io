// frontend/src/components/Trades.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './Trades.css'; // Ensure you have the corresponding CSS

const Trades = () => {
  const [trades, setTrades] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTrades = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/trades');
      setTrades(response.data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching trades:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrades();
    const interval = setInterval(fetchTrades, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="trades-viewer">
      <div className="navbar">
        <Link to="/">Dashboard</Link>
        <Link to="/trades">Trades</Link>
        <Link to="/settings">Settings</Link>
      </div>
      <h2>Successful Trades</h2>
      {isLoading ? (
        <p>Loading trades...</p>
      ) : (
        trades.length > 0 ? (
          <div className="trades">
            <ul>
              {trades.map((trade) => (
                <li key={trade.id}>
                  <span className="timestamp">
                    {new Date(trade.timestamp).toLocaleString()}:
                  </span>{' '}
                  <span className="message">
                    {trade.type === 'buy' ? 'Bought' : 'Sold'} {trade.amountIn} ETH{' '}
                    {trade.type === 'buy' ? 'worth of token' : 'of token'}{' '}
                    <a
                      href={`https://etherscan.io/address/${trade.tokenAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {trade.tokenAddress.substring(0, 10)}...
                    </a>{' '}
                    (Tx: <a href={`https://etherscan.io/tx/${trade.txHash}`} target="_blank" rel="noopener noreferrer">{trade.txHash.substring(0, 10)}...</a>)
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p>No trades executed yet.</p>
        )
      )}
    </div>
  );
};

export default Trades;
