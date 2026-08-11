// Khop response cua GET /users ben apps/api (field audit tra ve duoi dang chuoi ISO).
// `password` khong bao gio co trong response - chi la field cua form.
export type User = {
  id: string;
  email: string;
  name: string;
  roles: { role: { id: string; name: string } }[];
  createdAt: string;
  updatedAt: string;
};

// Chi lay {id,name} tu GET /roles de do multi-select - khong can `permissions`.
export type RoleOption = { id: string; name: string };

// Gia tri cua form. `password` rong khi sua = giu nguyen mat khau cu
// (Server Action bo han key nay khoi payload).
export type UserFormValues = {
  email: string;
  name: string;
  password: string;
  roleIds: string[];
};

export const PAGE_SIZE = 10;
