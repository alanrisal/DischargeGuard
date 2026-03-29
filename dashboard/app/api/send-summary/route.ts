import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  tls: { rejectUnauthorized: false },
  auth: {
    user: process.env.GMAIL_USER?.trim(),
    pass: process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, ""),
  },
});

const STEP_LABELS: Record<string, string> = {
  opening: "Opening", symptoms: "Symptoms Check", medications: "Medications",
  activity_restrictions: "Activity Restrictions", wound_care: "Wound Care",
  follow_ups: "Follow-Up Appointments", warning_signs: "Warning Signs",
  open_questions: "Open Questions", closing: "Closing",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      patientName      = "Unknown Patient",
      callTime         = "—",
      comprehension    = 0,
      greenCount       = 0,
      totalItems       = 9,
      completedSteps   = [] as string[],
      flaggedWarnings  = [] as { sign: string; severity: string }[],
      transcript       = "",
    } = body;

    const scoreColor = comprehension > 80 ? "#16a34a" : comprehension > 50 ? "#d97706" : "#dc2626";

    // ── Summary highlights ──────────────────────────────────────
    const highlights: string[] = [];

    if (completedSteps.includes("medications")) {
      highlights.push("💊 Medications section completed — patient reviewed all prescriptions");
    } else {
      highlights.push("💊 Medications section not completed — follow-up recommended");
    }
    if (completedSteps.includes("symptoms")) {
      highlights.push("🩺 Symptoms check completed");
    }
    if (completedSteps.includes("warning_signs")) {
      highlights.push("⚠️ Warning signs reviewed with patient");
    }
    flaggedWarnings.forEach((w: { sign: string; severity: string }) => {
      highlights.push(`${w.severity === "urgent" ? "🚨" : "⚠️"} Concerning symptom flagged: ${w.sign}`);
    });
    if (greenCount === totalItems) {
      highlights.push("✅ All workflow steps completed successfully");
    }

    // ── Workflow progress rows ──────────────────────────────────
    const workflowRows = Object.entries(STEP_LABELS).map(([id, label]) => {
      const done = (completedSteps as string[]).includes(id);
      return `<tr>
        <td style="padding:5px 8px;font-size:14px">${done ? "✅" : "⬜"}</td>
        <td style="padding:5px 8px;font-size:12px;color:${done ? "#1a2340" : "#6b7a9e"}">${label}</td>
        <td style="padding:5px 8px;font-size:11px;font-family:monospace;color:${done ? "#16a34a" : "#c7d2e8"}">${done ? "DONE" : "—"}</td>
      </tr>`;
    }).join("");

    // ── Flagged warnings rows ───────────────────────────────────
    const warningRows = (flaggedWarnings as { sign: string; severity: string }[]).map((w) =>
      `<li style="margin-bottom:6px;font-size:12px;color:${w.severity === "urgent" ? "#dc2626" : "#d97706"}">
        ${w.severity === "urgent" ? "🚨" : "⚠️"} ${w.sign}
      </li>`
    ).join("");

    // ── Transcript excerpt (last 6 lines) ───────────────────────
    const transcriptLines = (transcript as string).split("\n").filter(Boolean);
    const excerptLines    = transcriptLines.slice(-6);
    const transcriptHtml  = excerptLines.map((line) => {
      const isAgent = line.startsWith("ALEX:");
      return `<div style="margin-bottom:6px;display:flex;gap:8px">
        <span style="font-size:9px;font-weight:700;font-family:monospace;color:${isAgent ? "#2563eb" : "#16a34a"};flex-shrink:0;padding-top:2px;width:28px">${isAgent ? "ALEX" : "PT"}</span>
        <span style="font-size:11px;color:#1a2340;line-height:1.5">${line.replace(/^(ALEX|PT):\s*/, "")}</span>
      </div>`;
    }).join("");

    const html = `
<div style="font-family:system-ui,sans-serif;max-width:620px;margin:0 auto;background:#f8faff;padding:24px;border-radius:12px">
  <h2 style="margin:0 0 4px;color:#1a2340">🏥 CareCall — Call Summary</h2>
  <p style="margin:0 0 20px;font-size:12px;color:#6b7a9e">Post-discharge follow-up report</p>

  <!-- Patient -->
  <div style="background:#fff;border-radius:10px;padding:14px 16px;margin-bottom:16px;border:1px solid #dde3f5">
    <p style="margin:0 0 2px;font-size:10px;color:#6b7a9e;text-transform:uppercase;letter-spacing:1px">Patient</p>
    <p style="margin:0;font-size:16px;font-weight:600;color:#1a2340">${patientName}</p>
  </div>

  <!-- Stats -->
  <table style="width:100%;border-collapse:separate;border-spacing:8px;margin-bottom:16px">
    <tr>
      <td style="background:#fff;border:1px solid #dde3f5;border-radius:8px;padding:12px;text-align:center">
        <div style="font-size:22px;font-weight:700;color:#2563eb;font-family:monospace">${callTime}</div>
        <div style="font-size:10px;color:#6b7a9e;margin-top:4px">Call Duration</div>
      </td>
      <td style="background:#fff;border:1px solid #dde3f5;border-radius:8px;padding:12px;text-align:center">
        <div style="font-size:22px;font-weight:700;color:${scoreColor};font-family:monospace">${comprehension}%</div>
        <div style="font-size:10px;color:#6b7a9e;margin-top:4px">Comprehension</div>
      </td>
      <td style="background:#fff;border:1px solid #dde3f5;border-radius:8px;padding:12px;text-align:center">
        <div style="font-size:22px;font-weight:700;color:#16a34a;font-family:monospace">${greenCount}/${totalItems}</div>
        <div style="font-size:10px;color:#6b7a9e;margin-top:4px">Steps Done</div>
      </td>
    </tr>
  </table>

  <!-- Highlights / Summary -->
  <div style="background:#fff;border:1px solid #dde3f5;border-radius:10px;padding:14px 16px;margin-bottom:16px">
    <p style="margin:0 0 10px;font-size:10px;font-weight:600;color:#6b7a9e;letter-spacing:1px;text-transform:uppercase">Call Summary</p>
    <ul style="margin:0;padding-left:16px">
      ${highlights.map((h) => `<li style="margin-bottom:6px;font-size:12px;color:#1a2340">${h}</li>`).join("")}
    </ul>
  </div>

  <!-- Flagged warnings -->
  ${warningRows ? `
  <div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:10px;padding:14px 16px;margin-bottom:16px">
    <p style="margin:0 0 8px;font-size:10px;font-weight:600;color:#dc2626;letter-spacing:1px;text-transform:uppercase">⚠ Concerning Symptoms</p>
    <ul style="margin:0;padding-left:16px">${warningRows}</ul>
  </div>` : ""}

  <!-- Workflow progress -->
  <div style="background:#fff;border:1px solid #dde3f5;border-radius:10px;padding:14px 16px;margin-bottom:16px">
    <p style="margin:0 0 10px;font-size:10px;font-weight:600;color:#6b7a9e;letter-spacing:1px;text-transform:uppercase">Workflow Progress</p>
    <table style="width:100%;border-collapse:collapse">${workflowRows}</table>
  </div>

  <!-- Transcript excerpt -->
  ${transcriptHtml ? `
  <div style="background:#fff;border:1px solid #dde3f5;border-radius:10px;padding:14px 16px;margin-bottom:16px">
    <p style="margin:0 0 10px;font-size:10px;font-weight:600;color:#6b7a9e;letter-spacing:1px;text-transform:uppercase">Transcript Excerpt (last exchanges)</p>
    ${transcriptHtml}
  </div>` : ""}

  <p style="font-size:10px;color:#c7d2e8;text-align:center;margin-top:20px">
    CareCall · AI-powered post-discharge follow-up · Google ADK + ElevenLabs
  </p>
</div>`;

    await transporter.sendMail({
      from: `"CareCall" <${process.env.GMAIL_USER?.trim()}>`,
      to: process.env.DEMO_RECIPIENT_EMAIL?.trim(),
      subject: `📋 Call Summary — ${patientName} · ${comprehension}% comprehension`,
      html,
    });

    // ── Save to Supabase call_history ───────────────────────────
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      const patientMrn = body.patientMrn;
      if (patientMrn) {
        const { data: patient } = await supabase
          .from("patients").select("id").eq("mrn", patientMrn).single();
        if (patient) {
          const now = new Date();
          await supabase.from("call_history").insert({
            patient_id:          patient.id,
            date:                now.toISOString().split("T")[0],
            time:                now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
            duration:            callTime,
            type:                "Post-discharge",
            status:              "completed",
            agent:               "ElevenLabs VoiceCoach",
            language_code:       body.languageCode ?? "en",
            comprehension_score: comprehension,
            flags:               (flaggedWarnings as { sign: string }[]).map((w) => w.sign),
            summary:             (completedSteps as string[]).includes("medications")
              ? "Medications reviewed. "
              : ("Medications not completed. " +
                ((flaggedWarnings as { sign: string }[]).length > 0
                  ? `${(flaggedWarnings as { sign: string }[]).length} concern(s) flagged.`
                  : "No concerns flagged.")),
            elevenlabs_conversation_id: body.conversationId ?? null,
          });
        }
      }
    } catch (dbErr: any) {
      console.warn("[send-summary] Supabase save failed:", dbErr?.message);
    }

    return NextResponse.json({ status: "ok" });
  } catch (err: any) {
    console.error("[send-summary] error:", err?.message ?? err);
    return NextResponse.json({ status: "error", message: err?.message }, { status: 500 });
  }
}
