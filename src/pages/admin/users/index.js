import React from 'react';
import { Container, Typography } from '@mui/material';

export default function AdminUsersPage() {
  return (
    <Container>
      <Typography variant="h4" sx={{ mt: 4 }}>Admin: Users</Typography>
      <Typography>User management content goes here.</Typography>
    </Container>
  );
}