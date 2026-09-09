import { supabase } from "../config/supabaseClient.js";
import { HttpError } from "../middleware/errorHandler.js";

const INTERVENTION_SELECT = `
  id,
  student_user_id,
  student_info_id,
  student_id,
  student_name,
  risk_level,
  severity,
  status,
  escalated_by,
  escalated_at,
  acknowledged_by,
  acknowledged_at,
  latest_note,
  created_at,
  updated_at
`;

const PROGRESS_STATUSES = new Set(["monitoring", "improving", "resolved"]);

const getActorId = (req) => req.user?.sub || req.user?.id;

const normalizeSeverity = (value) => {
  const raw = String(value || "").trim().toLowerCase();
  if (["low", "medium", "high", "critical"].includes(raw)) return raw;
  return "low";
};

const normalizeRiskLevel = (value) => {
  const raw = String(value || "").trim().toLowerCase();
  if (raw === "critical") return "Critical";
  if (raw === "high") return "High";
  if (raw === "medium") return "Medium";
  return "Low";
};

const insertEvent = async ({
  interventionId,
  actorUserId,
  eventType,
  status,
  note = null,
}) => {
  const { error } = await supabase.from("alert_intervention_events").insert({
    intervention_id: interventionId,
    actor_user_id: actorUserId,
    event_type: eventType,
    status,
    note,
  });
  if (error) throw error;
};

const notifyAllAdmins = async ({ interventionId, title, body }) => {
  const { data: admins, error } = await supabase
    .from("users")
    .select("id, role")
    .eq("role", "admin");
  if (error) throw error;

  const adminRows = (admins || []).filter((row) => row?.id);
  if (!adminRows.length) {
    console.error(
      "[alerts] escalate: no users with role=admin were found; skipping admin_notifications insert",
    );
    return 0;
  }

  const rows = adminRows.map((admin) => ({
    admin_user_id: admin.id,
    intervention_id: interventionId,
    title,
    body,
    is_read: false,
  }));

  const { data: inserted, error: insertError } = await supabase
    .from("admin_notifications")
    .insert(rows)
    .select("id");
  if (insertError) throw insertError;

  return inserted?.length || 0;
};

/** Self-heal: ensure each admin has a bell row for every pending escalation. */
const ensurePendingAdminNotifications = async (adminUserId) => {
  if (!adminUserId) return;

  const { data: pending, error: pendingError } = await supabase
    .from("alert_interventions")
    .select("id, student_name, risk_level")
    .eq("status", "pending_admin");
  if (pendingError) throw pendingError;
  if (!pending?.length) return;

  const pendingIds = pending.map((row) => row.id);
  const { data: existing, error: existingError } = await supabase
    .from("admin_notifications")
    .select("intervention_id")
    .eq("admin_user_id", adminUserId)
    .in("intervention_id", pendingIds);
  if (existingError) throw existingError;

  const alreadyNotified = new Set(
    (existing || []).map((row) => row.intervention_id).filter(Boolean),
  );
  const missing = pending.filter((row) => !alreadyNotified.has(row.id));
  if (!missing.length) return;

  const { error: insertError } = await supabase.from("admin_notifications").insert(
    missing.map((row) => ({
      admin_user_id: adminUserId,
      intervention_id: row.id,
      title: "Early alert escalated",
      body: `${row.student_name || "Student"} was escalated by staff (${row.risk_level || "Medium"} risk). Please acknowledge.`,
      is_read: false,
    })),
  );
  if (insertError) throw insertError;
};

