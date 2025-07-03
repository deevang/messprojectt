import { useEffect, useState } from "react";

const getInitialTheme = () => {
  const saved = localStorage.getItem("theme");
  if (saved === "dark") return true;
  if (saved === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

const DarkModeToggle = () => {
  const [dark, setDark] = useState(getInitialTheme);

  // Sync all toggles and set class on mount
  useEffect(() => {
    const applyTheme = (isDark) => {
      if (isDark) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
      }
    };
    applyTheme(dark);
    // Listen for theme-change events
    const handler = () => setDark(getInitialTheme());
    window.addEventListener("theme-change", handler);
    return () => window.removeEventListener("theme-change", handler);
  }, [dark]);

  // Toggle and dispatch event
  const handleToggle = () => {
    setDark((prev) => {
      const next = !prev;
      setTimeout(() => {
        window.dispatchEvent(new Event("theme-change"));
      }, 0);
      return next;
    });
  };

  return (
    <button
      onClick={handleToggle}
      aria-label="Toggle dark mode"
      className="relative w-12 h-7 flex items-center rounded-full px-1 transition-colors duration-300 focus:outline-none bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 shadow-sm"
    >
      <span
        className={`absolute left-1 top-1 w-5 h-5 rounded-full flex items-center justify-center transition-transform duration-300 bg-white dark:bg-gray-900 shadow-md ${dark ? 'translate-x-5' : 'translate-x-0'}`}
      >
        {dark ? (
          <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z"></path></svg>
        ) : (
          <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path d="M12 1v2m0 18v2m11-11h-2M3 12H1m16.95 6.95l-1.41-1.41M6.34 6.34L4.93 4.93m12.02 0l-1.41 1.41M6.34 17.66l-1.41 1.41"/></svg>
        )}
      </span>
      <span className="sr-only">Toggle dark mode</span>
    </button>
  );
};

export default DarkModeToggle;