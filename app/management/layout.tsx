"use client";

import { ProtectedRoute } from "../components/ProtectedRoute";
import Navbar from "../components/Navbar";

export default function ManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="flex flex-col h-screen w-full bg-white dark:bg-black">
        <Navbar />
        <div className="flex-1 flex flex-col min-h-0">
          {children}
        </div>
      </div>
    </ProtectedRoute>
  );
}
