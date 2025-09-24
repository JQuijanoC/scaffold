import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';
import { Container, Typography, Button, Box, CircularProgress } from '@mui/material';

const HomePage = () => {
  const { user, logout, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container>
      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          Welcome, {user.email}!
        </Typography>
        <Typography variant="body1">
          Your Tenant ID is: {user.tenantId || 'N/A'}
        </Typography>
        <Button
          variant="contained"
          onClick={logout}
          sx={{ mt: 4 }}
        >
          Logout
        </Button>
      </Box>
    </Container>
  );
};

export default HomePage;