# DischargeGuard — Complete Technical Implementation Blueprint

## Multilingual Post-Discharge Voice Agent System

**Hackathon Build Time: 24 Hours**
**Team Size: 3–5 people**

---

## The Pitch (Memorize This)

**Opening line (deliver standing, no slides):**

> "1 in 5 hospital patients are readmitted within 30 days. The number one reason? They didn't understand their discharge instructions. Not because they're not smart — because they were exhausted, scared, medicated, and handed a 6-page document in a language that wasn't their first. We built a system of AI agents that calls them the next day, in their own language, and walks them through everything — like a nurse who has unlimited time and speaks 70 languages."

**Then play the demo call on speaker.** Let the room hear it. Don't explain — let them listen for 45 seconds. THEN explain the technology.

---

## System Architecture Overview

DischargeGuard is a **4-agent A2A ecosystem** built on Google ADK, with ElevenLabs providing the voice layer. Each agent is a standalone A2A service with its own Agent Card, deployed on Google Cloud Run.

```
┌─────────────────────────────────────────────────────────────┐
│                    ORCHESTRATOR AGENT                        │
│                  (Google ADK + Gemini)                       │
│              Port 8000 — "CareCoordinator"                  │
│                                                             │
│   Triggers calls → delegates tasks → aggregates results     │
└──────┬──────────────┬───────────────┬──────────────┬────────┘
       │ A2A          │ A2A           │ A2A          │ A2A
       ▼              ▼               ▼              ▼
┌──────────┐  ┌──────────────┐ ┌───────────┐ ┌─────────────┐
│ Discharge│  │   Voice      │ │Comprehen- │ │ Escalation  │
│ Reader   │  │   Coach      │ │sion Check │ │ Agent       │
│          │  │              │ │           │ │             │
│ Port 8001│  │  Port 8002   │ │ Port 8003 │ │  Port 8004  │
│          │  │              │ │           │ │             │
│ Parses   │  │ ElevenLabs   │ │ Analyzes  │ │ Alerts care │
│ discharge│  │ Conversatio- │ │ patient   │ │ team, sched │
│ summaries│  │ nal AI agent │ │ responses │ │ callbacks   │
│ into     │  │ in patient's │ │ for under-│ │ from nurses │
│ checklist│  │ language     │ │ standing  │ │             │
└──────────┘  └──────────────┘ └───────────┘ └─────────────┘
```

---

## Agent Definitions (Google ADK)

### Agent 1: CareCoordinator (Orchestrator)

**Role:** The root agent that manages the entire post-discharge workflow. It triggers calls at the right time, delegates to specialist agents via A2A, and produces the final summary.

**Agent Card:**
```python
# agents/care_coordinator/agent_card.py
from a2a.types import AgentCard, AgentSkill, AgentCapabilities

care_coordinator_skill = AgentSkill(
    id="post_discharge_followup",
    name="Post-Discharge Patient Follow-up Coordinator",
    description=(
        "Orchestrates multilingual post-discharge follow-up calls. "
        "Parses discharge summaries, initiates voice calls in the patient's "
        "preferred language, monitors comprehension, and escalates concerns "
        "to the care team."
    ),
    tags=["healthcare", "discharge", "multilingual", "voice", "follow-up"],
    examples=[
        "Follow up with patient Maria Garcia discharged today",
        "Schedule a discharge call for room 412 patient",
        "Check if patient understood their medication instructions",
    ],
)

care_coordinator_card = AgentCard(
    name="CareCoordinator",
    description="Orchestrates post-discharge follow-up workflows across specialist agents",
    url="http://localhost:8000",
    version="1.0.0",
    skills=[care_coordinator_skill],
    capabilities=AgentCapabilities(streaming=True, pushNotifications=False),
    defaultInputModes=["text"],
    defaultOutputModes=["text"],
)
```

