import { ReactNode } from 'react';
import { Box, CircularProgress, Alert, Container } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { Login } from './Login';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          bgcolor: '#f5f5f5',
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (!profile) {
    return <Login />;
  }

  if (profile.role !== 'official' && profile.role !== 'admin') {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          bgcolor: '#f5f5f5',
        }}
      >
        <Container maxWidth="sm">
          <Alert severity="error">
            Access denied. This dashboard is for authorized officials only.
          </Alert>
        </Container>
      </Box>
    );
  }

  return <>{children}</>;
}