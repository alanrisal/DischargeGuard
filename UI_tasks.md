# CareCall — UI Implementation Tasks for Claude Code
> Warm Neumorphic Medical Dashboard · Fraunces + DM Sans · Ivory Base

---

## Design System Foundation

**Aesthetic Direction:** Warm Neumorphic — soft, extruded surfaces on an ivory base. Clinical precision with human warmth. Every surface feels like it has physical depth — raised cards, inset inputs, gentle shadows. Nothing flat. Nothing cold.

**Core Palette (CSS Variables):**
```css
:root {
  --bg-base: #F0EBE3;           /* Warm ivory — the skin everything lives on */
  --surface-raised: #F5F0E8;    /* Elevated neumorphic card */
  --surface-inset: #E8E3DB;     /* Recessed/inset elements */
  --shadow-light: #FFFFFF;      /* Neumorphic highlight */
  --shadow-dark: #D4CECA;       /* Neumorphic shadow */

  --text-primary: #2C2420;      /* Deep warm brown — primary text */
  --text-secondary: #7A6E68;    /* Muted warm gray */
  --text-tertiary: #A89E98;     /* Lightest label text */

  --accent-clinical: #3B6FA0;   /* Medical blue — trust, authority */
  --accent-warm: #C2714F;       /* Warm terracotta — humanity, care */
  --accent-success: #4A8C6F;    /* Muted sage green — positive signals */

  --warning-amber: #D4813A;     /* Alert amber */
  --warning-red: #B84040;       /* Critical red */
  --warning-red-bg: #F5E8E8;    /* Critical red surface */

  --waveform-active: #3B6FA0;   /* Active speaking waveform */
  --waveform-idle: #C2BAB4;     /* Idle/ambient waveform */

  --font-display: 'Fraunces', Georgia, serif;
  --font-body: 'DM Sans', sans-serif;
}
```

**Neumorphic Mixin (reference for all raised cards):**
```css
.neu-raised {
  background: var(--surface-raised);
  box-shadow:
    6px 6px 14px var(--shadow-dark),
    -6px -6px 14px var(--shadow-light);
  border-radius: 16px;
}

.neu-inset {
  background: var(--surface-inset);
  box-shadow:
    inset 4px 4px 10px var(--shadow-dark),
    inset -4px -4px 10px var(--shadow-light);
  border-radius: 12px;
}
```

**Font Imports (add to `<head>` or globals.css):**
```css
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
```

---

## Implementation Progression
> Ordered from least to most complex. Complete each phase before moving to the next.

---

## Phase 1 — Global Shell & Design Tokens
**Effort:** Low · **Impact:** Foundational

### Task 1.1 — Install & Configure Fonts
- Add Google Fonts import for Fraunces + DM Sans to `app/globals.css`
- Set `font-family` on `body` to DM Sans
- Set `font-family` on all `h1, h2, h3` to Fraunces

### Task 1.2 — Apply CSS Variable System
- Replace all hardcoded colors throughout the codebase with the CSS variables defined above
- Set `background-color: var(--bg-base)` on `html, body`
- Remove any existing `bg-white`, `bg-gray-*`, `bg-blue-*` Tailwind classes that conflict

### Task 1.3 — Global Neumorphic Card Component
Create `components/ui/NeuCard.tsx`:
```tsx
// Props: variant ('raised' | 'inset'), className, children
// Applies the correct box-shadow pair
// Used as the base wrapper for every panel in the dashboard
```

---

## Phase 2 — Landing Splash Page (`/` or `/landing`)
**Effort:** Medium · **Impact:** First impression, demo opener

### Task 2.1 — Full-Screen Dark Base
- Page background: `#1A1410` (deep warm almost-black — contrast against the ivory dashboard)
- This page is the ONLY dark page. Everything else is warm ivory.

### Task 2.2 — Robotic Voice Contrast Moment
Top section of the landing — autoplay a short audio clip of a flat robotic TTS voice (record or generate using a basic TTS service) saying something like:
> *"Your discharge instructions have been sent. Please refer to page four for medication guidance."*

Visuals during playback:
- A cold, flat sine wave — monochrome, mechanical, lifeless — animates beneath the text
- Subtitle appears: `"This is what most patients hear."`
- After clip ends (or after 4s), a subtle red X fades over the waveform

### Task 2.3 — Stat Reveal Animation
After the robotic moment, large Fraunces type builds in:
```
"1 in 5 patients
are readmitted
within 30 days."
```
- Each line reveals with a staggered clip-path animation (`clip-path: inset(0 100% 0 0)` → `inset(0 0% 0 0)`)
- Delay: line 1 at 0.2s, line 2 at 0.6s, line 3 at 1.0s
- Color: warm ivory `#F0EBE3` on dark background

### Task 2.4 — CareCall Logo Pulse
After the stat fully reveals (~1.8s):
- CareCall wordmark fades + scales in (`opacity: 0, scale: 0.95` → `opacity: 1, scale: 1`)
- Fraunces italic for "Care", DM Sans weight 300 for "Call" — typographic lockup
- A single gentle pulse ring expands outward from behind the logo (CSS keyframe, single occurrence)

