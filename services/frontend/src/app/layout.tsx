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

