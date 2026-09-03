// src/Pages/Login/ThemeToggle.jsx
//
// Tiny theme switch for the pre-auth screens (Login, LoginFree, RegisterFree).
// These render before <ThemeProvider> mounts, so instead of depending on that
// context, this talks directly to the same "dms-theme" localStorage key and
// <html class="dark"> toggle that ThemeProvider and index.html's pre-paint
// script already use — the preference still carries into the app after login.

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const THEME_KEY = "dms-theme";

export default function ThemeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    try {
      window.localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
    } catch {
      // localStorage unavailable — theme just won't persist
    }
  }, [dark]);

  return (
    <button
      type="button"
      onClick={() => setDark((v) => !v)}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="absolute right-5 top-5 z-20 flex h-9 w-9 items-center justify-center rounded-app-md border border-[var(--border-subtle)] bg-[var(--surface-card)]/80 text-[var(--text-secondary)] backdrop-blur transition-colors hover:text-[var(--text-primary)]"
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
