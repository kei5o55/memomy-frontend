import { ImageResponse } from "next/og";

// ファビコン（ビルド時に PNG として生成）
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 8,
          background: "#0284c7",
          color: "white",
          fontSize: 24,
          fontWeight: 700,
        }}
      >
        m
      </div>
    ),
    size
  );
}
