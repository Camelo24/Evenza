"use client";

import { Monitor, MoonStar, SunMedium } from "lucide-react";
import { useEffect, useState } from "react";

type ThemeMode = "light" | "dark" | "system";

const getSystemPreference = () => (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

export function ModeToggle() {
  const [mode, setMode] = useState<ThemeMode>("system");

  useEffect(() => {
    const saved = localStorage.getItem("trufeta-theme-mode") as ThemeMode | null;
    const initial = saved ?? "system";
    setMode(initial);
    applyTheme(initial);
  }, []);

  const applyTheme = (nextMode: ThemeMode) => {
    const root = document.documentElement;
    if (nextMode === "system") {
      const preferred = getSystemPreference();
      root.setAttribute("data-theme", preferred);
    } else {
      root.setAttribute("data-theme", nextMode);
    }
    localStorage.setItem("trufeta-theme-mode", nextMode);
  };

  const handleModeChange = (nextMode: ThemeMode) => {
    setMode(nextMode);
    applyTheme(nextMode);
  };

  const currentIcon = mode === "dark" ? MoonStar : mode === "light" ? SunMedium : Monitor;
  const CurrentIcon = currentIcon;

  return (
    <div className="rounded-[22px] border border-ink/10 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-ink text-white">
            <CurrentIcon size={18} />
          </span>
          <div>
            <p className="eyebrow text-ink/45">Appearance</p>
            <h3 className="display mt-1 text-2xl font-semibold">Interface mode</h3>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {([
          { label: "Light", value: "light", icon: SunMedium },
          { label: "Dark", value: "dark", icon: MoonStar },
          { label: "System", value: "system", icon: Monitor },
        ] as const).map(({ label, value, icon: Icon }) => {
          const selected = mode === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => handleModeChange(value)}
              className={`flex items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-sm font-semibold transition ${
                selected
                  ? "border-ink bg-ink text-white shadow-lg"
                  : "border-ink/10 bg-paper text-ink hover:border-ink/30"
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
