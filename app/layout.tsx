import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "おてつだいきゅうよ",
  description: "家族のお手伝い仕事ボードと給与計算",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
