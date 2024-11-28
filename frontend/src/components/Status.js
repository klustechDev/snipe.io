// frontend/src/components/Status.js

import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Status = () => {
  const [status, setStatus] = useState('Unknown');

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await axios.get('http://localhost:3001/api/status');
        setStatus(response.data.status);
      } catch (error) {
        console.error('Error fetching status:', error);
      }
    };
    fetchStatus();
  }, []);

  return (
    <div className="status">
      <h3>Status: {status}</h3>
    </div>
  );
};

export default Status;
