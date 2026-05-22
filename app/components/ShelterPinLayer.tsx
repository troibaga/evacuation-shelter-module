import L, { LatLng } from "leaflet";
import { FormEvent, useEffect, useRef } from "react";
import { Marker, Popup, useMapEvents } from "react-leaflet";

interface ShelterPinLayerProps {
  pinMode: boolean;
  onPinPlaced: (latlng: LatLng) => void;
  pinLocation: LatLng | null;
  onCancelPin: () => void;
  onConfirmPin: () => void;
  showForm: boolean;
  onFormSubmit: (e: FormEvent<HTMLFormElement>) => void;
}

const pinIcon = new L.Icon({
  iconUrl: "https://cdn.jsdelivr.net/npm/leaflet@1.9.3/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [0, -41],
});

export default function ShelterPinLayer({
  pinMode,
  onPinPlaced,
  pinLocation,
  onCancelPin,
  onConfirmPin,
  showForm,
  onFormSubmit,
}: ShelterPinLayerProps) {
  const popupRef = useRef<L.Popup>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);

  // Focus address input when form is shown
  useEffect(() => {
    if (showForm && addressInputRef.current) {
      addressInputRef.current.focus();
    }
  }, [showForm]);

  // Handle map click for pin placement
  useMapEvents({
    click(e) {
      if (pinMode && !pinLocation) {
        onPinPlaced(e.latlng);
        // Immediately confirm and show the allocation form
        onConfirmPin();
      }
    },
  });

  if (!pinLocation) return null;

  // Consistent Theme Colors
  const theme = {
    primary: "#526D82",      // Desaturated Blue
    primaryHover: "#425a6e",
    panelBg: "#ffffff",
    panelBorder: "#cbd5e1",
    inputBg: "#ffffff",
    inputBorder: "#cbd5e1",
    inputBgReadOnly: "#f1f5f9",
    textMain: "#1e293b",
    textMuted: "#475569"
  };

  // Use key on Popup to force remount and auto-open when pinLocation or showForm changes
  return (
    <Marker position={pinLocation} icon={pinIcon}>
      <Popup autoPan key={showForm ? 'form' : `${pinLocation.lat},${pinLocation.lng}`}> 
        {showForm ? (
          <form
            onSubmit={onFormSubmit}
            style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 220, padding: "2px", background: theme.panelBg }}
          >
            <div style={{ fontWeight: 500, fontSize: 14, color: theme.textMain, letterSpacing: "-0.01em" }}>Shelter Details</div>
            <label style={{ fontSize: 12, color: theme.textMuted, display: "flex", flexDirection: "column", gap: 4 }}>
              Address
              <input
                name="address"
                ref={addressInputRef}
                required
                style={{ 
                  width: "100%", 
                  padding: "8px 10px", 
                  borderRadius: 6, 
                  border: `1px solid ${theme.inputBorder}`, 
                  background: theme.inputBg,
                  color: theme.textMain,
                  outline: "none", 
                  transition: "border-color 0.2s, box-shadow 0.2s", 
                  fontSize: 13,
                  boxSizing: "border-box"
                }}
                placeholder="Enter shelter address"
                autoComplete="off"
                onFocus={(e) => {
                  e.target.style.borderColor = theme.primary;
                  e.target.style.boxShadow = `0 0 0 1px ${theme.primary}`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = theme.inputBorder;
                  e.target.style.boxShadow = "none";
                }}
              />
            </label>
            <label style={{ fontSize: 12, color: theme.textMuted, display: "flex", flexDirection: "column", gap: 4 }}>
              Coordinates
              <input
                name="coordinates"
                value={`${pinLocation.lat.toFixed(6)}, ${pinLocation.lng.toFixed(6)}`}
                readOnly
                style={{ 
                  width: "100%", 
                  padding: "8px 10px", 
                  borderRadius: 6, 
                  border: `1px solid ${theme.inputBorder}`, 
                  background: theme.inputBgReadOnly, 
                  color: theme.textMuted, 
                  fontSize: 13,
                  boxSizing: "border-box"
                }}
              />
            </label>
            <button 
              type="submit" 
              style={{ 
                background: theme.primary, 
                color: "#fff", 
                border: `1px solid ${theme.primaryHover}`, 
                borderRadius: 6, 
                padding: "8px 0", 
                fontWeight: 500, 
                fontSize: 13, 
                cursor: "pointer", 
                marginTop: 4, 
                transition: "all 0.2s ease",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)"
              }} 
              onMouseOver={(e) => {
                e.currentTarget.style.background = theme.primaryHover;
              }} 
              onMouseOut={(e) => {
                e.currentTarget.style.background = theme.primary;
              }}
            >
              Confirm Shelter
            </button>
          </form>
        ) : null}
      </Popup>
    </Marker>
  );
}
