import { useEffect, useMemo, useState } from "react";

/**
 * Client-side list pagination helper.
 * @param {unknown[]} items
 * @param {{ pageSize?: number, resetKey?: string | number }} [options]
 */
export const useListPagination = (items, { pageSize = 10, resetKey } = {}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const list = useMemo(
    () => (Array.isArray(items) ? items : []),
    [items],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [resetKey, pageSize]);

  const totalItems = list.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize) || 1);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const pageItems = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return list.slice(startIndex, startIndex + pageSize);
  }, [list, currentPage, pageSize]);

  return {
    currentPage,
    setCurrentPage,
    pageItems,
    totalItems,
    totalPages,
    pageSize,
  };
};

export default useListPagination;
