// frontend/src/components/Trades.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Trades = () => {
  const [trades, setTrades] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTrades = async () => {
    try {
      const response = await axios.get('/api/trades');
      setTrades(response.data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching trades:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrades();
  }, []);

  return (
    <div className="content">
      <h2>Successful Trades</h2>
      {isLoading ? (
        <p>Loading trades...</p>
      ) : trades.length > 0 ? (
        <table className="pairs-table">
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
                  <a
                    href={`https://etherscan.io/address/${trade.token}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {trade.token.slice(0, 6)}...{trade.token.slice(-4)}
                  </a>
                </td>
                <td>{trade.amountIn} ETH</td>
                <td>
                  <a
                    href={`https://etherscan.io/tx/${trade.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {trade.txHash.slice(0, 6)}...{trade.txHash.slice(-4)}
                  </a>
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
