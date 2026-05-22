export type ThemeMode = 'light' | 'dark';

export const themeColors = {
  dark: {
    panelBg: "#000000",
    panelBorder: "#333333",
    toolBg: "#111111",
    toolBorder: "#333333",
    toolHover: "#222222",
    toolActive: "#333333",
    textMain: "#ffffff",
    textMuted: "#a3a3a3",
    // Toast / Confirm Button (Solid but tinted look)
    confirmBg: "#0d2140",
    confirmHover: "#17365d",
    confirmBorder: "#1d4ed8",
    confirmText: "#60a5fa",
    // Success Button / Toast
    successBg: "#08330d",
    successHover: "#115e39",
    successBorder: "#16a34a",
    successText: "#a7f3d0",
    // Cancel Button (Solid but tinted look)
    cancelBg: "#450a0a",
    cancelHover: "#7f1d1d",
    cancelBorder: "#991b1b",
    cancelText: "#f87171",
  },
  light: {
    panelBg: "#ffffff",
    panelBorder: "#e5e7eb",
    toolBg: "#f9fafb",
    toolBorder: "#d1d5db",
    toolHover: "#f3f4f6",
    toolActive: "#e5e7eb",
    textMain: "#111827",
    textMuted: "#6b7280",
    // Toast / Confirm Button (Solid but tinted look for light mode)
    confirmBg: "#dbeafe",
    confirmHover: "#bfdbfe",
    confirmBorder: "#93c5fd",
    confirmText: "#1d4ed8",
    // Success Button / Toast
    successBg: "#d1fae5",
    successHover: "#86efac",
    successBorder: "#34d399",
    successText: "#166534",
    // Cancel Button (Solid but tinted look for light mode)
    cancelBg: "#fee2e2",
    cancelHover: "#fecaca",
    cancelBorder: "#fca5a5",
    cancelText: "#991b1b",
  }
};