**Agent Logic:**
```python
# agents/care_coordinator/agent.py
from google.adk.agents import LlmAgent
from google.adk.agents.remote_a2a_agent import RemoteA2aAgent

# Connect to remote specialist agents via A2A
discharge_reader = RemoteA2aAgent(
    name="DischargeReader",
    description="Parses discharge summaries into structured checklists",
    agent_card_url="http://localhost:8001/.well-known/agent.json",
)

voice_coach = RemoteA2aAgent(
    name="VoiceCoach",
    description="Conducts voice calls with patients in their language",
    agent_card_url="http://localhost:8002/.well-known/agent.json",
)

comprehension_check = RemoteA2aAgent(
    name="ComprehensionCheck",
    description="Analyzes patient responses for understanding level",
    agent_card_url="http://localhost:8003/.well-known/agent.json",
)

escalation_agent = RemoteA2aAgent(
    name="EscalationAgent",
    description="Alerts care team and schedules human callbacks",
    agent_card_url="http://localhost:8004/.well-known/agent.json",
)

care_coordinator = LlmAgent(
    name="CareCoordinator",
    model="gemini-2.0-flash",
    instruction="""You are CareCoordinator, the orchestrator of a post-discharge
    patient follow-up system. Your workflow:

    1. Receive a discharge summary for a patient
    2. Send it to DischargeReader to parse into a structured checklist
    3. Using the checklist, instruct VoiceCoach to call the patient
       in their preferred language
    4. As the call progresses, send patient responses to ComprehensionCheck
    5. If ComprehensionCheck flags confusion OR the patient mentions
       concerning symptoms (fever, bleeding, severe pain, shortness of breath),
       immediately delegate to EscalationAgent
    6. After the call, produce a structured summary with:
       - Items understood vs. items needing reinforcement
       - Any health concerns detected
       - Recommended follow-up actions

    Always prioritize patient safety. When in doubt, escalate.
    Never provide medical advice — only reinforce what was in the
    discharge instructions.""",
    sub_agents=[discharge_reader, voice_coach, comprehension_check, escalation_agent],
)
```

**Exposing via A2A:**
```python
# agents/care_coordinator/__main__.py
from google.adk.a2a.utils.agent_to_a2a import to_a2a
from agent import care_coordinator
import uvicorn

app = to_a2a(
    care_coordinator,
    host="localhost",
    port=8000,
)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

---

### Agent 2: DischargeReader

**Role:** Parses unstructured discharge summaries into a structured JSON checklist that VoiceCoach can walk through conversationally.

```python
# agents/discharge_reader/agent.py
from google.adk.agents import LlmAgent
from google.adk.tools import FunctionTool

def parse_discharge_summary(summary_text: str, patient_language: str) -> dict:
    """Parse a discharge summary into a structured checklist.

    Args:
        summary_text: The raw discharge summary text
        patient_language: The patient's preferred language (e.g., 'es', 'zh', 'en')

    Returns:
        A structured checklist with medications, restrictions,
        follow-ups, and warning signs
    """
    # In production, this would use Gemini to extract structured data
    # For the hackathon, we use Gemini's structured output mode
    return {
        "patient_language": patient_language,
        "medications": [],      # name, dose, frequency, purpose, pronunciation
        "restrictions": [],     # activity restrictions, dietary restrictions
        "wound_care": [],       # if applicable
        "follow_up_appointments": [],  # date, provider, purpose
        "warning_signs": [],    # symptoms that require immediate ER visit
        "lifestyle_notes": [],  # exercise, diet, hydration
    }

discharge_reader = LlmAgent(
    name="DischargeReader",
    model="gemini-2.0-flash",
    instruction="""You parse hospital discharge summaries into structured checklists.
    Extract every actionable item into these categories:
    - medications (include generic AND brand names, dose, frequency, what it's for)
    - restrictions (what NOT to do — lifting, driving, bathing, etc.)
    - wound_care (if any surgical site instructions)
    - follow_up_appointments (date, time, which doctor, what for)
    - warning_signs (symptoms requiring immediate ER: fever >101, bleeding, etc.)
    - lifestyle_notes (diet, hydration, exercise when cleared)

    For each medication, include a phonetic pronunciation guide.
    Be thorough — missed items could cause readmission.""",
    tools=[FunctionTool(func=parse_discharge_summary)],
)
```

---

### Agent 3: VoiceCoach (ElevenLabs Integration)

**Role:** The patient-facing voice agent. Conducts the actual phone call using ElevenLabs' Conversational AI platform in the patient's preferred language.

```python
# agents/voice_coach/elevenlabs_setup.py
"""
ElevenLabs Conversational AI Agent Configuration

This module configures the ElevenLabs agent that conducts
post-discharge follow-up calls with patients.
"""
import os
import requests

ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
BASE_URL = "https://api.elevenlabs.io/v1"

# ── Step 1: Select or create voice ──────────────────────────
# For the hackathon demo, use a pre-built warm, caring voice
# ElevenLabs has 10,000+ voices; pick one that sounds like
# a caring nurse for each language

