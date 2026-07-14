import type { Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Instrument_Serif, Inter } from "next/font/google";
import localFont from "next/font/local";
import type { ReactNode } from "react";
import "./globals.css";

const campaignSans = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-campaign-sans",
  display: "swap",
});

const campaignDisplay = localFont({
  src: [
    {
      path: "./fonts/big-shoulders-display-600.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "./fonts/big-shoulders-display-700.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "./fonts/big-shoulders-display-800.ttf",
      weight: "800",
      style: "normal",
    },
    {
      path: "./fonts/big-shoulders-display-900.ttf",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-campaign-display",
  display: "swap",
});

const campaignSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: "italic",
  variable: "--font-campaign-serif",
  display: "swap",
});

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#170c08",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${campaignSans.variable} ${campaignDisplay.variable} ${campaignSerif.variable}`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
