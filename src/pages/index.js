import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import { useAuth } from '../context/AuthContext';

export default function HomePage() {
  const { isAuthenticated, user } = useAuth();

  return (
    <Container>
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome to the Application
        </Typography>
        {isAuthenticated ? (
          <Typography variant="body1">
            You are logged in as {user?.email}.
          </Typography>
        ) : (
          <Typography variant="body1">
            Please log in to continue.
          </Typography>
        )}
      </Box>
    </Container>
  );
}