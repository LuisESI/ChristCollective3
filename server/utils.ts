import { storage } from "./storage";
import slugify from "slugify";

export async function generateSlug(title: string): Promise<string> {
  let slug = slugify(title, {
    lower: true,
    strict: true,
    trim: true,
  });
  
  // Check if slug exists
  const existingCampaign = await storage.getCampaignBySlug(slug);
  
  // If exists, append a random suffix
  if (existingCampaign) {
    const randomSuffix = Math.floor(Math.random() * 10000);
    slug = `${slug}-${randomSuffix}`;
  }
  
  return slug;
}