VOICE_MAP = {
    "en": "JBFqnCBsd6RMkjVDRZzb",  # Warm female English voice
    "es": "pNInz6obpgDQGcFmaJgB",  # Native Spanish voice
    "zh": "AZnzlk1XvdvUeBnXmlld",  # Mandarin voice
    "ko": "EXAVITQu4vr4xnSDxMaL",  # Korean voice
}

# ── Step 2: Create the Conversational AI Agent ──────────────
def create_discharge_agent(checklist: dict, patient_language: str):
    """
    Create an ElevenLabs Conversational AI agent configured
    for this specific patient's discharge instructions.
    """
    voice_id = VOICE_MAP.get(patient_language, VOICE_MAP["en"])

    # Build the system prompt from the parsed checklist
    meds_text = "\n".join([
        f"- {m['name']} ({m['dose']}): {m['frequency']} — for {m['purpose']}"
        for m in checklist.get("medications", [])
    ])

    warnings_text = "\n".join([
        f"- {w}" for w in checklist.get("warning_signs", [])
    ])

    followups_text = "\n".join([
        f"- {f['date']} with {f['provider']}: {f['purpose']}"
        for f in checklist.get("follow_up_appointments", [])
    ])

    system_prompt = f"""You are a warm, patient, caring post-discharge
    follow-up nurse assistant. You are calling the patient to check on
    them after they left the hospital.

    LANGUAGE: Speak ONLY in {patient_language}. If the patient switches
    to a different language, gently switch to match them.

    TONE: Warm, unhurried, empathetic. Use simple words. Pause often
    to let the patient respond. If they seem confused, slow down and
    rephrase. Never sound rushed or clinical.

    YOUR TASK: Walk through each section of their discharge instructions
    conversationally. Don't read a list — have a conversation.

    MEDICATIONS:
    {meds_text}

    WARNING SIGNS (things that mean they should go to the ER):
    {warnings_text}

    FOLLOW-UP APPOINTMENTS:
    {followups_text}

    CONVERSATION FLOW:
    1. Greet warmly. Ask how they're feeling today.
    2. Ask about pain level (1-10 scale).
    3. Go through medications one by one. For each, ask:
       "Have you been able to take your [medication]?"
       If confused, explain what it's for in simple terms.
    4. Ask about any warning signs: "Have you noticed any [sign]?"
    5. Confirm they know about their follow-up appointments.
    6. Ask if they have any questions.
    7. Close warmly: "You're doing great. Remember, if anything
       feels wrong, don't hesitate to call."

    TEACH-BACK METHOD: For critical items (medications, warning signs),
    ask the patient to repeat back what they understood:
    "Just so I know I explained it well, can you tell me what
    the [medication] is for?"

    ESCALATION TRIGGERS — if the patient mentions ANY of these,
    express concern and tell them you'll have a nurse call them back:
    - Fever over 101°F / 38.3°C
    - Uncontrolled bleeding
    - Severe or worsening pain
    - Difficulty breathing
    - Chest pain
    - Confusion or disorientation

    IMPORTANT: You are NOT a doctor. Never diagnose. Never change
    medication instructions. Only reinforce what was in the discharge plan."""

    # Create the agent via ElevenLabs API
    response = requests.post(
        f"{BASE_URL}/convai/agents/create",
        headers={
            "xi-api-key": ELEVENLABS_API_KEY,
            "Content-Type": "application/json",
        },
        json={
            "conversation_config": {
                "agent": {
                    "prompt": {
                        "prompt": system_prompt,
                    },
                    "first_message": get_first_message(patient_language),
                    "language": patient_language,
                },
                "tts": {
                    "voice_id": voice_id,
                    "model_id": "eleven_flash_v2_5",  # Low latency for conversation
                },
            },
            "name": f"DischargeGuard-{patient_language}",
        }
    )
    return response.json()


def get_first_message(language: str) -> str:
    """The opening line the agent speaks when the patient picks up."""
    messages = {
        "en": (
            "Hi, this is a follow-up call from the hospital. "
            "I'm checking in to see how you're doing after leaving "
            "the hospital. How are you feeling today?"
        ),
        "es": (
            "Hola, le llamo del hospital para saber cómo se encuentra "
            "después de su alta. ¿Cómo se siente hoy?"
        ),
        "zh": (
            "您好，这是医院的随访电话。我想了解您出院后的情况。"
            "您今天感觉怎么样？"
        ),
    }
    return messages.get(language, messages["en"])
```

**Twilio Integration (for actual phone calls):**
```python
# agents/voice_coach/twilio_bridge.py
"""
Bridge between ElevenLabs Conversational AI and Twilio
for outbound phone calls.
"""
from twilio.rest import Client
import os

