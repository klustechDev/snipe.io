import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const Settings = () => {
    const [settings, setSettings] = useState({
        ETH_AMOUNT_TO_SWAP: '0.05',
        SLIPPAGE_TOLERANCE: 5,
        GAS_PRICE_MULTIPLIER: 1.2,
        PROFIT_THRESHOLD: 10,
        DEADLINE_BUFFER: 60,
        MINIMUM_LOCKED_ETH: '500',
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await axios.get('/api/settings');
                setSettings(response.data);
            } catch (error) {
                console.error('Error fetching settings:', error);
            }
        };
        fetchSettings();
    }, []);

    const handleChange = (e) => {
        setSettings({
            ...settings,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/settings', settings);
            alert('Settings updated successfully.');
        } catch (error) {
            console.error('Error updating settings:', error);
        }
    };

    return (
        <div className="content">
            <div className="navbar">
                <Link to="/">Dashboard</Link>
                <Link to="/logs">Trades</Link>
                <Link to="/settings">Settings</Link>
            </div>
            <h2>Bot Settings</h2>
            <form onSubmit={handleSubmit}>
                <label className="label">
                    ETH Amount to Swap:
                    <input
                        className="input"
                        type="text"
                        name="ETH_AMOUNT_TO_SWAP"
                        value={settings.ETH_AMOUNT_TO_SWAP}
                        onChange={handleChange}
                    />
                </label>
                <label className="label">
                    Slippage Tolerance (%):
                    <input
                        className="input"
                        type="number"
                        name="SLIPPAGE_TOLERANCE"
                        value={settings.SLIPPAGE_TOLERANCE}
                        onChange={handleChange}
                    />
                </label>
                <label className="label">
                    Gas Price Multiplier:
                    <input
                        className="input"
                        type="number"
                        step="0.1"
                        name="GAS_PRICE_MULTIPLIER"
                        value={settings.GAS_PRICE_MULTIPLIER}
                        onChange={handleChange}
                    />
                </label>
                <label className="label">
                    Profit Threshold (%):
                    <input
                        className="input"
                        type="number"
                        name="PROFIT_THRESHOLD"
                        value={settings.PROFIT_THRESHOLD}
                        onChange={handleChange}
                    />
                </label>
                <label className="label">
                    Deadline Buffer (seconds):
                    <input
                        className="input"
                        type="number"
                        name="DEADLINE_BUFFER"
                        value={settings.DEADLINE_BUFFER}
                        onChange={handleChange}
                    />
                </label>
                <label className="label">
                    Minimum Locked ETH in Pool:
                    <input
                        className="input"
                        type="text"
                        name="MINIMUM_LOCKED_ETH"
                        value={settings.MINIMUM_LOCKED_ETH}
                        onChange={handleChange}
                    />
                </label>
                <button className="button" type="submit">
                    Update Settings
                </button>
            </form>
        </div>
    );
};

export default Settings;
