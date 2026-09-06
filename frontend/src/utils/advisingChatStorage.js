const STORAGE_PREFIX = "hawks.advisingChat.v1.";

export const getAdvisingChatStorageKey = (userId, contextKey) =>
  `${STORAGE_PREFIX}${userId || "anon"}.${contextKey || "default"}`;

const sanitizeMessages = (messages) => {
  if (!Array.isArray(messages)) return null;

  const cleaned = messages
    .filter(
      (message) =>
        message &&
        (message.sender === "user" || message.sender === "bot") &&
        String(message.text || "").trim(),
    )
    .map((message) => ({
      id: message.id ?? Date.now(),
      sender: message.sender,
      text: String(message.text),
    }));

  return cleaned.length > 0 ? cleaned : null;
};

export const loadAdvisingChat = (userId, contextKey) => {
  try {
    const raw = sessionStorage.getItem(
      getAdvisingChatStorageKey(userId, contextKey),
    );
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    return sanitizeMessages(parsed?.messages);
  } catch {
    return null;
  }
};

export const saveAdvisingChat = (userId, contextKey, messages) => {
  try {
    const cleaned = sanitizeMessages(messages);
    if (!cleaned) return;

    sessionStorage.setItem(
      getAdvisingChatStorageKey(userId, contextKey),
      JSON.stringify({
        messages: cleaned,
        updatedAt: Date.now(),
      }),
    );
  } catch {
    // Ignore quota / private-mode write failures.
  }
};
