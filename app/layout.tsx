import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthNav } from "./AuthNav";
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
  title: "Ta — plan a trip with your friends",
  description: "Collect everyone's preferences privately, then generate a trip plan together.",
};

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
        <AuthNav />
        {children}
      </body>
    </html>
  );
}