const getInterventionOrThrow = async (id) => {
  const { data, error } = await supabase
    .from("alert_interventions")
    .select(INTERVENTION_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new HttpError(404, "Intervention not found.");
  return data;
};

const loadEventsForInterventions = async (interventionIds) => {
  if (!interventionIds.length) return {};

  const { data, error } = await supabase
    .from("alert_intervention_events")
    .select("id, intervention_id, actor_user_id, event_type, status, note, created_at")
    .in("intervention_id", interventionIds)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const byIntervention = {};
  (data || []).forEach((event) => {
    if (!byIntervention[event.intervention_id]) {
      byIntervention[event.intervention_id] = [];
    }
    byIntervention[event.intervention_id].push(event);
  });
  return byIntervention;
};

export const listInterventions = async (req, res) => {
  const includeResolved = String(req.query.includeResolved || "") === "true";

  let query = supabase
    .from("alert_interventions")
    .select(INTERVENTION_SELECT)
    .order("updated_at", { ascending: false });

  if (!includeResolved) {
    query = query.neq("status", "resolved");
  }

  const { data, error } = await query;
  if (error) throw error;

  const interventions = data || [];
  const eventsById = await loadEventsForInterventions(
    interventions.map((row) => row.id),
  );

  res.status(200).json({
    interventions: interventions.map((row) => ({
      ...row,
      events: (eventsById[row.id] || []).slice(0, 8),
    })),
  });
};

export const escalateAlert = async (req, res) => {
  const actorId = getActorId(req);
  const {
    studentUserId,
    studentInfoId = null,
    studentId = "",
    studentName = "",
    riskLevel = "Low",
    severity = "low",
    note = "",
  } = req.body || {};

  if (!studentUserId) {
    throw new HttpError(400, "studentUserId is required.");
  }

  const { data: student, error: studentError } = await supabase
    .from("users")
    .select("id, full_name, role")
    .eq("id", studentUserId)
    .maybeSingle();
  if (studentError) throw studentError;
  if (!student || student.role !== "student") {
    throw new HttpError(404, "Student account not found.");
  }

  const normalizedRisk = normalizeRiskLevel(riskLevel);
  const normalizedSeverity = normalizeSeverity(severity);
  const displayName = studentName || student.full_name || "Student";
  const now = new Date().toISOString();

  const { data: existing, error: existingError } = await supabase
    .from("alert_interventions")
    .select(INTERVENTION_SELECT)
    .eq("student_user_id", studentUserId)
    .maybeSingle();
  if (existingError) throw existingError;

  let intervention;

  if (existing) {
    if (existing.status !== "resolved" && existing.status !== "pending_admin") {
      throw new HttpError(
        409,
        "This student already has an active intervention case.",
      );
    }

    const { data, error } = await supabase
      .from("alert_interventions")
      .update({
        student_info_id: studentInfoId || existing.student_info_id,
        student_id: studentId || existing.student_id,
        student_name: displayName,
        risk_level: normalizedRisk,
        severity: normalizedSeverity,
        status: "pending_admin",
        escalated_by: actorId,
        escalated_at: now,
        acknowledged_by: null,
        acknowledged_at: null,
        latest_note: note?.trim() || existing.latest_note,
        updated_at: now,
      })
      .eq("id", existing.id)
      .select(INTERVENTION_SELECT)
      .single();
    if (error) throw error;
    intervention = data;
  } else {
    const { data, error } = await supabase
      .from("alert_interventions")
      .insert({
        student_user_id: studentUserId,
        student_info_id: studentInfoId,
        student_id: studentId || null,
        student_name: displayName,
        risk_level: normalizedRisk,
        severity: normalizedSeverity,
        status: "pending_admin",
        escalated_by: actorId,
        escalated_at: now,
        latest_note: note?.trim() || null,
        updated_at: now,
      })
      .select(INTERVENTION_SELECT)
      .single();
    if (error) throw error;
    intervention = data;
  }

  await insertEvent({
    interventionId: intervention.id,
    actorUserId: actorId,
    eventType: "escalated",
    status: "pending_admin",
    note: note?.trim() || null,
  });

  const notifiedAdminCount = await notifyAllAdmins({
    interventionId: intervention.id,
    title: "Early alert escalated",
    body: `${displayName} was escalated by staff (${normalizedRisk} risk). Please acknowledge.`,
  });

  res.status(201).json({ intervention, notifiedAdminCount });
};

export const acknowledgeIntervention = async (req, res) => {
  const actorId = getActorId(req);
  const intervention = await getInterventionOrThrow(req.params.id);

  if (intervention.status !== "pending_admin") {
    throw new HttpError(400, "Only pending escalations can be acknowledged.");
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("alert_interventions")
    .update({
      status: "acknowledged",
      acknowledged_by: actorId,
      acknowledged_at: now,
      updated_at: now,
    })
    .eq("id", intervention.id)
    .select(INTERVENTION_SELECT)
    .single();
  if (error) throw error;

  await insertEvent({
    interventionId: intervention.id,
    actorUserId: actorId,
    eventType: "acknowledged",
    status: "acknowledged",
    note: null,
  });

  // Mark related admin notifications as read for the acknowledging admin.
  await supabase
    .from("admin_notifications")
    .update({ is_read: true })
    .eq("intervention_id", intervention.id)
    .eq("admin_user_id", actorId);

  res.status(200).json({ intervention: data });
};

export const updateInterventionProgress = async (req, res) => {
  const actorId = getActorId(req);
  const intervention = await getInterventionOrThrow(req.params.id);
  const { status, note = "" } = req.body || {};

  if (!PROGRESS_STATUSES.has(String(status || ""))) {
    throw new HttpError(
      400,
      "Progress status must be monitoring, improving, or resolved.",
    );
  }

  if (intervention.status === "pending_admin") {
    throw new HttpError(
      400,
      "Acknowledge this escalation before updating progress.",
    );
  }

  const trimmedNote = String(note || "").trim();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("alert_interventions")
    .update({
      status,
      latest_note: trimmedNote || intervention.latest_note,
      updated_at: now,
    })
    .eq("id", intervention.id)
    .select(INTERVENTION_SELECT)
    .single();
  if (error) throw error;

  await insertEvent({
    interventionId: intervention.id,
    actorUserId: actorId,
    eventType: "progress_update",
    status,
    note: trimmedNote || null,
  });

  res.status(200).json({ intervention: data });
};

export const revertInterventionToAcknowledged = async (req, res) => {
  const actorId = getActorId(req);
  const intervention = await getInterventionOrThrow(req.params.id);

  const revertible = new Set(["acknowledged", "monitoring", "improving"]);
  if (!revertible.has(intervention.status)) {
    throw new HttpError(
      400,
      "Only acknowledged, monitoring, or improving cases can return to pending admin review.",
    );
  }

  const now = new Date().toISOString();
  const note =
    String(req.body?.note || "").trim() ||
    "Returned to pending admin acknowledgement.";

  const { data, error } = await supabase
    .from("alert_interventions")
    .update({
      status: "pending_admin",
      acknowledged_by: null,
      acknowledged_at: null,
      latest_note: note,
      updated_at: now,
    })
    .eq("id", intervention.id)
    .select(INTERVENTION_SELECT)
    .single();
  if (error) throw error;

  await insertEvent({
    interventionId: intervention.id,
    actorUserId: actorId,
    eventType: "progress_update",
    status: "pending_admin",
    note,
  });

  await notifyAllAdmins({
    interventionId: intervention.id,
    title: "Early alert returned to admin",
    body: `${intervention.student_name || "Student"} was returned to pending admin acknowledgement.`,
  });

  res.status(200).json({ intervention: data });
};

export const cancelIntervention = async (req, res) => {
  const intervention = await getInterventionOrThrow(req.params.id);

  // Allow reset from any active case state back to the original early-alert
  // (no intervention). Resolved cases stay in Resolved Cases until reopened.
  if (intervention.status === "resolved") {
    throw new HttpError(
      400,
      "Resolved cases cannot be cancelled here. Reopen them from Resolved Cases instead.",
    );
  }

  const { error } = await supabase
    .from("alert_interventions")
    .delete()
    .eq("id", intervention.id);
  if (error) throw error;

  res.status(200).json({ success: true, id: intervention.id });
};

export const reopenIntervention = async (req, res) => {
  const actorId = getActorId(req);
  const intervention = await getInterventionOrThrow(req.params.id);

  if (intervention.status !== "resolved") {
    throw new HttpError(400, "Only resolved cases can be reopened.");
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("alert_interventions")
    .update({
      status: "monitoring",
      updated_at: now,
      latest_note:
        String(req.body?.note || "").trim() ||
        intervention.latest_note ||
        "Case reopened.",
    })
    .eq("id", intervention.id)
    .select(INTERVENTION_SELECT)
    .single();
  if (error) throw error;

  await insertEvent({
    interventionId: intervention.id,
    actorUserId: actorId,
    eventType: "progress_update",
    status: "monitoring",
    note: String(req.body?.note || "").trim() || "Case reopened.",
  });

  res.status(200).json({ intervention: data });
};

export const listAdminNotifications = async (req, res) => {
  const actorId = getActorId(req);
  if (!actorId) {
    throw new HttpError(401, "Unable to resolve admin user for notifications.");
  }

  const unreadOnly = String(req.query.unreadOnly || "") === "true";

  // Backfill any pending escalations that never received a bell notification.
  await ensurePendingAdminNotifications(actorId);

  let query = supabase
    .from("admin_notifications")
    .select(
      "id, admin_user_id, intervention_id, title, body, is_read, created_at",
    )
    .eq("admin_user_id", actorId)
    .order("created_at", { ascending: false })
    .limit(40);

  if (unreadOnly) {
    query = query.eq("is_read", false);
  }

  const { data, error } = await query;
  if (error) throw error;

  res.status(200).json({ notifications: data || [] });
};

export const markAdminNotificationsRead = async (req, res) => {
  const actorId = getActorId(req);
  const { ids = [], all = false } = req.body || {};

  let query = supabase
    .from("admin_notifications")
    .update({ is_read: true })
    .eq("admin_user_id", actorId)
    .eq("is_read", false);

  if (!all) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new HttpError(400, "Provide notification ids or set all=true.");
    }
    query = query.in("id", ids);
  }

  const { data, error } = await query.select("id");
  if (error) throw error;

  res.status(200).json({ updated: data?.length || 0 });
};
