"use client";

import ErrorBoundary from "@/components/ui/ErrorBoundary";

export default function InversionesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorBoundary error={error} reset={reset} />;
}
