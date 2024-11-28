// frontend/src/components/Navbar.js

import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css'; // Ensure you have the corresponding CSS

const Navbar = () => {
  return (
    <div className="navbar">
      <Link to="/">Dashboard</Link>
      <Link to="/trades">Trades</Link>
      <Link to="/settings">Settings</Link>
    </div>
  );
};

export default Navbar;
