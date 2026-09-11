import { supabase } from "../config/supabaseClient.js";
import { HttpError } from "../middleware/errorHandler.js";

const ANNOUNCEMENT_SELECT =
  "id, title, content, image_url, action_link, is_active, created_by, created_at, updated_at";

const getActorId = (req) => req.user?.sub || req.user?.id;

const normalizeOptionalText = (value) => {
  const trimmed = String(value ?? "").trim();
  return trimmed || null;
};

const validatePayload = ({ title, content }, { partial = false } = {}) => {
  if (!partial || title !== undefined) {
    if (!String(title || "").trim()) {
      throw new HttpError(400, "Title is required.");
    }
  }
  if (!partial || content !== undefined) {
    if (!String(content || "").trim()) {
      throw new HttpError(400, "Content is required.");
    }
  }
};

/** Public: latest active announcements for the Home page. */
export const listActiveAnnouncements = async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 5, 20);

  const { data, error } = await supabase
    .from("news_announcements")
    .select(ANNOUNCEMENT_SELECT)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  res.status(200).json({ announcements: data || [] });
};

/** Admin: all announcements (active + inactive). */
export const listAnnouncements = async (_req, res) => {
  const { data, error } = await supabase
    .from("news_announcements")
    .select(ANNOUNCEMENT_SELECT)
    .order("created_at", { ascending: false });

  if (error) throw error;

  res.status(200).json({ announcements: data || [] });
};

export const createAnnouncement = async (req, res) => {
  const actorId = getActorId(req);
  const {
    title,
    content,
    imageUrl = null,
    actionLink = null,
    isActive = true,
  } = req.body || {};

  validatePayload({ title, content });

  const { data, error } = await supabase
    .from("news_announcements")
    .insert({
      title: String(title).trim(),
      content: String(content).trim(),
      image_url: normalizeOptionalText(imageUrl),
      action_link: normalizeOptionalText(actionLink),
      is_active: Boolean(isActive),
      created_by: actorId || null,
    })
    .select(ANNOUNCEMENT_SELECT)
    .single();

  if (error) throw error;

  res.status(201).json({ announcement: data });
};

export const updateAnnouncement = async (req, res) => {
  const { id } = req.params;
  if (!id) throw new HttpError(400, "Announcement id is required.");

  const {
    title,
    content,
    imageUrl,
    actionLink,
    isActive,
  } = req.body || {};

  validatePayload({ title, content }, { partial: true });

  const patch = { updated_at: new Date().toISOString() };
  if (title !== undefined) patch.title = String(title).trim();
  if (content !== undefined) patch.content = String(content).trim();
  if (imageUrl !== undefined) patch.image_url = normalizeOptionalText(imageUrl);
  if (actionLink !== undefined) {
    patch.action_link = normalizeOptionalText(actionLink);
  }
  if (isActive !== undefined) patch.is_active = Boolean(isActive);

  const { data, error } = await supabase
    .from("news_announcements")
    .update(patch)
    .eq("id", id)
    .select(ANNOUNCEMENT_SELECT)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new HttpError(404, "Announcement not found.");

  res.status(200).json({ announcement: data });
};

export const deleteAnnouncement = async (req, res) => {
  const { id } = req.params;
  if (!id) throw new HttpError(400, "Announcement id is required.");

  const { data, error } = await supabase
    .from("news_announcements")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new HttpError(404, "Announcement not found.");

  res.status(200).json({ success: true, id: data.id });
};
