export type Permission = 
  | 'manage_billing'
  | 'manage_team'
  | 'manage_integrations'
  | 'use_ai'
  | 'create_passport'
  | 'edit_passport'
  | 'view_analytics';

export function hasWorkspacePermission(role: string, permission: Permission): boolean {
  switch (role) {
    case 'owner':
      return true;
    case 'admin':
      return [
        'manage_team',
        'manage_integrations',
        'use_ai',
        'create_passport',
        'edit_passport',
        'view_analytics'
      ].includes(permission);
    case 'member':
      return [
        'create_passport',
        'edit_passport',
        'view_analytics'
      ].includes(permission);
    default:
      return false;
  }
}
