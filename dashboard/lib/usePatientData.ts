"use client";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { getPrescriptions, getVisits, getCallHistory, getPatientByMrn } from "./queries";
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

function applyDemoRows(scenarioId: string) {
  const demo = getDemoData(scenarioId);
  return {
    prescriptions: demo.prescriptions.map((r) => ({
      name: r.name, purpose: r.purpose, status: r.status, prescribed_by: r.by, prescribed_date: r.prescribed, refills: r.refills,
    })),
    visits: demo.visits.map((v) => ({
      date: v.date, type: v.type, provider: v.provider, department: v.dept, notes: v.note,
    })),
    calls: demo.calls.map((c) => ({
      date: c.date, time: c.time, duration: c.duration, type: c.type, status: c.status, agent: c.agent, language_code: c.language,
      comprehension_score: c.comprehension, flags: c.flags, summary: c.summary, transcript: null as string | null,
      elevenlabs_conversation_id: null as string | null,
    })),
  };
}

export function usePatientData(scenarioId = "maria") {
  const [prescriptions, setPrescriptions] = useState<RxRow[]>(() => applyDemoRows(scenarioId).prescriptions);
  const [visits, setVisits]               = useState<VisitRow[]>(() => applyDemoRows(scenarioId).visits);
  const [calls, setCalls]                 = useState<CallRow[]>(() => applyDemoRows(scenarioId).calls);
  const [source, setSource]               = useState<"supabase" | "demo">("demo");
  const [refreshTick, setRefreshTick]     = useState(0);

  const refetch = useCallback(() => setRefreshTick((n) => n + 1), []);

  useLayoutEffect(() => {
    const rows = applyDemoRows(scenarioId);
    setPrescriptions(rows.prescriptions);
    setVisits(rows.visits);
    setCalls(rows.calls);
    setSource("demo");
  }, [scenarioId]);

  useEffect(() => {
    let cancelled = false;
    const scenario = getScenario(scenarioId);

    (async () => {
      try {
        const patient = await getPatientByMrn(scenario.mrn);
        if (cancelled || !patient) return;

        const [rxData, visitData, callData] = await Promise.all([
          getPrescriptions(patient.id),
          getVisits(patient.id),
          getCallHistory(patient.id),
        ]);
        if (cancelled) return;

        setSource("supabase");

        setPrescriptions(
          rxData?.length
            ? rxData.map((r: any) => ({
                name: r.name,
                purpose: r.purpose,
                status: r.status,
                prescribed_by: r.prescribed_by,
                prescribed_date: r.prescribed_date,
                refills: r.refills,
              }))
            : []
        );
        setVisits(
          visitData?.length
            ? visitData.map((v: any) => ({
                date: v.date,
                type: v.type,
                provider: v.provider,
                department: v.department,
                notes: v.notes,
              }))
            : []
        );
        setCalls(
          callData?.length
            ? callData.map((c: any) => ({
                date: c.date,
                time: c.time,
                duration: c.duration,
                type: c.type,
                status: c.status,
                agent: c.agent,
                language_code: c.language_code,
                comprehension_score: c.comprehension_score,
                flags: c.flags ?? [],
                summary: c.summary,
                transcript: (c.transcript as string | null | undefined) ?? null,
                elevenlabs_conversation_id: c.elevenlabs_conversation_id,
              }))
            : []
        );
      } catch {
        /* keep demo rows */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [scenarioId, refreshTick]);

  useEffect(() => {
    if (source !== "supabase") return;
    const id = setInterval(() => setRefreshTick((n) => n + 1), 25_000);
    return () => clearInterval(id);
  }, [source]);

  return { prescriptions, visits, calls, loading: false, source, refetch };
}
