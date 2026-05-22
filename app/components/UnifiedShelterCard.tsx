"use client";

import React from "react";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocationOn as LocationIcon,
  People as PeopleIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import { UnifiedShelter } from './UnifiedShelterManagement';
import { useTheme } from '../contexts/ThemeContext';

interface UnifiedShelterCardProps {
  shelter: UnifiedShelter;
  onEdit: (shelter: UnifiedShelter) => void;
  onDelete: (shelter: UnifiedShelter) => void;
}

export function UnifiedShelterCard({ shelter, onEdit, onDelete }: UnifiedShelterCardProps) {
  const { theme, mode } = useTheme();
  
  const totalOccupancy = shelter.curr_capacity || 0;
  const capacity = shelter.max_capacity || 0;
  const occupancyPercent = capacity > 0 ? (totalOccupancy / capacity) * 100 : 0;

  const getStatusChipStyle = () => {
    if (occupancyPercent >= 100) {
      return {
        bgcolor: theme.cancelBg,
        color: theme.cancelText,
        border: `1px solid ${theme.cancelBorder}`,
        label: 'Full'
      };
    } else if (occupancyPercent > 80) {
      return {
        bgcolor: mode === 'dark' ? 'rgba(217, 119, 6, 0.1)' : 'rgba(217, 119, 6, 0.05)',
        color: '#f59e0b',
        border: '1px solid #f59e0b',
        label: 'Near Full'
      };
    }
    return {
      bgcolor: theme.successBg,
      color: theme.successText,
      border: `1px solid ${theme.successBorder}`,
      label: 'Available'
    };
  };

  const statusStyle = getStatusChipStyle();
  
  const getDisplayName = () => {
    if (shelter.shelter_head) {
      const { fname, mname, lname } = shelter.shelter_head;
      return [fname, mname, lname].filter(Boolean).join(" ") || `Shelter #${shelter.shelter_id}`;
    }
    return shelter.barangay_name || `Shelter #${shelter.shelter_id}`;
  };

  const displayName = getDisplayName();

  return (
    <div style={{
      background: theme.toolBg,
      border: `1px solid ${theme.panelBorder}`,
      borderRadius: "4px",
      padding: "12px",
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      color: theme.textMain,
      fontFamily: "Inter, system-ui, -apple-system, sans-serif",
      transition: "all 0.2s ease",
      boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ 
            fontSize: "14px", 
            fontWeight: 700, 
            marginBottom: "2px",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis"
          }} title={displayName}>
            {displayName}
          </div>
          <div style={{ fontSize: "10px", color: theme.textMuted, fontWeight: 500 }}>ID: #{shelter.shelter_id}</div>
        </div>
        <div style={{
          padding: "2px 6px",
          borderRadius: "4px",
          fontSize: "9px",
          fontWeight: 700,
          textTransform: "uppercase",
          background: statusStyle.bgcolor,
          color: statusStyle.color,
          border: statusStyle.border,
          whiteSpace: "nowrap",
          marginLeft: "12px"
        }}>
          {statusStyle.label}
        </div>
      </div>

      <div style={{ display: "grid", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <LocationIcon sx={{ fontSize: 14, color: theme.textMuted }} />
          <div style={{ fontSize: "12px", color: theme.textMain }}>
            {shelter.barangay_name}, {shelter.municipality}
            {shelter.zone_num && <span style={{ color: theme.textMuted }}> • Zone {shelter.zone_num}</span>}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <HomeIcon sx={{ fontSize: 14, color: theme.textMuted }} />
          <div style={{ fontSize: "11px", color: theme.textMuted, textTransform: "capitalize" }}>
            {shelter.type}
          </div>
        </div>

        <div style={{ marginTop: "2px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
            <span style={{ fontSize: "10px", fontWeight: 700, color: theme.textMuted, letterSpacing: "0.03em" }}>OCCUPANCY</span>
            <span style={{ fontSize: "10px", fontWeight: 700 }}>{shelter.curr_capacity} / {shelter.max_capacity}</span>
          </div>
          <div style={{ 
            height: "4px", 
            background: theme.panelBorder, 
            borderRadius: "2px", 
            overflow: "hidden" 
          }}>
            <div style={{ 
              height: "100%", 
              width: `${Math.min(occupancyPercent, 100)}%`, 
              background: occupancyPercent >= 90 ? theme.cancelText : theme.confirmText,
              transition: "width 0.5s ease"
            }} />
          </div>
        </div>
      </div>

      <div style={{ 
        display: "flex", 
        gap: "6px", 
        marginTop: "2px",
        paddingTop: "12px",
        borderTop: `1px solid ${theme.panelBorder}`
      }}>
        <button
          onClick={() => onEdit(shelter)}
          style={{
            flex: 1,
            padding: "6px",
            background: theme.toolBg,
            border: `1px solid ${theme.toolBorder}`,
            color: theme.textMain,
            borderRadius: "4px",
            fontSize: "11px",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "4px",
            transition: "all 0.2s ease"
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = theme.toolHover)}
          onMouseOut={(e) => (e.currentTarget.style.background = theme.toolBg)}
        >
          <EditIcon sx={{ fontSize: 14 }} />
          Edit
        </button>
        <button
          onClick={() => onDelete(shelter)}
          style={{
            flex: 1,
            padding: "6px",
            background: theme.cancelBg,
            border: `1px solid ${theme.cancelBorder}`,
            color: theme.cancelText,
            borderRadius: "4px",
            fontSize: "11px",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "4px",
            transition: "all 0.2s ease"
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = theme.cancelHover)}
          onMouseOut={(e) => (e.currentTarget.style.background = theme.cancelBg)}
        >
          <DeleteIcon sx={{ fontSize: 14 }} />
          Delete
        </button>
      </div>
    </div>
  );
}
