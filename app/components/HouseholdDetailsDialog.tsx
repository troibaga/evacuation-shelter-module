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
  Home as HomeIcon,
} from '@mui/icons-material';
import { Household } from './HouseholdManagement';

interface HouseholdDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  household: Household | null;
}

export function HouseholdDetailsDialog({ open, onClose, household }: HouseholdDetailsDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  if (!household) return null;

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
            Household Details
          </Typography>
          {household.isEvacuationShelter ? (
            <Chip label="Household Shelter" color="success" size="small" />
          ) : household.evacuationShelterName ? (
            <Chip label="Evacuated" color="primary" size="small" />
          ) : (
            <Chip label="Not Evacuated" color="default" size="small" />
          )}
        </Box>
      </DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        <Grid container spacing={3}>
          <Grid size={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <InfoIcon color="primary" />
              <Typography variant="overline" color="text.secondary">
                Head of Household
              </Typography>
            </Box>
            <Typography variant="h6" gutterBottom>
              {household.lastName}, {household.firstName} {household.middleName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Household ID: {household.householdID}
            </Typography>
          </Grid>

          <Grid size={12}>
            <Divider />
          </Grid>

          <Grid size={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <LocationIcon color="primary" />
              <Typography variant="overline" color="text.secondary">
                Address
              </Typography>
            </Box>
            <Typography variant="body1">
              {household.address}
            </Typography>
          </Grid>

          <Grid size={12}>
            <Divider />
          </Grid>

          <Grid size={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <PeopleIcon color="primary" />
              <Typography variant="overline" color="text.secondary">
                Family Members
              </Typography>
            </Box>
            <Typography variant="h5" color="primary">
              {household.numMembers} {household.numMembers === 1 ? 'person' : 'people'}
            </Typography>
          </Grid>

          <Grid size={12}>
            <Divider />
          </Grid>

          <Grid size={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <HomeIcon color="primary" />
              <Typography variant="overline" color="text.secondary">
                {household.isEvacuationShelter ? 'Shelter Occupancy' : 'Evacuation Shelter'}
              </Typography>
            </Box>
            {household.isEvacuationShelter ? (
              <>
                <Typography variant="h5" color="primary">
                  {household.numMembers + household.currentShelterOccupancy} / {household.shelterCapacity}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1, display: 'block' }}>
                  ({household.numMembers} family members + {household.currentShelterOccupancy} evacuees)
                </Typography>
              </>
            ) : household.evacuationShelterName ? (
              <Typography variant="body1">
                {household.evacuationShelterName}
              </Typography>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No evacuation shelter assigned
              </Typography>
            )}
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
