// src/components/ThemeToggle.jsx
import React from "react";
import { useTheme } from "@/context/ThemeContext";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const toggle = () => setTheme(theme === "dark" ? "light" : "dark");

  return (
    <button onClick={toggle} aria-label="Toggle theme" className="p-2">
      {theme === "dark" ? "🌙 Dark" : theme === "light" ? "☀️ Light" : "🖥️ System"}
    </button>
  );
}
