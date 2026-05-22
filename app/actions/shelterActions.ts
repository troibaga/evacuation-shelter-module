"use server";

import { createClient } from "@supabase/supabase-js";

// We create the server-side client inside the action to ensure it has the latest env vars
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function submitShelter(formData: any) {
  try {
    let headId = null;

    // 1. Insert Shelter Head (If Provided)
    if (formData.shelterHead && formData.shelterHead.fname) {
      const { data: headData, error: headError } = await supabase
        .from("shelter_head")
        .insert([{
          fname: formData.shelterHead.fname,
          mname: formData.shelterHead.mname || null,
          lname: formData.shelterHead.lname,
          contact_num: formData.shelterHead.contact_num,
          socmed_url: formData.shelterHead.socmed_url || null,
        }])
        .select("head_id")
        .single();

      if (headError) throw new Error(`Failed to insert shelter head: ${headError.message}`);
      headId = headData.head_id;
    }

    // 2. Insert Shelter
    const { data: shelterData, error: shelterError } = await supabase
      .from("shelter")
      .insert([{
        zone_num: formData.shelter.zone_num,
        barangay_name: "Brgy. Rizal", // Fixed default
        municipality: "San Fernando", // Fixed default
        type: formData.shelter.type,
        max_capacity: formData.shelter.max_capacity,
        curr_capacity: formData.shelter.curr_capacity,
        head_id: headId,
        // created_at and last_update are assumed to be handled by DB defaults
      }])
      .select("shelter_id")
      .single();

    if (shelterError) throw new Error(`Failed to insert shelter: ${shelterError.message}`);
    const shelterId = shelterData.shelter_id;

    // 3. Insert Location
    const { error: locError } = await supabase
      .from("location")
      .insert([{
        latitude: formData.location.latitude,
        longitude: formData.location.longitude,
        shelter_id: shelterId,
      }]);

    if (locError) throw new Error(`Failed to insert location: ${locError.message}`);

    return { success: true };
  } catch (error: any) {
    console.error("Submission Error:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteShelter(shelterId: number) {
  try {
    if (!Number.isInteger(shelterId) || shelterId <= 0) {
      return { success: false, error: "Invalid shelter ID." };
    }

    // 1. Fetch the shelter with its head_id
    const { data: shelterData, error: fetchError } = await supabase
      .from("shelter")
      .select("head_id")
      .eq("shelter_id", shelterId)
      .single();

    if (fetchError || !shelterData) {
      return { success: false, error: "Shelter not found." };
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

      if (!checkError && (!otherShelters || otherShelters.length === 0)) {
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

    return { success: true };
  } catch (error: any) {
    console.error("Delete Error:", error);
    return { success: false, error: error.message };
  }
}

export async function updateShelter(shelterId: number, formData: any) {
  try {
    if (!Number.isInteger(shelterId) || shelterId <= 0) {
      return { success: false, error: "Invalid shelter ID." };
    }

    // Validate required fields for update
    if (!formData || Object.keys(formData).length === 0) {
      return { success: false, error: "No fields to update." };
    }

    // Update shelter fields if provided
    if (formData.shelter) {
      const { error: shelterError } = await supabase
        .from("shelter")
        .update({
          zone_num: formData.shelter.zone_num,
          type: formData.shelter.type,
          max_capacity: formData.shelter.max_capacity,
          curr_capacity: formData.shelter.curr_capacity,
          last_update: new Date().toISOString(),
        })
        .eq("shelter_id", shelterId);

      if (shelterError) {
        throw new Error(`Failed to update shelter: ${shelterError.message}`);
      }
    }

    // Update shelter head if provided
    if (formData.shelterHead) {
      // First, fetch the current shelter to get head_id
      const { data: shelterData, error: fetchError } = await supabase
        .from("shelter")
        .select("head_id")
        .eq("shelter_id", shelterId)
        .single();

      if (fetchError || !shelterData) {
        return { success: false, error: "Shelter not found." };
      }

      const headId = shelterData.head_id;

      if (headId) {
        // Update existing head
        const { error: headError } = await supabase
          .from("shelter_head")
          .update({
            fname: formData.shelterHead.fname,
            mname: formData.shelterHead.mname || null,
            lname: formData.shelterHead.lname,
            contact_num: formData.shelterHead.contact_num,
            socmed_url: formData.shelterHead.socmed_url || null,
          })
          .eq("head_id", headId);

        if (headError) {
          throw new Error(`Failed to update shelter head: ${headError.message}`);
        }
      } else if (formData.shelterHead.fname || formData.shelterHead.lname) {
        // Create new head if doesn't exist
        const { data: newHead, error: createError } = await supabase
          .from("shelter_head")
          .insert([{
            fname: formData.shelterHead.fname,
            mname: formData.shelterHead.mname || null,
            lname: formData.shelterHead.lname,
            contact_num: formData.shelterHead.contact_num,
            socmed_url: formData.shelterHead.socmed_url || null,
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

    return { success: true };
  } catch (error: any) {
    console.error("Update Error:", error);
    return { success: false, error: error.message };
  }
}
