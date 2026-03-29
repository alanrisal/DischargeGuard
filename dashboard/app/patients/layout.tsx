import type { ReactNode } from "react";

/** Uses root `globals.css` (same tokens as /dashboard) — no separate hdc theme. */
export default function PatientsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
