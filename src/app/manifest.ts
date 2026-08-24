import type { MetadataRoute } from "next";

// Installable PWA — "Add to Home Screen" gives an app-like, standalone shell.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ClipDish — clip cooking videos into recipes",
    short_name: "ClipDish",
    description: "Paste a cooking-video link, get a structured recipe, build your weekly shopping list.",
    start_url: "/",
    display: "standalone",
    background_color: "#fafafa",
    theme_color: "#ea580c",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
