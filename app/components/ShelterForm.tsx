"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { submitShelter, updateShelter } from "../actions/shelterActions";
import styles from "./ShelterForm.module.css";
import toast from "react-hot-toast";
import { IconButton, Box, Typography, Button } from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";

interface ShelterFormProps {
  lat: number;
  lng: number;
  onClose: () => void;
  onSuccess: () => void;
  shelterId?: number;
  initialData?: any;
  isEditMode?: boolean;
}

export default function ShelterForm({ lat, lng, onClose, onSuccess, shelterId, initialData, isEditMode = false }: ShelterFormProps) {
  const { theme, mode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => onClose(), 190);
  };

  const validateName = (value: string) => {
    if (!value.trim()) return null;
    if (!/^[a-zA-Z\s'\.\-]+$/.test(value.trim())) return "Name must contain only letters, spaces, hyphens, periods, or apostrophes.";
    return null;
  };

  const validateContact = (value: string) => {
    if (!value) return null;
    if (!/^09\d{9}$/.test(value)) return "Contact number must be in format 09xxxxxxxxx.";
    return null;
  };

  // Shelter Data
  const [zoneNum, setZoneNum] = useState<number>(initialData?.zone_num ?? 1);
  const [type, setType] = useState<"Evacuation Center" | "Volunteering Household">(initialData?.type ?? "Evacuation Center");
  const [maxCapacity, setMaxCapacity] = useState<number | "">(initialData?.max_capacity ?? "");
  const [currCapacity, setCurrCapacity] = useState<number | "">(initialData?.curr_capacity ?? "");

  // Shelter Head Data
  const [fname, setFname] = useState(initialData?.shelter_head?.fname ?? "");
  const [mname, setMname] = useState(initialData?.shelter_head?.mname ?? "");
  const [lname, setLname] = useState(initialData?.shelter_head?.lname ?? "");
  const [contactNum, setContactNum] = useState(initialData?.shelter_head?.contact_num ?? "");
  const [socmedUrl, setSocmedUrl] = useState(initialData?.shelter_head?.socmed_url ?? "");
  const [step, setStep] = useState<1 | 2>(1);

  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string | null }>({});

  const validateField = (field: string, value: string, compareMaxCapacity?: number | "") => {
    const activeMaxCapacity = compareMaxCapacity !== undefined ? compareMaxCapacity : maxCapacity;

    switch (field) {
      case "fname":
        if (type === "Volunteering Household" && !value.trim()) return "First name is required.";
        return value ? validateName(value) : null;
      case "mname":
        return value ? validateName(value) : null;
      case "lname":
        if (type === "Volunteering Household" && !value.trim()) return "Last name is required.";
        return value ? validateName(value) : null;
      case "contactNum":
        if (type === "Volunteering Household" && !value) return "Contact number is required.";
        return value ? validateContact(value) : null;
      case "maxCapacity":
        if (!value.trim()) return "Max capacity is required.";
        if (!/^\d+$/.test(value)) return "Max capacity must be a whole number.";
        if (Number(value) < 1) return "Max capacity must be at least 1.";
        return null;
      case "currCapacity":
        if (!value.trim()) return "Current capacity is required.";
        if (!/^\d+$/.test(value)) return "Current capacity must be a whole number.";
        if (Number(value) < 0) return "Current capacity cannot be negative.";
        if (activeMaxCapacity !== "" && Number(value) > Number(activeMaxCapacity)) return "Current capacity cannot exceed max capacity.";
        return null;
      default:
        return null;
    }
  };

  const validateStepOne = () => {
    const errors: { [key: string]: string | null } = {
      maxCapacity: validateField("maxCapacity", maxCapacity.toString()),
      currCapacity: validateField("currCapacity", currCapacity.toString()),
    };
    setFieldErrors(prev => ({ ...prev, ...errors }));

    if (errors.maxCapacity || errors.currCapacity) {
      toast.error(
        "Please correct the highlighted fields.",
        toastOptions(theme.cancelBg, theme.cancelText, `1px solid ${theme.cancelBorder}`)
      );
      return false;
    }

    if (zoneNum < 1 || zoneNum > 10) {
      toast.error(
        "Zone number must be between 1 and 10.",
        toastOptions(theme.cancelBg, theme.cancelText, `1px solid ${theme.cancelBorder}`)
      );
      return false;
    }

    return true;
  };

  const toastOptions = (background: string, color: string, border: string) => ({
    position: "top-left" as const,
    style: {
      background,
      color,
      border,
      padding: "8px 12px",
      borderRadius: "4px",
      fontSize: "12px",
      fontWeight: 500,
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    },
  });

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement;
    const field = target.name;
    const errorMessage = field ? validateField(field, target.value) : null;

    if (field) {
      setFieldErrors(prev => ({ ...prev, [field]: errorMessage }));
    }

    if (errorMessage) {
      target.classList.add('invalid');
      toast.error(errorMessage, toastOptions(theme.cancelBg, theme.cancelText, `1px solid ${theme.cancelBorder}`));
    } else {
      target.classList.remove('invalid');
    }
  };

  const handleNext = () => {
    if (!validateStepOne()) {
      return;
    }
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (!validateStepOne()) return;
      setStep(2);
      return;
    }

    const newErrors: { [key: string]: string | null } = {
      fname: validateField("fname", fname),
      mname: validateField("mname", mname),
      lname: validateField("lname", lname),
      contactNum: validateField("contactNum", contactNum),
    };
    setFieldErrors(prev => ({ ...prev, ...newErrors }));

    if (Object.values(newErrors).some(Boolean)) {
      toast.error(
        "Please correct the highlighted fields.",
        toastOptions(theme.cancelBg, theme.cancelText, `1px solid ${theme.cancelBorder}`)
      );
      return;
    }

    if (type === "Volunteering Household" && (!fname.trim() || !lname.trim() || !contactNum)) {
      toast.error(
        "Head details are required for Volunteering Household.",
        toastOptions(theme.cancelBg, theme.cancelText, `1px solid ${theme.cancelBorder}`)
      );
      return;
    }

    setLoading(true);

    try {
      let res: any;

      if (isEditMode && shelterId) {
        // Edit mode - call updateShelter
        const updateData = {
          shelter: {
            zone_num: zoneNum,
            type: type,
            max_capacity: Number(maxCapacity),
            curr_capacity: Number(currCapacity),
          },
          shelterHead: (fname || lname) ? {
            fname,
            mname,
            lname,
            contact_num: contactNum,
            socmed_url: socmedUrl,
          } : null,
        };
        res = await updateShelter(shelterId, updateData);
      } else {
        // Create mode - call submitShelter
        const formData = {
          shelter: {
            zone_num: zoneNum,
            type: type,
            max_capacity: Number(maxCapacity),
            curr_capacity: Number(currCapacity),
          },
          shelterHead: (fname || lname) ? {
            fname,
            mname,
            lname,
            contact_num: contactNum,
            socmed_url: socmedUrl,
          } : null,
          location: {
            latitude: lat,
            longitude: lng,
          }
        };
        res = await submitShelter(formData);
      }

      if (res.success) {
        const message = isEditMode ? "Shelter updated successfully!" : "Shelter registered successfully!";
        toast.success(
          message,
          toastOptions(theme.successBg, theme.successText, `1px solid ${theme.successBorder}`)
        );
        onSuccess();
      } else {
        toast.error(
          res.error || "An unknown error occurred.",
          toastOptions(theme.cancelBg, theme.cancelText, `1px solid ${theme.cancelBorder}`)
        );
        setLoading(false);
      }
    } catch (error: any) {
      toast.error(
        error?.message || "An unknown error occurred.",
        toastOptions(theme.cancelBg, theme.cancelText, `1px solid ${theme.cancelBorder}`)
      );
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    background: theme.toolBg,
    border: `1px solid ${theme.toolBorder}`,
    color: theme.textMain,
    padding: "10px 14px",
    borderRadius: "4px",
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontSize: "14px",
    outline: "none",
    transition: "all 0.2s ease",
    boxShadow: "inset 0 1px 2px rgba(0,0,0,0.05)",
    minHeight: "42px",
  };

  const getInputStyle = (hasError?: boolean) => ({
    ...inputStyle,
    border: `1px solid ${hasError ? (theme.cancelBorder || "#ef4444") : theme.toolBorder}`,
  });

  const labelStyle = {
    display: "block",
    fontSize: "12px",
    fontWeight: 700,
    color: theme.textMuted,
    marginBottom: "6px",
    textTransform: "none" as const,
    letterSpacing: "0.01em",
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  };

  const activeLineColor = theme.confirmText;
  const inactiveLineColor = theme.toolBorder;
  const title = isEditMode
    ? (step === 1 ? "Edit Shelter" : "Edit Shelter Head")
    : (step === 1 ? "Shelter Details" : "Shelter Head Details");
  const description = isEditMode
    ? (step === 1 ? "Update the shelter zone, type, and capacity." : "Update the shelter head information.")
    : (step === 1 ? "Choose a zone, shelter type, and capacity for this location." : "Add the shelter head profile before registering the shelter.");

  return (
    <div className={isClosing ? "modal-backdrop-exit" : "modal-backdrop-enter"} style={{
      position: "absolute",
      top: 0, left: 0, right: 0, bottom: 0,
      background: mode === "dark" ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.7)",
      zIndex: 2000,
      display: "flex", alignItems: "center", justifyContent: "center",
      backdropFilter: "blur(4px)"
    }}>
      <div className={`${styles.modalWrapper} ${isClosing ? "modal-panel-exit" : "modal-panel-enter"}`} style={{
        background: theme.panelBg,
        border: `1px solid ${theme.panelBorder}`,
        borderRadius: "10px",
        width: "100%", maxWidth: "520px",
        maxHeight: "90vh",
        overflowY: "auto",
        boxShadow: "0 14px 30px rgba(0,0,0,0.15)",
      }}>
        <Box sx={{ padding: "20px 24px", borderBottom: `1px solid ${theme.toolBorder}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            <Typography sx={{ fontSize: "18px", fontWeight: 700, color: theme.textMain, margin: 0, fontFamily: "var(--font-plus-jakarta)" }}>{title}</Typography>
            <Typography sx={{ margin: "6px 0 0", fontSize: "13px", color: theme.textMuted, lineHeight: 1.4, maxWidth: "420px", fontFamily: "var(--font-geist)" }}>
              {description}
            </Typography>
          </Box>
          <IconButton 
            onClick={handleClose} 
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

        <form noValidate onSubmit={handleSubmit} className={styles.shelterForm} style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "16px", fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <div style={{ flex: 1, height: "4px", borderRadius: "999px", background: activeLineColor, transition: "background-color 0.2s ease" }} />
            <div style={{ flex: 1, height: "4px", borderRadius: "999px", background: step === 2 ? activeLineColor : inactiveLineColor, transition: "background-color 0.2s ease" }} />
          </div>

          {/* Location Info (Readonly) */}
          <div style={{ display: "flex", gap: "12px" }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Barangay</label>
              <input value="Brgy. Rizal" disabled className={styles.control} style={{ ...inputStyle, opacity: 0.6, cursor: "not-allowed" }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Municipality</label>
              <input value="San Fernando" disabled className={styles.control} style={{ ...inputStyle, opacity: 0.6, cursor: "not-allowed" }} />
            </div>
          </div>

          <div style={{ height: "1px", background: theme.toolBorder, margin: "4px 0" }} />

          {step === 1 ? (
            <div className={styles.fieldPanel} style={{ padding: "16px", borderRadius: "4px", background: theme.toolBg, border: `1px solid ${theme.toolBorder}` }}>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ ...labelStyle, fontSize: "13px", color: theme.textMain, marginBottom: "4px", textTransform: "none" }}>Shelter Details</label>
                <p style={{ margin: 0, fontSize: "12px", color: theme.textMuted, lineHeight: 1.5 }}>
                  Start by defining the shelter type, zone, and capacity.
                </p>
              </div>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: "120px" }}>
                  <label style={labelStyle}>Zone</label>
                  <select value={zoneNum} onChange={e => setZoneNum(Number(e.target.value))} onBlur={handleBlur} className={`${styles.control} ${styles.selectControl}`} style={{ ...inputStyle, paddingRight: "42px" }}>
                    {Array.from({ length: 10 }, (_, index) => index + 1).map(zone => (
                      <option key={zone} value={zone}>Zone {zone}</option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: 1, minWidth: "160px" }}>
                  <label style={labelStyle}>Shelter Type</label>
                  <select value={type} onChange={e => setType(e.target.value as any)} onBlur={handleBlur} className={`${styles.control} ${styles.selectControl}`} style={{ ...inputStyle, paddingRight: "42px" }}>
                    <option value="Evacuation Center">Evacuation Center</option>
                    <option value="Volunteering Household">Volunteering Household</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "12px" }}>
                <div style={{ flex: 1, minWidth: "120px" }}>
                  <label style={labelStyle}>Max Capacity</label>
                  <input name="maxCapacity" type="number" min="1" required value={maxCapacity} onChange={e => {
                    const newMax = Number(e.target.value) || "";
                    setMaxCapacity(newMax);
                    if (currCapacity !== "") {
                      setFieldErrors(prev => ({
                        ...prev,
                        currCapacity: validateField("currCapacity", currCapacity.toString(), newMax),
                      }));
                    }
                  }} onBlur={handleBlur} className={`${styles.control} ${fieldErrors.maxCapacity ? 'invalid' : ''}`} style={getInputStyle(Boolean(fieldErrors.maxCapacity))} />
                </div>
                <div style={{ flex: 1, minWidth: "120px" }}>
                  <label style={labelStyle}>Current Capacity</label>
                  <input name="currCapacity" type="number" min="0" required value={currCapacity} onChange={e => setCurrCapacity(Number(e.target.value) || "")} onBlur={handleBlur} className={`${styles.control} ${fieldErrors.currCapacity ? 'invalid' : ''}`} style={getInputStyle(Boolean(fieldErrors.currCapacity))} />
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.fieldPanel} style={{ padding: "16px", borderRadius: "4px", background: theme.toolBg, border: `1px solid ${theme.toolBorder}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <label style={{ ...labelStyle, fontSize: "13px", color: theme.textMain, marginBottom: "4px", textTransform: "none" }}>Shelter Head</label>
                  <p style={{ margin: 0, fontSize: "12px", color: theme.textMuted, lineHeight: 1.5 }}>
                    Provide the shelter head details to complete registration.
                  </p>
                </div>
                <span style={{ fontSize: "12px", color: theme.textMuted, fontWeight: 500 }}>
                  {type === "Evacuation Center" ? "Optional" : "Required"}
                </span>
              </div>

              <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
                <div>
                  <label style={labelStyle}>First Name</label>
                  <input name="fname" type="text" placeholder="Juan" value={fname} onChange={e => {
                    setFname(e.target.value);
                    const error = validateName(e.target.value);
                    setFieldErrors(prev => ({ ...prev, fname: error }));
                  }} onBlur={handleBlur} required={type === "Volunteering Household"} className={`${styles.control} ${fieldErrors.fname ? 'invalid' : ''}`} style={getInputStyle(Boolean(fieldErrors.fname))} />
                </div>
                <div>
                  <label style={labelStyle}>Middle Name</label>
                  <input name="mname" type="text" value={mname} onChange={e => {
                    setMname(e.target.value);
                    const error = validateName(e.target.value);
                    setFieldErrors(prev => ({ ...prev, mname: error }));
                  }} onBlur={handleBlur} className={`${styles.control} ${fieldErrors.mname ? 'invalid' : ''}`} style={getInputStyle(Boolean(fieldErrors.mname))} />
                </div>
                <div>
                  <label style={labelStyle}>Last Name</label>
                  <input name="lname" type="text" placeholder="Dela Cruz" value={lname} onChange={e => {
                    setLname(e.target.value);
                    const error = validateName(e.target.value);
                    setFieldErrors(prev => ({ ...prev, lname: error }));
                  }} onBlur={handleBlur} required={type === "Volunteering Household"} className={`${styles.control} ${fieldErrors.lname ? 'invalid' : ''}`} style={getInputStyle(Boolean(fieldErrors.lname))} />
                </div>
                <div>
                  <label style={labelStyle}>Contact Number</label>
                  <input name="contactNum" type="tel" placeholder="09xxxxxxxxx" pattern="09\d{9}" maxLength={11} value={contactNum} onChange={e => {
                    const numericValue = e.target.value.replace(/\D/g, '');
                    setContactNum(numericValue);
                    const error = validateContact(numericValue);
                    setFieldErrors(prev => ({ ...prev, contactNum: error }));
                  }} onBlur={handleBlur} required={type === "Volunteering Household"} className={`${styles.control} ${fieldErrors.contactNum ? 'invalid' : ''}`} style={getInputStyle(Boolean(fieldErrors.contactNum))} />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>Social Media URL (Optional)</label>
                  <input type="url" placeholder="https://facebook.com/juan.delacruz" value={socmedUrl} onChange={e => setSocmedUrl(e.target.value)} onBlur={handleBlur} className={styles.control} style={getInputStyle()} />
                </div>
              </div>
            </div>
          )}

          <Box sx={{ display: "flex", gap: "12px", mt: 1.5, justifyContent: step === 1 ? "flex-end" : "space-between" }}>
            {step === 2 && (
              <Button
                onClick={handleBack}
                disabled={loading}
                sx={{
                  flex: 1,
                  py: 1.25,
                  background: theme.toolBg,
                  border: `1px solid ${theme.toolBorder}`,
                  color: theme.textMain,
                  borderRadius: "4px",
                  fontSize: "12px",
                  fontWeight: 700,
                  textTransform: 'none',
                  fontFamily: 'var(--font-geist)',
                  transition: 'all 0.2s ease',
                  '&:hover': { background: theme.toolHover }
                }}
              >
                Back
              </Button>
            )}
            <Button 
              type="submit" 
              disabled={loading} 
              sx={{ 
                flex: 1, 
                py: 1.25, 
                background: theme.confirmBg, 
                border: `1px solid ${theme.confirmBorder}`, 
                color: theme.confirmText, 
                borderRadius: "4px", 
                fontSize: "12px", 
                fontWeight: 700, 
                textTransform: 'none',
                fontFamily: 'var(--font-geist)',
                transition: 'all 0.2s ease',
                opacity: loading ? 0.7 : 1,
                '&:hover': { 
                  background: theme.confirmHover,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }
              }}
            >
              {isEditMode
                ? (step === 1 ? "Next" : (loading ? "Updating..." : "Update Shelter"))
                : (step === 1 ? "Continue" : (loading ? "Saving..." : "Confirm Registration"))}
            </Button>
          </Box>
        </form>
      </div>
    </div>
  );
}
