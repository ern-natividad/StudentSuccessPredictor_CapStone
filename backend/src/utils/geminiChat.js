/**
 * Converts frontend chat messages into Gemini-compatible history.
 * Gemini requires the first history entry to have role "user".
 */
export const formatGeminiHistory = (history = []) => {
  const formatted = history
    .filter((message) => String(message?.text || "").trim())
    .map((message) => ({
      role:
        message.sender === "user" || message.role === "user" ? "user" : "model",
      parts: [{ text: String(message.text).trim() }],
    }));

  while (formatted.length > 0 && formatted[0].role !== "user") {
    formatted.shift();
  }

  // The active user prompt is sent via sendMessage(), not history.
  if (formatted.length > 0 && formatted[formatted.length - 1].role === "user") {
    formatted.pop();
  }

  return formatted;
};
