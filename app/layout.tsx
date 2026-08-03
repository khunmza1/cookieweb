import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import { LanguageProvider } from "@/lib/i18nContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cookie Run Setup Finder (Classic / LINE / Kakao)",
  description: "Personalized team combinations, pet combi bonuses, and treasure recommendations based on your Cookie Run inventory.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100 font-sans">
        <LanguageProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
        </LanguageProvider>
      </body>
    </html>
  );
}
