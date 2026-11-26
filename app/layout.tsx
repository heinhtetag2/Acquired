import type { Metadata } from "next";
import { PT_Serif, Sofia_Sans_Condensed, Geist, Archivo } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import Nav from "@/components/Nav";

// Free stand-ins for the licensed faces, chosen by measured cap height + width (scripts/font-fit.mjs, font-caps.mjs)
// and scaled to the live cap heights with font-size-adjust (see tokens.css).
const body = PT_Serif({ subsets: ["latin"], weight: ["400"], style: ["normal", "italic"], variable: "--ff-body", display: "swap" });
const serif = localFont({
  src: [
    { path: "../node_modules/@fontsource/libre-caslon-condensed/files/libre-caslon-condensed-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../node_modules/@fontsource/libre-caslon-condensed/files/libre-caslon-condensed-latin-400-italic.woff2", weight: "400", style: "italic" },
  ],
  variable: "--ff-serif", display: "swap",
});
const display = Sofia_Sans_Condensed({ subsets: ["latin"], weight: ["400", "500"], variable: "--ff-display", display: "swap" });
const sans = Geist({ subsets: ["latin"], variable: "--ff-sans", display: "swap", preload: false });
const logo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--ff-logo", display: "swap", preload: false });

export const metadata: Metadata = {
  title: "Scrollbook | One story at a time",
  description: "Short, true stories about the companies and people that shape the world. Swipe, save, read.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${body.variable} ${serif.variable} ${display.variable} ${sans.variable} ${logo.variable}`}>
      <body>
        <a href="#main" className="sr-only">Skip to content</a>
        <Nav />
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
