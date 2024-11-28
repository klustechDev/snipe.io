// frontend/src/components/DetectedPairs.js

import React, { useEffect, useState } from 'react';
import axios from 'axios';

const DetectedPairs = () => {
  const [pairs, setPairs] = useState([]);

  useEffect(() => {
    const fetchPairs = async () => {
      try {
        const response = await axios.get('http://localhost:3001/api/detected-pairs');
        setPairs(response.data);
      } catch (error) {
        console.error('Error fetching detected pairs:', error);
      }
    };
    fetchPairs();
  }, []);

  return (
    <div className="detected-pairs">
      <h3>Detected Pairs</h3>
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
              <td>{pair.tokenAddress}</td>
              <td>{pair.pairAddress}</td>
              <td>{pair.liquidity}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DetectedPairs;
