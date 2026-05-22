import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  IconButton,
  Box,
  LinearProgress,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  LocationOn as LocationIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import { Shelter } from './ShelterManagement';

interface ShelterCardProps {
  shelter: Shelter;
  onView: (shelter: Shelter) => void;
  onEdit: (shelter: Shelter) => void;
  onDelete: (shelter: Shelter) => void;
}

export function ShelterCard({ shelter, onView, onEdit, onDelete }: ShelterCardProps) {
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

  const occupancyPercentage = (shelter.currentOccupancy / shelter.capacity) * 100;

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flex: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
          <Typography variant="h6" component="h3" sx={{ flex: 1, pr: 1 }}>
            {shelter.shelterName}
          </Typography>
          <Chip
            label={shelter.status}
            color={getStatusColor(shelter.status) as any}
            size="small"
          />
        </Box>

        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
            <LocationIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {shelter.latitude.toFixed(4)}, {shelter.longitude.toFixed(4)}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <PeopleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              Capacity: {shelter.currentOccupancy} / {shelter.capacity}
            </Typography>
          </Box>
        </Box>

        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              Occupancy Rate
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
              {occupancyPercentage.toFixed(1)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={occupancyPercentage}
            color={getStatusColor(shelter.status) as any}
            sx={{ height: 8, borderRadius: 1 }}
          />
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
          ID: {shelter.shelterID}
        </Typography>
      </CardContent>

      <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
        <IconButton
          size="small"
          color="primary"
          onClick={() => onView(shelter)}
          title="View Details"
        >
          <ViewIcon />
        </IconButton>
        <IconButton
          size="small"
          color="info"
          onClick={() => onEdit(shelter)}
          title="Edit"
        >
          <EditIcon />
        </IconButton>
        <IconButton
          size="small"
          color="error"
          onClick={() => onDelete(shelter)}
          title="Delete"
        >
          <DeleteIcon />
        </IconButton>
      </CardActions>
    </Card>
  );
}
