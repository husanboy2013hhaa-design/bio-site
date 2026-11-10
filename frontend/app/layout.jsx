import "./globals.css";
import { Inter, Space_Grotesk } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
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
    <html lang="en" className={`${inter.variable} ${display.variable}`}>
      <body>{children}</body>
    </html>
  );
}