### Task 2.5 — CTA Button
- Neumorphic raised pill button: "Begin" or "Open Dashboard"
- Warm ivory fill, `var(--accent-clinical)` border
- On hover: slight depression effect (switch to inset shadow)
- Routes to `/patients`

---

## Phase 3 — Patient Selection Page (`/patients`)
**Effort:** Low-Medium · **Impact:** Clinical polish, transition into the tool**

### Task 3.1 — Page Header
- Warm ivory background (back to the main palette)
- Fraunces display heading: `"Select a Patient"` — weight 300 italic, large, left-aligned
- Subtext in DM Sans: `"Active monitored patients · CareCall AI"` in `var(--text-tertiary)`

### Task 3.2 — Search / Filter Bar
- Neumorphic inset input field (`.neu-inset`)
- Placeholder: `"Search by name or room number..."`
- DM Sans, weight 400
- A subtle magnifying glass icon in `var(--text-tertiary)` on the left

### Task 3.3 — Patient Cards Grid
Each patient card is a `NeuCard` (raised variant) containing:
- **Left:** Patient initials in a neumorphic inset circle — warm terracotta for active, muted for inactive
- **Name:** Fraunces weight 400 · `var(--text-primary)`
- **Subtitle:** Age · Condition tag · Room number in DM Sans weight 300
- **Status badge:** Pill-shaped · Inset neumorphic · `"Call Scheduled"` / `"In Progress"` / `"Completed"` with appropriate accent colors
- **Hover state:** Card lifts slightly (box-shadow increases in spread by 2px, transition 200ms)
- **Click:** Navigate to `/dashboard/[patientId]`

### Task 3.4 — Empty / Loading State
- Skeleton cards using animated shimmer gradient across neumorphic surfaces
- Shimmer direction: left to right, warm ivory tones only

---

## Phase 4 — Dashboard Page (`/dashboard/[id]`)
**Effort:** High · **Impact:** The core demo surface

The dashboard is a single-page layout with a persistent left sidebar and a main content area. No scroll on the outer shell — internal panels may scroll independently.

### Task 4.1 — Layout Structure
```
┌─────────────────────────────────────────────────────┐
│  SIDEBAR (280px fixed)   │   MAIN CONTENT AREA       │
│                          │                           │
│  Patient info            │  [Waveform Panel]         │
│  Call status             │  [Transcript Panel]       │
│  Nav items               │  [Radial Spoke Chart]     │
│                          │  [Warnings Panel]         │
└─────────────────────────────────────────────────────┘
```

All panels are `NeuCard` raised variant with generous padding (24–32px).

### Task 4.2 — Sidebar
- Patient avatar: large inset neumorphic circle with initials or photo
- Patient name in Fraunces weight 400
- Condition + discharge date in DM Sans weight 300
- Divider: single pixel `var(--shadow-dark)`
- Call status indicator: pulsing dot (CSS animation) + label `"Agent Active"` / `"Standby"`
- Navigation links (if applicable): DM Sans weight 500, left-aligned

### Task 4.3 — Waveform Panel
This is the showstopper component.

**Structure:**
- Full-width `NeuCard` raised
- Label: `"Live Call — Agent Speaking"` in DM Sans weight 500 + `var(--accent-clinical)`
- Waveform canvas below — 80px tall, full width

**Waveform Implementation:**
```tsx
// Use a <canvas> element with requestAnimationFrame
// Two modes controlled by a prop: `isAgentSpeaking: boolean`

// IDLE mode: 
//   - Slow gentle sine wave
//   - Color: var(--waveform-idle) — muted warm gray
//   - Amplitude: ~8px · Frequency: low

// ACTIVE mode (agent speaking):
//   - Multiple overlapping sine waves with randomized amplitude spikes
//   - Color: var(--waveform-active) — clinical blue
//   - Random noise added to amplitude each frame to simulate real voice
//   - Amplitude: 20–40px with variance
//   - Transition between modes: ease over 600ms

// Implementation pattern:
function drawWaveform(ctx, width, height, time, isActive) {
  ctx.clearRect(0, 0, width, height);
  const amplitude = isActive ? (20 + Math.random() * 20) : 8;
  const frequency = isActive ? 0.04 : 0.02;
  // Draw 2 overlapping paths if active (creates richness)
  // Single path if idle
}
```

**Call controls below waveform:**
- Three neumorphic inset pill buttons: `"Pause"` · `"Flag Warning"` · `"End Call"`
- Icons: minimal stroke icons, `var(--text-secondary)`

### Task 4.4 — Live Transcript Panel
- `NeuCard` raised, right column, top half
- Label: `"Live Transcript"` — Fraunces italic weight 300
- Scrollable inner area (`.neu-inset` background) showing dialogue
- **Agent lines:** DM Sans weight 400 · `var(--accent-clinical)` left border (3px)
- **Patient lines:** DM Sans weight 400 · `var(--accent-warm)` left border (3px)
- New lines animate in: `translateY(8px) opacity:0` → `translateY(0) opacity:1` over 300ms
- Auto-scroll to bottom as new lines arrive

