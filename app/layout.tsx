import type { Metadata } from "next";
import { Cinzel, Dancing_Script } from "next/font/google";
import "./globals.css";

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  display: "swap",
});

const dancing = Dancing_Script({
  subsets: ["latin"],
  variable: "--font-dancing",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TechQuest: Triwizard Tournament",
  description: "The magical hunt begins.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${cinzel.variable} ${dancing.variable} font-cinzel bg-parchment text-ink-black`}>
        {children}
      </body>
    </html>
  );
}