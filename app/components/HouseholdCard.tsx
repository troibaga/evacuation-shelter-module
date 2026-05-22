import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  IconButton,
  Box,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  LocationOn as LocationIcon,
  People as PeopleIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import { Household } from './HouseholdManagement';

interface HouseholdCardProps {
  household: Household;
  onView: (household: Household) => void;
  onEdit: (household: Household) => void;
  onDelete: (household: Household) => void;
}

export function HouseholdCard({ household, onView, onEdit, onDelete }: HouseholdCardProps) {
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flex: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
          <Typography variant="h6" component="h3" sx={{ flex: 1, pr: 1 }}>
            {household.lastName}, {household.firstName}
          </Typography>
          {household.isEvacuationShelter ? (
            <Chip label="Shelter" color="success" size="small" />
          ) : household.evacuationShelterName ? (
            <Chip label="Evacuated" color="primary" size="small" />
          ) : (
            <Chip label="Not Evacuated" color="default" size="small" />
          )}
        </Box>

        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
            <LocationIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {household.address}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
            <PeopleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {household.numMembers} {household.numMembers === 1 ? 'member' : 'members'}
            </Typography>
          </Box>
          {household.isEvacuationShelter ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <HomeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                Occupancy: {household.numMembers + household.currentShelterOccupancy}/{household.shelterCapacity}
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <HomeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {household.evacuationShelterName || 'No evacuation shelter'}
              </Typography>
            </Box>
          )}
        </Box>

        <Typography
          variant="caption"
          color="text.secondary"
          
          sx={{ display: 'block' }}
        >
          ID: {household.householdID}
        </Typography>
      </CardContent>

      <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
        <IconButton
          size="small"
          color="primary"
          onClick={() => onView(household)}
          title="View Details"
        >
          <ViewIcon />
        </IconButton>
        <IconButton
          size="small"
          color="info"
          onClick={() => onEdit(household)}
          title="Edit"
        >
          <EditIcon />
        </IconButton>
        <IconButton
          size="small"
          color="error"
          onClick={() => onDelete(household)}
          title="Delete"
        >
          <DeleteIcon />
        </IconButton>
      </CardActions>
    </Card>
  );
}