### Task 4.5 — Radial Spoke Chart (Understanding Progress)
This visualizes the 9 call topic areas completing in real time.

**Implementation:**
```tsx
// SVG-based radial chart
// 9 spokes radiating from center, evenly distributed (40° apart)
// Each spoke:
//   - Has a label at its tip (DM Sans weight 500, 11px)
//   - Fills from center outward as topic completes (0% → 100%)
//   - Color when incomplete: var(--shadow-dark) — barely visible
//   - Color when in-progress: var(--accent-clinical) at 50% opacity
//   - Color when complete: var(--accent-clinical) full
//   - Transition: stroke-dashoffset animation over 800ms ease-out

// Topics (customize to CareCall's call checklist):
const topics = [
  "Medications", "Follow-up Appt", "Warning Signs",
  "Diet & Activity", "Emergency Contact", "Wound Care",
  "Pharmacy Info", "Mental Wellbeing", "Comprehension Check"
]

// Center: small neumorphic inset circle showing % overall completion
// e.g. "7/9" in Fraunces weight 600
```

Card label: `"Call Coverage"` — Fraunces italic weight 300

### Task 4.6 — Warnings & Flags Panel
**This panel is a persistent log, not a modal.**

- `NeuCard` raised — bottom of main content area or right column lower half
- Header: `"Clinical Flags"` in Fraunces · A count badge (neumorphic inset pill): `"3 Flags"`
- If zero flags: subtle empty state — `"No concerns flagged"` in `var(--text-tertiary)`

**Each flag entry:**
- Left border: 3px solid `var(--warning-red)`
- Background: `var(--warning-red-bg)` — very subtle red tint on the row
- Flag text in DM Sans weight 500 · `var(--text-primary)`
- Timestamp in DM Sans weight 300 · `var(--text-tertiary)` right-aligned
- Severity tag: `"Critical"` / `"Moderate"` — pill in matching red/amber
- Underline on the concerning phrase within the flag text using `text-decoration: underline` · `var(--warning-red)` · `text-underline-offset: 3px`

**New flag animation:**
- Slides in from the right (`translateX(20px)` → `translateX(0)`)
- Brief background flash on entry (red tint pulses once)
- No modal, no blocking — purely additive to the log

---

## Phase 5 — Micro-interactions & Final Polish
**Effort:** Low-Medium · **Impact:** Separates good from memorable

### Task 5.1 — Page Transitions
- Landing → Patients: fade out dark, fade in ivory (cross-dissolve via CSS transition on route change)
- Patients → Dashboard: slide up (`translateY(20px)` → `translateY(0)` on mount)

### Task 5.2 — Neumorphic Button Interactions
All buttons across the app:
- Default: raised shadow
- Hover: shadow spreads 2px
- Active/press: switches to inset shadow (feels like physical press)
- Transition: 150ms ease

### Task 5.3 — Sidebar Pulse Dot
When agent is active:
```css
@keyframes pulse-dot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.3); }
}
```
Color: `var(--accent-success)` when active · `var(--text-tertiary)` when idle

### Task 5.4 — Responsive Considerations
- Dashboard: below 1200px, sidebar collapses to icon rail
- Below 768px: single column stack (not a priority for hackathon demo, note as future work)

---

## File Structure Reference
```
app/
  page.tsx                    # Landing splash
  patients/
    page.tsx                  # Patient selection
  dashboard/
    [id]/
      page.tsx                # Main dashboard
globals.css                   # CSS variables + base styles

components/
  ui/
    NeuCard.tsx               # Base neumorphic card wrapper
    NeuButton.tsx             # Neumorphic button with press state
  landing/
    StatReveal.tsx            # Animated stat text component
    RoboticWaveform.tsx       # Cold flat waveform for landing contrast
  dashboard/
    Waveform.tsx              # Live agent waveform (canvas)
    Transcript.tsx            # Live scrolling transcript
    RadialSpoke.tsx           # SVG radial coverage chart
    WarningsPanel.tsx         # Clinical flags log
    Sidebar.tsx               # Patient info sidebar
  patients/
    PatientCard.tsx           # Patient selection card
    PatientSearch.tsx         # Search/filter input
```

---

## Notes for Claude Code

- Do NOT use Tailwind for neumorphic shadows — custom CSS only. Tailwind's shadow utilities cannot express the dual light/dark neumorphic pairs.
- All color references must use CSS variables — never hardcode hex values in component files.
- The waveform canvas MUST use `requestAnimationFrame` with a cleanup `cancelAnimationFrame` on unmount.
- The radial spoke chart MUST be SVG — do not use a charting library (recharts etc.) for this component as they cannot achieve the custom spoke fill animation needed.
- Fraunces italic (`font-style: italic`) is a distinct optical axis — use it intentionally for display labels, not body text.
- Keep all neumorphic border-radius consistent: cards at 16px, pills at 999px, inset fields at 12px.