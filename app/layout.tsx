import type { Metadata } from "next";
import { Fraunces, Libre_Franklin } from "next/font/google";
import { AuthNav } from "./AuthNav";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
});

const libreFranklin = Libre_Franklin({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Ta, plan a trip with your friends",
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
      className={`${fraunces.variable} ${libreFranklin.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthNav />
        {children}
      </body>
    </html>
  );
}
