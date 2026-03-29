import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const AGENT_ID = "agent_3001kmtk38tae4m9rhs2thzdvh3r";

type PatientData = {
  hospital: { name: string };
  patient: {
    first_name: string; language: string; discharge_date: string;
    diagnosis: string; procedure: string; primary_provider: string;
  };
  medications: { name: string; dose: string; frequency: string; purpose: string; special_instructions: string | null }[];
  activity_restrictions: string[];
  wound_care: string[];
  follow_ups: { date: string; time: string; provider: string; purpose: string }[];
  warning_signs: string[];
};

function loadPatientData(): PatientData {
  const filePath = path.join(process.cwd(), "..", "agents", "voice_coach", "sample_data.json");
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as PatientData;
}

/** Format dynamic variables exactly as useVoiceAgent.ts does for browser calls. */
function buildDynamicVariables() {
  const d = loadPatientData();

  const medsFormatted = d.medications
    .map((m) =>
      `- ${m.name} ${m.dose}: ${m.frequency}. Purpose: ${m.purpose}` +
      (m.special_instructions ? `. Note: ${m.special_instructions}` : "")
    )
    .join("\n");

  return {
    patient_first_name: d.patient.first_name,
    hospital_name:      d.hospital.name,
    patient_language:   d.patient.language,
    discharge_date:     d.patient.discharge_date,
    diagnosis:          d.patient.diagnosis,
    procedure:          d.patient.procedure,
    primary_provider:   d.patient.primary_provider.replace(/^Dr\.\s*/i, ""),
    medications:        medsFormatted,
    restrictions:       d.activity_restrictions.map((r) => `- ${r}`).join("\n"),
    wound_care:         d.wound_care.map((w) => `- ${w}`).join("\n"),
    follow_ups:         d.follow_ups.map((f) => `- ${f.date} at ${f.time} with ${f.provider}: ${f.purpose}`).join("\n"),
    warning_signs:      d.warning_signs.map((w) => `- ${w}`).join("\n"),
  };
}

export async function POST(req: NextRequest) {
  const { phoneNumber } = await req.json();

  if (!phoneNumber) {
    return NextResponse.json({ error: "phoneNumber is required" }, { status: 400 });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  const phoneNumberId = process.env.ELEVENLABS_PHONE_NUMBER_ID;

  if (!apiKey || !phoneNumberId) {
    return NextResponse.json(
      { error: "ELEVENLABS_API_KEY and ELEVENLABS_PHONE_NUMBER_ID must be set in .env.local." },
      { status: 500 }
    );
  }

  const body = {
    agent_id: AGENT_ID,
    agent_phone_number_id: phoneNumberId,
    to_number: phoneNumber,
    // Pass the same patient variables the browser agent uses.
    // Without this the agent hits unfilled Handlebars placeholders and hangs up.
    conversation_initiation_client_data: {
      dynamic_variables: buildDynamicVariables(),
    },
  };

  console.log("[outbound-call] Initiating call to", phoneNumber);

  const res = await fetch("https://api.elevenlabs.io/v1/convai/twilio/outbound_call", {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  console.log("[outbound-call] ElevenLabs response:", JSON.stringify(data));

  if (!res.ok) {
    return NextResponse.json(
      { error: data?.detail || data?.message || "ElevenLabs API error", raw: data },
      { status: res.status }
    );
  }

  return NextResponse.json(data);
}
