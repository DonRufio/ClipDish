import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Offline-aware UI: shows a banner when connectivity drops and auto-retries
  // blocked navigations/Server Actions when it returns. (Native, no SW.)
  // ponytail: this is connectivity-aware UI, not offline *launch* — caching the
  // shell for a cold offline start would need a service worker (Serwist). Add if
  // users actually open the app with no signal in a shop.
  experimental: {
    useOffline: true,
  },
};

export default nextConfig;
