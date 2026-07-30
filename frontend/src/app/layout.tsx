import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pocket Money - Smart Passive Income & MLM Yield Platform",
  description: "Pocket Money is a high-yield passive income platform offering transparent multi-level affiliate commission rewards and daily ROI.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/logo-icon.png", type: "image/png" }
    ],
    shortcut: "/favicon.ico",
    apple: "/logo-icon.png"
  },
  openGraph: {
    title: "Pocket Money - Smart Passive Income Platform",
    description: "Earn daily returns and multi-level referral rewards with Pocket Money financial network node.",
    siteName: "Pocket Money",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Pocket Money Official Brand Logo"
      }
    ],
    locale: "en_IN",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Pocket Money - Smart Passive Income Platform",
    description: "Earn daily returns and multi-level referral rewards with Pocket Money financial network node.",
    images: ["/og-image.png"]
  }
};


import { Providers } from "./providers";
import MaintenanceBanner from "../components/MaintenanceBanner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <MaintenanceBanner />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

