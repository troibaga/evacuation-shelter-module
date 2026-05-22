import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Fab,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { DatabaseShelter, supabase } from '../utils/supabase';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { ShelterCard } from './ShelterCard';
import { ShelterDetailsDialog } from './ShelterDetailsDialog';
import { ShelterDialog } from './ShelterDialog';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface Shelter {
  shelterID: number;
  shelterName: string;
  latitude: number;
  longitude: number;
  address: string;
  shelterType: 'official' | 'household';
  numMembers: number;
  capacity: number;
  currentOccupancy: number;
  status: 'Available' | 'Near Full' | 'Full';
  lastUpdatedTimestamp: string;
}

// ============================================================================
// MAPPING FUNCTIONS - Convert between frontend camelCase and DB snake_case
// ============================================================================

function mapDatabaseToShelter(dbShelter: DatabaseShelter): Shelter {
  return {
    shelterID: dbShelter.shelter_id,
    shelterName: dbShelter.shelter_name ?? '',
    latitude: dbShelter.latitude ?? 0,
    longitude: dbShelter.longitude ?? 0,
    address: dbShelter.address ?? '',
    shelterType: dbShelter.shelter_type ?? 'official',
    capacity: dbShelter.capacity,
    currentOccupancy: dbShelter.current_occupancy,
    status: dbShelter.status ?? 'Available',
    numMembers: dbShelter.num_members ?? 0,
    lastUpdatedTimestamp:
      dbShelter.last_updated_timestamp ?? new Date().toISOString(),
  };
}

