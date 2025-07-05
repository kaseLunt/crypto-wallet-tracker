import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import type React from "react";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Crypto Portfolio Tracker",
  description: "Track your multi-chain crypto portfolio with real-time analytics",
  applicationName: "Crypto Tracker",
  authors: [{ name: "Kase Lunt" }],
  generator: "Next.js",
  keywords: ["crypto", "portfolio", "blockchain", "defi", "web3"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Crypto Tracker",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Crypto Portfolio Tracker",
    title: "Crypto Portfolio Tracker",
    description: "Track your multi-chain crypto portfolio with real-time analytics",
  },
  twitter: {
    card: "summary_large_image",
    title: "Crypto Portfolio Tracker",
    description: "Track your multi-chain crypto portfolio with real-time analytics",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
