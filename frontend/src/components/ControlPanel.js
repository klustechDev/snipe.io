import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const ControlPanel = () => {
    const [status, setStatus] = useState('Stopped');

    const fetchStatus = async () => {
        try {
            const response = await axios.get('/api/status');
            setStatus(response.data.status);
        } catch (error) {
            console.error('Error fetching status:', error);
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

    return (
        <div className="content">
            <div className="navbar">
                <Link to="/">Control Panel</Link>
                <Link to="/logs">Logs</Link>
                <Link to="/settings">Settings</Link>
            </div>
            <h2>Control Panel</h2>
            <p>Status: {status}</p>
            <button className="button" onClick={fetchStatus}>Get Status</button>
            <button className="button" onClick={handleStart}>Start Bot</button>
            <button className="button" onClick={handleStop}>Stop Bot</button>
        </div>
    );
};

export default ControlPanel;
