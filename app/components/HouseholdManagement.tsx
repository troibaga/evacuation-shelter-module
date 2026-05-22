import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  Box,
  Typography,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Grid,
  useMediaQuery,
  useTheme,
  Fab,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { HouseholdDialog } from './HouseholdDialog';
import { HouseholdDetailsDialog } from './HouseholdDetailsDialog';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { HouseholdCard } from './HouseholdCard';
import { supabase} from '../utils/supabase';
import toast from 'react-hot-toast';

export interface Household {
  householdID: number;
  lastName: string;
  firstName: string;
  middleName?: string;
  address: string;
  numMembers: number;
  isEvacuationShelter: boolean;
  shelterCapacity?: number;
  currentShelterOccupancy: number;
  evacuatedToShelterID?: number;
  evacuatedToHouseholdID?: number;
  evacuationShelterName?: string;
}

function mapDatabaseToHousehold(dbHousehold: any): Household {
  return {
    householdID: dbHousehold.household_id,
    lastName: dbHousehold.last_name,
    firstName: dbHousehold.first_name,
    middleName: dbHousehold.middle_name,
    address: dbHousehold.address,
    numMembers: dbHousehold.num_members,
    isEvacuationShelter: dbHousehold.is_evacuation_shelter,
    shelterCapacity: dbHousehold.shelter_capacity,
    currentShelterOccupancy: dbHousehold.current_shelter_occupancy,
    evacuatedToShelterID: dbHousehold.evacuated_to_shelter_id,
    evacuatedToHouseholdID: dbHousehold.evacuated_to_household_id,
    evacuationShelterName: dbHousehold.evacuation_shelter?.shelter_name ||
                          (dbHousehold.evacuation_household ?
                            `${dbHousehold.evacuation_household.last_name}, ${dbHousehold.evacuation_household.first_name} (Household)` :
                            undefined),
  };
}

function mapHouseholdToDatabase(household: Household) {
  return {
    last_name: household.lastName,
    first_name: household.firstName,
    middle_name: household.middleName,
    address: household.address,
    num_members: household.numMembers,
    is_evacuation_shelter: household.isEvacuationShelter,
    shelter_capacity: household.shelterCapacity,
    current_shelter_occupancy: household.currentShelterOccupancy,
    evacuated_to_shelter_id: household.evacuatedToShelterID,
    evacuated_to_household_id: household.evacuatedToHouseholdID,
  };
}

