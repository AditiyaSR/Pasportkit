import { supabase } from './supabase';
import { Workspace, WorkspaceMember } from './types';

export async function getUserWorkspaces(userId: string) {
  const { data, error } = await supabase
    .from('workspace_members')
    .select(`
      workspace_id,
      role,
      workspaces (*)
    `)
    .eq('user_id', userId);

  if (error || !data) return [];
  
  return data.map((item: any) => ({
    ...item.workspaces,
    role: item.role,
  })) as (Workspace & { role: string })[];
}

export async function getDefaultWorkspace(userId: string) {
  const workspaces = await getUserWorkspaces(userId);
  return workspaces.length > 0 ? workspaces[0] : null;
}
