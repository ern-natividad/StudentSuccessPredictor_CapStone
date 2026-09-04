const REFUSAL_REPLY =
  "I'm not able to help with that request. I can only provide academic advising based on your profile, grades, and study planning.";

const ASSIGNMENT_REFUSAL_REPLY =
  "No, I can't do your assignment for you. I can help you understand concepts, break down topics, and plan how to approach your work instead.";

const OUT_OF_SCOPE_REPLY =
  "I can't answer that. I'm here to help with academic advising — your grades, risk level, study plans, and course strategies.";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isAssignmentHelpRequest = (message) => {
  const normalized = String(message || "").toLowerCase();
  return (
    /\b(do my|complete my|finish my|write my|solve my)\b/.test(normalized) &&
    /\b(assignment|homework|exam|quiz|test|problem set|project)\b/.test(normalized)
  );
};

const isBlockedCandidate = (finishReason) =>
  ["SAFETY", "RECITATION", "BLOCKLIST", "PROHIBITED_CONTENT", "SPII"].includes(
    finishReason,
  );

const formatMetric = (value, digits = 2) => {
  if (value === null || value === undefined || value === "") return "—";
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric.toFixed(digits) : String(value);
};

export const isModelUnavailableError = (error) => {
  const message = (error?.message || "").toLowerCase();
  const status = error?.status || error?.statusCode;

  return (
    status === 404 ||
    message.includes("not found") ||
    message.includes("not supported") ||
    message.includes("unknown model") ||
    message.includes("invalid model") ||
    message.includes("no longer available") ||
    message.includes("is not available")
  );
};

export const isGeminiServiceError = (error) => {
  const message = (error?.message || "").toLowerCase();
  const status = error?.status || error?.statusCode;

  if (isModelUnavailableError(error)) return false;

  if (status === 429 || status === 503 || status === 500 || status === 502) {
    return true;
  }

  return (
    message.includes("fetch failed") ||
    message.includes("econnrefused") ||
    message.includes("enotfound") ||
    message.includes("socket hang up") ||
    message.includes("quota exceeded") ||
    message.includes("rate limit") ||
    message.includes("high demand") ||
    message.includes("try again later") ||
    message.includes("service unavailable") ||
    message.includes("temporarily unavailable") ||
    message.includes("api key not valid") ||
    message.includes("invalid api key")
  );
};

/** Overload / model-missing — safe to try another model or retry. */
export const shouldFallbackGeminiModel = (error) =>
  isModelUnavailableError(error) || isGeminiServiceError(error);

export const resolveAdvisingReply = (message, result) => {
  if (isAssignmentHelpRequest(message)) {
    return ASSIGNMENT_REFUSAL_REPLY;
  }

  const response = result?.response;
  if (!response) {
    return OUT_OF_SCOPE_REPLY;
  }

  if (response.promptFeedback?.blockReason) {
    return REFUSAL_REPLY;
  }

  const candidate = response.candidates?.[0];
  if (candidate && isBlockedCandidate(candidate.finishReason)) {
    return REFUSAL_REPLY;
  }

  try {
    const text = response.text()?.trim();
    if (text) return text;
  } catch (error) {
    const messageText = (error?.message || "").toLowerCase();
    if (
      messageText.includes("blocked") ||
      messageText.includes("safety") ||
      messageText.includes("prohibited") ||
      messageText.includes("no text")
    ) {
      return REFUSAL_REPLY;
    }
    throw error;
  }

  return OUT_OF_SCOPE_REPLY;
};

/**
 * Snapshot-based reply when Gemini is overloaded or unreachable.
 * Keeps advising usable during demos / defense.
 */
export const buildOfflineAdvisingReply = (
  snapshot = {},
  message = "",
  viewerRole = "student",
) => {
  if (isAssignmentHelpRequest(message)) {
    return ASSIGNMENT_REFUSAL_REPLY;
  }

  const isStudent = viewerRole === "student";
  const your = isStudent ? "your" : "this student's";
  const you = isStudent ? "you" : "the student";
  const risk = snapshot.riskLevel || "Unknown";
  const focus = snapshot.focusAreas || "current coursework and weaker subjects";
  const currentGwa = formatMetric(snapshot.currentGpa);
  const predictedGwa = formatMetric(snapshot.predictedGpa);
  const gradeCount = snapshot.gradeCount ?? snapshot.grades?.length ?? 0;

  return [
    `Here is advising guidance based on ${your} academic snapshot:`,
    "",
    `- Risk level: **${risk}**`,
    `- Current GWA: **${currentGwa}** | Predicted GWA: **${predictedGwa}**`,
    `- Grades on record: **${gradeCount}**`,
    `- Focus areas: ${focus}`,
    "",
    "Recommended next steps:",
    `1. Prioritize subjects tied to the focus areas above and review recent assessments.`,
    `2. Schedule 4–6 focused study hours this week, with short reviews after each class.`,
    `3. If risk is Medium or High, meet a human academic adviser to adjust course load and support.`,
    `4. Track attendance, deadlines, and incomplete grades over the next two weeks.`,
    "",
    `Ask about a specific subject, weekly schedule, or risk-reduction plan if ${you} want a more detailed follow-up.`,
  ].join("\n");
};

/** Prefer configured model, then proven Flash fallbacks for this API key. */
export const buildGeminiModelCandidates = (preferredModel) => {
  const preferred = String(preferredModel || "").trim();
  const fallbacks = [
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-3-flash-preview",
    "gemini-3.8-flash",
    "gemini-3.7-flash",
  ];

  return [...new Set([preferred, ...fallbacks].filter(Boolean))];
};

/**
 * Try preferred Gemini model, then fallbacks on overload / unavailable models.
 */
export const sendAdvisingChatMessage = async ({
  genAI,
  preferredModel,
  systemInstruction,
  history,
  message,
  maxAttemptsPerModel = 2,
}) => {
  const candidates = buildGeminiModelCandidates(preferredModel);
  let lastError = null;

  for (let modelIndex = 0; modelIndex < candidates.length; modelIndex += 1) {
    const modelName = candidates[modelIndex];

    for (let attempt = 1; attempt <= maxAttemptsPerModel; attempt += 1) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction,
        });
        const chat = model.startChat({ history });
        const result = await chat.sendMessage(message);
        return { result, modelName };
      } catch (error) {
        lastError = error;
        const unavailable = isModelUnavailableError(error);
        const canFallback = shouldFallbackGeminiModel(error);
        const hasMoreAttempts = attempt < maxAttemptsPerModel;
        const hasMoreModels = modelIndex < candidates.length - 1;

        // 404 / invalid model: skip retries and move on immediately.
        if (unavailable && hasMoreModels) {
          console.warn(
            `[advising] Model "${modelName}" not available; trying next fallback.`,
          );
          break;
        }

        if (canFallback && hasMoreAttempts && !unavailable) {
          console.warn(
            `[advising] Model "${modelName}" attempt ${attempt} failed (${error?.status || error?.message}); retrying...`,
          );
          await sleep(350 * attempt);
          continue;
        }

        if (canFallback && hasMoreModels) {
          console.warn(
            `[advising] Model "${modelName}" unavailable/overloaded; trying next fallback.`,
          );
          break;
        }

        throw error;
      }
    }
  }

  throw lastError || new Error("No Gemini model candidates available.");
};
