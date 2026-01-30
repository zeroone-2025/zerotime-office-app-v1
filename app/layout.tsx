import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "제로타임 백오피스",
  description: "전북대 제로타임 관리자 페이지",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
