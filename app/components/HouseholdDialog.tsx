import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  useMediaQuery,
  useTheme,
 FormControlLabel,
  Checkbox,
  Typography,
  Divider,
  Box,
} from '@mui/material';
import { Household } from './HouseholdManagement';
import { supabase, DatabaseShelter } from '../utils/supabase';

interface HouseholdDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (household: Household) => void;
  household: Household | null;
  editMode: boolean;
}

interface EvacuationOption {
  id: string;
  name: string;
  type: 'shelter' | 'household';
}

export function HouseholdDialog({
  open,
  onClose,
  onSave,
  household,
  editMode,
}: HouseholdDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const [formData, setFormData] = useState<Partial<Household>>({
    lastName: '',
    firstName: '',
    middleName: '',
    address: '',
    numMembers: 1,
    isEvacuationShelter: false,
    shelterCapacity: undefined,
    currentShelterOccupancy: 0,
    evacuatedToShelterID: undefined,
    evacuatedToHouseholdID: undefined,
  });

  const [evacuationOptions, setEvacuationOptions] = useState<
    EvacuationOption[]
  >([]);

  useEffect(() => {
    if (open) {
      fetchEvacuationOptions();
    }
  }, [open]);

  useEffect(() => {
    if (household && editMode) {
      setFormData(household);
    } else {
      setFormData({
        lastName: '',
        firstName: '',
        middleName: '',
        address: '',
        numMembers: 1,
        isEvacuationShelter: false,
        shelterCapacity: undefined,
        currentShelterOccupancy: 0,
        evacuatedToShelterID: undefined,
        evacuatedToHouseholdID: undefined,
      });
    }
  }, [household, editMode, open]);

  const fetchEvacuationOptions = async () => {
    try {
      const options: EvacuationOption[] = [];

      const { data: shelters, error: shelterError } = await supabase
        .from('shelters')
        .select('shelter_id, shelter_name')
        .order('shelter_name', { ascending: true });

      if (shelterError) throw shelterError;

      if (shelters) {
        options.push(
          ...shelters.map((s) => ({
            id: `shelter-${s.shelter_id}`,
            name: s.shelter_name,
            type: 'shelter' as const,
          }))
        );
      }

      const { data: householdShelters, error: householdError } =
        await supabase
          .from('households')
          .select('household_id, last_name, first_name, address')
          .eq('is_evacuation_shelter', true)
          .order('last_name', { ascending: true });

      if (householdError) throw householdError;

      if (householdShelters) {
        options.push(
          ...householdShelters.map((h) => ({
            id: `household-${h.household_id}`,
            name: `${h.last_name}, ${h.first_name} (Household Shelter)`,
            type: 'household' as const,
          }))
        );
      }

      setEvacuationOptions(options);
    } catch (err) {
      console.error('Failed to fetch evacuation options:', err);
    }
  };

  const handleChange = (field: keyof Household, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      if (field === 'isEvacuationShelter' && value === true) {
        if (!updated.shelterCapacity) {
          updated.shelterCapacity = 10;
        }

        updated.evacuatedToShelterID = undefined;
        updated.evacuatedToHouseholdID = undefined;
      }

      if (field === 'isEvacuationShelter' && value === false) {
        updated.shelterCapacity = undefined;
        updated.currentShelterOccupancy = 0;
      }

      return updated;
    });
  };

  const handleSubmit = () => {
    const householdData: Household = {
      householdID: household?.householdID || 0,
      lastName: formData.lastName || '',
      firstName: formData.firstName || '',
      middleName: formData.middleName,
      address: formData.address || '',
      numMembers: Number(formData.numMembers) || 1,
      isEvacuationShelter: formData.isEvacuationShelter || false,
      shelterCapacity: formData.shelterCapacity
        ? Number(formData.shelterCapacity)
        : undefined,
      currentShelterOccupancy:
        Number(formData.currentShelterOccupancy) || 0,
      evacuatedToShelterID: formData.evacuatedToShelterID,
      evacuatedToHouseholdID: formData.evacuatedToHouseholdID,
    };

    onSave(householdData);
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
        {editMode ? 'Edit Household' : 'Add New Household'}
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              label="Last Name"
              value={formData.lastName}
              onChange={(e) =>
                handleChange('lastName', e.target.value)
              }
              required
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              label="First Name"
              value={formData.firstName}
              onChange={(e) =>
                handleChange('firstName', e.target.value)
              }
              required
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              label="Middle Name"
              value={formData.middleName}
              onChange={(e) =>
                handleChange('middleName', e.target.value)
              }
            />
          </Grid>

          <Grid size={12}>
            <TextField
              fullWidth
              label="Address"
              value={formData.address}
              onChange={(e) =>
                handleChange('address', e.target.value)
              }
              required
              multiline
              rows={2}
            />
          </Grid>

          <Grid size={12}>
            <Divider sx={{ my: 1 }} />
          </Grid>

          <Grid size={12}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.isEvacuationShelter || false}
                  onChange={(e) =>
                    handleChange(
                      'isEvacuationShelter',
                      e.target.checked
                    )
                  }
                />
              }
              label={
                <Box>
                  <Typography
                    variant="body1"
                    sx={{ fontWeight: 500 }}
                  >
                    Volunteer as Evacuation Shelter
                  </Typography>

                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    This household is willing to host evacuees
                  </Typography>
                </Box>
              }
            />
          </Grid>

          {formData.isEvacuationShelter && (
            <>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Shelter Capacity"
                  type="number"
                  value={formData.shelterCapacity}
                  onChange={(e) =>
                    handleChange(
                      'shelterCapacity',
                      e.target.value
                    )
                  }
                  slotProps={{
                    htmlInput: {
                      min: 1,
                      max: 100,
                    },
                  }}
                  required
                  helperText="Maximum number of evacuees this household can accommodate"
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Current Evacuees"
                  type="number"
                  value={formData.currentShelterOccupancy}
                  onChange={(e) =>
                    handleChange(
                      'currentShelterOccupancy',
                      e.target.value
                    )
                  }
                  slotProps={{
                    htmlInput: {
                      min: 0,
                      max: formData.shelterCapacity,
                    },
                  }}
                  helperText="Number of evacuees currently sheltered"
                />
              </Grid>
            </>
          )}

          <Grid size={12}>
            <Divider sx={{ my: 1 }} />
          </Grid>

          <Grid size={12}>
            <TextField
              fullWidth
              label="Number of Members"
              type="number"
              value={formData.numMembers}
              onChange={(e) =>
                handleChange('numMembers', e.target.value)
              }
              slotProps={{
                htmlInput: {
                  min: 1,
                  max: 20,
                },
              }}
              required
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>

        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
        >
          {editMode ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}