TWILIO_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_PHONE = os.getenv("TWILIO_PHONE_NUMBER")

twilio_client = Client(TWILIO_SID, TWILIO_TOKEN)

def initiate_call(patient_phone: str, agent_id: str):
    """
    Place an outbound call to the patient, connecting them
    to the ElevenLabs Conversational AI agent.

    ElevenLabs supports Twilio via ConversationRelay or
    direct SIP trunking.
    """
    call = twilio_client.calls.create(
        to=patient_phone,
        from_=TWILIO_PHONE,
        # TwiML that connects the call to ElevenLabs agent
        twiml=f"""
        <Response>
            <Connect>
                <ConversationRelay
                    url="wss://api.elevenlabs.io/v1/convai/conversation"
                    agentId="{agent_id}"
                />
            </Connect>
        </Response>
        """,
    )
    return call.sid
```

---

### Agent 4: ComprehensionCheck

**Role:** Analyzes patient responses during and after the call to assess whether they actually understood each instruction. Uses the teach-back method scoring.

```python
# agents/comprehension_check/agent.py
from google.adk.agents import LlmAgent

comprehension_agent = LlmAgent(
    name="ComprehensionCheck",
    model="gemini-2.0-flash",
    instruction="""You analyze patient responses from a post-discharge
    follow-up call to assess comprehension.

    For each discharge instruction item, score the patient's understanding:
    - GREEN (understood): Patient can accurately describe the instruction
    - YELLOW (partial): Patient has the gist but missed details
    - RED (not understood): Patient is confused or gave incorrect information

    Also flag these SAFETY CONCERNS:
    - Patient mentions symptoms that match warning signs
    - Patient indicates they haven't been taking medication
    - Patient seems confused about dosing (wrong amounts, wrong times)
    - Patient sounds cognitively impaired (slurred speech, non-sequiturs)
    - Patient expresses significant distress or hopelessness

    Output a structured assessment:
    {
      "overall_comprehension": "green|yellow|red",
      "item_scores": [
        {"item": "Metformin 500mg twice daily", "score": "green", "notes": "..."},
      ],
      "safety_flags": [],
      "recommended_actions": [],
      "escalation_needed": true/false
    }""",
)
```

---

### Agent 5: EscalationAgent

**Role:** When ComprehensionCheck or VoiceCoach detects a problem, this agent takes action — alerting the care team, scheduling nurse callbacks, or in emergencies, advising the patient to call 911.

```python
# agents/escalation/agent.py
from google.adk.agents import LlmAgent
from google.adk.tools import FunctionTool

def send_care_team_alert(
    patient_id: str,
    alert_level: str,
    summary: str,
    recommended_action: str,
) -> dict:
    """Send an alert to the patient's care team.

    Args:
        patient_id: The patient's identifier
        alert_level: 'urgent', 'warning', or 'info'
        summary: Brief description of the concern
        recommended_action: What the care team should do

    Returns:
        Confirmation of alert delivery
    """
    # In production: integrates with EHR system, sends SMS/page to nurse
    # For hackathon: sends a webhook to the demo dashboard
    return {
        "status": "sent",
        "alert_id": f"ALT-{patient_id}-001",
        "delivered_to": ["Dr. Thompson", "Nurse Williams"],
        "channel": "sms_and_dashboard",
    }

def schedule_nurse_callback(
    patient_id: str,
    urgency: str,
    reason: str,
) -> dict:
    """Schedule a human nurse to call the patient back.

    Args:
        patient_id: The patient's identifier
        urgency: 'immediate' (within 1 hour), 'today', or 'next_day'
        reason: Why the callback is needed

    Returns:
        Callback scheduling confirmation
    """
    return {
        "status": "scheduled",
        "callback_time": "within 1 hour" if urgency == "immediate" else urgency,
        "assigned_nurse": "Nurse Williams",
    }

