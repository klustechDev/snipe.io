import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Dashboard from './components/Dashboard';
import LogsViewer from './components/LogsViewer';
import Settings from './components/Settings';

function App() {
    return (
        <Router>
            <div className="App">
                <header className="App-header">
                    <h1>Snipe.io Dashboard</h1>
                </header>
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/logs" element={<LogsViewer />} />
                    <Route path="/settings" element={<Settings />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
