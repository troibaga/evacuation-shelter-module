"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";

export default function Navbar() {
  const { theme, mode, toggleTheme } = useTheme();
  const { profile, signOut } = useAuth();
  const pathname = usePathname();

  const isManagement = pathname?.startsWith("/management");

  return (
    <nav
      className="w-full"
      style={{
        backgroundColor: theme.panelBg,
        borderBottom: `1px solid ${theme.panelBorder}`,
        transition: "background 0.3s ease, border-color 0.3s ease",
      }}
    >
      <div className="mx-auto px-6 py-2 flex items-center justify-between">
        <Link href="/" className="no-underline">
          <div
            className="text-sm font-light tracking-[0.2em] uppercase flex items-center gap-2"
            style={{ color: theme.textMain }}
          >
            FLOWS
          </div>
        </Link>

        <div className="flex items-center gap-4">
          <div
            className="text-[11px] font-medium hidden sm:block"
            style={{ color: theme.textMuted }}
          >
            {isManagement ? "Management Portal" : "Evacuation Shelters Overview"}
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-2">
            {isManagement && (
              <>
                <Link href="/management">
                  <button
                    style={{
                      background: pathname === "/management" ? theme.toolHover : theme.toolBg,
                      border: `1px solid ${theme.toolBorder}`,
                      color: theme.textMain,
                      padding: "6px 12px",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontWeight: 500,
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.background = theme.toolHover)
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.background = pathname === "/management" ? theme.toolHover : theme.toolBg)
                    }
                  >
                    Map
                  </button>
                </Link>
                <Link href="/management/dashboard">
                  <button
                    style={{
                      background: pathname === "/management/dashboard" ? theme.toolHover : theme.toolBg,
                      border: `1px solid ${theme.toolBorder}`,
                      color: theme.textMain,
                      padding: "6px 12px",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontWeight: 500,
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onMouseOver={(e) =>
                      (e.currentTarget.style.background = theme.toolHover)
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.background = pathname === "/management/dashboard" ? theme.toolHover : theme.toolBg)
                    }
                  >
                    Dashboard
                  </button>
                </Link>
              </>
            )}

            {isManagement && profile && (
              <button
                onClick={() => signOut()}
                style={{
                  background: "transparent",
                  border: `1px solid ${theme.toolBorder}`,
                  color: "#ef4444",
                  padding: "6px 12px",
                  borderRadius: "4px",
                  fontSize: "11px",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                Logout
              </button>
            )}
          </div>

          {/* Theme Toggle */}
          <div style={{ position: "relative" }} className="group">
            <button
              onClick={toggleTheme}
              style={{
                background: theme.toolBg,
                border: `1px solid ${theme.toolBorder}`,
                color: theme.textMain,
                width: "28px",
                height: "28px",
                borderRadius: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.background = theme.toolHover)
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.background = theme.toolBg)
              }
            >
              {mode === "dark" ? (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="5"></circle>
                  <line x1="12" y1="1" x2="12" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="23"></line>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                  <line x1="1" y1="12" x2="3" y2="12"></line>
                  <line x1="21" y1="12" x2="23" y2="12"></line>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
              ) : (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              )}
            </button>

            <div
              className="absolute right-0 mt-2 px-2 py-1 text-[10px] font-medium rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-lg"
              style={{
                background: theme.toolBg,
                color: theme.textMain,
                border: `1px solid ${theme.toolBorder}`,
                top: "100%",
              }}
            >
              Toggle Theme
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}