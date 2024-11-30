// frontend/src/components/DetectedPairs.js

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './DetectedPairs.css'; // Ensure you have the corresponding CSS

const DetectedPairs = () => {
  const [pairs, setPairs] = useState([]);

  const fetchPairs = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/detected-pairs');
      setPairs(response.data);
    } catch (error) {
      console.error('Error fetching detected pairs:', error);
    }
  };

  useEffect(() => {
    fetchPairs();
    const interval = setInterval(fetchPairs, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="detected-pairs">
      <div className="navbar">
        <Link to="/">Dashboard</Link>
        <Link to="/trades">Trades</Link>
        <Link to="/settings">Settings</Link>
      </div>
      <h2>Detected Pairs</h2>
      {pairs.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Token Address</th>
              <th>Pair Address</th>
              <th>Liquidity (ETH)</th>
            </tr>
          </thead>
          <tbody>
            {pairs.map((pair, index) => (
              <tr key={index}>
                <td>{new Date(pair.timestamp).toLocaleString()}</td>
                <td>
                  <a
                    href={`https://etherscan.io/address/${pair.tokenAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {pair.tokenAddress.substring(0, 10)}...
                  </a>
                </td>
                <td>
                  <a
                    href={`https://etherscan.io/address/${pair.pairAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {pair.pairAddress.substring(0, 10)}...
                  </a>
                </td>
                <td>{pair.liquidity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No pairs detected yet.</p>
      )}
    </div>
  );
};

export default DetectedPairs;
