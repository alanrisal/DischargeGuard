"use client";
import { useEffect, useState } from "react";
import { getPrescriptions, getVisits, getCallHistory, getAllPatients } from "./queries";
import { PATIENT_PRESCRIPTIONS, PATIENT_VISITS, PATIENT_CALL_HISTORY } from "./demoData";

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
  flags: string[]; summary: string; elevenlabs_conversation_id: string | null;
};

const DEMO_MRN = "847291";

export function usePatientData() {
  const [prescriptions, setPrescriptions] = useState<RxRow[]>([]);
  const [visits, setVisits]               = useState<VisitRow[]>([]);
  const [calls, setCalls]                 = useState<CallRow[]>([]);
  const [loading, setLoading]             = useState(true);
  const [source, setSource]               = useState<"supabase" | "demo">("demo");

  useEffect(() => {
    async function load() {
      try {
        const patients = await getAllPatients();
        const patient  = patients?.find((p: { mrn: string }) => p.mrn === DEMO_MRN);

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
        if (callData?.length)  setCalls(callData.map((c: any) => ({ date: c.date, time: c.time, duration: c.duration, type: c.type, status: c.status, agent: c.agent, language_code: c.language_code, comprehension_score: c.comprehension_score, flags: c.flags ?? [], summary: c.summary, elevenlabs_conversation_id: c.elevenlabs_conversation_id })));
        setSource("supabase");
      } catch {
        fallback();
      } finally {
        setLoading(false);
      }
    }

    function fallback() {
      setPrescriptions(PATIENT_PRESCRIPTIONS.map((r) => ({ name: r.name, purpose: r.purpose, status: r.status, prescribed_by: r.by, prescribed_date: r.prescribed, refills: r.refills })));
      setVisits(PATIENT_VISITS.map((v) => ({ date: v.date, type: v.type, provider: v.provider, department: v.dept, notes: v.note })));
      setCalls(PATIENT_CALL_HISTORY.map((c) => ({ date: c.date, time: c.time, duration: c.duration, type: c.type, status: c.status, agent: c.agent, language_code: c.language, comprehension_score: c.comprehension, flags: c.flags, summary: c.summary, elevenlabs_conversation_id: null })));
      setSource("demo");
      setLoading(false);
    }

    load();
  }, []);

  return { prescriptions, visits, calls, loading, source };
}
