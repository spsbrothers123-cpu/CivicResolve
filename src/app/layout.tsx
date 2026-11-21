import type { Metadata } from "next";
import { Manrope, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { DemoNotice } from "@/components/shared/DemoNotice";
import { AuthProvider } from "@/components/providers/AuthProvider";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://civicresolve.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "CivicResolve — Better cities begin with better reporting",
    template: "%s | CivicResolve",
  },
  description:
    "AI-powered civic issue reporting and municipal resolution platform. Transform citizen reports into structured work items with Google Gemini intelligence.",
  keywords: [
    "civic reporting",
    "municipal complaints",
    "city maintenance",
    "pothole report",
    "smart city AI",
    "urban resolution tracking",
  ],
  authors: [{ name: "CivicResolve Operations" }],
  creator: "CivicResolve",
  icons: {
    icon: "/icon.svg",
    apple: "/apple-icon.svg",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "CivicResolve",
    title: "CivicResolve — Better cities begin with better reporting",
    description:
      "Transform citizen reports into structured municipal work items with transparent resolution tracking.",
  },
  twitter: {
    card: "summary_large_image",
    title: "CivicResolve — Municipal Issue Reporting & Resolution",
    description:
      "AI-assisted civic complaint analysis and transparent municipal dispatch tracking.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-body bg-[#F5F5EF] text-[#102C35] antialiased selection:bg-[#D6F36A] selection:text-[#102C35]">
        <AuthProvider>
          {children}
          <DemoNotice />
        </AuthProvider>
      </body>
    </html>
  );
}
