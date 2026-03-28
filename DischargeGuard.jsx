import { useState, useEffect, useRef, useCallback } from "react";

/* ─── Google Fonts ─────────────────────────────────────────── */
const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href =
  "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap";
document.head.appendChild(fontLink);

/* ─── CSS ───────────────────────────────────────────────────── */
const css = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:       #060c18;
    --surface:  #0b1425;
    --card:     #0f1e35;
    --border:   #1a2f50;
    --blue:     #0ea5e9;
    --teal:     #14b8a6;
    --green:    #10b981;
    --amber:    #f59e0b;
    --red:      #ef4444;
    --purple:   #8b5cf6;
    --text:     #e2e8f0;
    --muted:    #4a6080;
    --font:     'Outfit', sans-serif;
    --mono:     'JetBrains Mono', monospace;
  }

  body { background: var(--bg); color: var(--text); font-family: var(--font); }

  .dg-root {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--bg);
    padding: 0;
  }

  /* Header */
  .dg-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 24px;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
    position: relative;
    overflow: hidden;
  }
  .dg-header::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, #0ea5e915 0%, transparent 40%);
    pointer-events: none;
  }
  .dg-logo {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 20px;
    font-weight: 700;
    letter-spacing: -0.5px;
  }
  .dg-logo-icon {
    width: 32px;
    height: 32px;
    background: linear-gradient(135deg, var(--blue), var(--teal));
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
  }
  .dg-logo span { color: var(--blue); }
  .dg-patient-tag {
    display: flex;
    align-items: center;
    gap: 16px;
    font-size: 13px;
  }
  .dg-patient-name {
    font-weight: 600;
    font-size: 15px;
    color: var(--text);
  }
  .dg-tag {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 3px 10px;
    font-size: 11px;
    color: var(--muted);
    font-family: var(--mono);
  }
  .dg-tag.lang {
    border-color: var(--teal);
    color: var(--teal);
  }
  .dg-status-live {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 600;
    color: var(--green);
    font-family: var(--mono);
  }
  .dg-pulse {
    width: 8px;
    height: 8px;
    background: var(--green);
    border-radius: 50%;
    animation: pulse-dot 1.2s ease-in-out infinite;
  }
  @keyframes pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(0.7); }
  }
  .dg-status-idle { color: var(--muted); }

  /* Layout */
  .dg-body {
    flex: 1;
    display: grid;
    grid-template-columns: 1fr 1fr 340px;
    grid-template-rows: 1fr 1fr;
    gap: 0;
    height: calc(100vh - 62px);
  }
  .dg-panel {
    border: 0;
    border-right: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    padding: 20px;
    overflow: hidden;
    position: relative;
  }
  .dg-panel:last-child { border-right: 0; }
  .dg-panel-title {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 16px;
    font-family: var(--mono);
  }

  /* Call Panel */
  .call-panel { grid-column: 1; grid-row: 1; }

  .dg-waveform {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 3px;
    height: 80px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 0 16px;
    margin-bottom: 16px;
    overflow: hidden;
    position: relative;
  }
  .dg-waveform::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, var(--surface) 0%, transparent 10%, transparent 90%, var(--surface) 100%);
    pointer-events: none;
    z-index: 2;
  }
  .wave-bar {
    width: 3px;
    border-radius: 2px;
    background: var(--blue);
    opacity: 0.6;
    transition: height 0.1s ease;
    flex-shrink: 0;
  }
  .wave-bar.active { opacity: 1; }

  .dg-subtitles {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 14px 16px;
    min-height: 90px;
    position: relative;
  }
  .sub-original {
    font-size: 16px;
    font-weight: 500;
    color: var(--text);
    margin-bottom: 6px;
    line-height: 1.4;
    min-height: 24px;
  }
  .sub-translation {
    font-size: 12px;
    color: var(--muted);
    font-style: italic;
    line-height: 1.4;
    min-height: 18px;
  }
  .sub-lang-badge {
    position: absolute;
    top: 10px;
    right: 12px;
    font-size: 10px;
    font-family: var(--mono);
    color: var(--teal);
    background: #14b8a615;
    border: 1px solid #14b8a630;
    border-radius: 4px;
    padding: 2px 6px;
  }

  .dg-call-stats {
    display: flex;
    gap: 12px;
    margin-top: 14px;
  }
  .dg-stat {
    flex: 1;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 10px 12px;
    text-align: center;
  }
  .dg-stat-val {
    font-size: 22px;
    font-weight: 700;
    font-family: var(--mono);
    color: var(--blue);
    line-height: 1;
  }
  .dg-stat-label {
    font-size: 10px;
    color: var(--muted);
    margin-top: 4px;
    font-family: var(--mono);
  }

  /* Checklist Panel */
  .checklist-panel { grid-column: 2; grid-row: 1 / 3; }

  .dg-checklist { display: flex; flex-direction: column; gap: 8px; }
  .dg-check-item {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 12px 14px;
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    position: relative;
    overflow: hidden;
  }
  .dg-check-item::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    border-radius: 0;
    background: var(--border);
    transition: background 0.4s ease;
  }
  .dg-check-item.active::before { background: var(--blue); }
  .dg-check-item.green::before { background: var(--green); }
  .dg-check-item.yellow::before { background: var(--amber); }
  .dg-check-item.red::before { background: var(--red); }

  .dg-check-item.active {
    border-color: #0ea5e930;
    background: #0ea5e908;
  }
  .dg-check-item.green {
    border-color: #10b98130;
    background: #10b98108;
  }
  .dg-check-item.yellow {
    border-color: #f59e0b30;
    background: #f59e0b08;
  }
  .dg-check-item.red {
    border-color: #ef444430;
    background: #ef444408;
  }
  .dg-check-item.active { animation: active-pulse 2s ease-in-out infinite; }
  @keyframes active-pulse {
    0%, 100% { box-shadow: 0 0 0 0 #0ea5e920; }
    50% { box-shadow: 0 0 0 4px #0ea5e910; }
  }

  .dg-check-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
  }
  .dg-check-icon {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    flex-shrink: 0;
    transition: all 0.4s ease;
    background: var(--card);
    border: 1px solid var(--border);
    color: var(--muted);
  }
  .dg-check-item.active .dg-check-icon { border-color: var(--blue); color: var(--blue); }
  .dg-check-item.green .dg-check-icon { background: #10b98120; border-color: var(--green); color: var(--green); }
  .dg-check-item.yellow .dg-check-icon { background: #f59e0b20; border-color: var(--amber); color: var(--amber); }
  .dg-check-item.red .dg-check-icon { background: #ef444420; border-color: var(--red); color: var(--red); }

  .dg-check-name {
    font-size: 13px;
    font-weight: 600;
    flex: 1;
  }
  .dg-check-score {
    font-size: 10px;
    font-family: var(--mono);
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 20px;
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  .dg-check-item.green .dg-check-score {
    opacity: 1;
    color: var(--green);
    background: #10b98115;
  }
  .dg-check-item.yellow .dg-check-score {
    opacity: 1;
    color: var(--amber);
    background: #f59e0b15;
  }
  .dg-check-item.red .dg-check-score {
    opacity: 1;
    color: var(--red);
    background: #ef444415;
  }
  .dg-check-detail {
    font-size: 11px;
    color: var(--muted);
    font-family: var(--mono);
    margin-bottom: 8px;
  }
  .dg-bar-track {
    height: 4px;
    background: var(--card);
    border-radius: 2px;
    overflow: hidden;
  }
  .dg-bar-fill {
    height: 100%;
    border-radius: 2px;
    width: 0%;
    transition: width 0.8s cubic-bezier(0.25, 1, 0.5, 1), background 0.4s ease;
  }
  .dg-check-item.green .dg-bar-fill { background: var(--green); }
  .dg-check-item.yellow .dg-bar-fill { background: var(--amber); }
  .dg-check-item.red .dg-bar-fill { background: var(--red); }
  .dg-check-item.active .dg-bar-fill { background: var(--blue); width: 45%; }

  .dg-check-note {
    font-size: 10px;
    color: var(--red);
    margin-top: 4px;
    font-family: var(--mono);
    opacity: 0;
    max-height: 0;
    overflow: hidden;
    transition: all 0.3s ease;
  }
  .dg-check-note.visible { opacity: 1; max-height: 30px; }

  .dg-overall {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 14px 16px;
    display: flex;
    align-items: center;
    gap: 14px;
    margin-top: 12px;
  }
  .dg-overall-ring {
    position: relative;
    width: 52px;
    height: 52px;
    flex-shrink: 0;
  }
  .dg-overall-ring svg { transform: rotate(-90deg); }
  .dg-ring-val {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 700;
    font-family: var(--mono);
    color: var(--green);
  }
  .dg-overall-info { flex: 1; }
  .dg-overall-label { font-size: 10px; color: var(--muted); font-family: var(--mono); margin-bottom: 4px; }
  .dg-overall-text { font-size: 13px; font-weight: 600; }

  /* Agent Graph */
  .agent-panel { grid-column: 3; grid-row: 1; }

  .dg-graph-wrap {
    width: 100%;
    height: 220px;
    position: relative;
  }
  .dg-graph-svg { width: 100%; height: 100%; }

  .agent-node circle { transition: r 0.3s ease; }
  .agent-node text { font-family: var(--mono); pointer-events: none; }

  .dg-a2a-log {
    margin-top: 10px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-height: 120px;
    overflow: hidden;
  }
  .dg-a2a-msg {
    font-size: 10px;
    font-family: var(--mono);
    color: var(--muted);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 5px;
    padding: 4px 8px;
    display: flex;
    gap: 6px;
    align-items: flex-start;
    animation: msg-slide 0.3s ease;
  }
  @keyframes msg-slide {
    from { opacity: 0; transform: translateY(-4px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .dg-a2a-from { color: var(--blue); flex-shrink: 0; }
  .dg-a2a-arrow { color: var(--muted); flex-shrink: 0; }
  .dg-a2a-to { color: var(--purple); flex-shrink: 0; }
  .dg-a2a-text { color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }

  /* Alert Panel */
  .alert-panel { grid-column: 3; grid-row: 2; }

  .dg-alert-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 80%;
    color: var(--muted);
    font-size: 12px;
    gap: 8px;
    font-family: var(--mono);
  }
  .dg-alert-card {
    background: var(--surface);
    border: 1px solid var(--amber);
    border-radius: 10px;
    padding: 14px;
    margin-bottom: 10px;
    animation: alert-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
    position: relative;
    overflow: hidden;
  }
  .dg-alert-card::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, #f59e0b08 0%, transparent 60%);
    pointer-events: none;
  }
  .dg-alert-card.urgent {
    border-color: var(--red);
  }
  .dg-alert-card.urgent::before {
    background: linear-gradient(135deg, #ef444408 0%, transparent 60%);
  }
  @keyframes alert-in {
    from { opacity: 0; transform: translateX(20px) scale(0.95); }
    to { opacity: 1; transform: translateX(0) scale(1); }
  }
  .dg-alert-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }
  .dg-alert-icon {
    font-size: 14px;
  }
  .dg-alert-level {
    font-size: 10px;
    font-weight: 700;
    font-family: var(--mono);
    color: var(--amber);
    letter-spacing: 1px;
  }
  .dg-alert-card.urgent .dg-alert-level { color: var(--red); }
  .dg-alert-time {
    margin-left: auto;
    font-size: 10px;
    font-family: var(--mono);
    color: var(--muted);
  }
  .dg-alert-body {
    font-size: 12px;
    color: var(--text);
    margin-bottom: 8px;
    line-height: 1.5;
  }
  .dg-alert-action {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: var(--teal);
    font-family: var(--mono);
  }

  /* Summary panel */
  .summary-panel { grid-column: 1; grid-row: 2; }

  .dg-summary-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-bottom: 12px;
  }
  .dg-sum-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 12px;
    text-align: center;
  }
  .dg-sum-num {
    font-size: 28px;
    font-weight: 700;
    font-family: var(--mono);
    line-height: 1;
    margin-bottom: 4px;
  }
  .dg-sum-label {
    font-size: 10px;
    color: var(--muted);
    font-family: var(--mono);
  }

  .dg-agent-status {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 12px;
  }
  .dg-agent-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 5px 0;
    font-size: 12px;
    border-bottom: 1px solid var(--border);
  }
  .dg-agent-row:last-child { border-bottom: 0; }
  .dg-agent-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .dg-agent-name { flex: 1; font-family: var(--mono); font-size: 11px; color: var(--muted); }
  .dg-agent-st { font-family: var(--mono); font-size: 10px; }

  /* Start button */
  .dg-start-btn {
    display: block;
    margin: 0 auto 20px;
    padding: 12px 32px;
    background: linear-gradient(135deg, var(--blue), var(--teal));
    color: white;
    font-family: var(--font);
    font-size: 15px;
    font-weight: 600;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    letter-spacing: 0.3px;
    transition: transform 0.15s ease, opacity 0.15s ease;
  }
  .dg-start-btn:hover { transform: translateY(-1px); opacity: 0.9; }
  .dg-start-btn:active { transform: translateY(0); }

  .dg-idle-overlay {
    position: absolute;
    inset: 0;
    background: var(--surface);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    z-index: 10;
  }
  .dg-idle-icon { font-size: 32px; margin-bottom: 4px; }
  .dg-idle-label { font-size: 12px; color: var(--muted); font-family: var(--mono); }

  /* Transitions */
  .fade-in { animation: fade-in 0.5s ease; }
  @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }

  .dg-score-change {
    animation: score-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  @keyframes score-pop {
    0% { transform: scale(1); }
    50% { transform: scale(1.08); }
    100% { transform: scale(1); }
  }
`;

/* ─── Data ──────────────────────────────────────────────────── */
const CHECKLIST = [
  { id: "met", name: "Metformin 500mg", detail: "Twice daily with meals · Diabetes", category: "medication" },
  { id: "lis", name: "Lisinopril 10mg", detail: "Once daily morning · Blood pressure", category: "medication" },
  { id: "ace", name: "Acetaminophen 500mg", detail: "Every 6 hrs as needed · Pain", category: "medication" },
  { id: "ome", name: "Omeprazole 20mg", detail: "Once daily before breakfast · Stomach", category: "medication" },
  { id: "wound", name: "Wound Care", detail: "Change dressing · Keep dry 48hr", category: "care" },
  { id: "warn", name: "Warning Signs", detail: "Fever >101°F · Bleeding · Chest pain", category: "safety" },
  { id: "fu1", name: "Follow-up: Dr. Thompson", detail: "April 3 at 10:00 AM · Surgeon", category: "appointment" },
  { id: "fu2", name: "Follow-up: Dr. Chen", detail: "April 10 at 2:30 PM · PCP", category: "appointment" },
  { id: "act", name: "Activity Limits", detail: "No lifting >10 lbs · No driving 1 wk", category: "restriction" },
];

const SUBTITLES = [
  { t: 1.5, es: "Hola, señora García. Le llama el hospital para ver cómo se encuentra.", en: "Hello, Mrs. García. The hospital is calling to see how you're doing." },
  { t: 5, es: "Primero, hablemos de sus medicamentos. ¿Ha podido tomar la metformina?", en: "First, let's talk about your medications. Have you been able to take metformin?" },
  { t: 10, es: "Paciente: \"Creo que es la pastilla azul... ¿para la presión?\"", en: "Patient: \"I think it's the blue pill... for blood pressure?\"" },
  { t: 14, es: "Entiendo, permítame explicarle mejor. La metformina es para la diabetes, no para la presión arterial.", en: "I understand, let me explain better. Metformin is for diabetes, not blood pressure." },
  { t: 19, es: "Paciente: \"Ah sí, ahora entiendo. La tomo dos veces al día con las comidas.\"", en: "Patient: \"Ah yes, I understand now. I take it twice a day with meals.\"" },
  { t: 23, es: "Perfecto. Y el lisinopril, ¿lo ha tomado esta mañana?", en: "Perfect. And the lisinopril, have you taken it this morning?" },
  { t: 28, es: "Paciente: \"Sí, una pastilla por la mañana como me dijeron.\"", en: "Patient: \"Yes, one pill in the morning as they told me.\"" },
  { t: 32, es: "Muy bien. Ahora hablemos de las señales de alarma importantes...", en: "Very good. Now let's talk about important warning signs..." },
  { t: 37, es: "Si tiene fiebre mayor de 101°F, enrojecimiento o dolor que empeora, vaya a urgencias.", en: "If you have a fever above 101°F, redness, or worsening pain, go to the ER." },
  { t: 43, es: "Paciente: \"Entendido. A propósito, tengo un dolor de cabeza desde ayer que no se quita.\"", en: "Patient: \"Understood. By the way, I've had a headache since yesterday that won't go away.\"" },
  { t: 48, es: "Entiendo, señora García. Una enfermera le llamará dentro de una hora para revisar eso.", en: "I understand, Mrs. García. A nurse will call you within an hour to check on that." },
  { t: 53, es: "¿Recuerda su cita con el Dr. Thompson el 3 de abril a las 10 de la mañana?", en: "Do you remember your appointment with Dr. Thompson on April 3 at 10 AM?" },
  { t: 58, es: "Paciente: \"Sí, lo tengo apuntado. Muchas gracias por llamar.\"", en: "Patient: \"Yes, I have it written down. Thank you so much for calling.\"" },
  { t: 62, es: "Ha sido un placer. Una enfermera la llamará pronto. ¡Cuídese mucho!", en: "It's been a pleasure. A nurse will call you soon. Take good care!" },
];

const EVENTS = [
  { t: 4,  type: "activate",  id: "met" },
  { t: 9,  type: "status",    id: "met", status: "red",    score: "RED",   note: "Confused with BP medication", fill: 20 },
  { t: 13, type: "a2a",       from: "Compr.", to: "CareCoord", msg: "Metformin → RED: confused w/ BP med" },
  { t: 13, type: "a2a",       from: "CareCoord", to: "VoiceCoach", msg: "Re-explain Metformin — wrong medication" },
  { t: 18, type: "status",    id: "met", status: "green",  score: "GREEN", note: "",     fill: 95 },
  { t: 22, type: "activate",  id: "lis" },
  { t: 27, type: "status",    id: "lis", status: "green",  score: "GREEN", note: "",     fill: 90 },
  { t: 27, type: "activate",  id: "ace" },
  { t: 31, type: "status",    id: "ace", status: "green",  score: "GREEN", note: "",     fill: 85 },
  { t: 31, type: "activate",  id: "warn" },
  { t: 36, type: "status",    id: "warn", status: "green", score: "GREEN", note: "",     fill: 100 },
  { t: 36, type: "activate",  id: "wound" },
  { t: 40, type: "status",    id: "wound", status: "yellow", score: "PARTIAL", note: "", fill: 65 },
  { t: 42, type: "a2a",       from: "VoiceCoach", to: "Compr.", msg: "Persistent headache since discharge" },
  { t: 43, type: "escalate" },
  { t: 43, type: "a2a",       from: "Compr.", to: "EscalAgent", msg: "SAFETY FLAG: persistent headache → escalate" },
  { t: 44, type: "a2a",       from: "EscalAgent", to: "CareCoord", msg: "⚠ Nurse callback scheduled — 1 hr" },
  { t: 52, type: "activate",  id: "fu1" },
  { t: 57, type: "status",    id: "fu1", status: "green",  score: "GREEN", note: "",     fill: 100 },
  { t: 60, type: "activate",  id: "fu2" },
  { t: 64, type: "status",    id: "fu2", status: "green",  score: "GREEN", note: "",     fill: 100 },
  { t: 65, type: "end" },
];

/* ─── Agent Graph ───────────────────────────────────────────── */
const NODES = [
  { id: "CareCoord",  label: "Care\nCoord.",    cx: 150, cy: 105, r: 22, color: "#0ea5e9" },
  { id: "DischargeR", label: "Discharge\nReader", cx: 55,  cy: 45,  r: 16, color: "#8b5cf6" },
  { id: "VoiceCoach", label: "Voice\nCoach",    cx: 245, cy: 45,  r: 16, color: "#10b981" },
  { id: "Compr.",     label: "Comprehension\nCheck", cx: 55,  cy: 165, r: 16, color: "#f59e0b" },
  { id: "EscalAgent", label: "Escalation\nAgent",   cx: 245, cy: 165, r: 16, color: "#ef4444" },
];
const EDGES = [
  ["CareCoord", "DischargeR"],
  ["CareCoord", "VoiceCoach"],
  ["CareCoord", "Compr."],
  ["CareCoord", "EscalAgent"],
  ["VoiceCoach", "Compr."],
  ["Compr.", "EscalAgent"],
];

function AgentGraph({ particles }) {
  return (
    <svg viewBox="0 0 300 210" className="dg-graph-svg">
      {/* Edges */}
      {EDGES.map(([a, b], i) => {
        const na = NODES.find(n => n.id === a);
        const nb = NODES.find(n => n.id === b);
        return (
          <line key={i} x1={na.cx} y1={na.cy} x2={nb.cx} y2={nb.cy}
            stroke="#1a2f50" strokeWidth="1" />
        );
      })}
      {/* Animated particles */}
      {particles.map((p, i) => {
        const na = NODES.find(n => n.id === p.from);
        const nb = NODES.find(n => n.id === p.to);
        if (!na || !nb) return null;
        const x = na.cx + (nb.cx - na.cx) * p.progress;
        const y = na.cy + (nb.cy - na.cy) * p.progress;
        return (
          <circle key={i} cx={x} cy={y} r={4}
            fill={na.color} opacity={0.9} style={{ filter: `drop-shadow(0 0 4px ${na.color})` }} />
        );
      })}
      {/* Nodes */}
      {NODES.map(n => (
        <g key={n.id} className="agent-node">
          <circle cx={n.cx} cy={n.cy} r={n.r}
            fill={n.color + "18"} stroke={n.color} strokeWidth="1.5" />
          {n.label.split("\n").map((line, li) => (
            <text key={li} x={n.cx} y={n.cy + (li - (n.label.split("\n").length - 1) / 2) * 11}
              textAnchor="middle" dominantBaseline="middle"
              fontSize={n.id === "CareCoord" ? 8 : 7}
              fontWeight={n.id === "CareCoord" ? "600" : "400"}
              fill={n.color}>
              {line}
            </text>
          ))}
        </g>
      ))}
    </svg>
  );
}

/* ─── Waveform ──────────────────────────────────────────────── */
function Waveform({ active }) {
  const bars = 48;
  const [heights, setHeights] = useState(() => Array.from({ length: bars }, () => 8));
  const raf = useRef(null);

  useEffect(() => {
    if (!active) {
      setHeights(Array.from({ length: bars }, () => 8));
      return;
    }
    let frame = 0;
    const animate = () => {
      frame++;
      setHeights(prev => prev.map((_, i) => {
        const wave = Math.sin((frame * 0.08) + (i * 0.4)) * 20;
        const noise = (Math.random() - 0.5) * 12;
        const center = Math.max(0, 1 - Math.abs(i - bars / 2) / (bars / 2)) * 15;
        return Math.max(4, Math.min(54, 20 + wave + noise + center));
      }));
      raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf.current);
  }, [active]);

  return (
    <div className="dg-waveform">
      {heights.map((h, i) => (
        <div key={i} className={`wave-bar ${active ? "active" : ""}`}
          style={{ height: `${h}px`, background: active ? "var(--blue)" : "var(--border)" }} />
      ))}
    </div>
  );
}

/* ─── Main App ──────────────────────────────────────────────── */
export default function DischargeGuard() {
  const [phase, setPhase] = useState("idle"); // idle | running | done
  const [elapsed, setElapsed] = useState(0);
  const [items, setItems] = useState(() =>
    Object.fromEntries(CHECKLIST.map(c => [c.id, { status: "idle", score: "", fill: 0, note: "" }]))
  );
  const [subtitle, setSubtitle] = useState({ es: "", en: "" });
  const [alerts, setAlerts] = useState([]);
  const [a2aMsgs, setA2aMsgs] = useState([]);
  const [particles, setParticles] = useState([]);
  const [callTime, setCallTime] = useState("0:00");
  const timerRef = useRef(null);
  const startRef = useRef(null);
  const pfRef = useRef(null);

  const activeCount = Object.values(items).filter(v => v.status === "green").length;
  const totalCount = CHECKLIST.length;
  const comprehension = phase === "idle" ? 0 : Math.round((activeCount / totalCount) * 100);

  const updateItem = useCallback((id, patch) => {
    setItems(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }, []);

  const spawnParticle = useCallback((from, to) => {
    const id = Math.random();
    setParticles(prev => [...prev, { id, from, to, progress: 0 }]);
    let prog = 0;
    const anim = () => {
      prog += 0.025;
      if (prog >= 1) {
        setParticles(prev => prev.filter(p => p.id !== id));
        return;
      }
      setParticles(prev => prev.map(p => p.id === id ? { ...p, progress: prog } : p));
      requestAnimationFrame(anim);
    };
    requestAnimationFrame(anim);
  }, []);

  useEffect(() => {
    if (phase !== "running") return;

    // Timer
    timerRef.current = setInterval(() => {
      const s = Math.floor((Date.now() - startRef.current) / 1000);
      setElapsed(s);
      const m = Math.floor(s / 60);
      const sec = s % 60;
      setCallTime(`${m}:${sec.toString().padStart(2, "0")}`);
    }, 250);

    return () => clearInterval(timerRef.current);
  }, [phase]);

  useEffect(() => {
    if (phase !== "running") return;

    // Subtitles
    SUBTITLES.forEach(s => {
      setTimeout(() => setSubtitle({ es: s.es, en: s.en }), s.t * 1000);
    });

    // Events
    EVENTS.forEach(ev => {
      setTimeout(() => {
        if (ev.type === "activate") {
          updateItem(ev.id, { status: "active", fill: 45 });
          spawnParticle("CareCoord", "VoiceCoach");
        } else if (ev.type === "status") {
          updateItem(ev.id, { status: ev.status, score: ev.score, fill: ev.fill, note: ev.note || "" });
          spawnParticle("VoiceCoach", "Compr.");
        } else if (ev.type === "escalate") {
          setAlerts(prev => [...prev, {
            id: Date.now(),
            level: "warning",
            icon: "⚠",
            title: "WARNING",
            body: "Patient reports persistent headache since discharge (post-op day 1).",
            action: "Nurse callback scheduled within 1 hour · Assigned: Nurse Williams",
            time: callTime,
          }]);
          spawnParticle("EscalAgent", "CareCoord");
        } else if (ev.type === "a2a") {
          setA2aMsgs(prev => [...prev.slice(-4), ev]);
          spawnParticle(ev.from, ev.to);
        } else if (ev.type === "end") {
          clearInterval(timerRef.current);
          setPhase("done");
          setSubtitle({ es: "Llamada completada · 1:05", en: "Call completed · All items reviewed" });
        }
      }, ev.t * 1000);
    });
  }, [phase]);

  const startDemo = () => {
    setPhase("running");
    setElapsed(0);
    setItems(Object.fromEntries(CHECKLIST.map(c => [c.id, { status: "idle", score: "", fill: 0, note: "" }])));
    setAlerts([]);
    setA2aMsgs([]);
    setSubtitle({ es: "", en: "" });
    setCallTime("0:00");
    startRef.current = Date.now();

    // Initial A2A messages
    setTimeout(() => spawnParticle("CareCoord", "DischargeR"), 500);
    setTimeout(() => {
      setA2aMsgs([{ from: "CareCoord", to: "DischargeR", msg: "Parse discharge — Maria Garcia (es)" }]);
      spawnParticle("DischargeR", "CareCoord");
    }, 1500);
    setTimeout(() => {
      setA2aMsgs(prev => [...prev, { from: "CareCoord", to: "VoiceCoach", msg: "Call patient +1-813-555-0142 · language: es" }]);
      spawnParticle("CareCoord", "VoiceCoach");
    }, 2500);
  };

  const getIcon = (status) => {
    if (status === "green") return "✓";
    if (status === "yellow") return "~";
    if (status === "red") return "✕";
    if (status === "active") return "◉";
    return "○";
  };

  const ringProgress = comprehension / 100;
  const r = 22;
  const circ = 2 * Math.PI * r;

  return (
    <>
      <style>{css}</style>
      <div className="dg-root">
        {/* Header */}
        <header className="dg-header">
          <div className="dg-logo">
            <div className="dg-logo-icon">🏥</div>
            Discharge<span>Guard</span>
          </div>
          <div className="dg-patient-tag">
            <div>
              <div className="dg-patient-name">Maria Garcia</div>
              <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                <span className="dg-tag">MRN 847291</span>
                <span className="dg-tag">Post-cholecystectomy</span>
                <span className="dg-tag lang">ES</span>
              </div>
            </div>
          </div>
          <div>
            {phase === "running" ? (
              <div className="dg-status-live">
                <div className="dg-pulse" />
                CALL LIVE · {callTime}
              </div>
            ) : phase === "done" ? (
              <div className="dg-status-live" style={{ color: "var(--teal)" }}>
                ✓ CALL COMPLETE · 1:05
              </div>
            ) : (
              <div className="dg-status-live dg-status-idle">● STANDBY</div>
            )}
          </div>
        </header>

        {/* Body */}
        <div className="dg-body">

          {/* ── Left Top: Call Panel ── */}
          <div className="dg-panel call-panel" style={{ position: "relative" }}>
            <div className="dg-panel-title">Live Call</div>

            {phase === "idle" && (
              <div className="dg-idle-overlay">
                <div className="dg-idle-icon">📞</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Scenario: Maria Garcia</div>
                <div className="dg-idle-label">Post-discharge follow-up · Spanish</div>
                <button className="dg-start-btn" style={{ marginTop: 12 }} onClick={startDemo}>
                  ▶ Run Demo Call
                </button>
              </div>
            )}

            <Waveform active={phase === "running"} />

            <div className="dg-subtitles">
              <div className="sub-lang-badge">ES → EN</div>
              <div className="sub-original">{subtitle.es || (phase !== "idle" ? "…" : "")}</div>
              <div className="sub-translation">{subtitle.en}</div>
            </div>

            <div className="dg-call-stats">
              <div className="dg-stat">
                <div className="dg-stat-val" style={{ color: "var(--green)" }}>
                  {Object.values(items).filter(v => v.status === "green").length}
                </div>
                <div className="dg-stat-label">UNDERSTOOD</div>
              </div>
              <div className="dg-stat">
                <div className="dg-stat-val" style={{ color: "var(--red)" }}>
                  {Object.values(items).filter(v => v.status === "red").length}
                </div>
                <div className="dg-stat-label">NEEDS REVIEW</div>
              </div>
              <div className="dg-stat">
                <div className="dg-stat-val" style={{ color: "var(--amber)" }}>
                  {alerts.length}
                </div>
                <div className="dg-stat-label">ALERTS</div>
              </div>
            </div>
          </div>

          {/* ── Middle: Checklist ── */}
          <div className="dg-panel checklist-panel">
            <div className="dg-panel-title">Comprehension Checklist</div>
            <div className="dg-checklist">
              {CHECKLIST.map(item => {
                const st = items[item.id];
                return (
                  <div key={item.id} className={`dg-check-item ${st.status}`}>
                    <div className="dg-check-header">
                      <div className="dg-check-icon">{getIcon(st.status)}</div>
                      <div className="dg-check-name">{item.name}</div>
                      <div className="dg-check-score">{st.score}</div>
                    </div>
                    <div className="dg-check-detail">{item.detail}</div>
                    <div className="dg-bar-track">
                      <div className="dg-bar-fill" style={{ width: `${st.fill}%` }} />
                    </div>
                    {st.note && (
                      <div className={`dg-check-note ${st.note ? "visible" : ""}`}>
                        ⚡ {st.note}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Overall ring */}
            <div className="dg-overall">
              <div className="dg-overall-ring">
                <svg width="52" height="52" viewBox="0 0 52 52">
                  <circle cx="26" cy="26" r={r} fill="none" stroke="var(--border)" strokeWidth="4" />
                  <circle cx="26" cy="26" r={r} fill="none"
                    stroke={comprehension > 80 ? "var(--green)" : comprehension > 50 ? "var(--amber)" : "var(--red)"}
                    strokeWidth="4" strokeLgiinecap="round"
                    strokeDasharray={`${circ * ringProgress} ${circ}`}
                    style={{ transform: "rotate(-90deg)", transformOrigin: "26px 26px", transition: "stroke-dasharray 0.8s ease" }}
                  />
                </svg>
                <div className="dg-ring-val">{comprehension}%</div>
              </div>
              <div className="dg-overall-info">
                <div className="dg-overall-label">OVERALL COMPREHENSION</div>
                <div className="dg-overall-text">
                  {comprehension === 0 ? "Waiting for call…" :
                   comprehension < 50 ? "Low — intervention needed" :
                   comprehension < 80 ? "Partial — continue reviewing" :
                   "Strong — patient engaged"}
                </div>
              </div>
            </div>
          </div>

          {/* ── Right Top: Agent Graph ── */}
          <div className="dg-panel agent-panel">
            <div className="dg-panel-title">Agent Network · A2A</div>
            <div className="dg-graph-wrap">
              <AgentGraph particles={particles} />
            </div>
            <div className="dg-a2a-log">
              {a2aMsgs.map((m, i) => (
                <div key={i} className="dg-a2a-msg">
                  <span className="dg-a2a-from">{m.from}</span>
                  <span className="dg-a2a-arrow">→</span>
                  <span className="dg-a2a-to">{m.to}</span>
                  <span className="dg-a2a-text">{m.msg}</span>
                </div>
              ))}
              {a2aMsgs.length === 0 && (
                <div className="dg-a2a-msg" style={{ opacity: 0.4 }}>
                  <span className="dg-a2a-from">—</span>
                  <span className="dg-a2a-text">A2A messages will appear here</span>
                </div>
              )}
            </div>
          </div>

          {/* ── Left Bottom: Summary ── */}
          <div className="dg-panel summary-panel">
            <div className="dg-panel-title">Session Summary</div>
            <div className="dg-summary-grid">
              <div className="dg-sum-card">
                <div className="dg-sum-num" style={{ color: "var(--green)" }}>
                  {Object.values(items).filter(v => v.status === "green").length}/{CHECKLIST.length}
                </div>
                <div className="dg-sum-label">ITEMS GREEN</div>
              </div>
              <div className="dg-sum-card">
                <div className="dg-sum-num" style={{ color: "var(--blue)" }}>
                  {callTime}
                </div>
                <div className="dg-sum-label">CALL DURATION</div>
              </div>
            </div>
            <div className="dg-agent-status">
              {[
                { id: "CareCoord", label: "CareCoordinator", color: "#0ea5e9", status: phase === "running" ? "Orchestrating" : phase === "done" ? "Complete" : "Standby" },
                { id: "DischargeR", label: "DischargeReader", color: "#8b5cf6", status: phase !== "idle" ? "Parsed ✓" : "Standby" },
                { id: "VoiceCoach", label: "VoiceCoach (ES)", color: "#10b981", status: phase === "running" ? "On call" : phase === "done" ? "Complete" : "Standby" },
                { id: "Compr.", label: "ComprehensionCheck", color: "#f59e0b", status: phase !== "idle" ? `${Object.values(items).filter(v => v.status !== "idle").length} scored` : "Standby" },
                { id: "EscalAgent", label: "EscalationAgent", color: "#ef4444", status: alerts.length > 0 ? `${alerts.length} alert sent` : "Monitoring" },
              ].map(a => (
                <div key={a.id} className="dg-agent-row">
                  <div className="dg-agent-dot" style={{ background: a.color }} />
                  <div className="dg-agent-name">{a.label}</div>
                  <div className="dg-agent-st" style={{ color: a.color }}>{a.status}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right Bottom: Alerts ── */}
          <div className="dg-panel alert-panel">
            <div className="dg-panel-title">Care Team Alerts</div>
            {alerts.length === 0 ? (
              <div className="dg-alert-empty">
                <span style={{ fontSize: 24, opacity: 0.3 }}>🔔</span>
                <span>No alerts triggered</span>
              </div>
            ) : (
              alerts.map(a => (
                <div key={a.id} className={`dg-alert-card ${a.level}`}>
                  <div className="dg-alert-header">
                    <span className="dg-alert-icon">{a.icon}</span>
                    <span className="dg-alert-level">{a.title}</span>
                    <span className="dg-alert-time">{a.time}</span>
                  </div>
                  <div className="dg-alert-body">{a.body}</div>
                  <div className="dg-alert-action">→ {a.action}</div>
                </div>
              ))
            )}

            {phase === "done" && (
              <div style={{ marginTop: 12 }}>
                <button className="dg-start-btn" style={{ fontSize: 12, padding: "8px 20px", margin: 0 }}
                  onClick={() => {
                    setPhase("idle");
                    setItems(Object.fromEntries(CHECKLIST.map(c => [c.id, { status: "idle", score: "", fill: 0, note: "" }])));
                    setAlerts([]);
                    setA2aMsgs([]);
                    setSubtitle({ es: "", en: "" });
                    setCallTime("0:00");
                  }}>
                  ↺ Reset Demo
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
