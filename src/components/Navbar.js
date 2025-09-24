import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, Button, IconButton, Menu, MenuItem, Box } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircle from '@mui/icons-material/AccountCircle';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';

export default function Navbar() {
  const { isAuthenticated, logout, hasCapability } = useAuth();
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [adminMenuAnchor, setAdminMenuAnchor] = useState(null);

  const handleUserMenu = (event) => setUserMenuAnchor(event.currentTarget);
  const handleUserMenuClose = () => setUserMenuAnchor(null);

  const handleAdminMenu = (event) => setAdminMenuAnchor(event.currentTarget);
  const handleAdminMenuClose = () => setAdminMenuAnchor(null);

  const showAdminMenu = isAuthenticated && (hasCapability('users:list') || hasCapability('roles:list') || hasCapability('tenants:list'));

  const handleLogout = () => {
    handleUserMenuClose();
    logout();
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          <Link href="/" passHref>
            <span style={{ cursor: 'pointer' }}>Auth App</span>
          </Link>
        </Typography>

        {showAdminMenu && (
          <Box>
            <Button
              aria-controls="admin-menu"
              aria-haspopup="true"
              onClick={handleAdminMenu}
              color="inherit"
              endIcon={<ArrowDropDownIcon />}
            >
              Admin
            </Button>
            <Menu
              id="admin-menu"
              anchorEl={adminMenuAnchor}
              open={Boolean(adminMenuAnchor)}
              onClose={handleAdminMenuClose}
            >
              {hasCapability('users:list') && <MenuItem component={Link} href="/admin/users">Users</MenuItem>}
              {hasCapability('roles:list') && <MenuItem component={Link} href="/admin/roles">Roles</MenuItem>}
              {hasCapability('tenants:list') && <MenuItem component={Link} href="/admin/tenants">Tenants</MenuItem>}
            </Menu>
          </Box>
        )}

        <Box>
          <IconButton
            aria-label="account of current user"
            aria-controls="user-menu"
            aria-haspopup="true"
            onClick={handleUserMenu}
            color="inherit"
          >
            <PersonIcon />
          </IconButton>
          <Menu
            id="user-menu"
            anchorEl={userMenuAnchor}
            open={Boolean(userMenuAnchor)}
            onClose={handleUserMenuClose}
          >
            {isAuthenticated ? (
              [
                <MenuItem key="profile" component={Link} href="/profile">
                  <AccountCircle sx={{ mr: 1 }} /> Profile
                </MenuItem>,
                <MenuItem key="logout" onClick={handleLogout}>
                  <LogoutIcon sx={{ mr: 1 }} /> Logout
                </MenuItem>
              ]
            ) : (
              <MenuItem component={Link} href="/login">
                <LoginIcon sx={{ mr: 1 }} /> Login
              </MenuItem>
            )}
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}