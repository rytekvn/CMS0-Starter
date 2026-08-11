// Khop response cua GET /roles va GET /roles/permissions ben apps/api.
export type Permission = { id: string; key: string };

export type Role = {
  id: string;
  name: string;
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
};

// Gan quyen bang `key` (khong phai id): PATCH dung `set` nen day la danh sach
// quyen cuoi cung, khong phai phan them vao.
export type RoleFormValues = { name: string; permissionKeys: string[] };
