import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/contexts/AuthContext";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MonkeysWork — AI-Powered Freelance Marketplace",
  description:
    "Connect with exceptional freelance talent or find your next project on MonkeysWork, the AI-powered marketplace by MonkeysCloud.",
  openGraph: {
    siteName: "MonkeysWork",
    type: "website",
    locale: "en_US",
    title: "MonkeysWork — AI-Powered Freelance Marketplace",
    description:
      "Connect with exceptional freelance talent or find your next project on MonkeysWork.",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "MonkeysWork" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "MonkeysWork — AI-Powered Freelance Marketplace",
    description:
      "Connect with exceptional freelance talent or find your next project.",
    images: ["/og-default.png"],
  },
  icons: {
    icon: [
      { url: "/favicon/favicon.ico", sizes: "any" },
      { url: "/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/favicon/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/favicon/apple-touch-icon.png", sizes: "180x180" },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <Header />
          <main className="min-h-[calc(100vh-72px)]">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}

