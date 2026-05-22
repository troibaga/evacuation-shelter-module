"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Polyline, CircleMarker } from "react-leaflet";
import styles from "./MapComponent.module.css";
import { useTheme } from "../contexts/ThemeContext";
import "./MapAnimations.css";
import ShelterForm from "./ShelterForm";
import ShelterDetailsPanel, { ShelterDetails } from "./ShelterDetailsPanel";
import { deleteShelter } from "../actions/shelterActions";
import toast from "react-hot-toast";

const MAP_LAYERS = {
  street: {
    name: "Street View",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  },
  satellite: {
    name: "Satellite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
  }
};

const createPinIcon = (isSelected: boolean, isPinMode: boolean = false, status: 'Available' | 'Near Full' | 'Full' = 'Available') => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Full': return '#ef4444';      // Red
      case 'Near Full': return '#f59e0b'; // Amber
      case 'Available': return '#22c55e'; // Emerald
      default: return '#ef4444';
    }
  };

  const statusColor = getStatusColor(status);

  return new L.DivIcon({
    className: "custom-pin",
    html: `
      <div style="
        position: relative;
        width: ${isSelected ? '52px' : '44px'};
        height: ${isSelected ? '52px' : '44px'};
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        filter: ${isSelected ? 'drop-shadow(0 0 10px rgba(0, 0, 0, 0.4))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'};
        transform: ${isSelected ? 'scale(1.1) translateY(-10px)' : 'none'};
        opacity: ${isPinMode && !isSelected ? '0.4' : '1'};
        pointer-events: ${isPinMode ? 'none' : 'auto'};
      ">
        <svg width="100%" height="100%" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- The Needle/Line -->
          <line x1="14" y1="14" x2="14" y2="26" stroke="#000000" stroke-width="2" stroke-linecap="round"/>
          
          <!-- The Hexagon Head -->
          <polygon points="14,3 22.5,7.5 22.5,17.5 14,22 5.5,17.5 5.5,7.5" fill="${statusColor}" stroke="#000000" stroke-width="2"/>
          
          <!-- The Home Icon -->
          <g transform="translate(11, 9.5) scale(0.25)">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="white" stroke="#000000" stroke-width="5"/>
            <polyline points="9 22 9 12 15 12 15 22" fill="white" stroke="#000000" stroke-width="5"/>
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill="white"/>
            <polyline points="9 22 9 12 15 12 15 22" fill="white"/>
          </g>
        </svg>
      </div>
    `,
    iconSize: isSelected ? [52, 52] : [44, 44],
    iconAnchor: isSelected ? [26, 52] : [22, 44],
  });
};

function MapClickHandler({ isPinMode, isResidentPinning, setTempPinLocation, onMapClick, onResidentPin }: { isPinMode: boolean, isResidentPinning: boolean, setTempPinLocation: (latlng: L.LatLng) => void, onMapClick: () => void, onResidentPin: (latlng: L.LatLng) => void }) {
  useMapEvents({
    click(e) {
      if (isPinMode) {
        setTempPinLocation(e.latlng);
      } else if (isResidentPinning) {
        onResidentPin(e.latlng);
      } else {
        onMapClick();
      }
    }
  });
  return null;
}

interface MapComponentProps {
  allowPinning?: boolean;
}

interface ShelterHead {
  head_id: number;
  fname: string | null;
  mname: string | null;
  lname: string | null;
  contact_num: string | null;
  socmed_url: string | null;
}

interface ShelterDetailsWithLocation extends ShelterDetails {
  latitude: number;
  longitude: number;
}

