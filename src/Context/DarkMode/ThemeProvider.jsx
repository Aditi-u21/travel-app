import React, { createContext, useContext, useEffect, useState, useRef } from "react";

const initialState = {
  theme: "system",
  setTheme: () => null,
};

const ThemeProviderContext = createContext(initialState);

export function ThemeProvider({ children, defaultTheme = "system", storageKey = "vite-ui-theme" }) {
  const [theme, setTheme] = useState(() => localStorage.getItem(storageKey) || defaultTheme);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");

    const applyTheme = theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      : theme;

    root.classList.add(applyTheme);
  }, [theme]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      timeoutRef.current = setTimeout(() => {
        const xPercent = (e.clientX / window.innerWidth) * 100;
        const yPercent = (e.clientY / window.innerHeight) * 100;

        // Update background position
        document.body.style.backgroundPosition = `${xPercent}% ${yPercent}%`;

        // Debugging: Log to ensure values are updating
        console.log(`Background position: ${xPercent}% ${yPercent}%`);
      }, 50); // Throttling for performance
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const syncThemeAcrossTabs = (event) => {
      if (event.key === storageKey) setTheme(event.newValue || "system");
    };
    window.addEventListener("storage", syncThemeAcrossTabs);
    return () => window.removeEventListener("storage", syncThemeAcrossTabs);
  }, [storageKey]);

  const value = {
    theme,
    setTheme: (newTheme) => {
      localStorage.setItem(storageKey, newTheme);
      setTheme(newTheme);
    },
  };

  return <ThemeProviderContext.Provider value={value}>{children}</ThemeProviderContext.Provider>;
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (!context) throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};

export default useTheme;