"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { ReactNode } from "react";

type Child = readonly [string, string];

/**
 * Small external store that reads/writes the sidebar collapse preference from
 * localStorage. Uses useSyncExternalStore so the parent's expanded state is
 * derived (not held in useState + useEffect), which keeps the component pure
 * during render and avoids cascading re-renders.
 */
const STORAGE_PREFIX = "sidebar:";
const listeners = new Set<() => void>();
function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = () => listener();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}
function readExpanded(key: string, fallback: boolean): boolean {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? fallback : raw === "1";
  } catch {
    return fallback;
  }
}
function writeExpanded(key: string, value: boolean) {
  try {
    window.localStorage.setItem(key, value ? "1" : "0");
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

/**
 * Collapsible sidebar parent item with sub-nav.
 * - Highlights when a child route is active (matched by pathname).
 * - Auto-forces expanded whenever a child is active so the parent is never
 *   collapsed while one of its children is being viewed.
 * - Persists the user's collapse/expand preference across refreshes.
 */
export function SidebarParentLink({
  label,
  href,
  icon,
  subItems,
}: {
  label: string;
  href: string;
  icon: ReactNode;
  subItems: ReadonlyArray<Child>;
}) {
  const pathname = usePathname();
  const isChildActive = useMemo(
    () => subItems.some(([childHref]) => pathname === childHref || pathname.startsWith(`${childHref}/`)),
    [subItems, pathname],
  );
  const storageKey = `${STORAGE_PREFIX}${label}`;
  const getSnapshot = useCallback(() => readExpanded(storageKey, true), [storageKey]);
  const userPref = useSyncExternalStore(subscribe, getSnapshot, () => true);
  const expanded = userPref || isChildActive;

  const toggle = () => writeExpanded(storageKey, !userPref);

  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={expanded}
        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition ${
          isChildActive ? "bg-ink/6 font-semibold text-ink" : "text-ink/70 hover:bg-ink/4 hover:text-ink"
        }`}
      >
        <span className={isChildActive ? "text-ink" : "text-ink/55"} aria-hidden="true">{icon}</span>
        {label}
        {isChildActive && <span className="ml-auto size-1.5 rounded-full bg-[#a4e600]" aria-hidden="true" />}
        <ChevronDown
          size={14}
          className={`transition-transform ${expanded ? "rotate-180" : ""} ${isChildActive ? "" : "ml-auto"}`}
          aria-hidden="true"
        />
      </button>
      {expanded && (
        <div className="ml-6 mt-0.5 grid gap-0.5 border-l border-ink/8 pl-3">
          {subItems.map(([childLabel, childHref]) => {
            const childActive = pathname === childHref || pathname.startsWith(`${childHref}/`);
            return (
              <Link
                key={childHref}
                href={childHref}
                aria-current={childActive ? "page" : undefined}
                className={`rounded-md px-2.5 py-1.5 text-xs transition ${
                  childActive ? "bg-berry/10 font-semibold text-berry" : "text-ink/70 hover:bg-ink/4 hover:text-ink"
                }`}
              >
                {childLabel}
              </Link>
            );
          })}
        </div>
      )}
      {/* Keep the parent route reachable for keyboard/screen-reader users. */}
      <Link href={href} className="sr-only" tabIndex={-1} aria-hidden="true">
        {label}
      </Link>
    </div>
  );
}
