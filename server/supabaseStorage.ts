import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";
import path from "path";

const BUCKET = "uploads";

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  }
  return createClient(url, key);
}

/**
 * Uploads a buffer to Supabase Storage and returns a permanent public URL.
 */
export async function uploadToSupabase(
  buffer: Buffer,
  contentType: string,
  originalName: string
): Promise<string> {
  const supabase = getSupabaseClient();
  const ext = path.extname(originalName) || ".jpg";
  const objectId = uuidv4();
  const filePath = `uploads/${objectId}${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, buffer, { contentType, upsert: false });

  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}
