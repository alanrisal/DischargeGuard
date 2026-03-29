"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { CHECKLIST, SUBTITLES, EVENTS } from "./demoData";
import type { Phase, ItemState, Alert, A2AMessage, Particle, Subtitle } from "./types";

function makeItems(): Record<string, ItemState> {
  return Object.fromEntries(
    CHECKLIST.map((c) => [c.id, { status: "idle" as const, score: "", fill: 0, note: "" }])
  );
}

export function useCallStream() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [items, setItems] = useState<Record<string, ItemState>>(makeItems);
  const [subtitle, setSubtitle] = useState<Subtitle>({ es: "", en: "" });
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [a2aMsgs, setA2aMsgs] = useState<A2AMessage[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [callTime, setCallTime] = useState("0:00");

  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef   = useRef<number>(0);
  const callTimeRef = useRef("0:00");
  const sentRef    = useRef(false); // guard against duplicate sends

  const updateItem = useCallback((id: string, patch: Partial<ItemState>) => {
    setItems((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }, []);

  const spawnParticle = useCallback((from: string, to: string) => {
    const id = Date.now() + Math.random();
    setParticles((prev) => [...prev, { id, from, to, progress: 0 }]);
    let prog = 0;
    const anim = () => {
      prog += 0.025;
      if (prog >= 1) {
        setParticles((prev) => prev.filter((p) => p.id !== id));
        return;
      }
      setParticles((prev) =>
        prev.map((p) => (p.id === id ? { ...p, progress: prog } : p))
      );
      requestAnimationFrame(anim);
    };
    requestAnimationFrame(anim);
  }, []);

  // Timer effect
  useEffect(() => {
    if (phase !== "running") return;
    timerRef.current = setInterval(() => {
      const s = Math.floor((Date.now() - startRef.current) / 1000);
      const m = Math.floor(s / 60);
      const sec = s % 60;
      const t = `${m}:${sec.toString().padStart(2, "0")}`;
      callTimeRef.current = t;
      setCallTime(t);
    }, 250);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase]);

  // Events effect
  useEffect(() => {
    if (phase !== "running") return;

    const handles: ReturnType<typeof setTimeout>[] = [];

    SUBTITLES.forEach((s) => {
      handles.push(setTimeout(() => setSubtitle({ es: s.es, en: s.en }), s.t * 1000));
    });

    EVENTS.forEach((ev) => {
      handles.push(
        setTimeout(() => {
          if (ev.type === "activate") {
            updateItem(ev.id!, { status: "active", fill: 45 });
            spawnParticle("CareCoord", "VoiceCoach");
          } else if (ev.type === "status") {
            updateItem(ev.id!, {
              status: ev.status as ItemState["status"],
              score: ev.score ?? "",
              fill: ev.fill ?? 0,
              note: ev.note ?? "",
            });
            spawnParticle("VoiceCoach", "Compr.");
          } else if (ev.type === "escalate") {
            setAlerts((prev) => [
              ...prev,
              {
                id: Date.now(),
                level: "warning",
                icon: "⚠",
                title: "WARNING",
                body: "Patient reports persistent headache since discharge (post-op day 1).",
                action: "Nurse callback scheduled within 1 hour · Assigned: Nurse Williams",
                time: callTimeRef.current,
              },
            ]);
            spawnParticle("EscalAgent", "CareCoord");
          } else if (ev.type === "a2a") {
            setA2aMsgs((prev) => [...prev.slice(-4), { from: ev.from!, to: ev.to!, msg: ev.msg! }]);
            spawnParticle(ev.from!, ev.to!);
          } else if (ev.type === "end") {
            if (timerRef.current) clearInterval(timerRef.current);
            setPhase("done");
            setSubtitle({ es: "Llamada completada · 1:05", en: "Call completed · All items reviewed" });
            setItems((currentItems) => {
              setAlerts((currentAlerts) => {
                sendSummaryAndFinish(currentItems, currentAlerts);
                return currentAlerts;
              });
              return currentItems;
            });
          }
        }, ev.t * 1000)
      );
    });

    return () => handles.forEach(clearTimeout);
  }, [phase, updateItem, spawnParticle]);

  // Shared: send summary email — guarded against duplicate calls
  const sendSummaryAndFinish = useCallback((currentItems: Record<string, ItemState>, currentAlerts: Alert[], transcript?: string) => {
    if (sentRef.current) return;
    sentRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    const greenC = Object.values(currentItems).filter((v) => v.status === "green").length;
    const comp   = Math.round((greenC / CHECKLIST.length) * 100);
    fetch("/api/send-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientName:   "Maria Garcia",
        callTime:      callTimeRef.current,
        comprehension: comp,
        greenCount:    greenC,
        totalItems:    CHECKLIST.length,
        alerts:        currentAlerts,
        transcript:    transcript ?? "",
        items:         Object.fromEntries(
          CHECKLIST.map((c) => [c.id, { ...currentItems[c.id], name: c.name, detail: c.detail }])
        ),
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.status === "ok") console.log("[send-summary] ✓ Email sent");
        else console.error("[send-summary] ✗ Server error:", data);
      })
      .catch((err) => console.error("[send-summary] ✗ Fetch failed:", err));
  }, []);

  const startDemo = useCallback(() => {
    sentRef.current = false; // reset guard for new call
    setPhase("running");
    setItems(makeItems());
    setAlerts([]);
    setA2aMsgs([]);
    setSubtitle({ es: "", en: "" });
    setCallTime("0:00");
    startRef.current = Date.now();

    setTimeout(() => spawnParticle("CareCoord", "DischargeR"), 500);
    setTimeout(() => {
      setA2aMsgs([{ from: "CareCoord", to: "DischargeR", msg: "Parse discharge — Maria Garcia (es)" }]);
      spawnParticle("DischargeR", "CareCoord");
    }, 1500);
    setTimeout(() => {
      setA2aMsgs((prev) => [
        ...prev,
        { from: "CareCoord", to: "VoiceCoach", msg: "Call patient +1-813-555-0142 · language: es" },
      ]);
      spawnParticle("CareCoord", "VoiceCoach");
    }, 2500);
  }, [spawnParticle]);

  // End call mid-session — shows summary + sends email, doesn't wipe state
  const endCall = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase("done");
    setSubtitle({ es: "Llamada finalizada", en: "Call ended early — partial summary below" });
    setItems((currentItems) => {
      setAlerts((currentAlerts) => {
        sendSummaryAndFinish(currentItems, currentAlerts);
        return currentAlerts;
      });
      return currentItems;
    });
  }, [sendSummaryAndFinish]);

  const resetDemo = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    sentRef.current = false;
    setPhase("idle");
    setItems(makeItems());
    setAlerts([]);
    setA2aMsgs([]);
    setSubtitle({ es: "", en: "" });
    setCallTime("0:00");
  }, []);

  const greenCount = Object.values(items).filter((v) => v.status === "green").length;
  const comprehension = phase === "idle" ? 0 : Math.round((greenCount / CHECKLIST.length) * 100);

  return {
    phase, items, subtitle, alerts, a2aMsgs, particles,
    callTime, comprehension, greenCount,
    startDemo, endCall, resetDemo,
  };
}
