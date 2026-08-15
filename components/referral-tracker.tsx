"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";

function TrackerContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      const code = ref.trim().toUpperCase();
      // Set a cookie valid for 30 days
      const days = 30;
      const date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      document.cookie = `knivik_ref_code=${code}; expires=${date.toUTCString()}; path=/; SameSite=Lax`;
    }
  }, [searchParams]);

  return null;
}

export function ReferralTracker() {
  return (
    <Suspense fallback={null}>
      <TrackerContent />
    </Suspense>
  );
}
