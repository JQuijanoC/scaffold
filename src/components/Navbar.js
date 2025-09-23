"use client";

import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, Button, IconButton, Menu, MenuItem } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircle from '@mui/icons-material/AccountCircle';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';

export default function Navbar() {
  const { isAuthenticated, user, logout, hasCapability } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            App
          </Link>
        </Typography>

        {isAuthenticated && (
          <div>
            {/* Admin Menu */}
            {(hasCapability('users:list') || hasCapability('roles:list') || hasCapability('tenants:list')) && (
                <Button color="inherit">Admin</Button>
            )}
          </div>
        )}

        <div>
          <IconButton
            size="large"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenu}
            color="inherit"
          >
            <PersonIcon />
          </IconButton>
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            {isAuthenticated ? (
              [
                <MenuItem key="profile" onClick={handleClose}>
                  <AccountCircle sx={{ mr: 1 }} /> Profile
                </MenuItem>,
                <MenuItem key="logout" onClick={() => {
                  handleClose();
                  logout();
                }}>
                  <LogoutIcon sx={{ mr: 1 }} /> Logout
                </MenuItem>
              ]
            ) : (
              <MenuItem onClick={() => {
                handleClose();
                // We will navigate to the login page
              }}>
                <Link href="/login" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}>
                  <LoginIcon sx={{ mr: 1 }} /> Login
                </Link>
              </MenuItem>
            )}
          </Menu>
        </div>
      </Toolbar>
    </AppBar>
  );
}