export function HouseholdManagement() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [households, setHouseholds] = useState<Household[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedHousehold, setSelectedHousehold] = useState<Household | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [sortBy, setSortBy] = useState<string>('id-asc');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    fetchHouseholds();
  }, []);

  const fetchHouseholds = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('households')
        .select(`
          *,
          evacuation_shelter:shelters!evacuated_to_shelter_id(shelter_name),
          evacuation_household:households!evacuated_to_household_id(last_name, first_name)
        `)
        .order('household_id', { ascending: true });

      if (error) throw error;

      const mappedHouseholds = (data || []).map(mapDatabaseToHousehold);
      setHouseholds(mappedHouseholds);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch households';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const filteredHouseholds = households
    .filter(household => {
      const matchesSearch =
        household.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        household.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        household.address.toLowerCase().includes(searchQuery.toLowerCase());

      let matchesFilter = true;
      if (filterType === 'evacuees') {
        matchesFilter = !household.isEvacuationShelter;
      } else if (filterType === 'shelters') {
        matchesFilter = household.isEvacuationShelter;
      } else if (filterType === 'evacuated') {
        matchesFilter = !household.isEvacuationShelter && (household.evacuatedToShelterID !== undefined || household.evacuatedToHouseholdID !== undefined);
      } else if (filterType === 'not-evacuated') {
        matchesFilter = !household.isEvacuationShelter && !household.evacuatedToShelterID && !household.evacuatedToHouseholdID;
      }

      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'id-asc':
          return a.householdID - b.householdID;
        case 'id-desc':
          return b.householdID - a.householdID;
        case 'name-asc':
          return a.lastName.localeCompare(b.lastName);
        case 'name-desc':
          return b.lastName.localeCompare(a.lastName);
        case 'members-asc':
          return a.numMembers - b.numMembers;
        case 'members-desc':
          return b.numMembers - a.numMembers;
        case 'address-asc':
          return a.address.localeCompare(b.address);
        case 'address-desc':
          return b.address.localeCompare(a.address);
        default:
          return 0;
      }
    });

  const handleAddHousehold = () => {
    setSelectedHousehold(null);
    setEditMode(false);
    setDialogOpen(true);
  };

  const handleEditHousehold = (household: Household) => {
    setSelectedHousehold(household);
    setEditMode(true);
    setDialogOpen(true);
  };

  const handleViewHousehold = (household: Household) => {
    setSelectedHousehold(household);
    setDetailsDialogOpen(true);
  };

  const handleDeleteClick = (household: Household) => {
    setSelectedHousehold(household);
    setDeleteDialogOpen(true);
  };

  const handleSaveHousehold = async (household: Household) => {
    try {
      if (editMode && selectedHousehold) {
        const { error } = await supabase
          .from('households')
          .update(mapHouseholdToDatabase(household))
          .eq('household_id', household.householdID);

        if (error) throw error;

        toast.success('Household updated successfully');
      } else {
        const { error } = await supabase
          .from('households')
          .insert([mapHouseholdToDatabase(household)]);

        if (error) throw error;

        toast.success('Household created successfully');
      }

      await fetchHouseholds();
      setDialogOpen(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save household';
      toast.error(errorMessage);
    }
  };

  const handleDeleteHousehold = async () => {
    if (!selectedHousehold) return;

    try {
      const { error } = await supabase
        .from('households')
        .delete()
        .eq('household_id', selectedHousehold.householdID);

      if (error) throw error;

      toast.success('Household deleted successfully');
      await fetchHouseholds();
      setDeleteDialogOpen(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete household';
      toast.error(errorMessage);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, pb: { xs: 10, md: 3 } }}>
      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'stretch', sm: 'center' },
        mb: 3,
        gap: 2
      }}>
        <Typography
          variant={isMobile ? 'h5' : 'h4'}
          component="h1"
          sx={{ fontWeight: 'bold' }}
        >
          Household Management
        </Typography>
        {!isMobile && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddHousehold}
            sx={{ bgcolor: '#1976d2', minWidth: 'fit-content' }}
          >
            Add New Household
          </Button>
        )}
      </Box>

      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              placeholder="Search households by name or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={loading}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth disabled={loading}>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                label="Sort By"
                onChange={(e) => setSortBy(e.target.value)}
              >
                <MenuItem key="sort-id-asc" value="id-asc">ID (Ascending)</MenuItem>
                <MenuItem key="sort-id-desc" value="id-desc">ID (Descending)</MenuItem>
                <MenuItem key="sort-name-asc" value="name-asc">Name (A-Z)</MenuItem>
                <MenuItem key="sort-name-desc" value="name-desc">Name (Z-A)</MenuItem>
                <MenuItem key="sort-members-asc" value="members-asc">Members (Low to High)</MenuItem>
                <MenuItem key="sort-members-desc" value="members-desc">Members (High to Low)</MenuItem>
                <MenuItem key="sort-address-asc" value="address-asc">Address (A-Z)</MenuItem>
                <MenuItem key="sort-address-desc" value="address-desc">Address (Z-A)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth disabled={loading}>
              <InputLabel>Filter Type</InputLabel>
              <Select
                value={filterType}
                label="Filter Type"
                onChange={(e) => setFilterType(e.target.value)}
                startAdornment={
                  <InputAdornment position="start">
                    <FilterIcon />
                  </InputAdornment>
                }
              >
                <MenuItem key="filter-all" value="all">All Households</MenuItem>
                <MenuItem key="filter-evacuees" value="evacuees">Regular Households</MenuItem>
                <MenuItem key="filter-shelters" value="shelters">Household Shelters</MenuItem>
                <MenuItem key="filter-evacuated" value="evacuated">Evacuated</MenuItem>
                <MenuItem key="filter-not-evacuated" value="not-evacuated">Not Evacuated</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : isMobile ? (
        <Grid container spacing={2}>
          {filteredHouseholds.map((household) => (
            <Grid size={12} key={household.householdID}>
              <HouseholdCard
                household={household}
                onView={handleViewHousehold}
                onEdit={handleEditHousehold}
                onDelete={handleDeleteClick}
              />
            </Grid>
          ))}
        </Grid>
      ) : (
        <TableContainer component={Paper} elevation={2} sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: 800 }}>
          <TableHead sx={{ bgcolor: '#f5f5f5' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Household ID</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Head of Household</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Address</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Members</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Capacity</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Occupancy</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredHouseholds.map((household) => {
              const totalOccupancy = household.numMembers + household.currentShelterOccupancy;
              const capacity = household.shelterCapacity || 1;
              const occupancyPercent = (totalOccupancy / capacity) * 100;

              let shelterStatus: 'Available' | 'Near Full' | 'Full' = 'Available';
              let statusColor: 'success' | 'warning' | 'error' = 'success';

              if (household.isEvacuationShelter) {
                if (occupancyPercent >= 100) {
                  shelterStatus = 'Full';
                  statusColor = 'error';
                } else if (occupancyPercent >= 80) {
                  shelterStatus = 'Near Full';
                  statusColor = 'warning';
                }
              }

              return (
              <TableRow key={household.householdID} hover>
                <TableCell>{household.householdID}</TableCell>
                <TableCell>
                  {household.lastName}, {household.firstName} {household.middleName}
                </TableCell>
                <TableCell>{household.address}</TableCell>
                <TableCell>{household.numMembers}</TableCell>
                <TableCell>
                  {household.isEvacuationShelter ? (
                    <Chip label="Household Shelter" size="small" color="success" />
                  ) : (
                    <Chip label="Regular Household" size="small" color="default" />
                  )}
                </TableCell>
                <TableCell>
                  {household.isEvacuationShelter ? household.shelterCapacity : '-'}
                </TableCell>
                <TableCell>
                  {household.isEvacuationShelter ? (
                    <>
                      {household.numMembers + household.currentShelterOccupancy} / {household.shelterCapacity}
                      <Typography variant="caption" sx={{display: 'block', color: 'text.secondary'}}>
                        {(((household.numMembers + household.currentShelterOccupancy) / (household.shelterCapacity || 1)) * 100).toFixed(1)}%
                      </Typography>
                    </>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>
                  {household.isEvacuationShelter ? (
                    <Chip label={shelterStatus} size="small" color={statusColor} />
                  ) : household.evacuationShelterName ? (
                    <Chip label={household.evacuationShelterName} size="small" color="primary" />
                  ) : (
                    <Chip label="Not Evacuated" size="small" variant="outlined" />
                  )}
                </TableCell>
                <TableCell align="center">
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => handleViewHousehold(household)}
                    title="View Details"
                  >
                    <ViewIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="info"
                    onClick={() => handleEditHousehold(household)}
                    title="Edit"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDeleteClick(household)}
                    title="Delete"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
              );
            })}
          </TableBody>
        </Table>
        </TableContainer>
      )}

      {!loading && filteredHouseholds.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="text.secondary">
            No households found matching your search.
          </Typography>
        </Box>
      )}

      <HouseholdDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSaveHousehold}
        household={selectedHousehold}
        editMode={editMode}
      />

      <HouseholdDetailsDialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        household={selectedHousehold}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteHousehold}
        shelterName={`${selectedHousehold?.lastName} Household`}
      />

      {isMobile && (
        <Fab
          color="primary"
          aria-label="add"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1000,
          }}
          onClick={handleAddHousehold}
        >
          <AddIcon />
        </Fab>
      )}
    </Box>
  );
}
