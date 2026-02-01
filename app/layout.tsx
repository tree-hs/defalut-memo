import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "메모",
  description: "날짜/시간과 함께 저장되는 메모",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
