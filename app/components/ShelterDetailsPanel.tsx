"use client";

import { useTheme } from "../contexts/ThemeContext";
import styles from "./MapComponent.module.css";

interface ShelterHead {
  head_id: number;
  fname: string | null;
  mname: string | null;
  lname: string | null;
  contact_num: string | null;
  socmed_url: string | null;
}

export interface ShelterDetails {
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
}

interface ShelterDetailsPanelProps {
  isOpen: boolean;
  shelter: ShelterDetails | null;
  isLoading?: boolean;
  error?: string | null;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

export default function ShelterDetailsPanel({
  isOpen,
  shelter,
  isLoading = false,
  error = null,
  onClose,
  onEdit,
  onDelete,
  showActions = false,
}: ShelterDetailsPanelProps) {
  const { theme } = useTheme();

  const formatName = () => {
    if (!shelter?.shelter_head) return "N/A";
    const { fname, mname, lname } = shelter.shelter_head;
    return [fname, mname, lname].filter(Boolean).join(" ") || "Unknown";
  };

  const formatCoordinate = (value: number | null) =>
    value === null || value === undefined ? "N/A" : value.toFixed(6);

  return (
    <div
      className={`${styles.sidePanel} ${isOpen ? styles.sidePanelOpen : ""}`}
      style={{
        background: theme.panelBg,
        color: theme.textMain,
        borderColor: theme.panelBorder,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 20px 16px",
          borderBottom: `1px solid ${theme.panelBorder}`,
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Evacuation Shelter Details</div>
          <div style={{ fontSize: 12, color: theme.textMuted }}>Location and head information</div>
        </div>
        <button
          aria-label="Close shelter details"
          onClick={onClose}
          style={{
            width: 34,
            height: 34,
            borderRadius: 4,
            border: `1px solid ${theme.panelBorder}`,
            background: theme.toolBg,
            color: theme.textMain,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background 0.2s ease, border-color 0.2s ease",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = theme.toolHover;
            e.currentTarget.style.borderColor = theme.toolBorder;
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = theme.toolBg;
            e.currentTarget.style.borderColor = theme.panelBorder;
          }}
        >
          ×
        </button>
      </div>

      <div style={{ padding: "20px", overflowY: "auto", height: "calc(100% - 74px)" }}>
        {isLoading ? (
          <div style={{ color: theme.textMuted, fontSize: 14 }}>Loading shelter details…</div>
        ) : error ? (
          <div style={{ color: "#ef4444", fontSize: 14 }}>{error}</div>
        ) : !shelter ? (
          <div style={{ color: theme.textMuted, fontSize: 14 }}>Select a shelter pin to see details.</div>
        ) : (
          <>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Overview</div>
              <div style={{ display: "grid", gap: 10, fontSize: 13 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span className={styles.detailLabel}>Shelter ID</span>
                  <span>{shelter.shelter_id}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span className={styles.detailLabel}>Zone</span>
                  <span>{shelter.zone_num ?? "N/A"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span className={styles.detailLabel}>Type</span>
                  <span>{shelter.type ?? "N/A"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span className={styles.detailLabel}>Barangay</span>
                  <span>{shelter.barangay_name ?? "N/A"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span className={styles.detailLabel}>Status</span>
                  {(() => {
                    const max = shelter.max_capacity || 0;
                    const curr = shelter.curr_capacity || 0;
                    let label = 'Available';
                    let color = '#22c55e'; // Emerald
                    
                    if (max > 0) {
                      const pct = (curr / max) * 100;
                      if (pct >= 100) {
                        label = 'Full';
                        color = '#ef4444';
                      } else if (pct > 80) {
                        label = 'Near Full';
                        color = '#f59e0b';
                      }
                    }

                    return (
                      <span style={{ 
                        background: color + '15', 
                        color: color, 
                        padding: '2px 8px', 
                        borderRadius: '12px', 
                        fontSize: '11px', 
                        fontWeight: 600,
                        border: `1px solid ${color}30`
                      }}>
                        {label}
                      </span>
                    );
                  })()}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span className={styles.detailLabel}>Municipality</span>
                  <span>{shelter.municipality ?? "N/A"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span className={styles.detailLabel}>Capacity</span>
                  <span>{shelter.curr_capacity ?? 0} / {shelter.max_capacity ?? "—"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span className={styles.detailLabel}>Coordinates</span>
                  <span>{formatCoordinate(shelter.latitude)}, {formatCoordinate(shelter.longitude)}</span>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Shelter Head</div>
              {shelter.shelter_head ? (
                <div style={{ display: "grid", gap: 10, fontSize: 13 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span className={styles.detailLabel}>Name</span>
                    <span>{formatName()}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span className={styles.detailLabel}>Contact</span>
                    <span>{shelter.shelter_head.contact_num ?? "N/A"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span className={styles.detailLabel}>Social</span>
                    <span style={{ maxWidth: 170, textAlign: "right", wordBreak: "break-all" }}>
                      {shelter.shelter_head.socmed_url ? (
                        <a
                          href={shelter.shelter_head.socmed_url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            color: theme.confirmText,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            textDecoration: "none",
                            transition: "opacity 0.2s ease"
                          }}
                          onMouseOver={(e) => e.currentTarget.style.opacity = "0.8"}
                          onMouseOut={(e) => e.currentTarget.style.opacity = "1"}
                        >
                          <span style={{ textDecoration: "underline" }}>
                            {(() => {
                              try {
                                return new URL(shelter.shelter_head.socmed_url).hostname.replace('www.', '');
                              } catch {
                                return "Profile Link";
                              }
                            })()}
                          </span>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                            <polyline points="15 3 21 3 21 9"></polyline>
                            <line x1="10" y1="14" x2="21" y2="3"></line>
                          </svg>
                        </a>
                      ) : (
                        "N/A"
                      )}
                    </span>
                  </div>
                </div>
              ) : (
                <div style={{ color: theme.textMuted, fontSize: 13 }}>No shelter head assigned for this location.</div>
              )}
            </div>

            {showActions && (
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={onEdit}
                  style={{
                    flex: 1,
                    minWidth: 96,
                    height: 34,
                    padding: "8px 10px",
                    borderRadius: 4,
                    border: `1px solid ${theme.panelBorder}`,
                    background: theme.toolBg,
                    color: theme.textMain,
                    cursor: onEdit ? "pointer" : "not-allowed",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    fontSize: 13,
                    transition: "background 0.2s ease, border-color 0.2s ease",
                  }}
                  onMouseOver={(e) => onEdit && (e.currentTarget.style.background = theme.toolHover)}
                  onMouseOut={(e) => e.currentTarget.style.background = theme.toolBg}
                  disabled={!onEdit}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" />
                  </svg>
                  Edit
                </button>
                <button
                  type="button"
                  onClick={onDelete}
                  style={{
                    flex: 1,
                    minWidth: 96,
                    height: 34,
                    padding: "8px 10px",
                    borderRadius: 4,
                    border: `1px solid ${theme.cancelBorder}`,
                    background: theme.cancelBg,
                    color: theme.cancelText,
                    cursor: onDelete ? "pointer" : "not-allowed",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    fontSize: 13,
                    transition: "background 0.2s ease, border-color 0.2s ease",
                  }}
                  onMouseOver={(e) => onDelete && (e.currentTarget.style.background = theme.cancelHover)}
                  onMouseOut={(e) => e.currentTarget.style.background = theme.cancelBg}
                  disabled={!onDelete}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6 17.4 20.1A2 2 0 0 1 15.4 22H8.6A2 2 0 0 1 6.6 20.1L5 6" />
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                  Delete
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
