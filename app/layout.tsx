import type { Metadata, Viewport } from "next";

import "./styles/globals.css";

export const metadata: Metadata = {
  title: { default: "Daybook", template: "%s · Daybook" },
  description:
    "Tasks, notes and your calendar in one calm list. Plan each task for a day, keep its deadline separate, and swipe it done. Everything stays in your browser.",
  applicationName: "Daybook",
  robots: { index: false, follow: false },
  appleWebApp: { title: "Daybook", capable: true, statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0b" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <body>{children}</body>
    </html>
  );
}
