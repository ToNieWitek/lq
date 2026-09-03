import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/components/AuthProvider";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "LQ Hub - Elfliq, Vozol, Puffy",
  description: "Katalog produktów marek Elfliq, Vozol, Puffy.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl" suppressHydrationWarning className="dark">
      <body className="min-h-screen bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 antialiased selection:bg-teal-500 selection:text-white">
        <ThemeProvider>
          <AuthProvider>
            <Navbar />
            <main className="w-full min-h-screen">
              {children}
            </main>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
