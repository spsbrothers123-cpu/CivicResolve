import "server-only";
import { GoogleGenAI } from "@google/genai";
import { aiAnalysisSchema } from "../validations/issue";
import { AIAnalysis, IssueCategory, IssuePriority, IssueSeverity, MunicipalDepartment } from "@/types";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";

export interface AnalyzeIssueInput {
  title: string;
  description: string;
  category?: string;
  location_text?: string;
  imageBase64?: string;
  imageMimeType?: string;
  imagePath?: string;
  supabaseClient?: SupabaseClient<Database>;
  timeoutMs?: number;
}

export interface AnalyzeIssueResult {
  analysis: AIAnalysis;
  provider: "gemini" | "deterministic_fallback";
  modelName?: string;
  error?: string;
}

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

export const GEMINI_SYSTEM_INSTRUCTION = `You are CivicResolve Intelligence, an advisory municipal engineering and civic triage AI.
Your mission is to analyze citizen-reported municipal complaints (title, description, and optional evidence photo) and generate structured, actionable recommendations for city administrators.

CRITICAL MUNICIPAL TRIAGE GUIDELINES:
1. ADVISORY ROLE ONLY: Your analysis is advisory. Administrators maintain final authority. Never assume authority over municipal decisions.
2. STRICT OBJECTIVITY: Base your recommendations ONLY on the provided title, description, and visual evidence. Never invent locations, injuries, witnesses, or damage not indicated by the citizen.
3. CONSERVATIVE SEVERITY: Do not exaggerate minor inconveniences. Reserve "Critical" strictly for imminent threats to human life or major infrastructural collapse (e.g. exposed live high-voltage wiring, gaping uncovered deep manholes on active roads, bursting mains causing sinkholes).
4. PRECISE MUNICIPAL DEPARTMENTS:
   - "Roads": Potholes, damaged pavement, collapsed dividers, broken curbs.
   - "Sanitation": Garbage accumulation, overflowing dumpsters, dead animal carcasses, street sweeping.
   - "Electricity": Broken streetlights, hanging/sparking wires, dark dangerous intersections.
   - "Water Supply": Clean water pipeline bursts, leaking municipal distribution valves, water wastage.
   - "Drainage": Clogged storm drains, overflowing sewage lines, missing manhole covers, stagnant rainwater.
   - "Other": Encroachment, park maintenance, noise, general municipal issues.

5. EXACT OUTPUT FORMAT:
You must respond ONLY with a raw JSON object matching this schema:
{
  "category": "Pothole" | "Road Damage" | "Garbage" | "Streetlight" | "Water Leakage" | "Drainage" | "Other",
  "severity": "Critical" | "High" | "Medium" | "Low",
  "priority": "Critical" | "High" | "Medium" | "Low",
  "department": "Roads" | "Sanitation" | "Electricity" | "Water Supply" | "Drainage" | "Other",
  "summary": "Concise 1-2 sentence municipal summary of the problem (max 30 words).",
  "recommended_action": "Specific field operational directive (e.g. 'Deploy asphalt cold-patch team within 24 hours').",
  "public_safety_risk": "Clear explanation of any identified risk to pedestrians, motorists, or public health.",
  "confidence": number between 0.00 and 1.00 reflecting classification certainty,
  "needs_human_review": boolean (set true if evidence is ambiguous, severe hazard is suspected, or confidence is below 0.75),
  "reasoning": "Clear municipal assessment explaining why this category, severity, and department were recommended."
}

Do NOT wrap the output in markdown codeblocks (no \`\`\`json). Output pure JSON.`;

/**
 * Normalizes AI triage output into canonical CivicResolve enums.
 * Reconciles common municipal synonyms (e.g. Urgent -> Critical, Electrical -> Electricity, Stormwater -> Drainage, General -> Other).
 * Preserves unrecognized values so Zod can reject invalid schemas cleanly.
 */
