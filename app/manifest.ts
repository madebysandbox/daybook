import type { MetadataRoute } from "next";

/* "Add to Home Screen" opens Daybook full-screen with its own icon (spec §2). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Daybook",
    short_name: "Daybook",
    description: "Tasks, notes and calendar in one list.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
