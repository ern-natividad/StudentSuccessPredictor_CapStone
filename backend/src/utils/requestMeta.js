export const getRequestMeta = (req) => {
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "unknown";
  const browser = req.headers["user-agent"] || "unknown";
  return { ip, browser };
};
