import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createProgram,
  deleteProgram,
  listPrograms,
  updateProgram,
} from "../services/programService";

/**
 * Shared programs catalog from Supabase `programs` table.
 */
export const usePrograms = ({ includeInactive = false, enabled = true } = {}) => {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(Boolean(enabled));
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    if (!enabled) {
      setPrograms([]);
      setLoading(false);
      return [];
    }

    setLoading(true);
    setError("");
    try {
      const rows = await listPrograms({ includeInactive });
      setPrograms(rows);
      return rows;
    } catch (err) {
      setError(err.message || "Unable to load programs.");
      setPrograms([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [enabled, includeInactive]);

  useEffect(() => {
    reload();
  }, [reload]);

  const programNames = useMemo(
    () => programs.map((program) => program.name).filter(Boolean),
    [programs],
  );

  const addProgram = useCallback(
    async ({ name, code }) => {
      const created = await createProgram({ name, code });
      await reload();
      return created;
    },
    [reload],
  );

  const editProgram = useCallback(
    async (id, payload) => {
      const updated = await updateProgram(id, payload);
      await reload();
      return updated;
    },
    [reload],
  );

  const removeProgram = useCallback(
    async (id) => {
      await deleteProgram(id);
      await reload();
      return true;
    },
    [reload],
  );

  return {
    programs,
    programNames,
    loading,
    error,
    reload,
    addProgram,
    editProgram,
    removeProgram,
  };
};