export function normalizeAiTriagePayload(parsed: any): any {
  if (!parsed || typeof parsed !== "object") return parsed;
  const normalized = { ...parsed };

  // 1. Normalize Category
  if (typeof normalized.category === "string") {
    const c = normalized.category.trim().toLowerCase();
    if (c === "pothole" || c === "potholes") normalized.category = "Pothole";
    else if (c === "road damage" || c === "road" || c === "roads") normalized.category = "Road Damage";
    else if (c === "garbage" || c === "trash" || c === "waste" || c === "solid waste") normalized.category = "Garbage";
    else if (c === "streetlight" || c === "street light" || c === "lighting" || c === "streetlights") normalized.category = "Streetlight";
    else if (c === "water leakage" || c === "water leak" || c === "pipeline") normalized.category = "Water Leakage";
    else if (c === "drainage" || c === "stormwater" || c === "sewage" || c === "sewer") normalized.category = "Drainage";
    else if (c === "other") normalized.category = "Other";
  }

  // 2. Normalize Severity (Canonical: Critical, High, Medium, Low)
  if (typeof normalized.severity === "string") {
    const s = normalized.severity.trim().toLowerCase();
    if (s === "critical" || s === "urgent" || s === "emergency") normalized.severity = "Critical";
    else if (s === "high") normalized.severity = "High";
    else if (s === "medium" || s === "moderate") normalized.severity = "Medium";
    else if (s === "low") normalized.severity = "Low";
  }

  // 3. Normalize Priority (Canonical: Critical, High, Medium, Low - NO 'Urgent')
  if (typeof normalized.priority === "string") {
    const p = normalized.priority.trim().toLowerCase();
    if (p === "urgent" || p === "critical" || p === "emergency") normalized.priority = "Critical";
    else if (p === "high") normalized.priority = "High";
    else if (p === "medium" || p === "moderate") normalized.priority = "Medium";
    else if (p === "low") normalized.priority = "Low";
  }

  // 4. Normalize Department (Canonical: Roads, Sanitation, Electricity, Water Supply, Drainage, Other)
  if (typeof normalized.department === "string") {
    const d = normalized.department.trim().toLowerCase();
    if (d === "electrical" || d === "electricity" || d === "power") normalized.department = "Electricity";
    else if (d === "stormwater" || d === "drainage" || d === "sewage") normalized.department = "Drainage";
    else if (d === "general" || d === "other" || d === "administration") normalized.department = "Other";
    else if (d === "roads" || d === "road" || d === "public works") normalized.department = "Roads";
    else if (d === "sanitation" || d === "waste management" || d === "cleaning") normalized.department = "Sanitation";
    else if (d === "water supply" || d === "water" || d === "water works") normalized.department = "Water Supply";
  }

  // 5. Ensure needs_human_review is resolved
  if (normalized.needs_human_review === undefined && normalized.requires_human_review !== undefined) {
    normalized.needs_human_review = normalized.requires_human_review;
  }

  return normalized;
}

/**
 * Deterministic rule-based civic classifier for graceful fallback, offline testing, or missing API keys.
 */
