import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const rawId = params.id?.toString().trim();
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

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const rawId = params.id?.toString().trim();
  const shelterId = rawId ? Number(rawId) : NaN;

  if (Number.isNaN(shelterId) || shelterId <= 0) {
    return NextResponse.json({ error: "Invalid shelter ID." }, { status: 400 });
  }

  try {
    // 1. Fetch the shelter with its head_id
    const { data: shelterData, error: fetchError } = await supabase
      .from("shelter")
      .select("head_id")
      .eq("shelter_id", shelterId)
      .single();

    if (fetchError || !shelterData) {
      return NextResponse.json({ error: "Shelter not found." }, { status: 404 });
    }

    const headId = shelterData.head_id;

    // 2. Delete the location record(s) for this shelter
    const { error: locError } = await supabase
      .from("location")
      .delete()
      .eq("shelter_id", shelterId);

    if (locError) {
      throw new Error(`Failed to delete location: ${locError.message}`);
    }

    // 3. Delete the shelter record
    const { error: shelterError } = await supabase
      .from("shelter")
      .delete()
      .eq("shelter_id", shelterId);

    if (shelterError) {
      throw new Error(`Failed to delete shelter: ${shelterError.message}`);
    }

    // 4. Delete the shelter head if it exists and is not referenced by other shelters
    if (headId) {
      const { data: otherShelters, error: checkError } = await supabase
        .from("shelter")
        .select("shelter_id", { count: "exact" })
        .eq("head_id", headId);

      if (checkError) {
        console.warn(`Warning: Could not check for other shelters with head_id ${headId}:`, checkError.message);
      } else if (!otherShelters || otherShelters.length === 0) {
        // No other shelters reference this head, so delete it
        const { error: headError } = await supabase
          .from("shelter_head")
          .delete()
          .eq("head_id", headId);

        if (headError) {
          console.warn(`Warning: Failed to delete shelter_head ${headId}:`, headError.message);
        }
      }
    }

    return NextResponse.json({ success: true, message: "Shelter deleted successfully." });
  } catch (error: any) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete shelter." }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const rawId = params.id?.toString().trim();
  const shelterId = rawId ? Number(rawId) : NaN;

  if (Number.isNaN(shelterId) || shelterId <= 0) {
    return NextResponse.json({ error: "Invalid shelter ID." }, { status: 400 });
  }

  try {
    const updateData = await request.json();

    // Validate required fields for update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No fields to update." }, { status: 400 });
    }

    // Update shelter fields if provided
    if (updateData.shelter) {
      const { error: shelterError } = await supabase
        .from("shelter")
        .update({
          zone_num: updateData.shelter.zone_num,
          type: updateData.shelter.type,
          max_capacity: updateData.shelter.max_capacity,
          curr_capacity: updateData.shelter.curr_capacity,
          last_update: new Date().toISOString(),
        })
        .eq("shelter_id", shelterId);

      if (shelterError) {
        throw new Error(`Failed to update shelter: ${shelterError.message}`);
      }
    }

    // Update shelter head if provided
    if (updateData.shelterHead) {
      // First, fetch the current shelter to get head_id
      const { data: shelterData, error: fetchError } = await supabase
        .from("shelter")
        .select("head_id")
        .eq("shelter_id", shelterId)
        .single();

      if (fetchError || !shelterData) {
        return NextResponse.json({ error: "Shelter not found." }, { status: 404 });
      }

      const headId = shelterData.head_id;

      if (headId) {
        // Update existing head
        const { error: headError } = await supabase
          .from("shelter_head")
          .update({
            fname: updateData.shelterHead.fname,
            mname: updateData.shelterHead.mname || null,
            lname: updateData.shelterHead.lname,
            contact_num: updateData.shelterHead.contact_num,
            socmed_url: updateData.shelterHead.socmed_url || null,
          })
          .eq("head_id", headId);

        if (headError) {
          throw new Error(`Failed to update shelter head: ${headError.message}`);
        }
      } else if (updateData.shelterHead.fname || updateData.shelterHead.lname) {
        // Create new head if doesn't exist
        const { data: newHead, error: createError } = await supabase
          .from("shelter_head")
          .insert([{
            fname: updateData.shelterHead.fname,
            mname: updateData.shelterHead.mname || null,
            lname: updateData.shelterHead.lname,
            contact_num: updateData.shelterHead.contact_num,
            socmed_url: updateData.shelterHead.socmed_url || null,
          }])
          .select("head_id")
          .single();

        if (createError) {
          throw new Error(`Failed to create shelter head: ${createError.message}`);
        }

        // Link the new head to the shelter
        const { error: linkError } = await supabase
          .from("shelter")
          .update({ head_id: newHead.head_id })
          .eq("shelter_id", shelterId);

        if (linkError) {
          throw new Error(`Failed to link shelter head: ${linkError.message}`);
        }
      }
    }

    // Update location if provided
    if (updateData.location) {
      const { error: locError } = await supabase
        .from("location")
        .update({
          latitude: updateData.location.latitude,
          longitude: updateData.location.longitude,
        })
        .eq("shelter_id", shelterId);

      if (locError) {
        throw new Error(`Failed to update location: ${locError.message}`);
      }
    }

    return NextResponse.json({ success: true, message: "Shelter updated successfully." });
  } catch (error: any) {
    console.error("Update error:", error);
    return NextResponse.json({ error: error.message || "Failed to update shelter." }, { status: 500 });
  }
}
