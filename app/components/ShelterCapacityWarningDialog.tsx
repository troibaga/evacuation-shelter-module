import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  Chip,
  Alert,
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';

interface Shelter {
  shelter_id: number;
  shelter_name: string;
  capacity: number;
  current_occupancy: number;
  status: string;
}

interface ShelterCapacityWarningDialogProps {
  open: boolean;
  onClose: () => void;
  shelterName: string;
  currentOccupancy: number;
  capacity: number;
  requiredSpace: number;
  availableShelters: Shelter[];
  onSelectShelter: (shelterId: number) => void;
}

export function ShelterCapacityWarningDialog({
  open,
  onClose,
  shelterName,
  currentOccupancy,
  capacity,
  requiredSpace,
  availableShelters,
  onSelectShelter,
}: ShelterCapacityWarningDialogProps) {
  const availableSpace = capacity - currentOccupancy;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon color="error" />
          Shelter Capacity Exceeded
        </Box>
      </DialogTitle>
      <DialogContent>
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body1" gutterBottom>
            <strong>{shelterName}</strong> does not have enough capacity!
          </Typography>
          <Typography variant="body2">
            • Current Occupancy: {currentOccupancy} / {capacity}
          </Typography>
          <Typography variant="body2">
            • Available Space: {availableSpace} {availableSpace === 1 ? 'person' : 'people'}
          </Typography>
          <Typography variant="body2">
            • Required Space: {requiredSpace} {requiredSpace === 1 ? 'person' : 'people'}
          </Typography>
        </Alert>

        {availableShelters.length > 0 ? (
          <>
            <Typography
              variant="subtitle1"
              gutterBottom
              sx={{ fontWeight: 'bold' }}
            >
              Recommended Available Shelters:
            </Typography>
            <List>
              {availableShelters.map((shelter, index) => {
                const available = shelter.capacity - shelter.current_occupancy;
                return (
                  <ListItem
                    key={`shelter-warning-${shelter.shelter_id}-${index}`}
                    sx={{
                      border: '1px solid #e0e0e0',
                      borderRadius: 1,
                      mb: 1,
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: '#f5f5f5',
                      },
                    }}
                    onClick={() => {
                      onSelectShelter(shelter.shelter_id);
                      onClose();
                    }}
                  >
                    <ListItemText
                      primary={shelter.shelter_name}
                      secondary={
                        <>
                          <Typography variant="caption" component="span" sx={{ display: 'block' }}>
                            Capacity: {shelter.current_occupancy} / {shelter.capacity}
                          </Typography>
                          <Typography variant="caption" component="span" sx={{ display: 'block', color: 'success.main' }}>
                            Available: {available} {available === 1 ? 'space' : 'spaces'}
                          </Typography>
                        </>
                      }
                    />
                    <Chip
                      label={shelter.status}
                      color={shelter.status === 'Available' ? 'success' : 'warning'}
                      size="small"
                    />
                  </ListItem>
                );
              })}
            </List>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
              Click on a shelter to automatically assign this household there.
            </Typography>
          </>
        ) : (
          <Alert severity="warning">
            <Typography variant="body2">
              No shelters have enough capacity for this household. Consider:
            </Typography>
            <Typography variant="body2" component="ul" sx={{ mt: 1, pl: 2 }}>
              <li>Splitting the household into multiple shelters</li>
              <li>Adding more evacuation shelters to the system</li>
              <li>Increasing capacity of existing shelters</li>
            </Typography>
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
