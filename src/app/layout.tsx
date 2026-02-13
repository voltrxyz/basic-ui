import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AppWrapper from "@/components/AppWrapper";
import TopBar from "@/components/TopBar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Voltr Vaults",
  description: "Voltr Protocol Vault Management",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <AppWrapper>
          <TopBar />
          <main className="min-h-screen pt-16">{children}</main>
        </AppWrapper>
      </body>
    </html>
  );
}