escalation_agent = LlmAgent(
    name="EscalationAgent",
    model="gemini-2.0-flash",
    instruction="""You handle escalations from patient follow-up calls.

    ESCALATION LEVELS:
    1. URGENT (immediate action):
       - Patient reports emergency symptoms (chest pain, difficulty breathing)
       - Action: Alert care team IMMEDIATELY + advise patient to call 911
    2. WARNING (same-day action):
       - Patient not taking medications correctly
       - Patient reports concerning but non-emergency symptoms
       - Patient seems very confused about their care plan
       - Action: Schedule nurse callback + alert care team
    3. INFO (next-day action):
       - Patient has questions beyond discharge scope
       - Patient needs appointment scheduling help
       - Action: Schedule follow-up + log for care team review

    Always be empathetic in your outputs — the care team will read these
    and use them to have a human conversation with the patient.""",
    tools=[
        FunctionTool(func=send_care_team_alert),
        FunctionTool(func=schedule_nurse_callback),
    ],
)
```

---

## A2A Message Flow (What Happens During a Call)

```
TIME  SOURCE              → DEST                MESSAGE
───── ─────────────────── → ─────────────────── ──────────────────────────
0:00  CareCoordinator     → DischargeReader     "Parse this discharge summary for
                                                 patient Maria Garcia, language: es"

0:03  DischargeReader      → CareCoordinator     {checklist: {medications: [...],
                                                  warnings: [...], followups: [...]}}

0:05  CareCoordinator     → VoiceCoach           "Call patient at +1-813-555-0142
                                                  using checklist, language: Spanish"

0:08  VoiceCoach           → [PHONE CALL BEGINS]  "Hola, le llamo del hospital..."

1:30  VoiceCoach           → ComprehensionCheck   "Patient said: 'I think the blue pill
                                                  is for my blood pressure, twice a day?'
                                                  Expected: Metformin 500mg for diabetes"

1:32  ComprehensionCheck   → CareCoordinator     {item: "Metformin", score: "RED",
                                                  notes: "Confused with BP medication"}

1:33  CareCoordinator     → VoiceCoach           "Re-explain Metformin — patient confused
                                                  it with blood pressure medication"

1:35  VoiceCoach           → [PATIENT]            "Quiero explicar un poco más sobre
                                                  la metformina. Esta es para la diabetes,
                                                  no para la presión arterial..."

3:00  VoiceCoach           → ComprehensionCheck   "Patient said: 'If I have a fever
                                                  over 101, I should go to the ER'"

3:02  ComprehensionCheck   → CareCoordinator     {item: "warning_signs_fever",
                                                  score: "GREEN"}

4:30  VoiceCoach           → ComprehensionCheck   "Patient said: 'I've had a headache
                                                  since yesterday and it won't go away'"

4:32  ComprehensionCheck   → CareCoordinator     {safety_flag: "persistent_headache",
                                                  escalation_needed: true}

4:33  CareCoordinator     → EscalationAgent      "Patient reports persistent headache
                                                  since discharge. Post-op patient.
                                                  Assess and escalate."

4:34  EscalationAgent      → [CARE TEAM]          ALERT: Warning level. Persistent headache
                                                  post-discharge. Nurse callback scheduled
                                                  within 1 hour.

4:35  CareCoordinator     → VoiceCoach           "Reassure patient, inform them a nurse
                                                  will call back within the hour"

5:00  VoiceCoach           → [CALL ENDS]          "Has sido muy amable. Una enfermera
                                                  le llamará pronto. ¡Cuídese mucho!"

5:01  CareCoordinator     → [DASHBOARD]           Final summary: 7/9 items GREEN,
                                                  1 RED (re-explained), 1 safety flag
                                                  (escalated). Call duration: 4:52.