export function getDeterministicAnalysis(input: {
  title: string;
  description: string;
  category?: string;
}): AIAnalysis {
  const combined = `${input.title} ${input.description} ${input.category || ""}`.toLowerCase();

  let category: IssueCategory = "Other";
  let department: MunicipalDepartment = "Other";
  let severity: IssueSeverity = "Medium";
  let priority: IssuePriority = "Medium";
  let safetyRisk = "Standard municipal issue; no immediate threat to life or safety detected.";
  let action = "Dispatch field inspection team for verification and schedule repair.";
  let reasoning = "Standard civic complaint registered for municipal assessment.";
  let confidence = 0.88;
  let needsReview = false;

  if (combined.includes("pothole") || combined.includes("crater") || combined.includes("road hole")) {
    category = "Pothole";
    department = "Roads";
    if (combined.includes("deep") || combined.includes("accident") || combined.includes("busy") || combined.includes("main road")) {
      severity = "High";
      priority = "High";
      safetyRisk = "Deep roadway crater on active traffic corridor poses imminent vehicle damage and cyclist accident risk.";
      action = "Deploy rapid asphalt cold-patch crew within 24 hours and place temporary warning bollards.";
      reasoning = "Deep road cavity on active roadway poses imminent vehicular accident hazard.";
      confidence = 0.94;
    } else {
      severity = "Medium";
      priority = "Medium";
      safetyRisk = "Minor roadway depression causing localized traffic slowdown and cycling hazard.";
      action = "Schedule asphalt patching in next regular road maintenance cycle.";
      reasoning = "Pothole detected on secondary street; moderate risk to vehicles.";
      confidence = 0.91;
    }
  } else if (combined.includes("garbage") || combined.includes("trash") || combined.includes("waste") || combined.includes("dump")) {
    category = "Garbage";
    department = "Sanitation";
    if (combined.includes("overflow") || combined.includes("smell") || combined.includes("rot") || combined.includes("days")) {
      severity = "High";
      priority = "Medium";
      safetyRisk = "Uncollected rotting waste invites vermin vectors and presents disease transmission risks to residents.";
      action = "Dispatch compactor sanitation truck and perform site lime disinfection.";
      reasoning = "Overflowing waste bin creates public health hazard and pest breeding risk.";
      confidence = 0.93;
    } else {
      severity = "Low";
      priority = "Low";
      safetyRisk = "Aesthetic nuisance and minor street litter; low immediate public health hazard.";
      action = "Schedule routine solid waste collection on next municipal route.";
      reasoning = "Accumulated solid waste scheduled for routine collection route.";
      confidence = 0.89;
    }
  } else if (combined.includes("light") || combined.includes("dark") || combined.includes("lamp") || combined.includes("wire") || combined.includes("spark")) {
    category = "Streetlight";
    department = "Electricity";
    if (combined.includes("wire") || combined.includes("spark") || combined.includes("hanging") || combined.includes("shock")) {
      severity = "Critical";
      priority = "Critical";
      safetyRisk = "Exposed or sparking electrical wiring poses severe, life-threatening electrocution risk to pedestrians.";
      action = "Immediately de-energize circuit and dispatch emergency electrical repairs unit.";
      reasoning = "Exposed wiring or fallen fixture presents critical electrocution hazard requiring emergency intervention.";
      confidence = 0.97;
      needsReview = true;
    } else {
      severity = "Medium";
      priority = "Medium";
      safetyRisk = "Darkened road segment compromises nighttime visibility and increases pedestrian safety risk.";
      action = "Replace defective luminaire / driver within 48 hours.";
      reasoning = "Non-functional streetlight on public roadway reducing nighttime safety.";
      confidence = 0.92;
    }
  } else if (combined.includes("water leak") || combined.includes("pipe") || combined.includes("burst") || combined.includes("drinking water")) {
    category = "Water Leakage";
    department = "Water Supply";
    if (combined.includes("burst") || combined.includes("gushing") || combined.includes("flooding")) {
      severity = "Critical";
      priority = "High";
      safetyRisk = "High-pressure water main rupture causing severe roadway undermining and potable water loss.";
      action = "Isolate pressure control valve and deploy emergency pipeline repair team.";
      reasoning = "Pressurized water main rupture leading to severe resource loss and road erosion.";
      confidence = 0.95;
      needsReview = true;
    } else {
      severity = "Medium";
      priority = "Medium";
      safetyRisk = "Low-pressure leakage causing water wastage and potential road foundation softening.";
      action = "Inspect pipeline joint and replace compromised valve seal.";
      reasoning = "Continuous potable water loss detected; repairs needed to prevent road weakening.";
      confidence = 0.90;
    }
  } else if (combined.includes("drain") || combined.includes("sewer") || combined.includes("manhole") || combined.includes("clog")) {
    category = "Drainage";
    department = "Drainage";
    if (combined.includes("open") || combined.includes("missing cover") || combined.includes("fall")) {
      severity = "Critical";
      priority = "Critical";
      safetyRisk = "Uncovered open manhole chamber poses fatal fall hazard for pedestrians, children, and two-wheelers.";
      action = "Erect emergency hazard perimeter barrier and install certified replacement ductile iron manhole cover immediately.";
      reasoning = "Missing manhole cover poses extreme life-safety risk for pedestrians and two-wheelers.";
      confidence = 0.98;
      needsReview = true;
    } else {
      severity = "High";
      priority = "High";
      safetyRisk = "Clogged drainage channel risks urban flash-flooding and stagnant sewage backflow into homes.";
      action = "Deploy super-sucker de-silting jet machine to clear blocked stormwater conduit.";
      reasoning = "Severely blocked drain liable to cause urban waterlogging during rainfall.";
      confidence = 0.92;
    }
  } else if (combined.includes("road") || combined.includes("asphalt") || combined.includes("crack")) {
    category = "Road Damage";
    department = "Roads";
    severity = "Medium";
    priority = "Medium";
    safetyRisk = "Deteriorated surface causes vehicle wear and braking instability.";
    action = "Schedule asphalt surface milling and resurfacing.";
    reasoning = "Surface deterioration observed requiring civil engineering remediation.";
    confidence = 0.88;
  }

  const summary = `${category} issue reported at municipal site: ${input.title.slice(0, 60)}`;

  return {
    category,
    severity,
    priority,
    department,
    summary,
    recommended_action: action,
    public_safety_risk: safetyRisk,
    confidence,
    needs_human_review: needsReview || severity === "Critical",
    reasoning,
    requires_human_review: needsReview || severity === "Critical",
    analyzed_at: new Date().toISOString(),
    provider: "deterministic_fallback",
  };
}

