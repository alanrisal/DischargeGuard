/** Persist last clinical dashboard patient (provider sidebar “Clinical dashboard” link). */
export const CLINICAL_SCENARIO_STORAGE_KEY = "dischargeguard_clinical_scenario";

export const CLINICAL_SCENARIO_IDS = ["maria", "wei", "james"] as const;

export function isClinicalScenarioId(s: string): s is (typeof CLINICAL_SCENARIO_IDS)[number] {
  return (CLINICAL_SCENARIO_IDS as readonly string[]).includes(s);
}