function mapShelterToDatabase(shelter: Shelter): Partial<DatabaseShelter> {
  return {
    shelter_name: shelter.shelterName,
    latitude: shelter.latitude,
    longitude: shelter.longitude,
    address: shelter.address,
    shelter_type: shelter.shelterType,
    capacity: shelter.capacity,
    current_occupancy: shelter.currentOccupancy,
    status: shelter.status,
    num_members: shelter.numMembers,
    last_updated_timestamp: new Date().toISOString(),
  };
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ShelterManagement() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedShelter, setSelectedShelter] = useState<Shelter | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [sortBy, setSortBy] = useState<string>('name-asc');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // ============================================================================
  // CRUD: READ (SELECT)
  // ============================================================================
  
  useEffect(() => {
    fetchShelters();
  }, []);

  const fetchShelters = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('shelters')
        .select('*')
        .order('shelter_id', { ascending: true });

      if (error) throw error;

      const mappedShelters = (data || []).map(mapDatabaseToShelter);
      setShelters(mappedShelters);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch shelters';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // FILTERING & SORTING
  // ============================================================================

  const filteredShelters = shelters
    .filter(shelter => {
      const matchesSearch = shelter.shelterName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || shelter.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'id-asc':
          return a.shelterID - b.shelterID;
        case 'id-desc':
          return b.shelterID - a.shelterID;
        case 'name-asc':
          return a.shelterName.localeCompare(b.shelterName);
        case 'name-desc':
          return b.shelterName.localeCompare(a.shelterName);
        case 'capacity-asc':
          return a.capacity - b.capacity;
        case 'capacity-desc':
          return b.capacity - a.capacity;
        case 'occupancy-asc':
          return a.currentOccupancy - b.currentOccupancy;
        case 'occupancy-desc':
          return b.currentOccupancy - a.currentOccupancy;
        default:
          return 0;
      }
    });

  // ============================================================================
  // DIALOG HANDLERS
  // ============================================================================

  const handleAddShelter = () => {
    setSelectedShelter(null);
    setEditMode(false);
    setDialogOpen(true);
  };

  const handleEditShelter = (shelter: Shelter) => {
    setSelectedShelter(shelter);
    setEditMode(true);
    setDialogOpen(true);
  };

  const handleViewShelter = (shelter: Shelter) => {
    setSelectedShelter(shelter);
    setDetailsDialogOpen(true);
  };

  const handleDeleteClick = (shelter: Shelter) => {
    setSelectedShelter(shelter);
    setDeleteDialogOpen(true);
  };

  // ============================================================================
  // CRUD: CREATE & UPDATE (INSERT/UPDATE)
  // ============================================================================

  const handleSaveShelter = async (shelter: Shelter) => {
    try {
      if (editMode && selectedShelter) {
        // UPDATE: Modify existing record
        const { error } = await supabase
          .from('shelters')
          .update(mapShelterToDatabase(shelter))
          .eq('shelter_id', shelter.shelterID);

        if (error) throw error;
        toast.success('Shelter updated successfully');
      } else {
        // CREATE: Insert new record
        const { error } = await supabase
          .from('shelters')
          .insert([mapShelterToDatabase(shelter)]);

        if (error) throw error;
        toast.success('Shelter created successfully');
      }

      // Refresh list
      await fetchShelters();
      setDialogOpen(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save shelter';
      toast.error(errorMessage);
      console.error('Save error:', err);
    }
  };

  // ============================================================================
  // CRUD: DELETE
  // ============================================================================

  const handleDeleteShelter = async () => {
    if (!selectedShelter) return;

    try {
      const { error } = await supabase
        .from('shelters')
        .delete()
        .eq('shelter_id', selectedShelter.shelterID);

      if (error) throw error;

      toast.success('Shelter deleted successfully');
      await fetchShelters();
      setDeleteDialogOpen(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete shelter';
      toast.error(errorMessage);
      console.error('Delete error:', err);
    }
  };

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

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

  // ============================================================================
  // RENDER
  // ============================================================================

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
          Evacuation Shelter Management
        </Typography>
        {!isMobile && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddShelter}
            sx={{ bgcolor: '#1976d2', minWidth: 'fit-content' }}
          >
            Add New Shelter
          </Button>
        )}
      </Box>

      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              placeholder="Search shelters by name or address..."
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
                <MenuItem key="sort-capacity-asc" value="capacity-asc">Capacity (Low to High)</MenuItem>
                <MenuItem key="sort-capacity-desc" value="capacity-desc">Capacity (High to Low)</MenuItem>
                <MenuItem key="sort-occupancy-asc" value="occupancy-asc">Occupancy (Low to High)</MenuItem>
                <MenuItem key="sort-occupancy-desc" value="occupancy-desc">Occupancy (High to Low)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth disabled={loading}>
              <InputLabel>Filter Status</InputLabel>
              <Select
                value={filterStatus}
                label="Filter Status"
                onChange={(e) => setFilterStatus(e.target.value)}
                startAdornment={
                  <InputAdornment position="start">
                    <FilterIcon />
                  </InputAdornment>
                }
              >
                <MenuItem key="filter-all" value="all">All Statuses</MenuItem>
                <MenuItem key="filter-available" value="Available">Available</MenuItem>
                <MenuItem key="filter-near-full" value="Near Full">Near Full</MenuItem>
                <MenuItem key="filter-full" value="Full">Full</MenuItem>
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
          {filteredShelters.map((shelter) => (
            <Grid size={12} key={shelter.shelterID}>
              <ShelterCard
                shelter={shelter}
                onView={handleViewShelter}
                onEdit={handleEditShelter}
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
                <TableCell sx={{ fontWeight: 'bold' }}>Shelter ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Shelter Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Location</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Capacity</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Occupancy</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredShelters.map((shelter) => (
                <TableRow key={shelter.shelterID} hover>
                  <TableCell>{shelter.shelterID}</TableCell>
                  <TableCell>{shelter.shelterName}</TableCell>
                  <TableCell>
                    {shelter.latitude.toFixed(4)}, {shelter.longitude.toFixed(4)}
                  </TableCell>
                  <TableCell>{shelter.capacity}</TableCell>
                  <TableCell>
                    {shelter.currentOccupancy} / {shelter.capacity}
                    <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                      {((shelter.currentOccupancy / shelter.capacity) * 100).toFixed(1)}%
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={shelter.status}
                      color={getStatusColor(shelter.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleViewShelter(shelter)}
                      title="View Details"
                    >
                      <ViewIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="info"
                      onClick={() => handleEditShelter(shelter)}
                      title="Edit"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteClick(shelter)}
                      title="Delete"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {!loading && filteredShelters.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="text.secondary">
            No shelters found matching your search.
          </Typography>
        </Box>
      )}

      <ShelterDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSaveShelter}
        shelter={selectedShelter}
        editMode={editMode}
      />

      <ShelterDetailsDialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        shelter={selectedShelter}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteShelter}
        shelterName={selectedShelter?.shelterName || ''}
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
          onClick={handleAddShelter}
        >
          <AddIcon />
        </Fab>
      )}
    </Box>
  );
}