// Phan trang dung chung. Trang nam trong URL (?page=) nen day la 2 the <Link>
// chu khong phai callback: F5 / chia se link van dung trang.
import Link from "next/link";
import { Button } from "@/components/ui/button";

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
    <div className="mt-4 flex items-center gap-3.5 text-[13px] text-muted-foreground">
      {page <= 1 ? (
        <Button type="button" variant="outline" size="sm" disabled>
          Truoc
        </Button>
      ) : (
        <Button asChild variant="outline" size="sm">
          <Link href={hrefFor(page - 1)}>Truoc</Link>
        </Button>
      )}
      <span>
        Trang {page}/{totalPages}
      </span>
      {page >= totalPages ? (
        <Button type="button" variant="outline" size="sm" disabled>
          Sau
        </Button>
      ) : (
        <Button asChild variant="outline" size="sm">
          <Link href={hrefFor(page + 1)}>Sau</Link>
        </Button>
      )}
    </div>
  );
}
