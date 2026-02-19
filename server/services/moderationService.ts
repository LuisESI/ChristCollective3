import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export interface ModerationResult {
  decision: "approved" | "flagged" | "rejected";
  flagCategories: string[];
  confidenceScores: Record<string, number>;
}

export async function moderateText(text: string): Promise<ModerationResult> {
  try {
    const response = await openai.moderations.create({
      input: text,
    });

    const result = response.results[0];
    if (!result) {
      return { decision: "approved", flagCategories: [], confidenceScores: {} };
    }

    const flagCategories: string[] = [];
    const confidenceScores: Record<string, number> = {};
    let maxScore = 0;

    for (const [category, score] of Object.entries(result.category_scores)) {
      confidenceScores[category] = score;
      if (score > maxScore) maxScore = score;
      if (score >= 0.60) {
        flagCategories.push(category);
      }
    }

    let decision: "approved" | "flagged" | "rejected" = "approved";
    if (maxScore >= 0.85 || result.flagged) {
      decision = "rejected";
    } else if (maxScore >= 0.60) {
      decision = "flagged";
    }

    return { decision, flagCategories, confidenceScores };
  } catch (error) {
    console.error("Text moderation error:", error);
    return { decision: "approved", flagCategories: [], confidenceScores: {} };
  }
}

export async function moderateImage(imageUrl: string): Promise<ModerationResult> {
  try {
    let fullUrl = imageUrl;
    if (imageUrl.startsWith("/")) {
      const domain = process.env.REPLIT_DOMAINS?.split(",")[0] || "localhost:5000";
      const protocol = domain.includes("localhost") ? "http" : "https";
      fullUrl = `${protocol}://${domain}${imageUrl}`;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a content moderation system. Analyze images for inappropriate content.
Respond ONLY with a JSON object in this exact format:
{"safe": true/false, "categories": ["category1"], "severity": "none|low|medium|high", "reason": "brief explanation"}
Categories to check: violence, sexual, hate, self-harm, drugs, weapons, graphic-content.
If the image is safe, return {"safe": true, "categories": [], "severity": "none", "reason": "Image is appropriate"}`
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: fullUrl },
            },
            {
              type: "text",
              text: "Analyze this image for content moderation. Is it safe for a Christian community platform?"
            }
          ],
        }
      ],
      max_tokens: 200,
    });

    const content = response.choices[0]?.message?.content || "";
    try {
      const parsed = JSON.parse(content);
      const severityScores: Record<string, number> = {
        "none": 0,
        "low": 0.3,
        "medium": 0.7,
        "high": 0.95,
      };

      const score = severityScores[parsed.severity] || 0;
      const confidenceScores: Record<string, number> = {};
      for (const cat of (parsed.categories || [])) {
        confidenceScores[cat] = score;
      }

      let decision: "approved" | "flagged" | "rejected" = "approved";
      if (score >= 0.85) {
        decision = "rejected";
      } else if (score >= 0.60) {
        decision = "flagged";
      }

      return {
        decision,
        flagCategories: parsed.categories || [],
        confidenceScores,
      };
    } catch {
      return { decision: "approved", flagCategories: [], confidenceScores: {} };
    }
  } catch (error) {
    console.error("Image moderation error:", error);
    return { decision: "approved", flagCategories: [], confidenceScores: {} };
  }
}

export async function moderateContent(params: {
  text?: string;
  imageUrls?: string[];
}): Promise<ModerationResult> {
  const results: ModerationResult[] = [];

  if (params.text) {
    results.push(await moderateText(params.text));
  }

  if (params.imageUrls && params.imageUrls.length > 0) {
    for (const url of params.imageUrls) {
      if (url && url.trim()) {
        results.push(await moderateImage(url));
      }
    }
  }

  if (results.length === 0) {
    return { decision: "approved", flagCategories: [], confidenceScores: {} };
  }

  const allCategories = new Set<string>();
  const mergedScores: Record<string, number> = {};
  let worstDecision: "approved" | "flagged" | "rejected" = "approved";

  for (const result of results) {
    for (const cat of result.flagCategories) {
      allCategories.add(cat);
    }
    for (const [key, score] of Object.entries(result.confidenceScores)) {
      mergedScores[key] = Math.max(mergedScores[key] || 0, score);
    }
    if (result.decision === "rejected") {
      worstDecision = "rejected";
    } else if (result.decision === "flagged" && worstDecision !== "rejected") {
      worstDecision = "flagged";
    }
  }

  return {
    decision: worstDecision,
    flagCategories: Array.from(allCategories),
    confidenceScores: mergedScores,
  };
}
