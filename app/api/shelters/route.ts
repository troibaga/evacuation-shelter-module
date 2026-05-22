import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const rawId = url.searchParams.get("id")?.trim();
  const shelterId = rawId ? Number(rawId) : NaN;

  if (Number.isNaN(shelterId) || shelterId <= 0) {
    return NextResponse.json({ error: "Invalid shelter ID." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("location")
    .select(
      `latitude, longitude, shelter_id, shelter(
        shelter_id,
        zone_num,
        barangay_name,
        municipality,
        type,
        max_capacity,
        curr_capacity,
        head_id,
        created_at,
        last_update,
        shelter_head(head_id, fname, mname, lname, contact_num, socmed_url)
      )`
    )
    .eq("shelter_id", shelterId)
    .single();

  if (error) {
    console.error("Shelter fetch failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data || !data.shelter) {
    return NextResponse.json({ error: "Shelter not found." }, { status: 404 });
  }

  const shelter = {
    ...data.shelter,
    latitude: data.latitude,
    longitude: data.longitude,
  };

  return NextResponse.json(shelter);
}
