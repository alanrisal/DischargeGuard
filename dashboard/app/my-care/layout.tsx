import type { ReactNode } from "react";

/** Inherits root `globals.css` — same tokens as /dashboard. */
export default function MyCareLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
