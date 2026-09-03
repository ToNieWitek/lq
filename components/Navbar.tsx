"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { useTheme } from "./ThemeProvider";
import { Moon, Sun, Shield, User as UserIcon, LogOut, Home } from "lucide-react";

export const Navbar = () => {
  const pathname = usePathname();
  const { user, profile, isAdmin, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // W liquidach nie ma być przycisków
  if (pathname && pathname.startsWith("/brand")) {
    return null;
  }

  const isHome = pathname === "/";

  return (
    <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50 flex items-center gap-2.5">
      {/* Przycisk przejścia do strony głównej (widoczny gdy jesteśmy w panelu lub logowaniu) */}
      {!isHome && (
        <Link
          href="/"
          title="Przejdź do strony głównej"
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 text-zinc-700 dark:text-zinc-200 shadow-md backdrop-blur-sm hover:scale-105 active:scale-95 transition-all text-xs font-bold"
        >
          <Home className="w-4 h-4 text-teal-500" />
          <span className="hidden sm:inline">Strona główna</span>
        </Link>
      )}

      {/* Przycisk motywu */}
      <button
        onClick={toggleTheme}
        aria-label="Przełącz motyw"
        className="w-10 h-10 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 text-zinc-700 dark:text-zinc-200 shadow-md backdrop-blur-sm flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer"
      >
        {theme === "dark" ? (
          <Sun className="w-5 h-5 text-amber-400" />
        ) : (
          <Moon className="w-5 h-5 text-zinc-700" />
        )}
      </button>

      {/* Przycisk Panel Admina (tylko gdy zalogowany admin) */}
      {isAdmin && (
        <Link
          href="/admin"
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-md transition-all hover:scale-105"
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Panel Admina</span>
        </Link>
      )}

      {/* Przycisk Panel Kupującego / Profil / Wyloguj */}
      {user ? (
        <div className="flex items-center gap-2">
          <Link
            href="/panel"
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all hover:scale-105"
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>{profile?.display_name || user.email?.split("@")[0]}</span>
          </Link>
          <button
            onClick={() => signOut()}
            title="Wyloguj się"
            className="w-10 h-10 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 text-zinc-500 hover:text-red-500 shadow-md backdrop-blur-sm flex items-center justify-center hover:scale-105 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <Link
          href="/login"
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 shadow-md transition-all hover:scale-105"
        >
          <UserIcon className="w-3.5 h-3.5" />
          <span>Panel Kupującego</span>
        </Link>
      )}
    </div>
  );
};
