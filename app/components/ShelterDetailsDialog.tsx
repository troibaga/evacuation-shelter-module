import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Typography,
  Chip,
  Divider,
  Box,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  LocationOn as LocationIcon,
  People as PeopleIcon,
  Info as InfoIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';
import { Shelter } from './ShelterManagement';

interface ShelterDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  shelter: Shelter | null;
}

export function ShelterDetailsDialog({ open, onClose, shelter }: ShelterDetailsDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  if (!shelter) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available':
        return 'success';
      case 'Near Full':
        return 'warning';
      case 'Full':
        return 'error';
      default:
        return 'default';
    }
  };

  const occupancyPercentage = ((shelter.currentOccupancy / shelter.capacity) * 100).toFixed(1);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={fullScreen}
    >
      <DialogTitle sx={{ bgcolor: '#f5f5f5' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" component="div">
            Shelter Details
          </Typography>
          <Chip
            label={shelter.status}
            color={getStatusColor(shelter.status) as any}
            size="small"
          />
        </Box>
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        <Grid container spacing={3}>
          <Grid size={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <InfoIcon color="primary" />
              <Typography variant="overline" color="text.secondary">
                Basic Information
              </Typography>
            </Box>
            <Typography variant="h6" gutterBottom>
              {shelter.shelterName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Shelter ID: {shelter.shelterID}
            </Typography>
          </Grid>

          <Grid size={12}>
            <Divider />
          </Grid>

          <Grid size={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <LocationIcon color="primary" />
              <Typography variant="overline" color="text.secondary">
                Location
              </Typography>
            </Box>
            <Typography variant="body1">
              Latitude: {shelter.latitude.toFixed(6)}
            </Typography>
            <Typography variant="body1">
              Longitude: {shelter.longitude.toFixed(6)}
            </Typography>
          </Grid>

          <Grid size={12}>
            <Divider />
          </Grid>

          <Grid size={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <PeopleIcon color="primary" />
              <Typography variant="overline" color="text.secondary">
                Capacity Information
              </Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid size={6}>
                <Typography variant="body2" color="text.secondary">
                  Total Capacity
                </Typography>
                <Typography variant="h6">
                  {shelter.capacity}
                </Typography>
              </Grid>
              <Grid size={6}>
                <Typography variant="body2" color="text.secondary">
                  Current Occupancy
                </Typography>
                <Typography variant="h6">
                  {shelter.currentOccupancy}
                </Typography>
              </Grid>
              <Grid size={12}>
                <Typography variant="body2" color="text.secondary">
                  Occupancy Rate
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      flex: 1,
                      height: 20,
                      bgcolor: '#e0e0e0',
                      borderRadius: 1,
                      overflow: 'hidden',
                    }}
                  >
                    <Box
                      sx={{
                        height: '100%',
                        width: `${occupancyPercentage}%`,
                        bgcolor:
                          shelter.status === 'Full'
                            ? '#f44336'
                            : shelter.status === 'Near Full'
                            ? '#ff9800'
                            : '#4caf50',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {occupancyPercentage}%
                  </Typography>
                </Box>
              </Grid>
              <Grid size={12}>
                <Typography variant="body2" color="text.secondary">
                  Available Capacity
                </Typography>
                <Typography variant="h6" color={shelter.capacity - shelter.currentOccupancy > 0 ? 'success.main' : 'error.main'}>
                  {shelter.capacity - shelter.currentOccupancy} spaces
                </Typography>
              </Grid>
            </Grid>
          </Grid>

          <Grid size={12}>
            <Divider />
          </Grid>

          <Grid size={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <TimeIcon color="primary" />
              <Typography variant="overline" color="text.secondary">
                Last Updated
              </Typography>
            </Box>
            <Typography variant="body2">
              {new Date(shelter.lastUpdatedTimestamp).toLocaleString()}
            </Typography>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
