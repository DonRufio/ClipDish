"use client";

import { useOffline } from "next/offline";

// Persistent strip while the network is down — your recipes and list still work
// (they're local); only fresh captures need a connection.
export function OfflineBanner() {
  const isOffline = useOffline();
  if (!isOffline) return null;
  return (
    <div
      role="status"
      className="bg-tangerine px-4 py-2 text-center text-sm font-semibold text-white"
    >
      You&apos;re offline — your saved recipes and list still work.
    </div>
  );
}
