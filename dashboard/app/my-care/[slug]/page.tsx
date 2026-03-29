import { notFound } from "next/navigation";
import MyCareClient from "../MyCareClient";
import { scenarioIdFromMyCareSlug } from "@/lib/myCareSlugs";

export default async function MyCareBySlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const scenarioId = scenarioIdFromMyCareSlug(slug);
  if (!scenarioId) notFound();

  return <MyCareClient initialScenarioId={scenarioId} />;
}
