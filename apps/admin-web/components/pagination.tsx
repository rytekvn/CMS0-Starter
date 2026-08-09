// Phan trang dung chung. Trang nam trong URL (?page=) nen day la 2 the <Link>
// chu khong phai callback: F5 / chia se link van dung trang.
import Link from "next/link";

export function Pagination({
  page,
  totalPages,
  hrefFor,
}: {
  page: number;
  totalPages: number;
  hrefFor: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="pagination">
      {page <= 1 ? (
        <button type="button" disabled>
          Truoc
        </button>
      ) : (
        <Link href={hrefFor(page - 1)}>Truoc</Link>
      )}
      <span>
        Trang {page}/{totalPages}
      </span>
      {page >= totalPages ? (
        <button type="button" disabled>
          Sau
        </button>
      ) : (
        <Link href={hrefFor(page + 1)}>Sau</Link>
      )}
    </div>
  );
}
