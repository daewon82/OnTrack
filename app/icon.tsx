import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 280,
          fontWeight: 900,
          letterSpacing: -10,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        OT
      </div>
    ),
    size,
  );
}