```

---

## The Demo Dashboard (React Frontend)

### Layout: Split-Screen Design

```
┌──────────────────────────────────┬───────────────────────────┐
│                                  │                           │
│   LIVE CALL PANEL                │   AGENT NETWORK           │
│                                  │                           │
│   ┌────────────────────────┐     │   [Force-directed graph   │
│   │ ~~~ audio waveform ~~~ │     │    showing 4 agents as    │
│   │                        │     │    nodes with animated    │
│   │  "Hola señora García,  │     │    message particles     │
│   │   ¿cómo se siente?"   │     │    flowing between them   │
│   └────────────────────────┘     │    when they communicate] │
│                                  │                           │
│   LIVE SUBTITLES                 │                           │
│   ES: "Sí, me tomé la pastilla" │                           │
│   EN: "Yes, I took the pill"    │                           │
│                                  │                           │
├──────────────────────────────────┤                           │
│                                  │                           │
│   COMPREHENSION CHECKLIST        ├───────────────────────────┤
│                                  │                           │
│   ✅ Metformin 500mg  ██████ G  │   CARE TEAM ALERTS        │
│   🔴 Lisinopril 10mg  █████ R  │                           │
│   ⬜ Follow-up Apr 2  ░░░░░░   │   ⚠ Persistent headache  │
│   ⬜ Warning signs    ░░░░░░   │     → Nurse callback 1hr  │
│   ⬜ Activity limits  ░░░░░░   │                           │
│                                  │   📊 Overall: 78%        │
│   [items check off as the call  │      comprehension        │
│    progresses, bars fill with   │                           │
│    green/yellow/red]            │                           │
│                                  │                           │
└──────────────────────────────────┴───────────────────────────┘
```

### Key Visual Components to Build

**1. Audio Waveform (simulated for demo)**
Use Web Audio API or a pre-recorded waveform visualization. During the live demo, play the pre-recorded call audio while the waveform animates. The waveform should pulse warmly — think heartbeat monitor, not EDM.

**2. Live Subtitles with Translation**
Two lines: original language on top (larger), English translation below (smaller, muted). Use Google Cloud Translation API or pre-compute for the demo.

**3. Comprehension Checklist (the star visual)**
This is the part judges will remember. A vertical list of discharge instruction items. As the call progresses and each item is discussed, the row animates:
- Grey (not yet discussed)
- Pulsing blue (currently being discussed)
- Green with checkmark (understood — teach-back passed)
- Yellow with warning (partial understanding)
- Red with X (not understood — re-explaining)

Each row has a small confidence bar that fills in real-time. When an item flips from red to green after re-explanation, the transition should feel satisfying — this IS the product working.

**4. Agent Network Graph**
A small force-directed D3 graph in the corner showing the 4 agents as labeled circles. When one agent sends an A2A message to another, an animated dot travels along the edge between them. The orchestrator (CareCoordinator) is larger and centered. This is a secondary visual — don't let it dominate, but it proves the multi-agent architecture to judges who care about it.

**5. Care Team Alert Panel**
When an escalation fires, an alert card slides in from the right with an amber or red accent. Shows: what was detected, what action was taken, who was notified. This is the "patient safety" moment — it shows the system protects people, not just talks to them.

---

## 48-Hour Build Schedule

### Hours 0–4: Foundation + Environment
- **Person A:** Set up Google Cloud project, install ADK, create skeleton agent files for all 4 agents
- **Person B:** Create ElevenLabs account, set up API key, test TTS in Spanish + English + one more language
- **Person C:** Scaffold React app with Vite, set up the split-screen layout shell, import D3.js

### Hours 4–12: Core Agent Logic
- **Person A:** Build CareCoordinator + DischargeReader agents. Test A2A communication between them locally. Use `adk web` to verify the orchestrator delegates correctly
- **Person B:** Build VoiceCoach agent — configure ElevenLabs Conversational AI agent with the system prompt. Test voice output in Spanish. Record demo audio clips
- **Person C:** Build the comprehension checklist UI component. Create the waveform visualizer. Set up WebSocket connection for real-time updates

### Hours 12–20: Integration + A2A Wiring
- **Person A:** Wire ComprehensionCheck + EscalationAgent. Test full A2A flow: CareCoordinator → DischargeReader → VoiceCoach → ComprehensionCheck → EscalationAgent
- **Person B:** Integrate Twilio (or mock the phone call for demo). Record 2 complete demo call scripts — one "happy path" (patient understands everything), one "escalation path" (patient confused + concerning symptom)
- **Person C:** Build the agent network graph visualization. Wire it to the A2A message log. Add animated message particles

### Hours 20–32: Demo Scenarios + Polish
- **All:** Create 3 pre-built demo scenarios:
  1. **Maria Garcia** — Spanish-speaking, post-surgery, understands most things but confuses one medication (shows re-explanation working)
  2. **Wei Chen** — Mandarin-speaking, reports persistent headache (shows escalation path)
  3. **James Wilson** — English-speaking, elderly, hearing difficulties (shows patience and accommodation)

- **Person C:** Polish all animations. Add the subtitle translation display. Make the comprehension bar animations feel smooth and satisfying

### Hours 32–40: Pre-Record Demo + Integration Test
- **Person B:** Record full audio for all 3 demo scenarios using ElevenLabs TTS (both agent and simulated patient voices). These are your backup if the live API has latency issues during the presentation
- **Person A:** Run end-to-end tests of the full A2A pipeline. Ensure message flow is logged and displayed correctly
- **Person C:** Build the final summary card that appears after a call ends (overall comprehension score, items flagged, actions taken)

### Hours 40–48: Presentation Prep
- **All:** Rehearse the presentation 5+ times. Time it. Practice the "reveal" moment where you play the audio
- Create slides for: problem statement (1 slide), the "play audio" moment (no slide — just audio), architecture overview (1 slide), live demo (the dashboard), impact numbers (1 slide), future vision (1 slide)
- **Plan B:** If live ElevenLabs API is slow during demo, seamlessly switch to pre-recorded audio. The dashboard should still animate as if live

---

## Presentation Script (5 minutes)

### Minute 0:00–0:30 — The Hook
Stand up. No slides. Say:

> "1 in 5 patients are readmitted within 30 days. The number one reason isn't a medical failure — it's a communication failure. They were handed a 6-page document while still groggy from anesthesia, told 'follow these instructions,' and sent home. 30% of patients can't even name a single medication they were prescribed. And if English isn't their first language? That number jumps to 50%."

### Minute 0:30–1:30 — The Demo (Audio)
> "This is what our system sounds like."

**Press play on the pre-recorded Spanish call.** Let the room hear 45 seconds of the agent warmly walking Maria through her medications in Spanish. Show the English subtitles on screen.

Then: "That's not a human nurse. That's an AI agent speaking in Maria's native Spanish, walking her through every medication, every warning sign, every follow-up appointment — 24 hours after she left the hospital."

### Minute 1:30–3:00 — The Dashboard (Live Demo)
Switch to the live dashboard. Show:
1. The comprehension checklist filling in real-time as the call plays
2. The moment Metformin turns RED because Maria confused it — then the re-explanation — then it turns GREEN
3. The agent network graph showing A2A messages flowing between agents
4. The moment the headache triggers an escalation — the alert card slides in

> "Each of these agents is a specialist. DischargeReader parses the medical document. VoiceCoach conducts the call. ComprehensionCheck monitors understanding in real-time. And when Maria mentioned a headache, EscalationAgent immediately scheduled a nurse callback. No single system could do this. It takes a coordinated workforce."

### Minute 3:00–4:00 — The Impact
> "Hospital readmissions cost the US healthcare system $26 billion per year. A 10% reduction would save $2.6 billion and thousands of lives. Post-discharge phone calls from nurses reduce readmissions by 25% — but there aren't enough nurses to call every patient. DischargeGuard can call every patient, in 70 languages, within 24 hours of discharge. Every single one."

### Minute 4:00–5:00 — The Architecture + Close
Show the architecture slide briefly. Emphasize:
- Built on Google ADK + A2A protocol
- 4 independent agents, each with their own Agent Card
- ElevenLabs Conversational AI with 70+ language support
- Real-time comprehension monitoring with teach-back method
- Automatic escalation to human nurses when needed

Close with:
> "The discharge instructions aren't the problem. The problem is that nobody follows up. DischargeGuard does — in your language, at scale, without ever getting tired."

---

## Required API Keys and Services

| Service | Purpose | Free Tier? | Setup Time |
|---------|---------|------------|------------|
| Google Cloud | ADK + Gemini + Cloud Run | $300 free credit | 30 min |
| ElevenLabs | Voice agents + TTS + multilingual | Free tier (10k chars/month) | 15 min |
| Twilio | Phone calls (optional for demo) | Free trial + $15 credit | 20 min |
| Google Cloud Translation | Real-time subtitle translation | 500k chars/month free | 10 min |

**Hackathon Tip:** For the demo, you don't need Twilio. Pre-record the phone calls using ElevenLabs TTS and play them through the dashboard while the agents animate. This is more reliable and just as impressive. Only add Twilio if you have time and want to make a live call on stage.

---

## Demo Data: Sample Discharge Summary

Use this as input for the DischargeReader agent during the demo:

```
PATIENT: Maria Garcia
MRN: 847291
DOB: 03/15/1955
LANGUAGE: Spanish
DISCHARGE DATE: 03/27/2026

