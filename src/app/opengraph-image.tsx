import { ImageResponse } from "next/og";

// SNS シェア時の OGP 画像（ビルド時に生成され、全ページの og:image / twitter:image に使われる）
// 既定フォントは日本語グリフを持たないため、画像内の文字は英語にしている
export const alt = "memomy - 創作活動を記録するワークログ";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 96px",
          background: "linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 120,
            height: 120,
            borderRadius: 28,
            background: "#0284c7",
            color: "white",
            fontSize: 84,
            fontWeight: 700,
            marginBottom: 48,
          }}
        >
          m
        </div>
        <div style={{ fontSize: 112, fontWeight: 800, color: "#0f172a", letterSpacing: -2 }}>
          memomy
        </div>
        <div style={{ fontSize: 44, color: "#475569", marginTop: 16 }}>
          A work log for your creative process
        </div>
      </div>
    ),
    size
  );
}
