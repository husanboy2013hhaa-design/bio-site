import "./globals.css";
import { Inter, Manrope, JetBrains_Mono } from "next/font/google";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

const display = Manrope({
  subsets: ["latin", "cyrillic"],
  weight: ["600", "700"],
  variable: "--font-display",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  weight: ["500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata = {
  title: "ilm.bio — everything you are, in one simple link",
  description:
    "Beautiful link-in-bio pages with themes, privacy-safe analytics and a full REST API. Free, open source and self-hostable.",
  icons: {
    icon: "/ilmbio-logo.png",
    apple: "/ilmbio-logo.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${display.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
