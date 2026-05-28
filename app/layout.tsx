import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OnTrack — 출퇴근 지하철",
  description: "내 출발역에서 지금 탈 수 있는 지하철 시간표",
  applicationName: "OnTrack",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "OnTrack",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0a0a0a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
