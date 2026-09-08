import type { GroupeMembreModel } from '@/domain/entités/GroupeMember'

export const GROUP_ROLES = ['createur', 'admin', 'membre'] as const

export type GroupRole = (typeof GROUP_ROLES)[number]

export interface GroupeModel {
  id: string
  name: string
  description?: string
  createdBy?: string
  createdAt: Date
}

export type CreateGroupeModel = Omit<GroupeModel, 'id' | 'createdAt'>
export type UpdateGroupeModel = Partial<Omit<CreateGroupeModel, 'createdBy'>>

export function isGroupCreator(
  groupe: Pick<GroupeModel, 'createdBy'> | null | undefined,
  userId: string | null | undefined,
): boolean {
  return Boolean(groupe?.createdBy && userId && groupe.createdBy === userId)
}

export function isGroupAdmin(
  membership: Pick<GroupeMembreModel, 'isGroupAdmin'> | null | undefined,
): boolean {
  return Boolean(membership?.isGroupAdmin)
}

export function canViewGroup(
  membership: GroupeMembreModel | null | undefined,
): boolean {
  return Boolean(membership)
}

export function canParticipateInGroup(
  membership: GroupeMembreModel | null | undefined,
): boolean {
  return canViewGroup(membership)
}

export function canManageGroup(
  groupe: Pick<GroupeModel, 'createdBy'> | null | undefined,
  membership: Pick<GroupeMembreModel, 'isGroupAdmin'> | null | undefined,
  userId: string | null | undefined,
): boolean {
  return isGroupCreator(groupe, userId) || isGroupAdmin(membership)
}

export function canManageGroupMembers(
  groupe: Pick<GroupeModel, 'createdBy'> | null | undefined,
  membership: Pick<GroupeMembreModel, 'isGroupAdmin'> | null | undefined,
  userId: string | null | undefined,
): boolean {
  return canManageGroup(groupe, membership, userId)
}

export function canDeleteGroup(
  groupe: Pick<GroupeModel, 'createdBy'> | null | undefined,
  userId: string | null | undefined,
): boolean {
  return isGroupCreator(groupe, userId)
}

export function getGroupRole(
  groupe: Pick<GroupeModel, 'createdBy'> | null | undefined,
  membership: Pick<GroupeMembreModel, 'isGroupAdmin'> | null | undefined,
  userId: string | null | undefined,
): GroupRole {
  if (isGroupCreator(groupe, userId)) return 'createur'
  if (isGroupAdmin(membership)) return 'admin'

  return 'membre'
}

export function getGroupRoleLabel(role: GroupRole): string {
  if (role === 'createur') return 'Créateur'
  if (role === 'admin') return 'Admin'

  return 'Membre'
}
