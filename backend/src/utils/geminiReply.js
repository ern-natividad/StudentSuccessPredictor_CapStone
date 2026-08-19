const REFUSAL_REPLY =
  "I'm not able to help with that request. I can only provide academic advising based on your profile, grades, and study planning.";

const ASSIGNMENT_REFUSAL_REPLY =
  "No, I can't do your assignment for you. I can help you understand concepts, break down topics, and plan how to approach your work instead.";

const OUT_OF_SCOPE_REPLY =
  "I can't answer that. I'm here to help with academic advising — your grades, risk level, study plans, and course strategies.";

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

export const isGeminiServiceError = (error) => {
  const message = (error?.message || "").toLowerCase();
  const status = error?.status || error?.statusCode;

  if (status === 429 || status === 503 || status === 500) return true;

  return (
    message.includes("fetch failed") ||
    message.includes("econnrefused") ||
    message.includes("enotfound") ||
    message.includes("socket hang up") ||
    message.includes("quota exceeded") ||
    message.includes("rate limit") ||
    message.includes("api key not valid") ||
    message.includes("invalid api key") ||
    message.includes("service unavailable")
  );
};

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
