// src/components/Navbar.js

import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

const Navbar = () => {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div">
          Snipe.io Dashboard
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Button color="inherit" component={RouterLink} to="/">
          Dashboard
        </Button>
        <Button color="inherit" component={RouterLink} to="/logs">
          Logs
        </Button>
        <Button color="inherit" component={RouterLink} to="/settings">
          Settings
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
