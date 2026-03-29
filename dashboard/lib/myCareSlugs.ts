import { SCENARIOS } from "./scenarioData";

/** Short URLs: /my-care/m, /my-care/wei, /my-care/james */
const SLUG_TO_SCENARIO: Record<string, keyof typeof SCENARIOS> = {
  m: "maria", maria: "maria",
  wei: "wei", w: "wei",
  j: "james", james: "james",
};

export function scenarioIdFromMyCareSlug(slug: string): string | null {
  const id = SLUG_TO_SCENARIO[slug.trim().toLowerCase()];
  return id ?? null;
}

export const MY_CARE_PORTAL_LINKS = [
  { href: "/my-care/m",     label: "Maria Garcia", scenario: "maria" as const },
  { href: "/my-care/wei",   label: "Wei Chen",     scenario: "wei"   as const },
  { href: "/my-care/james", label: "James Wilson", scenario: "james" as const },
];
