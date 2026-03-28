"use client";
import { useEffect, useState } from "react";
import { getPrescriptions, getVisits, getCallHistory, getAllPatients } from "./queries";
import {
  PATIENT_PRESCRIPTIONS,
  PATIENT_VISITS,
  PATIENT_CALL_HISTORY,
} from "./demoData";

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

// Maria Garcia's MRN — used to look up her patient_id from Supabase
const DEMO_MRN = "847291";

export function usePatientData() {
  const [patientId, setPatientId] = useState<string | null>(null);
  const [prescriptions, setPrescriptions] = useState<RxRow[]>([]);
  const [visits, setVisits]             = useState<VisitRow[]>([]);
  const [calls, setCalls]               = useState<CallRow[]>([]);
  const [loading, setLoading]           = useState(true);
  const [source, setSource]             = useState<"supabase" | "demo">("demo");

  useEffect(() => {
    async function load() {
      try {
        // Find patient by MRN
        const patients = await getAllPatients();
        const patient = patients?.find((p: { mrn: string }) => p.mrn === DEMO_MRN);

        if (!patient) {
          // No data in Supabase yet — fall back to demo
          useDemoData();
          return;
        }

        setPatientId(patient.id);

        const [rxData, visitData, callData] = await Promise.all([
          getPrescriptions(patient.id),
          getVisits(patient.id),
          getCallHistory(patient.id),
        ]);

        // If tables are empty fall back to demo
        if (!rxData?.length && !visitData?.length && !callData?.length) {
          useDemoData();
          return;
        }

        if (rxData?.length)    setPrescriptions(rxData);
        if (visitData?.length) setVisits(visitData);
        if (callData?.length)  setCalls(callData);
        setSource("supabase");
      } catch {
        // Supabase not reachable or keys not set — use demo data silently
        useDemoData();
      } finally {
        setLoading(false);
      }
    }

    function useDemoData() {
      setPrescriptions(
        PATIENT_PRESCRIPTIONS.map((r) => ({
          name: r.name, purpose: r.purpose, status: r.status,
          prescribed_by: r.by, prescribed_date: r.prescribed, refills: r.refills,
        }))
      );
      setVisits(
        PATIENT_VISITS.map((v) => ({
          date: v.date, type: v.type, provider: v.provider,
          department: v.dept, notes: v.note,
        }))
      );
      setCalls(
        PATIENT_CALL_HISTORY.map((c) => ({
          date: c.date, time: c.time, duration: c.duration, type: c.type,
          status: c.status, agent: c.agent, language_code: c.language,
          comprehension_score: c.comprehension, flags: c.flags,
          summary: c.summary, elevenlabs_conversation_id: null,
        }))
      );
      setSource("demo");
      setLoading(false);
    }

    load();
  }, []);

  return { patientId, prescriptions, visits, calls, loading, source };
}
