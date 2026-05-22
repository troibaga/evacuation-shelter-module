import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Shelter } from './ShelterManagement';

interface ShelterDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (shelter: Shelter) => void;
  shelter: Shelter | null;
  editMode: boolean;
}

export function ShelterDialog({
  open,
  onClose,
  onSave,
  shelter,
  editMode,
}: ShelterDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const [formData, setFormData] = useState<Partial<Shelter>>({
    shelterName: '',
    latitude: 13.6218,
    longitude: 123.1948,
    address: '',
    shelterType: 'official',
    numMembers: 0,
    capacity: 100,
    currentOccupancy: 0,
    status: 'Available',
  });

  useEffect(() => {
    if (shelter && editMode) {
      setFormData(shelter);
    } else {
      setFormData({
        shelterName: '',
        latitude: 13.6218,
        longitude: 123.1948,
        address: '',
        shelterType: 'official',
        numMembers: 0,
        capacity: 100,
        currentOccupancy: 0,
        status: 'Available',
      });
    }
  }, [shelter, editMode, open]);

  const handleChange = (field: keyof Shelter, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      if (field === 'currentOccupancy' || field === 'capacity') {
        const occupancy =
          field === 'currentOccupancy'
            ? Number(value)
            : Number(prev.currentOccupancy);

        const cap =
          field === 'capacity' ? Number(value) : Number(prev.capacity);

        if (occupancy >= cap) {
          updated.status = 'Full';
        } else if (occupancy > cap * 0.8) {
          updated.status = 'Near Full';
        } else {
          updated.status = 'Available';
        }
      }

      return updated;
    });
  };

  const handleSubmit = () => {
    const shelterData: Shelter = {
      shelterID: shelter?.shelterID || 0,
      shelterName: formData.shelterName || '',
      latitude: Number(formData.latitude) || 0,
      longitude: Number(formData.longitude) || 0,
      address: formData.address || '',
      shelterType: formData.shelterType as 'official' | 'household',
      numMembers: Number(formData.numMembers) || 0,
      capacity: Number(formData.capacity) || 0,
      currentOccupancy: Number(formData.currentOccupancy) || 0,
      status: formData.status || 'Available',
      lastUpdatedTimestamp: new Date().toISOString(),
    };

    onSave(shelterData);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={fullScreen}
    >
      <DialogTitle>
        {editMode ? 'Edit Shelter' : 'Add New Shelter'}
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {/* Shelter Name */}
          <Grid size={12}>
            <TextField
              fullWidth
              label="Shelter Name"
              value={formData.shelterName}
              onChange={(e) => handleChange('shelterName', e.target.value)}
              required
            />
          </Grid>

          {/* Address (ADDED) */}
          <Grid size={12}>
            <TextField
              fullWidth
              label="Address"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              required
            />
          </Grid>

          {/* Shelter Type (ADDED) */}
          <Grid size={12}>
            <TextField
              select
              fullWidth
              label="Shelter Type"
              value={formData.shelterType}
              onChange={(e) => handleChange('shelterType', e.target.value)}
              required
            >
              <MenuItem value="official">Official</MenuItem>
              <MenuItem value="household">Household</MenuItem>
            </TextField>
          </Grid>

          {/* Conditional field */}
          {formData.shelterType === 'household' && (
            <Grid size={12}>
              <TextField
                fullWidth
                label="Number of Members"
                type="number"
                value={formData.numMembers}
                onChange={(e) =>
                  handleChange('numMembers', e.target.value)
                }
                required
              />
            </Grid>
          )}

          {/* Latitude */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Latitude"
              type="number"
              value={formData.latitude}
              onChange={(e) => handleChange('latitude', e.target.value)}
              required
            />
          </Grid>

          {/* Longitude */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Longitude"
              type="number"
              value={formData.longitude}
              onChange={(e) => handleChange('longitude', e.target.value)}
              required
            />
          </Grid>

          {/* Capacity */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Capacity"
              type="number"
              value={formData.capacity}
              onChange={(e) => handleChange('capacity', e.target.value)}
              required
            />
          </Grid>

          {/* Current Occupancy */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Current Occupancy"
              type="number"
              value={formData.currentOccupancy}
              onChange={(e) =>
                handleChange('currentOccupancy', e.target.value)
              }
              required
            />
          </Grid>

          {/* Status */}
          <Grid size={12}>
            <TextField
              fullWidth
              select
              label="Status"
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
            >
              <MenuItem value="Available">Available</MenuItem>
              <MenuItem value="Near Full">Near Full</MenuItem>
              <MenuItem value="Full">Full</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">
          {editMode ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}