export default function MapComponent({ allowPinning = false }: MapComponentProps) {
  const { theme, mode } = useTheme();

  // Fixed coordinates for Rizal, San Fernando, Camarines Sur
  const fixedCenter: [number, number] = [13.5593944, 123.1520219];
  const INITIAL_ZOOM = 15;
  const MIN_ZOOM = 14;

  // Strict bounding box to lock the user view to this barangay
  const mapBounds = L.latLngBounds(
    L.latLng(13.5393944, 123.1320219), // SouthWest
    L.latLng(13.5793944, 123.1720219)  // NorthEast
  );

  const mapRef = useRef<L.Map | null>(null);
  const [activeLayer, setActiveLayer] = useState<keyof typeof MAP_LAYERS>("satellite");
  const [showLayerMenu, setShowLayerMenu] = useState(false);

  const [isPinMode, setIsPinMode] = useState(false);
  const [tempPinLocation, setTempPinLocation] = useState<L.LatLng | null>(null);
  const [savedLocations, setSavedLocations] = useState<{ 
    latitude: number; 
    longitude: number; 
    shelter_id: number; 
    max_capacity: number;
    curr_capacity: number;
  }[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedShelterId, setSelectedShelterId] = useState<number | null>(null);
  const [selectedShelter, setSelectedShelter] = useState<ShelterDetailsWithLocation | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [recommendation, setRecommendation] = useState<any | null>(null);
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [isResidentPinning, setIsResidentPinning] = useState(false);
  const [showLocationOption, setShowLocationOption] = useState(false);

  const loadLocations = async () => {
    try {
      const response = await fetch("/api/locations");
      if (!response.ok) throw new Error("Unable to load location markers.");
      const locations = await response.json();
      if (Array.isArray(locations)) {
        const normalizedLocations = locations
          .map((location) => ({
            ...location,
            shelter_id: Number(location.shelter_id),
            latitude: Number(location.latitude),
            longitude: Number(location.longitude),
            max_capacity: location.shelter?.max_capacity || 0,
            curr_capacity: location.shelter?.curr_capacity || 0,
          }))
          .filter(
            (location) =>
              Number.isInteger(location.shelter_id) &&
              location.shelter_id > 0 &&
              Number.isFinite(location.latitude) &&
              Number.isFinite(location.longitude)
          );
        setSavedLocations(normalizedLocations);
      }
    } catch (error) {
      console.error("Location fetch failed:", error);
    }
  };

  useEffect(() => {
    // Both light and dark mode default to satellite
    setActiveLayer("satellite");
  }, [mode]);

  useEffect(() => {
    loadLocations();
  }, []);

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView(fixedCenter, INITIAL_ZOOM);
    }
  }, []);

  const handleZoomIn = () => {
    mapRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapRef.current?.zoomOut();
  };

  const handleResetLocation = () => {
    mapRef.current?.setView(fixedCenter, INITIAL_ZOOM);
  };

  const handleStartPinning = () => {
    setIsPinMode(true);
    setTempPinLocation(null);
    closeSidebar();
  };

  const handleCancelPinning = () => {
    setIsPinMode(false);
    setTempPinLocation(null);
  };

  const handleConfirmPinning = () => {
    if (tempPinLocation) {
      setShowForm(true);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setIsPinMode(false);
    setTempPinLocation(null);
    loadLocations();
  };

  const closeSidebar = () => {
    setSelectedShelterId(null);
    setSelectedShelter(null);
    setDetailsError(null);
    setDetailsLoading(false);
    setIsEditMode(false);
    setShowDeleteConfirm(false);
  };

  const handleEdit = () => {
    if (!selectedShelter) return;
    setIsEditMode(true);
  };

  const handleEditClose = () => {
    setIsEditMode(false);
    setShowForm(false);
  };

  const handleEditSuccess = () => {
    setIsEditMode(false);
    setShowForm(false);
    loadLocations();
    closeSidebar();
  };

  const handleDeleteConfirm = async () => {
    if (!selectedShelterId) return;
    
    setIsDeleting(true);
    const result = await deleteShelter(selectedShelterId);
    
    if (result.success) {
      toast.success(
        "Shelter deleted successfully!",
        {
          position: "top-left",
          style: {
            background: theme.successBg,
            color: theme.successText,
            border: `1px solid ${theme.successBorder}`,
            padding: "8px 12px",
            borderRadius: "4px",
            fontSize: "12px",
            fontWeight: 500,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          },
        }
      );
      loadLocations();
      closeSidebar();
    } else {
      toast.error(
        result.error || "Failed to delete shelter.",
        {
          position: "top-left",
          style: {
            background: theme.cancelBg,
            color: theme.cancelText,
            border: `1px solid ${theme.cancelBorder}`,
            padding: "8px 12px",
            borderRadius: "4px",
            fontSize: "12px",
            fontWeight: 500,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          },
        }
      );
    }
    
    setIsDeleting(false);
    setShowDeleteConfirm(false);
  };

  const calculateRecommendation = (userLat: number, userLng: number) => {
    const toastId = toast.loading("Analyzing nearest available shelters...", {
      style: {
        background: theme.toolBg,
        color: theme.textMain,
        border: `1px solid ${theme.toolBorder}`,
        fontSize: '13px'
      }
    });

    const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371;
      const dLat = (lat2 - lat1) * (Math.PI / 180);
      const dLon = (lon2 - lon1) * (Math.PI / 180);
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2); 
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
      return R * c;
    };

    let nearest = null;
    let minDist = Infinity;

    for (const loc of savedLocations) {
      const max = loc.max_capacity || 0;
      const curr = loc.curr_capacity || 0;
      if (max > 0 && curr < max) {
        const dist = getDistance(userLat, userLng, loc.latitude, loc.longitude);
        if (dist < minDist) {
          minDist = dist;
          nearest = loc;
        }
      }
    }

    if (nearest) {
      toast.success("Safe shelter identified!", { id: toastId });
      const recId = Math.floor(Math.random() * 999999) + 1;
      const locId = Math.floor(Math.random() * 999999) + 1;
      const now = new Date();
      const timestampStr = `${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}/${now.getFullYear()} ${now.toTimeString().split(' ')[0]}`;
      const risk = minDist < 1 ? "Low" : minDist < 3 ? "Moderate" : "High";

      setUserCoords([userLat, userLng]);
      setRecommendation({
        recommendationID: recId,
        locationID: locId,
        shelterID: nearest.shelter_id,
        distanceKm: minDist,
        riskLevel: risk,
        timestamp: timestampStr,
        shelter: nearest
      });

      if (mapRef.current) {
        mapRef.current.fitBounds([
          [userLat, userLng],
          [nearest.latitude, nearest.longitude]
        ], { padding: [100, 100], maxZoom: 17 });
      }
    } else {
      toast.error("No available shelters found in range.", { id: toastId });
    }
  };

  const handleAutoRecommend = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => calculateRecommendation(position.coords.latitude, position.coords.longitude),
      (error) => toast.error("Location access denied. Please enable GPS.")
    );
  };

  const handleResidentPin = (latlng: L.LatLng) => {
    setIsResidentPinning(false);
    calculateRecommendation(latlng.lat, latlng.lng);
  };

  const fetchShelterDetails = async (shelterId: number) => {
    if (!Number.isInteger(shelterId) || shelterId <= 0) {
      setDetailsError("Invalid shelter ID.");
      setSelectedShelter(null);
      return;
    }

    setDetailsLoading(true);
    setDetailsError(null);

    try {
      const response = await fetch(`/api/shelters?id=${encodeURIComponent(String(shelterId))}`);
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Unable to load shelter details.");
      }

      setSelectedShelter(payload as ShelterDetailsWithLocation);
    } catch (error) {
      setSelectedShelter(null);
      setDetailsError(error instanceof Error ? error.message : "Unable to load shelter details.");
      console.error("Shelter details fetch failed:", error);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleMarkerClick = (shelterId: unknown, position?: [number, number]) => {
    const id = Number(shelterId);
    if (!Number.isInteger(id) || id <= 0) {
      console.warn("Invalid shelter ID clicked:", shelterId);
      setSelectedShelterId(null);
      setDetailsError("Invalid shelter ID.");
      return;
    }

    if (position && mapRef.current) {
      mapRef.current.setView(position, 18);
    }

    setSelectedShelterId(id);
    if (!selectedShelter || selectedShelter.shelter_id !== id) {
      fetchShelterDetails(id);
    }
  };

  useEffect(() => {
    if (!selectedShelterId) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeSidebar();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [selectedShelterId]);

  return (
    <div className={styles.mapWrapper} style={{ position: "relative", height: "100%", width: "100%" }}>
      {/* Management Mode Toast */}
      {allowPinning && isPinMode && (
        <div
          style={{
            position: "absolute",
            zIndex: 1000,
            top: 20,
            left: 20,
            background: theme.confirmBg,
            padding: "8px 12px",
            borderRadius: "4px",
            border: `1px solid ${theme.confirmBorder}`,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            display: "flex",
            alignItems: "center",
          }}
        >
          <span style={{ color: theme.confirmText, fontSize: "12px", fontWeight: 500 }}>
            Evacuation Shelter Management Mode
          </span>
        </div>
      )}

      {/* Map Tools Panel */}
      <div
        style={{
          position: "absolute",
          zIndex: 1000,
          right: 20,
          top: 20,
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          background: theme.panelBg,
          padding: "4px",
          borderRadius: "4px",
          border: `1px solid ${theme.panelBorder}`,
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        }}
      >
        <div style={{ position: "relative" }} className="group">
          <button
            onClick={handleZoomIn}
            style={{ width: "28px", height: "28px", border: `1px solid ${theme.toolBorder}`, background: theme.toolBg, color: theme.textMain, borderRadius: "4px", cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}
            onMouseOver={(e) => e.currentTarget.style.background = theme.toolHover}
            onMouseOut={(e) => e.currentTarget.style.background = theme.toolBg}
          >
            +
          </button>
          <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-2 py-1 text-[10px] font-medium rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50" style={{ background: theme.toolBg, color: theme.textMain, border: `1px solid ${theme.toolBorder}` }}>
            Zoom In
          </div>
        </div>
        <div style={{ position: "relative" }} className="group">
          <button
            onClick={handleZoomOut}
            style={{ width: "28px", height: "28px", border: `1px solid ${theme.toolBorder}`, background: theme.toolBg, color: theme.textMain, borderRadius: "4px", cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}
            onMouseOver={(e) => e.currentTarget.style.background = theme.toolHover}
            onMouseOut={(e) => e.currentTarget.style.background = theme.toolBg}
          >
            -
          </button>
          <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-2 py-1 text-[10px] font-medium rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50" style={{ background: theme.toolBg, color: theme.textMain, border: `1px solid ${theme.toolBorder}` }}>
            Zoom Out
          </div>
        </div>
        <div style={{ position: "relative" }} className="group">
          <button
            onClick={handleResetLocation}
            style={{ width: "28px", height: "28px", border: `1px solid ${theme.toolBorder}`, background: theme.toolBg, color: theme.textMain, borderRadius: "4px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}
            onMouseOver={(e) => e.currentTarget.style.background = theme.toolHover}
            onMouseOut={(e) => e.currentTarget.style.background = theme.toolBg}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </button>
          <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-2 py-1 text-[10px] font-medium rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50" style={{ background: theme.toolBg, color: theme.textMain, border: `1px solid ${theme.toolBorder}` }}>
            Reset View
          </div>
        </div>
        
        <div style={{ position: "relative" }} className="group">
          <button
            onClick={() => setShowLayerMenu(!showLayerMenu)}
            style={{ width: "28px", height: "28px", border: `1px solid ${theme.toolBorder}`, background: showLayerMenu ? theme.toolActive : theme.toolBg, color: theme.textMain, borderRadius: "4px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}
            onMouseOver={(e) => !showLayerMenu && (e.currentTarget.style.background = theme.toolHover)}
            onMouseOut={(e) => !showLayerMenu && (e.currentTarget.style.background = theme.toolBg)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
              <polyline points="2 12 12 17 22 12"></polyline>
              <polyline points="2 17 12 22 22 17"></polyline>
            </svg>
          </button>
          {!showLayerMenu && (
            <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-2 py-1 text-[10px] font-medium rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50" style={{ background: theme.toolBg, color: theme.textMain, border: `1px solid ${theme.toolBorder}` }}>
              Change Layer
            </div>
          )}
          
          {showLayerMenu && (
            <div
              style={{
                position: "absolute",
                right: "36px",
                top: 0,
                background: theme.panelBg,
                borderRadius: "4px",
                padding: "4px",
                border: `1px solid ${theme.panelBorder}`,
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                width: "120px",
                display: "flex",
                flexDirection: "column",
                gap: "2px"
              }}
            >
              {Object.entries(MAP_LAYERS).map(([key, layer]) => (
                <button
                  key={key}
                  onClick={() => {
                    setActiveLayer(key as keyof typeof MAP_LAYERS);
                    setShowLayerMenu(false);
                  }}
                  style={{
                    textAlign: "left",
                    padding: "4px 6px",
                    border: "none",
                    background: activeLayer === key ? theme.toolActive : "transparent",
                    color: activeLayer === key ? theme.textMain : theme.textMuted,
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: activeLayer === key ? 500 : 400,
                    transition: "all 0.15s ease"
                  }}
                  onMouseOver={(e) => activeLayer !== key && (e.currentTarget.style.background = theme.toolBg)}
                  onMouseOut={(e) => activeLayer !== key && (e.currentTarget.style.background = "transparent")}
                >
                  {layer.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {allowPinning && (
          <>
            <div style={{ width: "100%", height: "1px", background: theme.panelBorder, margin: "2px 0" }} />
            <div style={{ position: "relative" }} className="group">
              <button
                onClick={handleStartPinning}
                disabled={isPinMode}
                style={{ width: "28px", height: "28px", border: `1px solid ${theme.toolBorder}`, background: isPinMode ? theme.toolActive : theme.toolBg, color: theme.textMain, borderRadius: "4px", cursor: isPinMode ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", opacity: isPinMode ? 0.6 : 1 }}
                onMouseOver={(e) => !isPinMode && (e.currentTarget.style.background = theme.toolHover)}
                onMouseOut={(e) => !isPinMode && (e.currentTarget.style.background = theme.toolBg)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
              </button>
              {!isPinMode && (
                <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-2 py-1 text-[10px] font-medium rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50" style={{ background: theme.toolBg, color: theme.textMain, border: `1px solid ${theme.toolBorder}` }}>
                  Place Pin
                </div>
              )}
            </div>
            
            <div style={{ position: "relative" }} className="group">
              <button
                onClick={handleConfirmPinning}
                disabled={!isPinMode || !tempPinLocation}
                style={{ 
                  width: "28px", height: "28px", 
                  border: (!isPinMode || !tempPinLocation) ? `1px solid ${theme.toolBorder}` : `1px solid ${theme.confirmBorder}`, 
                  background: (!isPinMode || !tempPinLocation) ? theme.toolBg : theme.confirmBg, 
                  color: (!isPinMode || !tempPinLocation) ? theme.textMuted : theme.confirmText, 
                  borderRadius: "4px", cursor: (!isPinMode || !tempPinLocation) ? "not-allowed" : "pointer", 
                  display: "flex", alignItems: "center", justifyContent: "center", 
                  transition: "all 0.2s", opacity: (!isPinMode || !tempPinLocation) ? 0.4 : 1 
                }}
                onMouseOver={(e) => (!isPinMode || !tempPinLocation) ? null : (e.currentTarget.style.background = theme.confirmHover)}
                onMouseOut={(e) => (!isPinMode || !tempPinLocation) ? null : (e.currentTarget.style.background = theme.confirmBg)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </button>
              {(isPinMode && tempPinLocation) && (
                <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-2 py-1 text-[10px] font-medium rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50" style={{ background: theme.confirmBg, color: theme.confirmText, border: `1px solid ${theme.confirmBorder}` }}>
                  Save
                </div>
              )}
            </div>

            <div style={{ position: "relative" }} className="group">
              <button
                onClick={handleCancelPinning}
                disabled={!isPinMode}
                style={{ 
                  width: "28px", height: "28px", 
                  border: !isPinMode ? `1px solid ${theme.toolBorder}` : `1px solid ${theme.cancelBorder}`, 
                  background: !isPinMode ? theme.toolBg : theme.cancelBg, 
                  color: !isPinMode ? theme.textMuted : theme.cancelText, 
                  borderRadius: "4px", cursor: !isPinMode ? "not-allowed" : "pointer", 
                  display: "flex", alignItems: "center", justifyContent: "center", 
                  transition: "all 0.2s", opacity: !isPinMode ? 0.4 : 1 
                }}
                onMouseOver={(e) => !isPinMode ? null : (e.currentTarget.style.background = theme.cancelHover)}
                onMouseOut={(e) => !isPinMode ? null : (e.currentTarget.style.background = theme.cancelBg)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
              {isPinMode && (
                <div className="absolute right-full mr-2 top-1/2 -translate-y-1/2 px-2 py-1 text-[10px] font-medium rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50" style={{ background: theme.cancelBg, color: theme.cancelText, border: `1px solid ${theme.cancelBorder}` }}>
                  Cancel
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <ShelterDetailsPanel
        isOpen={selectedShelterId !== null}
        shelter={selectedShelter}
        isLoading={detailsLoading}
        error={detailsError}
        onClose={closeSidebar}
        showActions={allowPinning}
        onEdit={allowPinning ? handleEdit : undefined}
        onDelete={allowPinning ? () => setShowDeleteConfirm(true) : undefined}
      />

      {/* Shelter Registration Form Modal */}
      {(showForm && tempPinLocation && !isEditMode) && (
        <ShelterForm
          lat={tempPinLocation.lat}
          lng={tempPinLocation.lng}
          onClose={() => setShowForm(false)}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Shelter Edit Form Modal */}
      {isEditMode && selectedShelter && selectedShelterId && (
        <ShelterForm
          lat={selectedShelter.latitude || 0}
          lng={selectedShelter.longitude || 0}
          onClose={handleEditClose}
          onSuccess={handleEditSuccess}
          shelterId={selectedShelterId}
          initialData={selectedShelter}
          isEditMode={true}
        />
      )}

      {/* Resident Recommendation UI */}
      {!allowPinning && (
        <div style={{ position: "absolute", bottom: 40, left: "50%", transform: "translateX(-50%)", zIndex: 1000, display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
          {showLocationOption ? (
            <div style={{ background: theme.panelBg, border: `1px solid ${theme.panelBorder}`, padding: "16px", borderRadius: "12px", boxShadow: "0 8px 32px rgba(0,0,0,0.2)", display: "flex", gap: "10px", backdropFilter: "blur(8px)" }}>
              <button 
                onClick={() => {
                  setShowLocationOption(false);
                  handleAutoRecommend();
                }}
                style={{ padding: "10px 16px", background: theme.confirmBg, color: theme.confirmText, border: "none", borderRadius: "8px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
              >
                Auto GPS
              </button>
              <button 
                onClick={() => {
                  setShowLocationOption(false);
                  setIsResidentPinning(true);
                  toast("Click on the map to set your current location.", { icon: "📍" });
                }}
                style={{ padding: "10px 16px", background: theme.toolBg, color: theme.textMain, border: `1px solid ${theme.toolBorder}`, borderRadius: "8px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
              >
                Pin on Map (Demo)
              </button>
              <button onClick={() => setShowLocationOption(false)} style={{ padding: "10px 16px", background: "transparent", color: theme.textMuted, border: "none", cursor: "pointer", fontSize: "12px" }}>Cancel</button>
            </div>
          ) : isResidentPinning ? (
            <div style={{ background: theme.cancelBg, color: theme.cancelText, padding: "10px 20px", borderRadius: "50px", fontSize: "12px", fontWeight: 600, border: `1px solid ${theme.cancelBorder}`, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
              Set location: Click any point on the map
            </div>
          ) : (
            <button
              onClick={() => setShowLocationOption(true)}
            style={{
              padding: "12px 28px",
              background: theme.confirmBg,
              color: theme.confirmText,
              border: `1px solid ${theme.confirmBorder}`,
              borderRadius: "50px",
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
              transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              backdropFilter: "blur(8px)",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.25)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.15)";
            }}
          >
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            Recommend Nearest Shelter
            </button>
          )}
        </div>
      )}

      {/* Recommendation Modal */}
      {recommendation && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", zIndex: 5000, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(5px)" }}>
          <div style={{ background: theme.panelBg, border: `1px solid ${theme.panelBorder}`, borderRadius: "16px", width: "90%", maxWidth: "440px", padding: "32px", boxShadow: "0 20px 50px rgba(0,0,0,0.3)", position: "relative" }}>
            <button onClick={() => setRecommendation(null)} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", color: theme.textMuted, cursor: "pointer", fontSize: "20px" }}>×</button>
            
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: theme.confirmBg + '20', display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                 <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={theme.confirmText} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h3 style={{ fontSize: "20px", fontWeight: 800, color: theme.textMain, margin: "0 0 8px" }}>Shelter Recommended</h3>
              <p style={{ fontSize: "14px", color: theme.textMuted, margin: 0 }}>Safe path analyzed based on your proximity.</p>
            </div>

            <div style={{ display: "grid", gap: "16px", background: theme.toolBg + '40', padding: "20px", borderRadius: "12px", border: `1px solid ${theme.toolBorder}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: `1px solid ${theme.panelBorder}`, paddingBottom: "10px" }}>
                <span style={{ fontSize: "12px", color: theme.textMuted }}>Recommendation ID</span>
                <span style={{ fontSize: "12px", fontWeight: 700, color: theme.textMain }}>#{recommendation.recommendationID}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: `1px solid ${theme.panelBorder}`, paddingBottom: "10px" }}>
                <span style={{ fontSize: "12px", color: theme.textMuted }}>Distance</span>
                <span style={{ fontSize: "12px", fontWeight: 700, color: theme.textMain }}>{recommendation.distanceKm.toFixed(2)} km</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: `1px solid ${theme.panelBorder}`, paddingBottom: "10px" }}>
                <span style={{ fontSize: "12px", color: theme.textMuted }}>Travel Risk</span>
                <span style={{ 
                  fontSize: "11px", 
                  fontWeight: 800, 
                  color: recommendation.riskLevel === "Low" ? "#22c55e" : recommendation.riskLevel === "Moderate" ? "#f59e0b" : "#ef4444",
                  textTransform: "uppercase"
                }}>
                  {recommendation.riskLevel}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "12px", color: theme.textMuted }}>Generated At</span>
                <span style={{ fontSize: "12px", fontWeight: 500, color: theme.textMain }}>{recommendation.timestamp}</span>
              </div>
            </div>

            <button
              onClick={() => {
                handleMarkerClick(recommendation.shelter.shelter_id, [recommendation.shelter.latitude, recommendation.shelter.longitude]);
                setRecommendation(null);
              }}
              style={{
                width: "100%",
                marginTop: "24px",
                padding: "14px",
                background: theme.confirmBg,
                color: theme.confirmText,
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer",
                transition: "opacity 0.2s"
              }}
              onMouseOver={(e) => e.currentTarget.style.opacity = "0.9"}
              onMouseOut={(e) => e.currentTarget.style.opacity = "1"}
            >
              Go to Shelter Pin
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedShelter && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: mode === "dark" ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.7)",
            zIndex: 3000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            style={{
              background: theme.panelBg,
              border: `1px solid ${theme.panelBorder}`,
              borderRadius: "10px",
              width: "100%",
              maxWidth: "400px",
              padding: "24px",
              boxShadow: "0 14px 30px rgba(0,0,0,0.15)",
            }}
          >
            <h3 style={{ fontSize: "18px", fontWeight: 700, color: theme.textMain, margin: "0 0 12px", fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
              Delete Shelter?
            </h3>
            <p style={{ fontSize: "14px", color: theme.textMuted, margin: "0 0 24px", lineHeight: 1.5 }}>
              This will permanently delete the shelter location and all associated data including the shelter head information. This action cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                style={{
                  padding: "6px 12px",
                  background: theme.toolBg,
                  border: `1px solid ${theme.toolBorder}`,
                  color: theme.textMain,
                  borderRadius: "4px",
                  cursor: isDeleting ? "not-allowed" : "pointer",
                  fontWeight: 500,
                  fontSize: "12px",
                  opacity: isDeleting ? 0.6 : 1,
                }}
                onMouseOver={(e) => !isDeleting && (e.currentTarget.style.background = theme.toolHover)}
                onMouseOut={(e) => !isDeleting && (e.currentTarget.style.background = theme.toolBg)}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                style={{
                  padding: "6px 12px",
                  background: theme.cancelBg,
                  border: `1px solid ${theme.cancelBorder}`,
                  color: theme.cancelText,
                  borderRadius: "4px",
                  cursor: isDeleting ? "not-allowed" : "pointer",
                  fontWeight: 500,
                  fontSize: "12px",
                  opacity: isDeleting ? 0.6 : 1,
                }}
                onMouseOver={(e) => !isDeleting && (e.currentTarget.style.background = theme.cancelHover)}
                onMouseOut={(e) => !isDeleting && (e.currentTarget.style.background = theme.cancelBg)}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <MapContainer
        ref={mapRef}
        center={fixedCenter}
        zoom={INITIAL_ZOOM}
        minZoom={MIN_ZOOM}
        maxZoom={18}
        maxBounds={mapBounds}
        maxBoundsViscosity={1.0}
        className={styles.mapContainer}
        zoomControl={false}
        dragging={true}
        scrollWheelZoom={true}
        style={isPinMode ? { cursor: "crosshair" } : {}}
      >
        <TileLayer
          url={MAP_LAYERS[activeLayer].url}
          attribution={MAP_LAYERS[activeLayer].attribution}
        />
        <MapClickHandler 
          isPinMode={isPinMode} 
          isResidentPinning={isResidentPinning}
          setTempPinLocation={setTempPinLocation} 
          onMapClick={closeSidebar} 
          onResidentPin={handleResidentPin}
        />
        
        {/* Navigation path line with glow effect */}
        {userCoords && recommendation?.shelter && (
          <>
            {/* Glow/Shadow Line */}
            <Polyline
              key={`glow-${recommendation.recommendationID}`}
              positions={[
                [userCoords[0], userCoords[1]],
                [recommendation.shelter.latitude, recommendation.shelter.longitude]
              ]}
              pathOptions={{
                color: "#3b82f6",
                weight: 8,
                opacity: 0.3,
                lineJoin: "round",
                lineCap: "round"
              }}
            />
            {/* Main Animated Line */}
            <Polyline
              key={`main-${recommendation.recommendationID}`}
              positions={[
                [userCoords[0], userCoords[1]],
                [recommendation.shelter.latitude, recommendation.shelter.longitude]
              ]}
              pathOptions={{
                color: "#3b82f6",
                weight: 4,
                dashArray: "10, 15",
                opacity: 1,
                lineJoin: "round",
                lineCap: "round",
                className: "navigation-path-animated"
              }}
            />
          </>
        )}


        {/* User Location Indicator */}
        {userCoords && (
          <>
            <CircleMarker
              center={userCoords}
              radius={8}
              pathOptions={{
                fillColor: "#3b82f6",
                fillOpacity: 1,
                color: "#ffffff",
                weight: 2
              }}
            >
              <Popup>Your Location</Popup>
            </CircleMarker>
            <CircleMarker
              center={userCoords}
              radius={15}
              pathOptions={{
                fillColor: "#3b82f6",
                fillOpacity: 0.2,
                color: "#3b82f6",
                weight: 1,
                dashArray: "2, 4"
              }}
            />
          </>
        )}

        {savedLocations.map((location) => {
          const markerShelterId = Number(location.shelter_id);
          const isSelected = selectedShelterId === markerShelterId;
          const clickHandlers = (!isPinMode && Number.isInteger(markerShelterId) && markerShelterId > 0)
            ? { click: () => handleMarkerClick(markerShelterId, [location.latitude, location.longitude]) }
            : undefined;

          return (
            <Marker
              key={`${markerShelterId}-${location.latitude}-${location.longitude}`}
              position={[location.latitude, location.longitude]}
              icon={createPinIcon(
                isSelected, 
                isPinMode, 
                (() => {
                  const max = location.max_capacity || 0;
                  const curr = location.curr_capacity || 0;
                  if (max === 0) return 'Available';
                  const pct = (curr / max) * 100;
                  if (pct >= 100) return 'Full';
                  if (pct > 80) return 'Near Full';
                  return 'Available';
                })()
              )}
              eventHandlers={clickHandlers}
              zIndexOffset={isSelected ? 1000 : 0}
            />
          );
        })}
        {tempPinLocation && <Marker position={tempPinLocation} icon={createPinIcon(false, false)} />}
      </MapContainer>
    </div>
  );
}