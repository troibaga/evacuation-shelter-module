import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("location")
    .select("latitude, longitude, shelter_id, shelter(max_capacity, curr_capacity)");

  if (error) {
    console.error("Failed to fetch locations:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}
