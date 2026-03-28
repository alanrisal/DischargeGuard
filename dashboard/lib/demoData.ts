import type { ChecklistItem } from "./types";

// Maria Garcia — post-cholecystectomy, T2 diabetes, hypertension
export const CHECKLIST: ChecklistItem[] = [
  { id: "met",   name: "Metformin 500mg",        detail: "Twice daily with meals · Diabetes",         category: "medication" },
  { id: "lis",   name: "Lisinopril 10mg",         detail: "Once daily morning · Hypertension",         category: "medication" },
  { id: "ome",   name: "Omeprazole 20mg",         detail: "Once daily before breakfast · Stomach",     category: "medication" },
  { id: "ace",   name: "Acetaminophen 500mg",     detail: "Every 6 hrs as needed · Surgical pain",     category: "medication" },
  { id: "wound", name: "Wound Care",              detail: "Change dressing · Keep dry 48hr",           category: "care" },
  { id: "warn",  name: "Warning Signs",           detail: "Fever >101°F · Bleeding · Chest pain",      category: "safety" },
  { id: "fu1",   name: "Follow-up: Dr. Thompson", detail: "April 3 at 10:00 AM · Surgeon",             category: "appointment" },
  { id: "fu2",   name: "Follow-up: Dr. Chen",     detail: "April 10 at 2:30 PM · PCP",                 category: "appointment" },
  { id: "act",   name: "Activity Limits",         detail: "No lifting >10 lbs · No driving 1 wk",     category: "restriction" },
];

// Wei Chen — post-cardiac stent, hypertension, atrial fibrillation
export const CHECKLIST_WEI: ChecklistItem[] = [
  { id: "asp",   name: "Aspirin 81mg",            detail: "Once daily · Anti-platelet therapy",        category: "medication" },
  { id: "clo",   name: "Clopidogrel 75mg",        detail: "Once daily · Prevent stent clotting",       category: "medication" },
  { id: "met2",  name: "Metoprolol 25mg",         detail: "Twice daily · Heart rate control",          category: "medication" },
  { id: "ato",   name: "Atorvastatin 40mg",       detail: "Once daily at night · Cholesterol",         category: "medication" },
  { id: "act2",  name: "Activity Restrictions",   detail: "No strenuous activity 2 wks · Walk daily",  category: "restriction" },
  { id: "warn2", name: "Warning Signs",           detail: "Chest pain · Shortness of breath · Dizzy",  category: "safety" },
  { id: "diet",  name: "Dietary Guidelines",      detail: "Low sodium · Low fat · No grapefruit",      category: "care" },
  { id: "fu3",   name: "Follow-up: Dr. Patel",    detail: "April 5 at 9:00 AM · Cardiologist",         category: "appointment" },
  { id: "mon",   name: "BP Monitoring",           detail: "Check BP twice daily · Log readings",       category: "care" },
];

// James Wilson — post-hip replacement, COPD, type 2 diabetes
export const CHECKLIST_JAMES: ChecklistItem[] = [
  { id: "oxy",   name: "Oxycodone 5mg",           detail: "Every 4-6 hrs as needed · Post-op pain",    category: "medication" },
  { id: "cel",   name: "Celecoxib 200mg",         detail: "Twice daily with food · Inflammation",      category: "medication" },
  { id: "war",   name: "Warfarin 5mg",            detail: "Once daily · DVT prevention post-surgery",  category: "medication" },
  { id: "sal",   name: "Salbutamol Inhaler",      detail: "2 puffs as needed · COPD rescue",           category: "medication" },
  { id: "met3",  name: "Metformin 1000mg",        detail: "Twice daily with meals · Diabetes",         category: "medication" },
  { id: "pt",    name: "Physical Therapy",        detail: "Daily exercises · Walker required 4 wks",   category: "care" },
  { id: "warn3", name: "Warning Signs",           detail: "Leg swelling · Breathing difficulty · Fever", category: "safety" },
  { id: "fu4",   name: "Follow-up: Dr. Nguyen",   detail: "April 4 at 11:00 AM · Orthopedics",         category: "appointment" },
  { id: "inr",   name: "INR Monitoring",          detail: "Blood test April 1 · Warfarin dose check",  category: "care" },
];

