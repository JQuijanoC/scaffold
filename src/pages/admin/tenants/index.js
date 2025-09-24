import React from 'react';
import { Container, Typography } from '@mui/material';

export default function AdminTenantsPage() {
  return (
    <Container>
      <Typography variant="h4" sx={{ mt: 4 }}>Admin: Tenants</Typography>
      <Typography>Tenant management content goes here.</Typography>
    </Container>
  );
}