DIAGNOSIS: Type 2 Diabetes Mellitus, Hypertension, Post-cholecystectomy

MEDICATIONS:
1. Metformin 500mg - Take twice daily with meals (for diabetes)
2. Lisinopril 10mg - Take once daily in the morning (for blood pressure)
3. Acetaminophen 500mg - Take every 6 hours as needed for pain (surgical site)
4. Omeprazole 20mg - Take once daily before breakfast (stomach protection)

ACTIVITY RESTRICTIONS:
- No heavy lifting (>10 lbs) for 4 weeks
- No driving for 1 week or while taking pain medication
- May shower after 48 hours; no baths or swimming for 2 weeks
- Walk 10-15 minutes daily to prevent blood clots

WOUND CARE:
- Keep surgical dressing dry and clean
- Remove bandage after 48 hours
- Clean with mild soap and water daily
- No ointments or creams unless directed

FOLLOW-UP APPOINTMENTS:
1. Dr. Sarah Thompson (surgeon) - April 3, 2026 at 10:00 AM
2. Dr. Robert Chen (PCP) - April 10, 2026 at 2:30 PM

WARNING SIGNS — Go to ER immediately if you experience:
- Fever above 101°F (38.3°C)
- Redness, swelling, or drainage from surgical site
- Severe abdominal pain that gets worse
- Nausea/vomiting that won't stop
- Difficulty breathing
- Chest pain
```

---

## File Structure

```
dischargeguard/
├── agents/
│   ├── care_coordinator/
│   │   ├── __main__.py          # A2A server entry point
│   │   ├── agent.py             # Orchestrator logic
│   │   └── agent_card.py        # Agent Card definition
│   ├── discharge_reader/
│   │   ├── __main__.py
│   │   └── agent.py
│   ├── voice_coach/
│   │   ├── __main__.py
│   │   ├── agent.py             # ADK agent wrapping ElevenLabs
│   │   ├── elevenlabs_setup.py  # ElevenLabs configuration
│   │   └── twilio_bridge.py     # Optional phone integration
│   ├── comprehension_check/
│   │   ├── __main__.py
│   │   └── agent.py
│   └── escalation/
│       ├── __main__.py
│       └── agent.py
├── dashboard/                    # React frontend
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── CallPanel.jsx         # Waveform + subtitles
│   │   │   ├── ChecklistPanel.jsx    # Comprehension tracking
│   │   │   ├── AgentGraph.jsx        # D3 agent network
│   │   │   ├── AlertPanel.jsx        # Care team alerts
│   │   │   └── SummaryCard.jsx       # Post-call summary
│   │   └── hooks/
│   │       └── useAgentStream.js     # WebSocket for real-time updates
│   └── package.json
├── demo/
│   ├── sample_discharge.txt     # Demo discharge summary
│   ├── scenario_maria.json      # Pre-built demo scenario
│   ├── scenario_wei.json
│   ├── scenario_james.json
│   └── audio/                   # Pre-recorded demo audio
│       ├── maria_call_es.mp3
│       ├── maria_call_en_subtitles.json
│       ├── wei_call_zh.mp3
│       └── james_call_en.mp3
├── scripts/
│   ├── start_all_agents.sh      # Launch all 4 agents
│   └── generate_demo_audio.py   # Generate audio via ElevenLabs
├── requirements.txt
├── pyproject.toml
└── README.md
```

---

## Startup Script

```bash
#!/bin/bash
# scripts/start_all_agents.sh
# Launch all DischargeGuard agents in parallel

