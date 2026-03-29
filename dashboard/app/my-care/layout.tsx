import type { ReactNode } from "react";

/** Inherits root `globals.css` — same chrome as /dashboard and /patients. */
export default function MyCareLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
