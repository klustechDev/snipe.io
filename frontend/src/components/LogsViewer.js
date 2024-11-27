import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const LogsViewer = () => {
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
        const interval = setInterval(fetchTrades, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="content">
            <div className="navbar">
                <Link to="/">Dashboard</Link>
                <Link to="/logs">Trades</Link>
                <Link to="/settings">Settings</Link>
            </div>
            <h2>Successful Trades</h2>
            {isLoading ? (
                <p>Loading trades...</p>
            ) : (
                trades.length > 0 ? (
                    <div className="logs">
                        <ul>
                            {trades.map((trade, index) => (
                                <li key={index}>
                                    <span className="timestamp">
                                        {new Date(trade.timestamp).toLocaleString()}:
                                    </span>{' '}
                                    <span className="message">
                                        Bought {trade.amountIn} ETH worth of token {trade.token} (Tx: <a href={`https://etherscan.io/tx/${trade.txHash}`} target="_blank" rel="noopener noreferrer">{trade.txHash.substring(0, 10)}...</a>)
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

export default LogsViewer;
