import Link from "next/link";
import { redirect } from "next/navigation";
import { MY_CARE_PORTAL_LINKS } from "@/lib/myCareSlugs";

type Search = { scenario?: string; mrn?: string };

/**
 * /my-care → default portal patient (Maria).
 * Prefer /my-care/m, /my-care/wei, /my-care/james for direct links.
 */
export default async function MyCarePage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  if (sp.scenario === "wei") redirect("/my-care/wei");
  if (sp.scenario === "james") redirect("/my-care/james");
  if (sp.scenario === "maria") redirect("/my-care/m");
  if (typeof sp.mrn === "string" && sp.mrn.trim()) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          background: "var(--bg-base)",
          fontFamily: "var(--font-body)",
          padding: 24,
        }}
      >
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
          Open your care portal by profile (MRN lookup is on the clinical dashboard).
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
          {MY_CARE_PORTAL_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              style={{
                padding: "10px 18px",
                borderRadius: 12,
                background: "var(--surface-raised)",
                color: "var(--text-primary)",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: 13,
                boxShadow: "4px 4px 10px var(--shadow-dark), -4px -4px 10px var(--shadow-light)",
              }}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    );
  }

  redirect("/my-care/m");
}
