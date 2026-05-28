import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "OnTrack — 출퇴근 지하철",
    short_name: "OnTrack",
    description: "내가 탈 수 있는 지하철 시간표를 자동으로 알려줘요",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f8f9fb",
    theme_color: "#0a0a0a",
    lang: "ko",
    icons: [
      {
        src: "/icon",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
