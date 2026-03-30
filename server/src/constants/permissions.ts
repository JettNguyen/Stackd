const viewer = ['read', 'leave_space'] as const;
const editor = [...viewer, 'edit', 'rename', 'delete_content'] as const;
const owner = [...editor, 'add_user', 'remove_user', 'delete_space'] as const;

export const permissions = {
  viewer,
  editor,
  owner,
} as const;

export type Role = keyof typeof permissions;

export type Permission = (typeof permissions)[Role][number];

export const can = (role: Role, action: Permission): boolean => {
  return (permissions[role] as readonly Permission[]).includes(action);
};