/**
 * Server-only Gemini AI complaint analyzer.
 * Uses official @google/genai SDK with strict structured JSON output and fallback resilience.
 */
export async function analyzeCivicIssue(input: AnalyzeIssueInput): Promise<AnalyzeIssueResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  const configuredModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  // Check if API key is present and not a placeholder
  if (!apiKey || apiKey.trim() === "" || apiKey === "your_gemini_api_key_here") {
    return {
      analysis: getDeterministicAnalysis(input),
      provider: "deterministic_fallback",
      modelName: "deterministic_engine",
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    // Handle evidence image if provided
    let imagePart: { inlineData: { mimeType: string; data: string } } | null = null;

    if (input.imageBase64 && input.imageMimeType) {
      if (!ALLOWED_MIME_TYPES.includes(input.imageMimeType)) {
        throw new Error(`Unsupported image MIME type: ${input.imageMimeType}`);
      }
      imagePart = {
        inlineData: {
          mimeType: input.imageMimeType,
          data: input.imageBase64,
        },
      };
    } else if (input.imagePath && input.supabaseClient) {
      try {
        const { data: fileData, error: downloadError } = await input.supabaseClient.storage
          .from("civic-evidence")
          .download(input.imagePath);

        if (!downloadError && fileData) {
          const arrayBuffer = await fileData.arrayBuffer();
          if (arrayBuffer.byteLength <= MAX_IMAGE_BYTES) {
            const buffer = Buffer.from(arrayBuffer);
            const mimeType = fileData.type || "image/jpeg";
            if (ALLOWED_MIME_TYPES.includes(mimeType)) {
              imagePart = {
                inlineData: {
                  mimeType,
                  data: buffer.toString("base64"),
                },
              };
            }
          }
        }
      } catch (imgErr) {
        console.warn("Failed to download or attach evidence image for AI analysis:", imgErr);
      }
    }

    const promptText = `Analyze this civic complaint for municipal triage:
Complaint Title: ${input.title}
Complaint Description: ${input.description}
${input.location_text ? `Reported Location: ${input.location_text}` : ""}
${input.category ? `Citizen Suggested Category: ${input.category}` : ""}`;

    const contents: any[] = [{ text: promptText }];
    if (imagePart) {
      contents.push(imagePart);
    }

    // Call Gemini with timeout protection and AbortController request cancellation
    const timeoutMs = input.timeoutMs || 15000;
    const abortController = new AbortController();
    let timeoutId: NodeJS.Timeout | undefined;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        abortController.abort(new Error(`Gemini AI request timed out after ${timeoutMs}ms`));
        reject(new Error(`Gemini AI request timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    // Handle model availability with graceful modern candidate fallback if configured model is retired
    const candidateModels = Array.from(
      new Set([configuredModel, "gemini-3.5-flash-lite", "gemini-3.8-flash"].filter(Boolean))
    );

    let response: any;
    let successfulModel = configuredModel;
    let lastError: any = null;
    const startTime = Date.now();

    try {
      for (const modelCandidate of candidateModels) {
        // Enforce shared total timeout budget across all candidate fallback models
        const elapsed = Date.now() - startTime;
        const remainingMs = timeoutMs - elapsed;
        if (remainingMs <= 0 || abortController.signal.aborted) {
          throw new Error(`Gemini AI request timed out after ${timeoutMs}ms`);
        }

        try {
          const generatePromise = ai.models.generateContent({
            model: modelCandidate,
            contents,
            config: {
              systemInstruction: GEMINI_SYSTEM_INSTRUCTION,
              responseMimeType: "application/json",
              temperature: 0.1, // low temperature for consistent municipal assessment
              abortSignal: abortController.signal,
              httpOptions: { timeout: remainingMs },
            },
          });

          response = await Promise.race([generatePromise, timeoutPromise]);
          if (response?.text) {
            successfulModel = modelCandidate;
            break;
          }
        } catch (candidateErr: any) {
          lastError = candidateErr;
          // If the model was retired / 404 NOT_FOUND, attempt modern fallback model within shared budget
          const isModelNotFound =
            candidateErr?.status === 404 ||
            candidateErr?.message?.includes("is no longer available") ||
            candidateErr?.message?.includes("not found");
          if (!isModelNotFound || abortController.signal.aborted) {
            throw candidateErr;
          }
          console.warn(`[CivicResolve AI] Model ${modelCandidate} returned 404/retired. Attempting modern candidate model.`);
        }
      }

      if (!response && lastError) {
        throw lastError;
      }
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
    const rawText = response.text || "";

    // Strip any markdown fences if present
    const cleanJson = rawText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let parsed: any;
    try {
      parsed = JSON.parse(cleanJson);
    } catch (parseError) {
      throw new Error(`Gemini response is not valid JSON: ${rawText.slice(0, 100)}...`);
    }

    // Normalize near-misses and synonyms into canonical enums
    const normalized = normalizeAiTriagePayload(parsed);

    // Validate with Zod
    const validated = aiAnalysisSchema.parse(normalized);

    const finalAnalysis: AIAnalysis = {
      category: validated.category,
      severity: validated.severity,
      priority: validated.priority,
      department: validated.department,
      summary: validated.summary,
      recommended_action: validated.recommended_action,
      public_safety_risk: validated.public_safety_risk,
      confidence: validated.confidence,
      needs_human_review: validated.needs_human_review,
      reasoning: validated.reasoning,
      requires_human_review: validated.needs_human_review,
      analyzed_at: new Date().toISOString(),
      provider: "gemini",
      model: successfulModel,
    };

    return {
      analysis: finalAnalysis,
      provider: "gemini",
      modelName: successfulModel,
    };
  } catch (error: any) {
    console.warn(`[CivicResolve AI] Gemini analysis encountered an issue (${error.message}). Gracefully engaging deterministic civic classifier.`);

    return {
      analysis: getDeterministicAnalysis(input),
      provider: "deterministic_fallback",
      modelName: configuredModel,
      error: error.message,
    };
  }
}
