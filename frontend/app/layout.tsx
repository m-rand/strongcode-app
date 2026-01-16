import type { ReactNode } from 'react';
import type { Metadata } from "next";
import { Geist, Geist_Mono, Figtree } from "next/font/google";
import './globals.css';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700", "900"],
});

export const metadata: Metadata = {
  title: "StrongCode 60 - Evidence-Based Powerlifting Programming",
  description: "Systematic approach to strength training periodization based on Soviet weightlifting methodology",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html>
      <body className={`${geistSans.variable} ${geistMono.variable} ${figtree.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
