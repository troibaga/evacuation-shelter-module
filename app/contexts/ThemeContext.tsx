"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { ThemeMode, themeColors } from "../theme";

interface ThemeContextType {
  mode: ThemeMode;
  theme: typeof themeColors.dark; // The active theme object
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>("dark"); // Default to our established dark mode
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Wait for client mount to read from localStorage to avoid hydration mismatch
    setMounted(true);
    const saved = localStorage.getItem("flows-theme") as ThemeMode | null;
    if (saved === "light" || saved === "dark") {
      setMode(saved);
    }
  }, []);

  const toggleTheme = () => {
    setMode((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("flows-theme", next);
      return next;
    });
  };

  // Prevent hydration mismatch by rendering default mode initially on server
  const activeTheme = themeColors[mode];

  return (
    <ThemeContext.Provider value={{ mode, theme: activeTheme, toggleTheme }}>
      <div 
        style={{ 
          background: activeTheme.panelBg, 
          color: activeTheme.textMain,
          minHeight: "100vh",
          transition: "background 0.3s ease, color 0.3s ease"
        }}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
