import type { Metadata, Viewport } from "next";
import { Instrument_Sans, Source_Serif_4 } from "next/font/google";
import { Nav } from "@/components/Nav";
import "./globals.css";

const display = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-display",
});

const body = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Chris Vanek",
  description: "Personal site — projects, crypto, longevity, and vibe rat.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="font-body antialiased min-h-screen">
        <header className="max-w-2xl mx-auto px-5 pt-8 md:pt-10">
          <Nav />
        </header>
        {children}
      </body>
    </html>
  );
}