export const SUBTITLES = [
  { t: 1.5, es: "Hola, señora García. Le llama el hospital para ver cómo se encuentra.", en: "Hello, Mrs. García. The hospital is calling to see how you're doing." },
  { t: 5,   es: "Primero, hablemos de sus medicamentos. ¿Ha podido tomar la metformina?", en: "First, let's talk about your medications. Have you been able to take metformin?" },
  { t: 10,  es: "Paciente: \"Creo que es la pastilla azul... ¿para la presión?\"", en: "Patient: \"I think it's the blue pill... for blood pressure?\"" },
  { t: 14,  es: "Entiendo, permítame explicarle mejor. La metformina es para la diabetes, no para la presión arterial.", en: "I understand, let me explain better. Metformin is for diabetes, not blood pressure." },
  { t: 19,  es: "Paciente: \"Ah sí, ahora entiendo. La tomo dos veces al día con las comidas.\"", en: "Patient: \"Ah yes, I understand now. I take it twice a day with meals.\"" },
  { t: 23,  es: "Perfecto. Y el lisinopril, ¿lo ha tomado esta mañana?", en: "Perfect. And the lisinopril, have you taken it this morning?" },
  { t: 28,  es: "Paciente: \"Sí, una pastilla por la mañana como me dijeron.\"", en: "Patient: \"Yes, one pill in the morning as they told me.\"" },
  { t: 32,  es: "Ahora hablemos de las señales de alarma importantes...", en: "Now let's talk about important warning signs..." },
  { t: 37,  es: "Si tiene fiebre mayor de 101°F, enrojecimiento o dolor que empeora, vaya a urgencias.", en: "If you have a fever above 101°F, redness, or worsening pain, go to the ER." },
  { t: 43,  es: "Paciente: \"Entendido. A propósito, tengo un dolor de cabeza desde ayer que no se quita.\"", en: "Patient: \"Understood. By the way, I've had a headache since yesterday that won't go away.\"" },
  { t: 48,  es: "Entiendo, señora García. Una enfermera le llamará dentro de una hora para revisar eso.", en: "I understand, Mrs. García. A nurse will call you within an hour to check on that." },
  { t: 53,  es: "¿Recuerda su cita con el Dr. Thompson el 3 de abril a las 10 de la mañana?", en: "Do you remember your appointment with Dr. Thompson on April 3 at 10 AM?" },
  { t: 58,  es: "Paciente: \"Sí, lo tengo apuntado. Muchas gracias por llamar.\"", en: "Patient: \"Yes, I have it written down. Thank you so much for calling.\"" },
  { t: 62,  es: "Ha sido un placer. Una enfermera la llamará pronto. ¡Cuídese mucho!", en: "It's been a pleasure. A nurse will call you soon. Take good care!" },
];

export const EVENTS = [
  { t: 4,  type: "activate",  id: "met" },
  { t: 9,  type: "status",    id: "met",   status: "red",    score: "RED",     note: "Confused with BP medication", fill: 20 },
  { t: 13, type: "a2a",       from: "Compr.",    to: "CareCoord",  msg: "Metformin → RED: confused w/ BP med" },
  { t: 13, type: "a2a",       from: "CareCoord", to: "VoiceCoach", msg: "Re-explain Metformin — wrong medication" },
  { t: 18, type: "status",    id: "met",   status: "green",  score: "GREEN",   note: "",    fill: 95 },
  { t: 22, type: "activate",  id: "lis" },
  { t: 27, type: "status",    id: "lis",   status: "green",  score: "GREEN",   note: "",    fill: 90 },
  { t: 27, type: "activate",  id: "ace" },
  { t: 31, type: "status",    id: "ace",   status: "green",  score: "GREEN",   note: "",    fill: 85 },
  { t: 31, type: "activate",  id: "warn" },
  { t: 36, type: "status",    id: "warn",  status: "green",  score: "GREEN",   note: "",    fill: 100 },
  { t: 36, type: "activate",  id: "wound" },
  { t: 40, type: "status",    id: "wound", status: "yellow", score: "PARTIAL", note: "",    fill: 65 },
  { t: 42, type: "a2a",       from: "VoiceCoach", to: "Compr.",    msg: "Persistent headache since discharge" },
  { t: 43, type: "escalate" },
  { t: 43, type: "a2a",       from: "Compr.",     to: "EscalAgent", msg: "SAFETY FLAG: persistent headache → escalate" },
  { t: 44, type: "a2a",       from: "EscalAgent", to: "CareCoord",  msg: "⚠ Nurse callback scheduled — 1 hr" },
  { t: 52, type: "activate",  id: "fu1" },
  { t: 57, type: "status",    id: "fu1",  status: "green",  score: "GREEN",   note: "",    fill: 100 },
  { t: 60, type: "activate",  id: "fu2" },
  { t: 64, type: "status",    id: "fu2",  status: "green",  score: "GREEN",   note: "",    fill: 100 },
  { t: 65, type: "end" },
];

export const GRAPH_NODES = [
  { id: "CareCoord",  label: ["Care", "Coord."],          cx: 150, cy: 105, r: 22, color: "#2563eb" },
  { id: "DischargeR", label: ["Discharge", "Reader"],     cx: 55,  cy: 45,  r: 16, color: "#7c3aed" },
  { id: "VoiceCoach", label: ["Voice", "Coach"],          cx: 245, cy: 45,  r: 16, color: "#0891b2" },
  { id: "Compr.",     label: ["Comprehension", "Check"],  cx: 55,  cy: 165, r: 16, color: "#0284c7" },
  { id: "EscalAgent", label: ["Escalation", "Agent"],     cx: 245, cy: 165, r: 16, color: "#dc2626" },
];

