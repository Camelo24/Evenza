import { UiState } from "@/shared/components/ui-state";

export default function Loading() {
  return <main className="container-shell grid min-h-screen place-items-center py-10"><UiState kind="loading" title="Preparing your workspace" description="We’re securely gathering the latest details for you." /></main>;
}
