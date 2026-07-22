import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IdeaForge — generate & pressure-test startup ideas (YC framework)",
  description:
    "Generate startup ideas anchored to your own background, then run any idea through the YC framework: Four Mistakes, Ten Questions, Three Signals.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
