"use client";

import { UiState } from "@/shared/components/ui-state";

export default function GlobalError({ reset }: { reset: () => void }) {
  return <main className="container-shell grid min-h-screen place-items-center py-10"><div><UiState kind="error" title="We couldn’t load this page" description="Your information is safe. Please try again, or return to the marketplace if the problem continues." /><button className="btn-ink mx-auto mt-5 flex" onClick={reset}>Try again</button></div></main>;
}
