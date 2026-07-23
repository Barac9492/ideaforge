import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://ideaforge-navy-mu.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "IdeaForge — 막연한 창업 생각을 2주짜리 실험으로",
  description:
    "당신의 경력과 직접 겪은 문제에서 창업 아이디어를 꺼내고, YC 프레임워크로 압박 테스트한 뒤, 현실에서 확인하는 방법까지 설계하는 한국어 창업 워크북. Y Combinator와 무관.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "IdeaForge — 막연한 창업 생각을 2주짜리 실험으로",
    description:
      "아이디어를 던져주는 도구가 아니라, 내 경험에서 아이디어를 꺼내 현실에서 확인하게 만드는 한국어 창업 워크북.",
    url: "/",
    siteName: "IdeaForge",
    locale: "ko_KR",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
