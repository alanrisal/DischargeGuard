export type Phase = "idle" | "running" | "done";

export type ItemStatus = "idle" | "active" | "green" | "yellow" | "red";

export interface ChecklistItem {
  id: string;
  name: string;
  detail: string;
  category: string;
}

export interface ItemState {
  status: ItemStatus;
  score: string;
  fill: number;
  note: string;
}

export interface Alert {
  id: number;
  level: "warning" | "urgent";
  icon: string;
  title: string;
  body: string;
  action: string;
  time: string;
}

export interface A2AMessage {
  from: string;
  to: string;
  msg: string;
}

export interface Particle {
  id: number;
  from: string;
  to: string;
  progress: number;
}

export interface Subtitle {
  es: string;
  en: string;
}
