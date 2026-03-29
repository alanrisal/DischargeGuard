"use client";
import { useCallback, useEffect, useState } from "react";
import { getPrescriptions, getVisits, getCallHistory, getAllPatients } from "./queries";
import {
  PATIENT_PRESCRIPTIONS, PATIENT_VISITS, PATIENT_CALL_HISTORY,
  WEI_PRESCRIPTIONS, WEI_VISITS, WEI_CALL_HISTORY,
  JAMES_PRESCRIPTIONS, JAMES_VISITS, JAMES_CALL_HISTORY,
} from "./demoData";
import { getScenario } from "./scenarioData";

export type RxRow = {
  name: string; purpose: string; status: string;
  prescribed_by: string; prescribed_date: string; refills: number;
};
export type VisitRow = {
  date: string; type: string; provider: string; department: string; notes: string;
};
export type CallRow = {
  date: string; time: string; duration: string; type: string; status: string;
  agent: string; language_code: string; comprehension_score: number;
  flags: string[]; summary: string; transcript: string | null;
  elevenlabs_conversation_id: string | null;
};

type DemoDataSet = {
  prescriptions: typeof PATIENT_PRESCRIPTIONS;
  visits: typeof PATIENT_VISITS;
  calls: typeof PATIENT_CALL_HISTORY;
};

function getDemoData(scenarioId: string): DemoDataSet {
  switch (scenarioId) {
    case "wei":   return { prescriptions: WEI_PRESCRIPTIONS,   visits: WEI_VISITS,   calls: WEI_CALL_HISTORY };
    case "james": return { prescriptions: JAMES_PRESCRIPTIONS, visits: JAMES_VISITS, calls: JAMES_CALL_HISTORY };
    default:      return { prescriptions: PATIENT_PRESCRIPTIONS, visits: PATIENT_VISITS, calls: PATIENT_CALL_HISTORY };
  }
}

export function usePatientData(scenarioId = "maria") {
  const [prescriptions, setPrescriptions] = useState<RxRow[]>([]);
  const [visits, setVisits]               = useState<VisitRow[]>([]);
  const [calls, setCalls]                 = useState<CallRow[]>([]);
  const [loading, setLoading]             = useState(true);
  const [source, setSource]               = useState<"supabase" | "demo">("demo");
  const [reloadTick, setReloadTick]       = useState(0);

  const refetch = useCallback(() => setReloadTick((n) => n + 1), []);

  useEffect(() => {
    const scenario = getScenario(scenarioId);

    async function load() {
      try {
        const patients = await getAllPatients();
        const patient  = patients?.find((p: { mrn: string }) => p.mrn === scenario.mrn);

        if (!patient) { fallback(); return; }

        const [rxData, visitData, callData] = await Promise.all([
          getPrescriptions(patient.id),
          getVisits(patient.id),
          getCallHistory(patient.id),
        ]);

        if (!rxData?.length && !visitData?.length && !callData?.length) {
          fallback(); return;
        }

        if (rxData?.length)    setPrescriptions(rxData.map((r: any) => ({ name: r.name, purpose: r.purpose, status: r.status, prescribed_by: r.prescribed_by, prescribed_date: r.prescribed_date, refills: r.refills })));
        if (visitData?.length) setVisits(visitData.map((v: any) => ({ date: v.date, type: v.type, provider: v.provider, department: v.department, notes: v.notes })));
        if (callData?.length)  setCalls(callData.map((c: any) => ({
          date: c.date, time: c.time, duration: c.duration, type: c.type, status: c.status, agent: c.agent,
          language_code: c.language_code, comprehension_score: c.comprehension_score, flags: c.flags ?? [],
          summary: c.summary, transcript: c.transcript ?? null, elevenlabs_conversation_id: c.elevenlabs_conversation_id ?? null,
        })));
        setSource("supabase");
      } catch {
        fallback();
      } finally {
        setLoading(false);
      }
    }

    function fallback() {
      const demo = getDemoData(scenarioId);
      setPrescriptions(demo.prescriptions.map((r) => ({ name: r.name, purpose: r.purpose, status: r.status, prescribed_by: r.by, prescribed_date: r.prescribed, refills: r.refills })));
      setVisits(demo.visits.map((v) => ({ date: v.date, type: v.type, provider: v.provider, department: v.dept, notes: v.note })));
      setCalls(demo.calls.map((c) => ({
        date: c.date, time: c.time, duration: c.duration, type: c.type, status: c.status, agent: c.agent,
        language_code: c.language, comprehension_score: c.comprehension, flags: c.flags, summary: c.summary,
        transcript: null, elevenlabs_conversation_id: null,
      })));
      setSource("demo");
      setLoading(false);
    }

    load();
  }, [scenarioId, reloadTick]);

  return { prescriptions, visits, calls, loading, source, refetch };
}
