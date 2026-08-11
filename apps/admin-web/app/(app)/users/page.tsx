// List Users - Server Component that: trang nam trong URL nen F5 / chia se link
// deu ra dung ket qua.
import { Pagination } from "@/components/pagination";
import { requireUser } from "@/lib/session";
import { listUsers } from "./api";
import { userPermissions } from "./permissions";
import { PAGE_SIZE } from "./schema";
import { UserTable } from "./user-table";

type SearchParams = Record<string, string | string[] | undefined>;

const one = (value: string | string[] | undefined): string =>
  (Array.isArray(value) ? value[0] : value) ?? "";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireUser();
  const has = (key: string) => user.permissions.includes(key);

  // Vao thang URL ma khong co quyen: backend cung chan (403), o day chan som
  // de hien thong bao ro rang thay vi mot dong loi.
  if (!has(userPermissions.read))
    return <p className="empty-state">Ban khong co quyen xem danh sach user.</p>;

  const users = await listUsers();

  // Endpoint chua ho tro phan trang (spec: Out of scope) -> cat o day.
  const totalPages = Math.max(1, Math.ceil(users.length / PAGE_SIZE));
  const page = Math.min(Math.max(1, Number(one((await searchParams).page)) || 1), totalPages);
  const rows = users.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <UserTable
        rows={rows}
        // An o UI chi la UX; backend van la cho quyet dinh (PermissionsGuard).
        can={{
          create: has(userPermissions.create),
          update: has(userPermissions.update),
          delete: has(userPermissions.delete),
        }}
      />
      <Pagination page={page} totalPages={totalPages} hrefFor={(p) => `/users?page=${p}`} />
    </div>
  );
}
