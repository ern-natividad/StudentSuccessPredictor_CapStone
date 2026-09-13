import styles from "../../styles/ListPagination.module.css";

/**
 * Shared list pagination controls (Account Settings style).
 */
const ListPagination = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize = 10,
  onPageChange,
  itemLabel = "items",
}) => {
  if (!totalItems || totalItems <= 0) return null;

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <div className={styles.bar}>
      <div className={styles.summary}>
        Showing <strong>{start}</strong> to <strong>{end}</strong> of{" "}
        <strong>{totalItems}</strong> {itemLabel}
      </div>
      <div className={styles.controls}>
        <button
          type="button"
          className={styles.pageBtn}
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage <= 1}
        >
          Prev
        </button>
        {pages.map((pageNum) => (
          <button
            key={pageNum}
            type="button"
            className={`${styles.pageBtn} ${
              pageNum === currentPage ? styles.pageBtnActive : ""
            }`}
            onClick={() => onPageChange(pageNum)}
          >
            {pageNum}
          </button>
        ))}
        <button
          type="button"
          className={styles.pageBtn}
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage >= totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default ListPagination;
