"use client";
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  Button,
  IconButton,
  Box,
  Typography,
  CircularProgress,
  Alert,
  useMediaQuery,
  Chip,
  Dialog,
  useTheme as useMuiTheme,
} from '@mui/material';
import { useTheme } from '../contexts/ThemeContext';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Person as PersonIcon,
  People as PeopleIcon,
  Home as HomeIcon,
  Info as InfoIcon,
  Phone as PhoneIcon,
  Public as WebIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { UnifiedShelterCard } from './UnifiedShelterCard';
import ShelterForm from './ShelterForm';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { deleteShelter } from '../actions/shelterActions';
import { useCallback } from 'react';

export interface ShelterHead {
  head_id: number;
  fname: string | null;
  mname: string | null;
  lname: string | null;
  contact_num: string | null;
  socmed_url: string | null;
}

export interface UnifiedShelter {
  shelter_id: number;
  zone_num: number | string | null;
  barangay_name: string | null;
  municipality: string | null;
  type: string | null;
  max_capacity: number | null;
  curr_capacity: number | null;
  head_id: number | null;
  created_at: string | null;
  last_update: string | null;
  latitude: number | null;
  longitude: number | null;
  shelter_head: ShelterHead | null;
  // Metadata for evacuations if needed
  evacuation_shelter_name?: string;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const getShelterDisplayName = (shelter: UnifiedShelter | null): string => {
  if (!shelter) return '';
  if (shelter.shelter_head) {
    const { fname, mname, lname } = shelter.shelter_head;
    return [fname, mname, lname].filter(Boolean).join(" ") || `Shelter #${shelter.shelter_id}`;
  }
  return shelter.barangay_name || `Shelter #${shelter.shelter_id}`;
};

const calculateStatus = (shelter: UnifiedShelter): 'Available' | 'Near Full' | 'Full' => {
  const max = shelter.max_capacity || 0;
  const curr = shelter.curr_capacity || 0;

  if (max === 0) return 'Available';
  const occupancyPercent = (curr / max) * 100;

  if (occupancyPercent >= 100) return 'Full';
  if (occupancyPercent > 80) return 'Near Full';
  return 'Available';
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function UnifiedShelterManagement() {
  const router = useRouter();
  const muiTheme = useMuiTheme();
  const { theme, mode } = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  const { profile, signOut } = useAuth();

  const [shelters, setShelters] = useState<UnifiedShelter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedShelter, setSelectedShelter] = useState<UnifiedShelter | null>(null);
  const [sortBy, setSortBy] = useState<string>('id-asc');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [headDetailsOpen, setHeadDetailsOpen] = useState(false);
  const [isHeadClosing, setIsHeadClosing] = useState(false);
  const [activeHead, setActiveHead] = useState<any>(null);


  // ============================================================================
  // CRUD: READ (SELECT)
  // ============================================================================
  useEffect(() => {
    fetchShelters();
  }, []);



  const fetchShelters = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('location')
        .select(`
          latitude, 
          longitude, 
          shelter_id, 
          shelter(
            shelter_id,
            zone_num,
            barangay_name,
            municipality,
            type,
            max_capacity,
            curr_capacity,
            head_id,
            created_at,
            last_update,
            shelter_head(head_id, fname, mname, lname, contact_num, socmed_url)
          )
        `);

      if (fetchError) throw fetchError;

      const mappedShelters: UnifiedShelter[] = (data || [])
        .filter(item => item.shelter)
        .map(item => {
          const s = item.shelter as any;
          return {
            ...s,
            latitude: item.latitude,
            longitude: item.longitude,
            shelter_head: s.shelter_head || null
          };
        });

      setShelters(mappedShelters);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch shelters';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShelters();
  }, [fetchShelters]);

  // ============================================================================
  // FILTERING & SORTING
  // ============================================================================

  const filteredShelters = shelters
    .filter((shelter) => {
      const query = searchQuery.toLowerCase();

      const name = getShelterDisplayName(shelter).toLowerCase();
      const address = `${shelter.barangay_name ?? ''} ${shelter.municipality ?? ''}`.toLowerCase();

      const matchesSearch =
        name.includes(query) ||
        address.includes(query) ||
        String(shelter.shelter_id).includes(query);

      let matchesFilter = true;

      const status = calculateStatus(shelter);

      let matchesType = true;
      if (filterType === 'Evacuation Center') {
        matchesType = shelter.type === 'Evacuation Center';
      } else if (filterType === 'Volunteering Household') {
        matchesType = shelter.type === 'Volunteering Household';
      }

      let matchesStatus = true;
      if (filterStatus === 'available') {
        matchesStatus = status === 'Available';
      } else if (filterStatus === 'full') {
        matchesStatus = status === 'Full' || status === 'Near Full';
      }

      return matchesSearch && matchesType && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'id-asc':
          return a.shelter_id - b.shelter_id;
        case 'id-desc':
          return b.shelter_id - a.shelter_id;
        case 'name-asc':
          return getShelterDisplayName(a).localeCompare(getShelterDisplayName(b));
        case 'name-desc':
          return getShelterDisplayName(b).localeCompare(getShelterDisplayName(a));
        case 'capacity-asc':
          return (a.max_capacity || 0) - (b.max_capacity || 0);
        case 'capacity-desc':
          return (b.max_capacity || 0) - (a.max_capacity || 0);
        case 'occupancy-asc':
          return (a.curr_capacity || 0) - (b.curr_capacity || 0);
        case 'occupancy-desc':
          return (b.curr_capacity || 0) - (a.curr_capacity || 0);
        default:
          return 0;
      }
    });

  // ============================================================================
  // DIALOG HANDLERS
  // ============================================================================


  const handleEditShelter = (shelter: UnifiedShelter) => {
    setSelectedShelter(shelter);
    setDialogOpen(true);
  };


  const handleViewHead = (head: any) => {
    setActiveHead(head);
    setHeadDetailsOpen(true);
    setIsHeadClosing(false);
  };

  const closeHeadDetails = () => {
    setIsHeadClosing(true);
    setTimeout(() => {
      setHeadDetailsOpen(false);
      setIsHeadClosing(false);
    }, 190);
  };

  const handleDeleteClick = (shelter: UnifiedShelter) => {
    setSelectedShelter(shelter);
    setDeleteDialogOpen(true);
  };

  // ============================================================================
  // CRUD: CREATE & UPDATE (INSERT/UPDATE)
  // ============================================================================

  const handleFormSuccess = () => {
    setDialogOpen(false);
    fetchShelters();
  };

  const handleToggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredShelters.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredShelters.map(s => s.shelter_id)));
    }
  };

  const handleBulkDelete = async () => {
    setLoading(true);
    try {
      const idsToDelete = Array.from(selectedIds);
      const results = await Promise.all(idsToDelete.map(id => deleteShelter(id)));

      const failures = results.filter(r => !r.success);
      if (failures.length > 0) {
        toast.error(`Failed to delete ${failures.length} shelter(s).`);
      } else {
        toast.success(`Successfully deleted ${idsToDelete.length} shelter(s).`);
        setSelectedIds(new Set());
      }
      fetchShelters();
    } catch (err) {
      toast.error('Bulk deletion failed.');
    } finally {
      setLoading(false);
      setBulkDeleteDialogOpen(false);
    }
  };
  const handleDeleteShelter = async () => {
    if (!selectedShelter) return;

    try {
      setLoading(true);
      const result = await deleteShelter(selectedShelter.shelter_id);

      if (result.success) {
        toast.success('Shelter deleted successfully!', {
          style: {
            background: theme.successBg,
            color: theme.successText,
            border: `1px solid ${theme.successBorder}`,
            fontSize: '12px'
          }
        });

        setDeleteDialogOpen(false);
        setSelectedShelter(null);

        await fetchShelters();
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete shelter', {
        style: {
          background: theme.cancelBg,
          color: theme.cancelText,
          border: `1px solid ${theme.cancelBorder}`,
          fontSize: '12px'
        }
      });
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================


  // ============================================================================
  // RENDER
  // ============================================================================

  const toolButtonStyle = {
    background: theme.toolBg,
    border: `1px solid ${theme.toolBorder}`,
    color: theme.textMain,
    textTransform: 'none',
    fontSize: '13px',
    fontWeight: 500,
    borderRadius: '6px',
    padding: '6px 16px',
    transition: 'all 0.2s ease',
    '&:hover': {
      background: theme.toolHover,
      borderColor: theme.toolBorder,
    },
    '&:disabled': {
      opacity: 0.5,
      color: theme.textMuted,
    }
  };

  const primaryButtonStyle = {
    px: 2.5,
    py: 1,
    height: '36px',
    boxSizing: 'border-box',
    background: theme.confirmBg,
    border: `1px solid ${theme.confirmBorder}`,
    color: theme.confirmText,
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'var(--font-geist), sans-serif',
    textTransform: 'none',
    '&:hover': {
      background: theme.confirmHover,
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    },
    '&:disabled': {
      opacity: 0.6,
      cursor: 'not-allowed'
    }
  };

  const dangerButtonStyle = {
    ...primaryButtonStyle,
    background: theme.cancelBg,
    border: `1px solid ${theme.cancelBorder}`,
    color: theme.cancelText,
    '&:hover': {
      background: theme.cancelHover,
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }
  };

  const secondaryButtonStyle = {
    ...primaryButtonStyle,
    background: theme.toolBg,
    border: `1px solid ${theme.toolBorder}`,
    color: theme.textMain,
    '&:hover': {
      background: theme.toolHover,
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }
  };

  const inputStyle = {
    background: theme.toolBg,
    border: `1px solid ${theme.toolBorder}`,
    color: theme.textMain,
    borderRadius: '4px',
    padding: '6px 32px 6px 10px',
    fontSize: '13px',
    width: '100%',
    appearance: 'none' as any,
    cursor: 'pointer',
    outline: 'none',
    transition: 'all 0.2s ease',
    backgroundImage: 'none',
    '&:focus': {
      borderColor: theme.confirmBorder,
      boxShadow: `0 0 0 2px ${theme.confirmBg}`,
    }
  };

  const getStatusChipStyle = (status: string) => {
    switch (status) {
      case 'Available':
        return {
          bgcolor: theme.successBg,
          color: theme.successText,
          border: `1px solid ${theme.successBorder}`,
          fontWeight: 600,
          fontSize: '11px',
        };
      case 'Near Full':
        return {
          bgcolor: mode === 'dark' ? 'rgba(217, 119, 6, 0.1)' : 'rgba(217, 119, 6, 0.05)',
          color: '#f59e0b',
          border: '1px solid #f59e0b',
          fontWeight: 600,
          fontSize: '11px',
        };
      case 'Full':
        return {
          bgcolor: theme.cancelBg,
          color: theme.cancelText,
          border: `1px solid ${theme.cancelBorder}`,
          fontWeight: 600,
          fontSize: '11px',
        };
      default:
        return {};
    }
  };

  return (
    <Box sx={{
      p: { xs: 2, sm: 3 },
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      background: theme.panelBg,
      color: theme.textMain,
      fontFamily: 'var(--font-geist), system-ui, -apple-system, sans-serif',
      overflow: 'hidden'
    }}>
      {/* Metrics Row */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 3 }}>
        <Box sx={{
          flex: 1, minWidth: '160px', p: 1.5,
          background: theme.toolBg, borderRadius: '4px',
          border: `1px solid ${theme.panelBorder}`,
          display: 'flex', flexDirection: 'column'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <HomeIcon sx={{ fontSize: 14, color: theme.textMuted }} />
            <Typography sx={{ fontSize: '10px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', fontFamily: 'var(--font-plus-jakarta)' }}>Total Shelters</Typography>
          </Box>
          <Typography sx={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-plus-jakarta)' }}>{shelters.length}</Typography>
        </Box>
        <Box sx={{
          flex: 1, minWidth: '160px', p: 1.5,
          background: theme.toolBg, borderRadius: '4px',
          border: `1px solid ${theme.panelBorder}`,
          display: 'flex', flexDirection: 'column'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <PersonIcon sx={{ fontSize: 14, color: theme.textMuted }} />
            <Typography sx={{ fontSize: '10px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', fontFamily: 'var(--font-plus-jakarta)' }}>Current Occupancy</Typography>
          </Box>
          <Typography sx={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-plus-jakarta)' }}>{shelters.reduce((acc, s) => acc + (s.curr_capacity || 0), 0)}</Typography>
        </Box>
        <Box sx={{
          flex: 1, minWidth: '160px', p: 1.5,
          background: theme.toolBg, borderRadius: '4px',
          border: `1px solid ${theme.panelBorder}`,
          display: 'flex', flexDirection: 'column'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <PeopleIcon sx={{ fontSize: 14, color: theme.textMuted }} />
            <Typography sx={{ fontSize: '10px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', fontFamily: 'var(--font-plus-jakarta)' }}>Total Max Capacity</Typography>
          </Box>
          <Typography sx={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-plus-jakarta)' }}>{shelters.reduce((acc, s) => acc + (s.max_capacity || 0), 0)}</Typography>
        </Box>
      </Box>

      {/* Search & Filter Section */}
      <Box sx={{
        mb: 4,
        p: '2px',
        background: 'transparent',
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        gap: 2,
        alignItems: 'center'
      }}>
        <Box sx={{ position: 'relative', flex: 1, width: '100%' }}>
          <SearchIcon sx={{
            position: 'absolute',
            left: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 18,
            color: theme.textMuted,
            zIndex: 1
          }} />
          <Box
            component="input"
            placeholder="Search by name, address, or ID..."
            value={searchQuery}
            onChange={(e: any) => setSearchQuery(e.target.value)}
            disabled={loading}
            sx={{
              ...inputStyle,
              paddingLeft: '40px',
              height: '36px',
              boxSizing: 'border-box'
            }}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, width: { xs: '100%', md: 'auto' }, alignItems: 'center' }}>
          {selectedIds.size > 0 && (
            <Button
              onClick={() => setBulkDeleteDialogOpen(true)}
              sx={dangerButtonStyle}
              startIcon={
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6 17.4 20.1A2 2 0 0 1 15.4 22H8.6A2 2 0 0 1 6.6 20.1L5 6" />
                  <path d="M10 11v6" />
                  <path d="M14 11v6" />
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
              }
            >
              Delete Selected ({selectedIds.size})
            </Button>
          )}

          <Box sx={{ minWidth: '150px', flex: 1, position: 'relative' }}>
            <Box
              component="select"
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              sx={{ ...inputStyle, height: '36px' }}
            >
              <option value="id-asc">ID (Ascending)</option>
              <option value="id-desc">ID (Descending)</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="capacity-asc">Capacity (L to H)</option>
              <option value="capacity-desc">Capacity (H to L)</option>
            </Box>
            <FilterIcon sx={{
              position: 'absolute',
              right: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 14,
              color: theme.textMuted,
              pointerEvents: 'none'
            }} />
          </Box>
          <Box sx={{ minWidth: '150px', flex: 1, position: 'relative' }}>
            <Box
              component="select"
              value={filterType}
              onChange={(e: any) => setFilterType(e.target.value)}
              sx={{ ...inputStyle, height: '36px' }}
            >
              <option value="all">All Types</option>
              <option value="Evacuation Center">Evacuation Center</option>
              <option value="Volunteering Household">Volunteering Household</option>
            </Box>
            <FilterIcon sx={{
              position: 'absolute',
              right: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 14,
              color: theme.textMuted,
              pointerEvents: 'none'
            }} />
          </Box>
          <Box sx={{ minWidth: '130px', flex: 1, position: 'relative' }}>
            <Box
              component="select"
              value={filterStatus}
              onChange={(e: any) => setFilterStatus(e.target.value)}
              sx={{ ...inputStyle, height: '36px' }}
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="full">Full / Near Full</option>
            </Box>
            <FilterIcon sx={{
              position: 'absolute',
              right: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 14,
              color: theme.textMuted,
              pointerEvents: 'none'
            }} />
          </Box>
        </Box>
      </Box>

      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            bgcolor: theme.cancelBg,
            color: theme.cancelText,
            border: `1px solid ${theme.cancelBorder}`,
            '& .MuiAlert-icon': { color: theme.cancelText }
          }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
          <CircularProgress sx={{ color: theme.confirmText }} />
        </Box>
      ) : isMobile ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filteredShelters.map((shelter) => (
            <UnifiedShelterCard
              key={shelter.shelter_id}
              shelter={shelter}
              onEdit={handleEditShelter}
              onDelete={handleDeleteClick}
            />
          ))}
          {filteredShelters.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 8, color: theme.textMuted }}>
              No shelters found matching your criteria.
            </Box>
          )}
        </Box>
      ) : (
        <Box sx={{
          background: theme.toolBg,
          border: `1px solid ${theme.panelBorder}`,
          borderRadius: '4px',
          overflow: 'hidden',
          boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0 // Crucial for nested flex scrolling
        }}>
          <Box sx={{ overflowY: 'auto', flex: 1 }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, textAlign: 'left', tableLayout: 'fixed' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: theme.panelBg }}>
                <tr style={{ borderBottom: `1px solid ${theme.panelBorder}` }}>
                  <th style={{ padding: '12px 16px', width: '48px', background: theme.panelBg, borderBottom: `1px solid ${theme.panelBorder}` }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.size === filteredShelters.length && filteredShelters.length > 0}
                      onChange={handleSelectAll}
                      style={{ cursor: 'pointer' }}
                    />
                  </th>
                  <th style={{ padding: '12px 16px', width: '80px', background: theme.panelBg, borderBottom: `1px solid ${theme.panelBorder}`, fontSize: '10px', fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', fontFamily: 'var(--font-plus-jakarta)' }}>ID</th>
                  {['Address', 'Shelter Head Details', 'Type', 'Status', 'Occupancy', 'Actions'].map((head) => (
                    <th key={head} style={{
                      padding: '12px 16px',
                      fontSize: '10px',
                      fontWeight: 700,
                      color: theme.textMuted,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      background: theme.panelBg,
                      borderBottom: `1px solid ${theme.panelBorder}`,
                      width: 'auto',
                      textAlign: head === 'Actions' ? 'right' : 'left',
                      fontFamily: 'var(--font-plus-jakarta)'
                    }}>
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredShelters.map((shelter) => {
                  const status = calculateStatus(shelter);
                  const statusStyle = getStatusChipStyle(status);
                  const occupancyPercent = (shelter.max_capacity || 0) > 0
                    ? ((shelter.curr_capacity || 0) / (shelter.max_capacity || 0)) * 100
                    : 0;

                  return (
                    <tr
                      key={shelter.shelter_id}
                      style={{
                        borderBottom: `1px solid ${theme.panelBorder}`,
                        transition: 'background 0.2s ease',
                        cursor: 'default',
                        background: selectedIds.has(shelter.shelter_id) ? theme.toolHover : 'transparent'
                      }}
                      onMouseOver={(e) => !selectedIds.has(shelter.shelter_id) && (e.currentTarget.style.background = theme.toolHover)}
                      onMouseOut={(e) => !selectedIds.has(shelter.shelter_id) && (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(shelter.shelter_id)}
                          onChange={() => handleToggleSelect(shelter.shelter_id)}
                          style={{ cursor: 'pointer' }}
                        />
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '12px', fontWeight: 600 }}>#{shelter.shelter_id}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                          <Typography sx={{ fontSize: '13px', fontWeight: 700, color: theme.textMain }}>
                            Zone {shelter.zone_num}
                          </Typography>
                          <Typography sx={{ fontSize: '11px', color: theme.textMuted, fontFamily: 'var(--font-geist)' }}>
                            {shelter.barangay_name}, {shelter.municipality}
                          </Typography>
                        </Box>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {shelter.shelter_head ? (
                          <Box
                            onClick={() => handleViewHead(shelter.shelter_head)}
                            sx={{
                              display: 'inline-block',
                              px: 1.5,
                              py: 0.5,
                              background: theme.confirmBg,
                              border: `1px solid ${theme.confirmBorder}`,
                              color: theme.confirmText,
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '11px',
                              fontWeight: 700,
                              transition: 'all 0.2s ease',
                              textAlign: 'center',
                              '&:hover': {
                                background: theme.confirmHover,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                              }
                            }}
                          >
                            {getShelterDisplayName(shelter)}
                          </Box>
                        ) : (
                          <Typography sx={{ fontSize: '11px', color: theme.textMuted, fontStyle: 'italic', px: 1.5 }}>
                            No head assigned
                          </Typography>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <Box sx={{
                          display: 'inline-flex',
                          px: 1, py: 0.25,
                          borderRadius: '4px',
                          fontSize: '9px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          background: theme.toolBg,
                          border: `1px solid ${theme.panelBorder}`,
                          color: theme.textMuted
                        }}>
                          {shelter.type}
                        </Box>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <Box sx={{
                          display: 'inline-flex',
                          px: '6px', py: '2px',
                          borderRadius: '4px',
                          fontSize: '9px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          background: statusStyle.bgcolor,
                          color: statusStyle.color,
                          border: statusStyle.border,
                        }}>
                          {status}
                        </Box>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <Box sx={{ minWidth: '90px' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography sx={{ fontSize: '10px', fontWeight: 700 }}>
                              {shelter.curr_capacity} / {shelter.max_capacity}
                            </Typography>
                            <Typography sx={{ fontSize: '10px', color: theme.textMuted }}>
                              {Math.round(occupancyPercent)}%
                            </Typography>
                          </Box>
                          <Box sx={{
                            height: '3px',
                            width: '100%',
                            background: theme.panelBorder,
                            borderRadius: '1.5px',
                            overflow: 'hidden'
                          }}>
                            <Box sx={{
                              height: '100%',
                              width: `${Math.min(occupancyPercent, 100)}%`,
                              background: occupancyPercent >= 90 ? theme.cancelText : theme.confirmText,
                              transition: 'width 0.5s ease'
                            }} />
                          </Box>
                        </Box>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                          <IconButton
                            onClick={() => handleEditShelter(shelter)}
                            size="small"
                            sx={{
                              p: 0.5,
                              color: theme.textMuted,
                              '&:hover': { color: theme.confirmText, background: theme.toolHover }
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 20h9" />
                              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
                            </svg>
                          </IconButton>
                          <IconButton
                            onClick={() => handleDeleteClick(shelter)}
                            size="small"
                            sx={{
                              p: 0.5,
                              color: theme.textMuted,
                              '&:hover': { color: theme.cancelText, background: theme.toolHover }
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6 17.4 20.1A2 2 0 0 1 15.4 22H8.6A2 2 0 0 1 6.6 20.1L5 6" />
                              <path d="M10 11v6" />
                              <path d="M14 11v6" />
                              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                            </svg>
                          </IconButton>
                        </Box>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Box>
          {filteredShelters.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 8, color: theme.textMuted, borderTop: `1px solid ${theme.panelBorder}` }}>
              No shelters found matching your criteria.
            </Box>
          )}
        </Box>
      )}

      {/* Modals & Dialogs */}
      {dialogOpen && selectedShelter && (
        <ShelterForm
          lat={selectedShelter.latitude || 0}
          lng={selectedShelter.longitude || 0}
          onClose={() => setDialogOpen(false)}
          onSuccess={handleFormSuccess}
          shelterId={selectedShelter.shelter_id}
          initialData={selectedShelter}
          isEditMode={true}
        />
      )}

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteShelter}
        shelterName={selectedShelter ? getShelterDisplayName(selectedShelter) : ''}
        loading={loading}
        compact
      />

      <DeleteConfirmDialog
        open={bulkDeleteDialogOpen}
        onClose={() => setBulkDeleteDialogOpen(false)}
        onConfirm={handleBulkDelete}
        shelterName={`${selectedIds.size} selected shelter(s)`}
        loading={loading}
        compact
      />

      {(headDetailsOpen || isHeadClosing) && activeHead && (
        <Box className={isHeadClosing ? "modal-backdrop-exit" : "modal-backdrop-enter"} sx={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: mode === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)',
          zIndex: 3000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(4px)',
        }}>
          <Box className={isHeadClosing ? "modal-panel-exit" : "modal-panel-enter"} sx={{
            background: theme.panelBg,
            border: `1px solid ${theme.panelBorder}`,
            borderRadius: '4px',
            width: '100%',
            maxWidth: '360px',
            p: 3,
            boxShadow: '0 14px 30px rgba(0,0,0,0.15)',
            color: theme.textMain
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography sx={{
                fontSize: '11px',
                fontWeight: 700,
                color: theme.confirmText,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                fontFamily: 'var(--font-plus-jakarta)'
              }}>
                Shelter Head Identity
              </Typography>
              <IconButton
                onClick={closeHeadDetails}
                size="small"
                sx={{
                  color: theme.textMuted,
                  p: 0.5,
                  transition: 'all 0.2s ease',
                  '&:hover': { background: theme.toolHover, color: theme.textMain }
                }}
              >
                <CloseIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>

            <Box sx={{
              p: 3,
              background: theme.toolBg,
              borderRadius: '4px',
              border: `1px solid ${theme.toolBorder}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: 1
            }}>
              <Box sx={{
                width: 48, height: 48,
                borderRadius: '50%',
                background: theme.confirmBg,
                color: theme.confirmText,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                mb: 1
              }}>
                <PersonIcon sx={{ fontSize: 24 }} />
              </Box>

              <Typography sx={{
                fontSize: '20px',
                fontWeight: 800,
                fontFamily: 'var(--font-plus-jakarta)',
                letterSpacing: '-0.03em',
                color: theme.textMain
              }}>
                {`${activeHead.fname} ${activeHead.mname ? activeHead.mname + ' ' : ''}${activeHead.lname}`}
              </Typography>

              <Typography sx={{
                fontSize: '11px',
                color: theme.textMuted,
                fontFamily: 'var(--font-geist)',
                fontWeight: 500,
                mb: 1
              }}>
                Designated Shelter Head
              </Typography>

              <Box sx={{
                display: 'flex',
                gap: 3,
                mt: 1,
                pt: 2,
                borderTop: `1px solid ${theme.panelBorder}`,
                width: '100%',
                justifyContent: 'center'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PhoneIcon sx={{ fontSize: 16, color: theme.confirmText }} />
                  <Typography sx={{ fontSize: '13px', fontWeight: 600, color: theme.textMain, fontFamily: 'var(--font-geist)' }}>
                    {activeHead.contact_num || 'No contact'}
                  </Typography>
                </Box>

                {activeHead.socmed_url && (
                  <Box
                    component="a"
                    href={activeHead.socmed_url}
                    target="_blank"
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      color: 'inherit',
                      textDecoration: 'none',
                      '&:hover': { opacity: 0.8 }
                    }}
                  >
                    <WebIcon sx={{ fontSize: 16, color: theme.confirmText }} />
                    <Typography sx={{ fontSize: '13px', fontWeight: 600, color: theme.textMain, fontFamily: 'var(--font-geist)', textDecoration: 'underline' }}>
                      Profile
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        </Box>
      )}

      {isMobile && (
        <Box sx={{ position: 'fixed', bottom: 24, right: 24, display: 'flex', flexDirection: 'column', gap: 2, zIndex: 1000 }}>
        </Box>
      )}
    </Box>

  );
}