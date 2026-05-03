import type { Metadata } from "next";
import { Lora, Manrope } from "next/font/google";
import { AppToaster } from '@/components/common/AppToaster';
import "./globals.css";

const display = Lora({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const body = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "StayEasy | Your Next Stay, Sorted",
  description: 'Book curated stays with availability checks and M-Pesa payments.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable}`}>
        {children}
        <AppToaster />
      </body>
    </html>
  );
}
