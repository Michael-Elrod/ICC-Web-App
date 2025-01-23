"use client";

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { FaMoon, FaSun } from "react-icons/fa";

export default function DarkModeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
    if (!theme) {
      setTheme('light');
    }
  }, [theme, setTheme]);

  if (!mounted) {
    return null;
  }

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="w-10 h-10 p-2 flex items-center justify-center text-zinc-800 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full box-border"
      aria-label="Toggle dark mode"
    >
      {theme === 'dark' ? (
        <FaSun size={24} />
      ) : (
        <FaMoon size={24} />
      )}
    </button>
  );
}