echo "Starting DischargeGuard Agent Ecosystem..."

# Start each agent on its own port
python -m agents.discharge_reader --port 8001 &
python -m agents.voice_coach --port 8002 &
python -m agents.comprehension_check --port 8003 &
python -m agents.escalation --port 8004 &

# Wait for agents to initialize
sleep 3

# Start the orchestrator (connects to other agents via A2A)
python -m agents.care_coordinator --port 8000 &

# Start the React dashboard
cd dashboard && npm run dev &

echo ""
echo "All agents running:"
echo "  CareCoordinator:    http://localhost:8000"
echo "  DischargeReader:    http://localhost:8001"
echo "  VoiceCoach:         http://localhost:8002"
echo "  ComprehensionCheck: http://localhost:8003"
echo "  EscalationAgent:    http://localhost:8004"
echo "  Dashboard:          http://localhost:5173"
echo ""
echo "Agent Cards available at:"
echo "  http://localhost:800X/.well-known/agent.json"
```

---

## What Makes This Win

1. **The audio demo moment** — judges HEAR the product, not just see it. A warm Spanish voice walking a patient through medications is more powerful than any dashboard
2. **Multi-agent architecture is natural** — each agent does one thing well. The orchestrator coordinates. This isn't forced; it's the right architecture for the problem
3. **Directly quotes the challenge** — "AI-powered solution rooted in empathy — one that listens better, reaches further"
4. **Real impact numbers** — $26B readmission cost, 25% reduction with phone follow-up, 70+ languages
5. **The comprehension checklist animation** — watching items flip from grey to green to red to green again IS the product. It's visual, satisfying, and proves the system works
6. **Escalation moment** — when the headache triggers a nurse callback, judges see patient safety in action. The system doesn't just talk — it protects
