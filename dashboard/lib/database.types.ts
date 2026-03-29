export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      patients: {
        Row: {
          id: string;
          mrn: string;
          name: string;
          dob: string;
          language: string;
          language_code: string;
          diagnosis: string;
          phone: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["patients"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["patients"]["Insert"]>;
        Relationships: [];
      };
      prescriptions: {
        Row: {
          id: string;
          patient_id: string;
          name: string;
          purpose: string;
          status: "active" | "new" | "discontinued";
          prescribed_by: string;
          prescribed_date: string;
          refills: number;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["prescriptions"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["prescriptions"]["Insert"]>;
        Relationships: [];
      };
      visits: {
        Row: {
          id: string;
          patient_id: string;
          date: string;
          type: string;
          provider: string;
          department: string;
          notes: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["visits"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["visits"]["Insert"]>;
        Relationships: [];
      };
      call_history: {
        Row: {
          id: string;
          patient_id: string;
          date: string;
          time: string;
          duration: string;
          type: string;
          status: "completed" | "no-answer" | "failed";
          agent: string;
          language_code: string;
          comprehension_score: number;
          flags: string[];
          summary: string;
          /** Full ALEX:/PT: transcript from follow-up call */
          transcript: string | null;
          elevenlabs_conversation_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["call_history"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["call_history"]["Insert"]>;
        Relationships: [];
      };
      discharge_checklists: {
        Row: {
          id: string;
          patient_id: string;
          item_id: string;
          name: string;
          detail: string;
          category: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["discharge_checklists"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["discharge_checklists"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
