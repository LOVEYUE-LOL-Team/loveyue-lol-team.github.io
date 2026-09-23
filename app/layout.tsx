import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "车队战绩数据舱",
  description: "私密的英雄联盟车队灵活排位数据分析与逐局检索面板。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
