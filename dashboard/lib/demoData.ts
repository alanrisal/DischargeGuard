import type { ChecklistItem } from "./types";

export const CHECKLIST: ChecklistItem[] = [
  { id: "met",   name: "Metformin 500mg",        detail: "Twice daily with meals · Diabetes",       category: "medication" },
  { id: "lis",   name: "Lisinopril 10mg",         detail: "Once daily morning · Blood pressure",     category: "medication" },
  { id: "ace",   name: "Acetaminophen 500mg",     detail: "Every 6 hrs as needed · Pain",            category: "medication" },
  { id: "ome",   name: "Omeprazole 20mg",         detail: "Once daily before breakfast · Stomach",   category: "medication" },
  { id: "wound", name: "Wound Care",              detail: "Change dressing · Keep dry 48hr",         category: "care" },
  { id: "warn",  name: "Warning Signs",           detail: "Fever >101°F · Bleeding · Chest pain",    category: "safety" },
  { id: "fu1",   name: "Follow-up: Dr. Thompson", detail: "April 3 at 10:00 AM · Surgeon",           category: "appointment" },
  { id: "fu2",   name: "Follow-up: Dr. Chen",     detail: "April 10 at 2:30 PM · PCP",               category: "appointment" },
  { id: "act",   name: "Activity Limits",         detail: "No lifting >10 lbs · No driving 1 wk",   category: "restriction" },
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
  { id: "CareCoord",  label: ["Care", "Coord."],          cx: 150, cy: 105, r: 22, color: "#e07b54" },
  { id: "DischargeR", label: ["Discharge", "Reader"],     cx: 55,  cy: 45,  r: 16, color: "#7c9cbf" },
  { id: "VoiceCoach", label: ["Voice", "Coach"],          cx: 245, cy: 45,  r: 16, color: "#5aab8a" },
  { id: "Compr.",     label: ["Comprehension", "Check"],  cx: 55,  cy: 165, r: 16, color: "#c4a35a" },
  { id: "EscalAgent", label: ["Escalation", "Agent"],     cx: 245, cy: 165, r: 16, color: "#c46a6a" },
];

export const GRAPH_EDGES: [string, string][] = [
  ["CareCoord", "DischargeR"],
  ["CareCoord", "VoiceCoach"],
  ["CareCoord", "Compr."],
  ["CareCoord", "EscalAgent"],
  ["VoiceCoach", "Compr."],
  ["Compr.", "EscalAgent"],
];
