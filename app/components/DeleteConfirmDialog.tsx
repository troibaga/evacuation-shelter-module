import React, { useState, useEffect } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { IconButton, Box, Typography, Button } from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";

interface DeleteConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  shelterName: string;
  loading?: boolean;
  compact?: boolean;
}

export function DeleteConfirmDialog({
  open,
  onClose,
  onConfirm,
  shelterName,
  loading = false,
  compact = false,
}: DeleteConfirmDialogProps) {
  const { theme, mode } = useTheme();
  const [isClosing, setIsClosing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    if (open) {
      setIsClosing(false);
      setIsMounted(true);
    } else if (isMounted) {
      setIsClosing(true);

      const timeout = setTimeout(() => {
        setIsMounted(false);
        setIsClosing(false);
      }, 190);

      return () => clearTimeout(timeout);
    }
  }, [open]);

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  if (!isMounted) return null;

  return (
    <Box
      className={isClosing ? "modal-backdrop-exit" : "modal-backdrop-enter"}
      sx={{
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
      <Box
        className={isClosing ? "modal-panel-exit" : "modal-panel-enter"}
        sx={{
          background: theme.panelBg,
          border: `1px solid ${theme.panelBorder}`,
          borderRadius: "10px",
          width: "100%",
          maxWidth: "400px",
          padding: "24px",
          boxShadow: "0 14px 30px rgba(0,0,0,0.15)",
          position: 'relative'
        }}
      >
        <IconButton
          onClick={handleClose}
          disabled={loading}
          size="small"
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            color: theme.textMuted,
            p: 0.5,
            transition: 'all 0.2s ease',
            '&:hover': { background: theme.toolHover, color: theme.textMain }
          }}
        >
          <CloseIcon sx={{ fontSize: 16 }} />
        </IconButton>

        <Typography sx={{
          fontSize: "18px",
          fontWeight: 700,
          color: theme.textMain,
          mb: 1.5,
          fontFamily: "var(--font-plus-jakarta)"
        }}>
          Delete Shelter?
        </Typography>
        <Typography sx={{
          fontSize: "14px",
          color: theme.textMuted,
          mb: 3,
          lineHeight: 1.5,
          fontFamily: "var(--font-geist)"
        }}>
          Are you sure you want to delete the shelter "{shelterName}"? This action cannot be undone and will permanently remove all associated data.
        </Typography>
        <Box sx={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
          <Button
            onClick={handleClose}
            disabled={loading}
            sx={{
              px: compact ? 1.5 : 2.5,
              py: compact ? 0.5 : 1,
              background: theme.toolBg,
              border: `1px solid ${theme.toolBorder}`,
              color: theme.textMain,
              borderRadius: "4px",
              fontSize: compact ? "11px" : "12px",
              fontWeight: 700,
              textTransform: 'none',
              fontFamily: 'var(--font-geist)',
              '&:hover': { background: theme.toolHover }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            sx={{
              px: compact ? 1.5 : 2.5,
              py: compact ? 0.5 : 1,
              background: theme.cancelBg,
              border: `1px solid ${theme.cancelBorder}`,
              color: theme.cancelText,
              borderRadius: "4px",
              fontSize: compact ? "11px" : "12px",
              fontWeight: 700,
              textTransform: 'none',
              fontFamily: 'var(--font-geist)',
              '&:hover': { background: theme.cancelHover }
            }}
          >
            {loading ? "Deleting..." : "Delete"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
