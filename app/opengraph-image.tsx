import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const alt = "IdeaForge — 막연한 창업 생각을 2주짜리 실험으로";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  // Font lives outside /app so Next doesn't rewrite it into a static asset URL.
  // next.config outputFileTracingIncludes bundles it into the function.
  const fontData = await readFile(path.join(process.cwd(), "assets", "kr.ttf"));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f6f1e7",
          padding: "72px 80px",
          fontFamily: "KR",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 76,
              height: 76,
              borderRadius: 18,
              background: "#bd5a37",
              color: "#fffdf8",
              fontSize: 42,
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            IF
          </div>
          <div style={{ fontSize: 42, fontWeight: 800, color: "#2c2823" }}>IdeaForge</div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            whiteSpace: "pre-line",
            fontSize: 78,
            fontWeight: 800,
            color: "#2c2823",
            lineHeight: 1.25,
            letterSpacing: "-0.02em",
          }}
        >
          {"막연한 창업 생각을,\n2주짜리 실험으로."}
        </div>

        <div style={{ display: "flex", fontSize: 30, color: "#8a5a3f" }}>
          내 경험에서 아이디어를 꺼내 · YC 프레임워크로 압박 · 현실에서 확인
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "KR", data: fontData, style: "normal", weight: 800 }],
    }
  );
}
