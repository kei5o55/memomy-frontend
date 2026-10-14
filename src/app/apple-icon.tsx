import { ImageResponse } from "next/og";

// iOS のホーム画面追加用アイコン（角丸は iOS 側で付くので四角のまま）
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0284c7",
          color: "white",
          fontSize: 128,
          fontWeight: 700,
        }}
      >
        m
      </div>
    ),
    size
  );
}
