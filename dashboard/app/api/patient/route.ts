import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  const mrn = req.nextUrl.searchParams.get("mrn");
  if (!mrn) return NextResponse.json({ error: "mrn required" }, { status: 400 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return NextResponse.json({ patient: null, prescriptions: [] });
  }

  const supabase = createClient(url, key);

  const { data: patient, error } = await supabase
    .from("patients")
    .select("*")
    .eq("mrn", mrn)
    .single();

  if (error || !patient) return NextResponse.json({ error: "not found" }, { status: 404 });

  const { data: prescriptions } = await supabase
    .from("prescriptions")
    .select("name, purpose, status")
    .eq("patient_id", patient.id)
    .eq("status", "active")
    .order("prescribed_date", { ascending: false });

  return NextResponse.json({ patient, prescriptions: prescriptions ?? [] });
}
