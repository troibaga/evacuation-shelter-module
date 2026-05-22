"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import Navbar from "./components/Navbar";

const MapComponent = dynamic(() => import("./components/MapComponent"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-100 dark:bg-gray-900" />,
});

export default function Home() {
  return (
    <div className="flex flex-col h-screen w-full bg-white dark:bg-black">
      <Navbar />
      <div className="flex-1 overflow-hidden">
        <Suspense fallback={<div className="w-full h-full bg-gray-100 dark:bg-gray-900" />}>
          <MapComponent />
        </Suspense>
      </div>
    </div>
  );
}