export const GRAPH_EDGES: [string, string][] = [
  ["CareCoord", "DischargeR"],
  ["CareCoord", "VoiceCoach"],
  ["CareCoord", "Compr."],
  ["CareCoord", "EscalAgent"],
  ["VoiceCoach", "Compr."],
  ["Compr.", "EscalAgent"],
];

// ── Patient history demo data (will be replaced by Google ADK + ElevenLabs API) ──

export const PATIENT_PRESCRIPTIONS = [
  { name: "Metformin 500mg",      prescribed: "Jan 12, 2026", by: "Dr. Chen",     status: "active",      refills: 3, purpose: "Type 2 Diabetes" },
  { name: "Lisinopril 10mg",      prescribed: "Nov 4, 2025",  by: "Dr. Chen",     status: "active",      refills: 5, purpose: "Hypertension" },
  { name: "Omeprazole 20mg",      prescribed: "Mar 27, 2026", by: "Dr. Thompson", status: "new",         refills: 1, purpose: "Stomach protection post-op" },
  { name: "Acetaminophen 500mg",  prescribed: "Mar 27, 2026", by: "Dr. Thompson", status: "new",         refills: 0, purpose: "Post-surgical pain" },
  { name: "Atorvastatin 20mg",    prescribed: "Aug 18, 2025", by: "Dr. Chen",     status: "active",      refills: 6, purpose: "Cholesterol" },
  { name: "Aspirin 81mg",         prescribed: "Aug 18, 2025", by: "Dr. Chen",     status: "active",      refills: 11, purpose: "Cardiovascular prevention" },
  { name: "Warfarin 2.5mg",       prescribed: "Feb 2, 2025",  by: "Dr. Patel",    status: "discontinued", refills: 0, purpose: "Blood clot prevention" },
];

export const PATIENT_VISITS = [
  { date: "Mar 27, 2026", type: "Discharge",        provider: "Dr. Thompson",  dept: "Surgery",       note: "Post-cholecystectomy discharge. Stable." },
  { date: "Mar 25, 2026", type: "Surgery",           provider: "Dr. Thompson",  dept: "Surgery",       note: "Laparoscopic cholecystectomy — uncomplicated." },
  { date: "Mar 24, 2026", type: "Pre-op",            provider: "Dr. Thompson",  dept: "Surgery",       note: "Pre-surgical assessment. Cleared for procedure." },
  { date: "Feb 10, 2026", type: "Follow-up",         provider: "Dr. Chen",      dept: "Primary Care",  note: "HbA1c 7.2 — diabetes management on track." },
  { date: "Nov 4, 2025",  type: "Annual Physical",   provider: "Dr. Chen",      dept: "Primary Care",  note: "BP 138/88. Lisinopril dose maintained." },
  { date: "Aug 18, 2025", type: "Cardiology Consult",provider: "Dr. Patel",     dept: "Cardiology",    note: "Lipid panel reviewed. Statin therapy initiated." },
];

export const PATIENT_CALL_HISTORY = [
  {
    date: "Mar 27, 2026",
    time: "2:14 PM",
    duration: "1:05",
    type: "Post-discharge",
    status: "completed",
    agent: "ElevenLabs VoiceCoach",
    language: "ES",
    comprehension: 78,
    flags: ["Persistent headache flagged", "Nurse callback scheduled"],
    summary: "Patient understood 7/9 discharge items. Confused Metformin with BP medication — re-explained successfully. Headache symptom escalated to care team.",
  },
  {
    date: "Feb 10, 2026",
    time: "10:30 AM",
    duration: "0:48",
    type: "Medication check-in",
    status: "completed",
    agent: "ElevenLabs VoiceCoach",
    language: "ES",
    comprehension: 92,
    flags: [],
    summary: "Patient confirmed taking all medications correctly. No concerns raised. Follow-up appointment confirmed.",
  },
  {
    date: "Nov 6, 2025",
    time: "9:05 AM",
    duration: "0:32",
    type: "Post-discharge",
    status: "completed",
    agent: "ElevenLabs VoiceCoach",
    language: "ES",
    comprehension: 65,
    flags: ["Missed dose reported"],
    summary: "Patient reported missing Lisinopril dose twice. Nurse notified. Medication adherence counseling scheduled.",
  },
  {
    date: "Aug 20, 2025",
    time: "3:45 PM",
    duration: "0:00",
    type: "Medication check-in",
    status: "no-answer",
    agent: "ElevenLabs VoiceCoach",
    language: "ES",
    comprehension: 0,
    flags: [],
    summary: "No answer. Voicemail left. Retry scheduled.",
  },
];
