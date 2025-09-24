import React from 'react';
import { Container, Typography } from '@mui/material';
import { useAuth } from '../../context/AuthContext';

export default function ProfilePage() {
  const { user } = useAuth();
  return (
    <Container>
      <Typography variant="h4" sx={{ mt: 4 }}>User Profile</Typography>
      <Typography>Email: {user?.email}</Typography>
    </Container>
  );
}